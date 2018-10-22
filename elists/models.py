import logging
import secrets
import typing

import pandas as pd
import sqlalchemy
from django.conf import settings
from django.core import signing, exceptions
from django.db import models
from django.utils import timezone

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
    return

    # TODO: validate gradebook

    n1, sep, n2 = gradebook_number.partition('/')
    if sep == '':
        raise exceptions.ValidationError('"/" (slash) must be inside gradebook number.')
    if not (n1.isdigit() and n2.isdigit()) or not \
            (float(n1).is_integer() and float(n2).is_integer()):
        raise exceptions.ValidationError('Both numbers must be integers.')


def validate_certificate_number(certificate_number: str):
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
        if cls.staff_has_open_sessions(staff):
            raise wfe.StaffHasOpenSession()

        # assigns default "STARTED" status, NULL student_id and NULL end_dt
        new_check_in_session = cls(staff=staff, status=cls.STATUS_STARTED)

        # nothing to validate
        new_check_in_session.save()
        log.info(f'Started new check-in session #{new_check_in_session.id} by @{staff.username}')
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

        # check uniqueness
        try:
            session_with_same_document: CheckInSession = CheckInSession.objects.get(
                doc_num=doc_num,
                doc_type=doc_type,
                status=CheckInSession.STATUS_COMPLETED,
            )
        except self.DoesNotExist:
            pass
        else:
            if session_with_same_document is not None:
                raise wfe.StudentWithSameDocumentExists(
                    context={
                        'doc_num': doc_num,
                        'doc_type': doc_type,
                        'student__full_name': session_with_same_document.student.full_name,
                        'student__last_update_dt': session_with_same_document.student.status_update_dt,
                        'staff__username': session_with_same_document.staff.username,
                    },
                )

        self.student = student
        self.doc_type = doc_type
        self.doc_num = doc_num
        self.ballot_number = _new_ballot_number(self.id)
        self.status = self.STATUS_IN_PROGRESS

        self.save()
        self.student.change_status_in_progress()
        log.info(
            f'Assigned "{student.full_name}" to check-in session #{self.id} '
            f'by @{self.staff.username} with [{doc_type}] "{doc_num}"'
            f'with ballot number {self.show_ballot_number()}'
        )
        return self

    def search_by_name(self, full_name: str) -> typing.Tuple[Student]:
        log.info(f'Searching for "{full_name}" in check-in session #{self.id}')
        student = Student.search_by_full_name(full_name=full_name)
        return student

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
        log.info(f'Completed check-in session #{self.id} by @{self.staff.username}')
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
        log.info(f'Canceled check-in session #{self.id} by @{self.staff.username}')
        return self

    def create_token(self) -> str:
        data = dict({'id': self.id})
        return signing.dumps(data)

    def show_ballot_number(self) -> str:
        if not self.ballot_number:
            return '-'
        bn = str(self.ballot_number)
        return f'{bn[:2]}-{bn[2:4]}-{bn[4:6]}-{bn[6:]}'

    # Pandas methods
    # ==============

    @classmethod
    def dump_staff_stats(cls) -> pd.DataFrame:
        USERNAME = 'US'
        TOTAL = 'TO'
        COMPLETED = 'CO'
        CANCELED = 'CA'
        IN_PROGRESS = 'IP'
        JUST_STARTED = 'JS'
        ASSIGNED = 'AS'
        BY_TICKET = 'TN'
        BY_GRADEBOOK = 'GB'
        BY_CERTIFICATE = 'CT'

        INT16_COLUMNS = (
            TOTAL, COMPLETED, CANCELED, IN_PROGRESS, JUST_STARTED, ASSIGNED,
            BY_TICKET, BY_GRADEBOOK, BY_CERTIFICATE,
        )
        COLUMNS = (USERNAME, *INT16_COLUMNS)

        def _count_matches(df: pd.DataFrame, column: str, value, default=None):
            boolean_series: pd.Series = df[column] == value
            return boolean_series.value_counts().get(True, default)

        def _append(source, target, username):
            count = source.shape[0]
            completed = _count_matches(source, 'status', cls.STATUS_COMPLETED, 0)
            canceled = _count_matches(source, 'status', cls.STATUS_CANCELED, 0)
            in_progress = _count_matches(source, 'status', cls.STATUS_IN_PROGRESS, 0)
            just_started = _count_matches(source, 'status', cls.STATUS_STARTED, 0)
            assigned = source['student_id'].count()
            by_ticket = _count_matches(source, 'doc_type', cls.DOC_TYPE_TICKET, 0)
            by_gradebook = _count_matches(source, 'doc_type', cls.DOC_TYPE_GRADEBOOK, 0)
            by_certificate = _count_matches(source, 'doc_type', cls.DOC_TYPE_CERTIFICATE, 0)

            return target.append({
                USERNAME      : username,
                TOTAL         : count,
                COMPLETED     : completed,
                CANCELED      : canceled,
                IN_PROGRESS   : in_progress,
                JUST_STARTED  : just_started,
                ASSIGNED      : assigned,
                BY_TICKET     : by_ticket,
                BY_GRADEBOOK  : by_gradebook,
                BY_CERTIFICATE: by_certificate,
            }, ignore_index=True)

        eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
        origin = pd.read_sql_table(cls._meta.db_table, eng)
        df = pd.DataFrame({k: [] for k in COLUMNS})

        staff_dbids = origin['staff_id'].unique()
        dbid_to_username = {
            dbid: f'@{Staff.objects.get(id=dbid).username}'
            for dbid in staff_dbids
        }

        df = _append(origin, df, 'Всього')

        for staff_dbid in staff_dbids:
            owned = origin[origin['staff_id'] == staff_dbid]
            username = dbid_to_username[staff_dbid]
            df = _append(owned, df, username)

        for column in INT16_COLUMNS:
            df[column] = df[column].astype('int16')

        df = df.sort_values(by=[TOTAL], ascending=False)
        return df

    @classmethod
    def dump_table(cls) -> pd.DataFrame:
        def get_student_match() -> dict:
            student_df = pd.read_sql_table(Student._meta.db_table, eng)
            return {
                dbid: full_name
                for dbid, full_name in zip(student_df['id'], student_df['full_name'])
            }

        STATUS_CODE_TO_VERBOSE = dict(cls.STATUS_CHOICES)
        DOC_TYPE_CODE_TO_VERBOSE = dict(cls.DOC_TYPE_CHOICES)

        eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
        origin = pd.read_sql_table(cls._meta.db_table, eng)

        staff_dbid_to_username = {
            dbid: f'@{Staff.objects.get(id=dbid).username}'
            for dbid in origin['staff_id'].unique()
        }
        student_dbid_to_full_name = get_student_match()

        df = pd.DataFrame({
            'db ID'          : origin['id'],
            'Член ВКС'       : [
                staff_dbid_to_username[dbid]
                for dbid in origin['staff_id']
            ],
            'ПІБ студента'   : [
                student_dbid_to_full_name.get(dbid, '-')
                for dbid in origin['student_id']
            ],
            'Час початку'    : [
                timezone.make_naive(dt).strftime('%H:%M')
                for dt in origin['start_dt']
            ],
            'Час кінця'      : [
                timezone.make_naive(dt).strftime('%H:%M') if not pd.isna(dt) else '-'
                for dt in origin['end_dt']
            ],
            'Номер бюлетеня' : [
                f'{str(bn)[:3]}/{str(bn)[3:-2]}' if not pd.isna(bn) else '-'
                for bn in origin['ballot_number']
            ],
            'Статус'         : [
                STATUS_CODE_TO_VERBOSE[code]
                for code in origin['status']
            ],
            'Тип документа'  : [
                DOC_TYPE_CODE_TO_VERBOSE[code] if not pd.isna(code) else '-'
                for code in origin['doc_type']
            ],
            'Номер документа': [
                doc_num if not pd.isna(doc_num) else '-'
                for doc_num in origin['doc_num']
            ],
        })

        df = df.sort_values(by='db ID')
        return df

    @classmethod
    def dump_registered_students(cls) -> pd.DataFrame:
        EDUCATIONAL_DEGREE_CODE_TO_NAME = dict(Student.EDUCATIONAL_DEGREE_CHOICES)

        def get_ballot_match() -> dict:
            mapping = {}
            for cis_model in cls.objects.filter(ballot_number__isnull=False):
                mapping[cis_model.student_id] = cis_model.show_ballot_number()
            return mapping

        log.debug(f'creating mini-dump for "student_student" table ...')

        eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
        origin = pd.read_sql_table(Student._meta.db_table, eng)

        dbid_to_ballot_number = get_ballot_match()
        registered = origin[origin['status'] == Student.STATUS_VOTED]

        # check
        if set(registered['id']).difference(set(dbid_to_ballot_number.keys())) != set():
            raise RuntimeError('Not all students with status "voted" has related check-in session.')

        df = pd.DataFrame({
            'ПІБ студента'            : registered['full_name'],
            'Освітній рівень'         : [
                EDUCATIONAL_DEGREE_CODE_TO_NAME[code]
                for code in registered['educational_degree']
            ],
            'Курс'                    : registered['year'],
            'Номер бюлетеня'          : [
                dbid_to_ballot_number[dbid]
                for dbid in registered['id']
            ],
            'Час останнього оновлення': [
                timezone.make_naive(dt).strftime('%H:%M')
                for dt in registered['status_update_dt']
            ],
        })

        df = df.sort_values(by=['Час останнього оновлення', 'ПІБ студента'])
        df['№'] = tuple(range(1, df.shape[0] + 1))

        return df[['№', 'Час останнього оновлення', 'Номер бюлетеня', 'ПІБ студента', 'Освітній рівень', 'Курс']]

    @classmethod
    def collect_stats(cls) -> dict:
        total_students = Student.objects.all().count()
        completed_session = cls.filter_completed(cls.objects).count()
        started_session = cls.objects.filter(student__isnull=False).values('student').distinct().count()
        ignored_elections = total_students - started_session

        stats = {
            'total': total_students,
            'registered': completed_session,
            'started': started_session,
            'ignored': ignored_elections,
        }
        return stats

    @classmethod
    def make_report(cls) -> pd.DataFrame:
        registered_df = CheckInSession.dump_registered_students()
        df = registered_df.copy()

        df = df.sort_values(by=['Освітній рівень', 'Курс', 'ПІБ студента'])
        df['№'] = tuple(range(1, df.shape[0] + 1))
        df['Час видачі бюлетеня'] = df['Час останнього оновлення']

        return df[['№', 'ПІБ студента', 'Освітній рівень', 'Курс', 'Час видачі бюлетеня', 'Номер бюлетеня']]
