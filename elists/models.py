from django.conf import settings
from django.core import signing, exceptions
from django.db import models

from student.models import Student, validate_student_ticket_number
from .constants import Staff
from .utils import get_current_naive_time, time_diff_formatted


def validate_gradebook_number(gradebook_number: str):
    n1, sep, n2 = gradebook_number.partition('/')
    if sep == '':
        raise exceptions.ValidationError('"/" (slash) must be inside gradebook number.')
    if not (n1.isdigit() and n2.isdigit()) or not \
            (float(n1).is_integer() and float(n2).is_integer()):
        raise exceptions.ValidationError('Both numbers must be integers.')


def validate_certificate_number(certificate_number: str):
    try:
        num = int(certificate_number)
    except TypeError:
        raise exceptions.ValidationError('Number must be a valid integer')
    if not (10_00 < num < 99_99):
        raise exceptions.ValidationError('Number must contain exact 4 digits.')


def validate_ticket_number(ticket_number: str):
    try:
        num = int(ticket_number)
    except TypeError:
        raise exceptions.ValidationError('Number must be a valid integer')
    validate_student_ticket_number(num)


class CheckInSession(models.Model):

    class Meta:
        verbose_name = 'Чек-ін сесія'
        verbose_name_plural = 'Чек-ін сесії'

    TIME_FMT = '%H:%M:%S'

    STATUS_STARTED = 1
    STATUS_IN_PROGRESS = 2
    STATUS_CANCELED = -1
    STATUS_COMPLETED = 0
    """ Open status are natural numbers (positive integers), while 'completed' 
    is 0 (like exit code) and 'canceled' is -1 (something went wrong). """

    STATUS_CHOICES = (
        (STATUS_STARTED, "Відкрита"),
        (STATUS_IN_PROGRESS, "В процесі"),
        (STATUS_CANCELED, "Відмінена"),
        (STATUS_COMPLETED, "Завершена"),
    )

    DOC_TYPE_TICKET = 0
    DOC_TYPE_GRADEBOOK = 1
    DOC_TYPE_CERTIFICATE = 2
    """ Document types stored in descending popularity of usage. """

    DOC_TYPE_CHOICES = (
        (DOC_TYPE_TICKET, "Студентський квиток"),
        (DOC_TYPE_GRADEBOOK, "Залікова книжка"),
        (DOC_TYPE_CERTIFICATE, "Довідка від деканату"),
    )

    DOC_TYPE_VALIDATORS = {
        DOC_TYPE_TICKET: validate_ticket_number,
        DOC_TYPE_GRADEBOOK: validate_gradebook_number,
        DOC_TYPE_CERTIFICATE: validate_certificate_number,
    }

    # references
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        null=True,
        verbose_name='Студент',
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        verbose_name='Персонал',
    )

    # docs
    doc_type = models.IntegerField(
        choices=DOC_TYPE_CHOICES,
        null=True,
        verbose_name='Тип документу',
    )
    doc_num = models.CharField(
        max_length=8,
        null=True,
        verbose_name='Номер документу',
    )

    # status
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        verbose_name='Статус',
    )

    # time marks
    start_time = models.TimeField(
        auto_now_add=True,
        verbose_name='Час початку',
    )
    end_time = models.TimeField(
        null=True,
        verbose_name='Час завершення',
    )

    def __repr__(self) -> str:
        return f'<CheckInSession #{self.id} [{self.status}] by "{self.staff}">'

    def __str__(self) -> str:
        return f'Чек-ін сесія {self.show_time_summary().lower()} під контролем @{self.staff.username}'

    @property
    def is_open(self) -> bool:
        return self.status > 0

    @property
    def status_verbose(self) -> str:
        return dict(self.STATUS_CHOICES)[self.status]

    @property
    def time_duration(self) -> str:
        return time_diff_formatted(self.start_time, self.end_time)

    def show_time_summary(self) -> str:
        parts = [f'Почата о {self.start_time.strftime(self.TIME_FMT)}']
        if not self.is_open:
            parts.append(
                f'тривала {self.time_duration} '
                f'і була закрита о {self.end_time.strftime(self.TIME_FMT)}'
            )
        return ' '.join(parts)
    show_time_summary.short_description = 'Заключення'

    @classmethod
    def validate_doc_type_num_pair(cls, doc_type: int, doc_num: str):
        cls.DOC_TYPE_VALIDATORS[doc_type](doc_num)

    @classmethod
    def get_token_max_age(cls):
        return settings.ELISTS_CHECKINSESSION_TOKEN_EXPIRE

    @classmethod
    def student_allowed_to_assign(cls, student: Student) -> bool:
        return cls.objects.filter(student=student, status__gte=0).count() == 0

    @classmethod
    def get_session_by_staff(cls, staff) -> 'CheckInSession' or None:
        try:
            return cls.objects.get(staff=staff, status__gt=0)
        except models.ObjectDoesNotExist:
            return None

    @classmethod
    def staff_has_open_sessions(cls, staff: Staff) -> bool:
        return cls.get_session_by_staff(staff) is not None

    @classmethod
    def close_sessions(cls, staff: Staff):
        """ Ensures that `staff` doesn't have open sessions, cancels them. """
        session = cls.get_session_by_staff(staff)
        if session:
            session.cancel()

    @classmethod
    def start_new_session(cls, staff: Staff) -> 'CheckInSession' or None:
        """ Checks if `staff` has open sessions. Starts new session for `staff`.
        Records `start_time`, assigns `Status.std` status and lefts `student`
        and `end_time` unassigned.

        :param staff: logged in staff
        :return: model if everything was OK, else returns None
        """
        # assigns default "STARTED" status, NULL student_id and NULL end_time
        new_check_in_session = cls(staff=staff, status=cls.STATUS_STARTED)

        # nothing to validate
        new_check_in_session.save()
        return new_check_in_session

    @classmethod
    def get_session_by_token(cls, token: str) -> 'CheckInSession':
        try:
            query: dict = signing.loads(token, max_age=cls.get_token_max_age())
        except signing.SignatureExpired:
            raise TimeoutError('Provided check-in session token expired.')
        except signing.BadSignature:
            raise RuntimeError('Bad check-in session token signature.')

        # if we had given that token, than object must exist
        return cls.objects.get(**query)

    def assign_student(self, student: Student, doc_type: int, doc_num: str) -> 'CheckInSession':
        """ Checks if `student` has open sessions. Assigns `student` to given
        `session` and updates status to `IN_PROGRESS` value. """
        try:
            self.validate_doc_type_num_pair(doc_type, doc_num)
        except exceptions.ValidationError as exc:
            raise ValueError(str(exc))

        self.student = student
        self.doc_type = doc_type
        self.doc_num = doc_num
        self.status = self.STATUS_IN_PROGRESS

        self.save()
        return self

    def complete(self) -> 'CheckInSession':
        """ Assigns current time to `end_time` and `COMPLETED` status. """
        self.end_time = get_current_naive_time()
        self.status = self.STATUS_COMPLETED

        self.save()
        return self

    def cancel(self) -> 'CheckInSession':
        """ Assigns current time to `end_time` and `CANCELED` status. """
        self.end_time = get_current_naive_time()
        self.status = self.STATUS_CANCELED

        self.save()
        return self

    def create_token(self) -> str:
        return signing.dumps(dict(id=self.id))
