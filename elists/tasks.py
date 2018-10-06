import logging

import sqlalchemy
import pandas as pd
import numpy as np
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import async_notify
from .models import CheckInSession, Staff

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

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
    origin = pd.read_sql_table(CheckInSession._meta.db_table, eng)
    dt = timezone.make_naive(timezone.now())
    df = pd.DataFrame({k: [] for k in COLUMNS})

    staff_dbids = origin['staff_id'].unique()
    dbid_to_username = {
        dbid: f'@{Staff.objects.get(id=dbid).username}'
        for dbid in staff_dbids
    }

    total_count = origin.shape[0]
    total_completed = _count_matches(origin, 'status', CheckInSession.STATUS_COMPLETED, 0)
    total_canceled = _count_matches(origin, 'status', CheckInSession.STATUS_CANCELED, 0)
    total_in_progress = _count_matches(origin, 'status', CheckInSession.STATUS_IN_PROGRESS, 0)
    total_just_started = _count_matches(origin, 'status', CheckInSession.STATUS_STARTED, 0)
    total_assigned = origin['student_id'].count()
    total_by_ticket = _count_matches(origin, 'doc_type', CheckInSession.DOC_TYPE_TICKET, 0)
    total_by_gradebook = _count_matches(origin, 'doc_type', CheckInSession.DOC_TYPE_GRADEBOOK, 0)
    total_by_certificate = _count_matches(origin, 'doc_type', CheckInSession.DOC_TYPE_CERTIFICATE, 0)

    df = df.append({
        USERNAME      : 'Всього',
        TOTAL         : total_count,
        COMPLETED     : total_completed,
        CANCELED      : total_canceled,
        IN_PROGRESS   : total_in_progress,
        JUST_STARTED  : total_just_started,
        ASSIGNED      : total_assigned,
        BY_TICKET     : total_by_ticket,
        BY_GRADEBOOK  : total_by_gradebook,
        BY_CERTIFICATE: total_by_certificate,
    }, ignore_index=True)

    for staff_dbid in staff_dbids:
        owned = origin[origin['staff_id'] == staff_dbid]
        username = dbid_to_username[staff_dbid]

        count = owned.shape[0]
        completed = _count_matches(owned, 'status', CheckInSession.STATUS_COMPLETED, 0)
        canceled = _count_matches(owned, 'status', CheckInSession.STATUS_CANCELED, 0)
        in_progress = _count_matches(owned, 'status', CheckInSession.STATUS_IN_PROGRESS, 0)
        just_started = _count_matches(owned, 'status', CheckInSession.STATUS_STARTED, 0)
        assigned = owned['student_id'].count()
        by_ticket = _count_matches(owned, 'doc_type', CheckInSession.DOC_TYPE_TICKET, 0)
        by_gradebook = _count_matches(owned, 'doc_type', CheckInSession.DOC_TYPE_GRADEBOOK, 0)
        by_certificate = _count_matches(owned, 'doc_type', CheckInSession.DOC_TYPE_CERTIFICATE, 0)

        df = df.append({
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

    for column in INT16_COLUMNS:
        df[column] = df[column].astype('int16')

    msg = (
        f'--- Станом на {dt.strftime("%H:%M")} ---\n'
        f'```'
        f'{df.to_string(index=True)}'
        f'```'
    )
    async_notify(msg, digest='check-in session stats')
    return df.to_dict(orient='list', into=dict)
