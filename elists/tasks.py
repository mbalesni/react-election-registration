import logging

import pandas as pd
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import tg_notify
from .models import CheckInSession, Staff

log = logging.getLogger('elists.tasks')


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
        tg_notify(f'{obj} буде відмінена.')
        obj.cancel()
        log.info(f'Canceled "{obj}" due to its age.')


@app.task(bind=True, name='elists.collect_statistics')
def collect_statistics(self):
    USERNAME = 'Член ВКС'
    TOTAL = 'Всього'
    COMPLETED = 'Завершені'
    OPEN = 'Відриті'
    COLUMNS = (USERNAME, TOTAL, COMPLETED, OPEN)
    INT16_COLUMNS = (TOTAL, COMPLETED, OPEN)

    staff_ids = CheckInSession.objects.distinct().values_list('staff', flat=True)
    username_to_stats = {}
    df = pd.DataFrame({k: [] for k in COLUMNS})

    all_qs = CheckInSession.objects
    completed_qs = CheckInSession.filter_completed(qs=all_qs)
    open_qs = CheckInSession.filter_open(qs=all_qs)

    for staff_id in staff_ids:
        staff = Staff.objects.get(id=staff_id)
        staff_username = f'@{staff.username}'

        total_count = all_qs.filter(staff_id=staff_id).count()
        completed_count = completed_qs.filter(staff_id=staff_id).count()
        open_count = open_qs.filter(staff_id=staff_id).count()

        username_to_stats[staff_username] = (total_count, completed_count, open_count)
        df = df.append({
            USERNAME: staff_username,
            TOTAL: total_count,
            COMPLETED: completed_count,
            OPEN: open_count,
        }, ignore_index=True)

    for column in INT16_COLUMNS:
        df[column] = df[column].astype('int16')

    msg = (
        f'--- Станом на {timezone.now().strftime("%H:%M")} ---\n'
        f'``` {df.to_string(index=False)}```'
    )
    tg_notify(msg)
    return username_to_stats
