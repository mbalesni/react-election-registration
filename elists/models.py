from django.conf import settings
from django.core import signing
from django.db import models

from student.models import Student
from .constants import Staff
from .utils import get_current_naive_time, time_diff_formatted


class CheckInSession(models.Model):

    class Meta:
        verbose_name = 'Чек-ін сесія'
        verbose_name_plural = 'Чек-ін сесії'

    TIME_FMT = '%H:%M:%S'

    STATUS_STARTED = 1
    STATUS_IN_PROGRESS = 2
    STATUS_CANCELED = -1
    STATUS_COMPLETED = 0
    STATUS_CHOICES = (
        (STATUS_STARTED, "Відкрита"),
        (STATUS_IN_PROGRESS, "В процесі"),
        (STATUS_CANCELED, "Відмінена"),
        (STATUS_COMPLETED, "Завершена"),
    )
    """ Open status are natural numbers (positive integers), while 'completed' 
    is 0 (like exit code) and 'canceled' is -1 (something went wrong). """

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

    def assign_student(self, student: Student) -> 'CheckInSession':
        """ Checks if `student` has open sessions. Assigns `student` to given
        `session` and updates status to `IN_PROGRESS` value. """
        self.student = student
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
