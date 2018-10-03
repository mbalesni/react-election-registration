import logging
import secrets

from django.conf import settings
from django.core import signing, exceptions
from django.db import models

from errorsapp import exceptions as wfe
from student.models import Student, validate_student_ticket_number
from .constants import Staff
from .time_limit import time_limit_controller
from .utils import get_current_naive_datetime, time_diff_formatted

log = logging.getLogger('elists.models')


def _new_ballot_number(seed: int) -> int:
    encoded = (seed + 34_649) * 2_651_579_387_927
    salt = secrets.randbelow(800) + 200
    return salt * 100_000 + encoded % 100_000


def validate_ticket_number(ticket_number: str):
    try:
        num = int(ticket_number)
    except TypeError:
        raise exceptions.ValidationError('Number must be a valid integer')
    validate_student_ticket_number(num)


def validate_gradebook_number(gradebook_number: str):
    if len(gradebook_number) != 8:
        raise exceptions.ValidationError('Gradebook number must be no longer than 8 characters.')
    return

    # TODO: validate gradebook

    n1, sep, n2 = gradebook_number.partition('/')
    if sep == '':
        raise exceptions.ValidationError('"/" (slash) must be inside gradebook number.')
    if not (n1.isdigit() and n2.isdigit()) or not \
            (float(n1).is_integer() and float(n2).is_integer()):
        raise exceptions.ValidationError('Both numbers must be integers.')


def validate_certificate_number(certificate_number: str):
    if len(certificate_number) != 8:
        raise exceptions.ValidationError('Certificate number must be no longer than 8 characters.')
    return

    # TODO: validate certificate number

    try:
        num = int(certificate_number)
    except TypeError:
        raise exceptions.ValidationError('Number must be a valid integer')
    if not (10_00 < num < 99_99):
        raise exceptions.ValidationError('Number must contain exact 4 digits.')


class CheckInSession(models.Model):

    class Meta:
        verbose_name = 'Чек-ін сесія'
        verbose_name_plural = 'Чек-ін сесії'

    TIME_FMT = '%H:%M:%S'
    DOC_NUM_MAX_LENGTH = 8

    STATUS_STARTED = 1
    STATUS_IN_PROGRESS = 2
    STATUS_CANCELED = -1
    STATUS_COMPLETED = 0
    """ Open status are natural numbers (positive integers), while 'completed' 
    is 0 (like exit code) and 'canceled' is -1 (something went wrong). """

    STATUS_CHOICES = (
        (STATUS_STARTED, "Відкрита"),
        (STATUS_IN_PROGRESS, "В процесі"),
        (STATUS_CANCELED, "Скасована"),
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

    DOC_TYPE_CODES = frozenset(code for code, name in DOC_TYPE_CHOICES)

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
        max_length=DOC_NUM_MAX_LENGTH,
        null=True,
        verbose_name='Номер документу',
    )

    # status
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        verbose_name='Статус',
    )

    # time marks
    start_dt = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Час початку',
    )
    end_dt = models.DateTimeField(
        null=True,
        verbose_name='Час завершення',
    )

    # identifiers
    ballot_number = models.IntegerField(
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        verbose_name='Номер бюлетеня',
    )

    def __repr__(self) -> str:
        return f'<CheckInSession #{self.id} [{self.status}] by @{self.staff.username}>'

    def __str__(self) -> str:
        return f'Чек-ін сесія {self.show_time_summary().lower()} під контролем @{self.staff.username}'

    @property
    def is_open(self) -> bool:
        return self.status > 0

    @property
    def just_started(self) -> bool:
        return self.status == self.STATUS_STARTED

    @property
    def status_verbose(self) -> str:
        return dict(self.STATUS_CHOICES)[self.status]

    @property
    def time_duration(self) -> str:
        return time_diff_formatted(self.start_dt.time(), self.end_dt.time())

    def show_time_summary(self) -> str:
        parts = [f'Почата о {self.start_dt.strftime(self.TIME_FMT)}']
        if not self.is_open:
            parts.append(
                f'тривала {self.time_duration} '
                f'і була закрита о {self.end_dt.strftime(self.TIME_FMT)}'
            )
        return ' '.join(parts)
    show_time_summary.short_description = 'Заключення'

    @classmethod
    def filter_open(cls, qs: models.QuerySet) -> models.QuerySet:
        return qs.filter(status__gt=0)

    @classmethod
    def filter_completed(cls, qs: models.QuerySet) -> models.QuerySet:
        return qs.filter(status__exact=0)

    @classmethod
    def validate_doc_type_num_pair(cls, doc_type: int, doc_num: str):
        cls.DOC_TYPE_VALIDATORS[doc_type](doc_num)

    @classmethod
    def get_token_max_age(cls):
        return settings.ELISTS_CHECKINSESSION_TOKEN_EXPIRE

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
        Records `start_dt`, assigns `Status.std` status and lefts `student`
        and `end_dt` unassigned.

        :param staff: logged in staff
        :return: model if everything was OK, else returns None
        """
        if not time_limit_controller.check():
            raise wfe.ElectionsTimeLimitReached()
        if CheckInSession.staff_has_open_sessions(staff):
            raise wfe.StaffHasOpenSession()

        # assigns default "STARTED" status, NULL student_id and NULL end_dt
        new_check_in_session = cls(staff=staff, status=cls.STATUS_STARTED)

        # nothing to validate
        new_check_in_session.save()
        log.info(f'Started #{new_check_in_session.id} by @{staff.username}')
        return new_check_in_session

    @classmethod
    def get_session_by_token(cls, token: str) -> 'CheckInSession':
        try:
            query: dict = signing.loads(token, max_age=cls.get_token_max_age())
            session_id = query['id']
        except signing.SignatureExpired:
            raise wfe.CheckInSessionTokenExpired()
        except signing.BadSignature:
            raise wfe.CheckInSessionTokenBadSignature()
        except KeyError:
            raise wfe.ProgrammingError({'msg': 'missing "id" field'})

        # if we had given that token, than object must exist
        return cls.objects.get(id=session_id)

    def assign_student(self, student: Student, doc_type: str, doc_num: str) -> 'CheckInSession':
        """ Checks if `student` has open sessions. Assigns `student` to given
        `session` and updates status to `IN_PROGRESS` value. """
        student.check_allowed_to_assign()
        if not self.just_started:
            raise wfe.CheckInSessionWrongStatus(
                context={
                    'current_status_code': self.status,
                    'current_status_name': self.status_verbose,
                },
            )

        # validation
        try:
            doc_type = int(doc_type)
        except TypeError:
            raise wfe.StudentDocTypeWrongFormat(context={
                'msg'         : f'`doc_type` must be an integer',
                'actual_value': doc_type,
            })
        if not doc_type in self.DOC_TYPE_CODES:
            raise wfe.StudentDocTypeWrongFormat(context={
                'msg': f'`doc_type` must be one of {self.DOC_TYPE_CODES}',
                'actual_value': doc_type,
            })
        if len(doc_num) > self.DOC_NUM_MAX_LENGTH:
            raise wfe.StudentDocNumberWrongFormat(context={
                'msg'          : f'Document number must be no longer than '
                                 f'{self.DOC_NUM_MAX_LENGTH} characters.',
                'actual_length': len(doc_num),
            })
        try:
            self.validate_doc_type_num_pair(int(doc_type), doc_num)
        except exceptions.ValidationError as exc:
            raise wfe.StudentDocNumberWrongFormat(context={
                'msg': str(exc)
            })

        self.student = student
        self.doc_type = doc_type
        self.doc_num = doc_num
        self.ballot_number = _new_ballot_number(self.id)
        self.status = self.STATUS_IN_PROGRESS

        self.save()
        self.student.change_status_in_progress()
        log.info(
            f'Assigned {student} to #{self.id} by @{self.staff.username} '
            f'with ballot number {self.show_ballot_number()}'
        )
        return self

    def complete(self) -> 'CheckInSession':
        """ Assigns current time to `end_dt` and `COMPLETED` status. """
        if self.student is None:
            raise wfe.CheckInSessionWithoutStudent()
        if not self.is_open:
            raise wfe.CheckInSessionAlreadyClosed()

        self.end_dt = get_current_naive_datetime()
        self.status = self.STATUS_COMPLETED

        self.save()
        self.student.change_status_voted()
        log.info(f'Completed #{self.id} by @{self.staff.username}')
        return self

    def cancel(self) -> 'CheckInSession':
        """ Assigns current time to `end_dt` and `CANCELED` status. """
        if not self.is_open:
            # FIXME: alarm if trying to cancel already closed session
            # raise wfe.CheckInSessionAlreadyClosed()
            return self

        self.end_dt = get_current_naive_datetime()
        self.status = self.STATUS_CANCELED

        self.save()
        if self.student:
            self.student.change_status_free()
        log.info(f'Canceled #{self.id} by @{self.staff.username}')
        return self

    def create_token(self) -> str:
        data = dict({'id': self.id})
        return signing.dumps(data)

    def show_ballot_number(self) -> str:
        if not self.ballot_number:
            return 'Н/Д'
        bn = str(self.ballot_number)
        return f'{bn[:2]}-{bn[2:4]}-{bn[4:6]}-{bn[6:]}'
