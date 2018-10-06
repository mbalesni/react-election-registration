import io
import logging

import sqlalchemy
import pandas as pd
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import async_notify, notifier_bot
from .models import CheckInSession, Staff, Student

log = logging.getLogger('elists.tasks')


def _count_matches(df: pd.DataFrame, column: str, value, default=None):
    boolean_series: pd.Series = df[column] == value
    return boolean_series.value_counts().get(True, default)


@app.task(bind=True, name='elists.cancel_idle_checkin_sessions')
def cancel_obsolete_checkin_sessions(self, td_seconds: int =None):
    if td_seconds is None:
        td_seconds = settings.ELISTS_CHECKINSESSION_OBSOLETE_TDS
    td = timezone.timedelta(seconds=td_seconds)
    upper_dt = timezone.now() - td

    log.info(f'Looking for check-in sessions opened more than {td.seconds} seconds age ...')
    open_sessions = CheckInSession.filter_open(qs=CheckInSession.objects)
    idle_sessions = open_sessions.filter(start_dt__lte=upper_dt)

    for obj in idle_sessions:
        obj: CheckInSession
        async_notify(f'{obj} буде відмінена.', digest='canceling check-in session')
        obj.cancel()
        log.info(f'Canceled "{obj}" due to its age.')


@app.task(bind=True, name='elists.collect_statistics')
def collect_statistics(self):
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
    FIRST_COLUMN_LENGTH = 10

    def _append(source, target, username):
        count = source.shape[0]
        completed = _count_matches(source, 'status', CheckInSession.STATUS_COMPLETED, 0)
        canceled = _count_matches(source, 'status', CheckInSession.STATUS_CANCELED, 0)
        in_progress = _count_matches(source, 'status', CheckInSession.STATUS_IN_PROGRESS, 0)
        just_started = _count_matches(source, 'status', CheckInSession.STATUS_STARTED, 0)
        assigned = source['student_id'].count()
        by_ticket = _count_matches(source, 'doc_type', CheckInSession.DOC_TYPE_TICKET, 0)
        by_gradebook = _count_matches(source, 'doc_type', CheckInSession.DOC_TYPE_GRADEBOOK, 0)
        by_certificate = _count_matches(source, 'doc_type', CheckInSession.DOC_TYPE_CERTIFICATE, 0)

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
    origin = pd.read_sql_table(CheckInSession._meta.db_table, eng)
    dt = timezone.make_naive(timezone.now())
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
        short_username = username if len(username) <= FIRST_COLUMN_LENGTH \
            else username[:FIRST_COLUMN_LENGTH - 1] + '\u2026'
        df = _append(owned, df, short_username)

    for column in INT16_COLUMNS:
        df[column] = df[column].astype('int16')

    df = df.sort_values(by=[TOTAL], ascending=False)

    msg = (
        f'--- Станом на {dt.strftime("%H:%M")} ---\n'
        f'```'
        f'{" " * (FIRST_COLUMN_LENGTH - 2)}{df.to_string(index=False)}'
        f'```'
    )
    async_notify(msg, digest='check-in session stats')
    return df.to_dict(orient='list', into=dict)


@app.task(bind=True, name='elists.dump_table')
def dump_table(self):

    def get_student_match() -> dict:
        student_df = pd.read_sql_table(Student._meta.db_table, eng)
        return {
            dbid: full_name
            for dbid, full_name in zip(student_df['id'], student_df['full_name'])
        }

    STATUS_CODE_TO_VERBOSE = dict(CheckInSession.STATUS_CHOICES)
    DOC_TYPE_CODE_TO_VERBOSE = dict(CheckInSession.DOC_TYPE_CHOICES)

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
    origin = pd.read_sql_table(CheckInSession._meta.db_table, eng)
    dt_now = timezone.make_naive(timezone.now())

    staff_dbid_to_username = {
        dbid: f'@{Staff.objects.get(id=dbid).username}'
        for dbid in origin['staff_id'].unique()
    }
    student_dbid_to_full_name = get_student_match()

    df = pd.DataFrame({
        'db ID': origin['id'],
        'Член ВКС': [
            staff_dbid_to_username[dbid]
            for dbid in origin['staff_id']
        ],
        'ПІБ студента': [
            student_dbid_to_full_name.get(dbid, '-')
            for dbid in origin['student_id']
        ],
        'Час початку': [
            timezone.make_naive(dt).strftime('%H:%M')
            for dt in origin['start_dt']
        ],
        'Час кінця': [
            timezone.make_naive(dt).strftime('%H:%M') if not pd.isna(dt) else '-'
            for dt in origin['end_dt']
        ],
        'Номер бюлетеня': [
            f'{str(bn)[:3]}/{str(bn)[3:-2]}' if not pd.isna(bn) else '-'
            for bn in origin['ballot_number']
        ],
        'Статус': [
            STATUS_CODE_TO_VERBOSE[code]
            for code in origin['status']
        ],
        'Тип документа': [
            DOC_TYPE_CODE_TO_VERBOSE[code] if not pd.isna(code) else '-'
            for code in origin['doc_type']
        ],
        'Номер документа': [
            doc_num if not pd.isna(doc_num) else '-'
            for doc_num in origin['doc_num']
        ],
    })

    df = df.sort_values(by='db ID')

    notifier_bot.send_message(f'Копія бази чек-ін сесій станом на {dt_now.strftime("%H:%M")}')
    notifier_bot.send_doc(
        file_obj=io.BytesIO(df.to_csv(index=False).encode('utf-8')),
        file_name=dt_now.strftime('check-in_sessions_%H-%M.csv'),
    )

    log.info(f'Successfully dumped check-in sessions.')
    return df.to_dict(orient='list', into=dict)


@app.task(bind=True, name='elists.dump_registered')
def dump_registered(self):
    EDUCATIONAL_DEGREE_CODE_TO_NAME = dict(Student.EDUCATIONAL_DEGREE_CHOICES)

    def get_ballot_match() -> dict:
        mapping = {}
        for cis_model in CheckInSession.objects.filter(ballot_number__isnull=False):
            mapping[cis_model.student_id] = cis_model.show_ballot_number()
        return mapping

    log.debug(f'creating mini-dump for "student_student" table ...')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
    origin = pd.read_sql_table(Student._meta.db_table, eng)
    dt_now = timezone.make_naive(timezone.now())

    dbid_to_ballot_number = get_ballot_match()
    registered = origin[origin['status'] == Student.STATUS_VOTED]

    df = pd.DataFrame({
        'ПІБ студента': registered['full_name'],
        'Освітній рівень': [
            EDUCATIONAL_DEGREE_CODE_TO_NAME[code]
            for code in registered['educational_degree']
        ],
        'Курс': registered['year'],
        'Номер бюлетеня': [
            dbid_to_ballot_number.get(dbid, '-')
            for dbid in registered['id']
        ],
        'Час останнього оновлення': [
            timezone.make_naive(dt).strftime('%H:%M') if not pd.isna(dt) else '-'
            for dt in registered['status_update_dt']
        ],
    })
    df = df.sort_values(by=['Освітній рівень', 'Курс', 'ПІБ студента'])

    notifier_bot.send_message(
        f'Список зареєстрованих студентів станом на {dt_now.strftime("%H:%M")}'
    )
    notifier_bot.send_doc(
        file_obj=io.BytesIO(df.to_csv(index=False).encode('utf-8')),
        file_name=dt_now.strftime("registered_students_%H-%M.csv"),
    )

    log.info(f'Successfully created mini-dump of registered students.')
    return df.to_dict(orient='list', into=dict)
