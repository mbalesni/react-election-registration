import io
import logging
import os

import matplotlib.pyplot
import matplotlib.table
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import async_notify, notifier_bot
from .models import CheckInSession

log = logging.getLogger('elists.tasks')


@app.task(bind=True, name='elists.cancel_idle_checkin_sessions')
def cancel_idle_checkin_sessions(self, td_seconds: int =None):
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
        log.info(
            f'Canceled check-in session #{obj.id} '
            f'(started at {obj.start_dt.strftime("%H:%M")} by @{obj.staff.username}) '
            f'due to its age.'
        )


@app.task(bind=True, name='elists.collect_statistics')
def collect_statistics(self):
    log.debug('start collecting check-in session stats')

    FIRST_COLUMN_LENGTH = 10

    dt = timezone.make_naive(timezone.now())
    df = CheckInSession.dump_staff_stats()

    df['US'] = [
        un if len(un) <= FIRST_COLUMN_LENGTH
        else un[:FIRST_COLUMN_LENGTH - 1] + '\u2026'
        for un in df['US']
    ]

    msg = (
        f'--- Станом на {dt.strftime("%H:%M")} ---\n'
        f'```'
        f'{" " * (FIRST_COLUMN_LENGTH - 2)}{df.to_string(index=False)}'
        f'```'
    )
    async_notify(msg, digest='staff stats')
    log.info(f'Successfully collected staff stats.')
    return df.to_dict(orient='list', into=dict)


@app.task(bind=True, name='elists.dump_table')
def dump_table(self):
    log.debug(f'start dumping check-in session table...')

    dt_now = timezone.make_naive(timezone.now())
    df = CheckInSession.dump_table()

    notifier_bot.send_doc(
        file_obj=io.BytesIO(df.to_csv(index=False).encode('utf-8')),
        file_name=dt_now.strftime('check-in_sessions_%H-%M.csv'),
        caption=f'Копія бази чек-ін сесій станом на '
                f'{dt_now.strftime("%H:%M")} #checkin_session_dump',
    )

    log.info(f'Successfully dumped check-in sessions table.')
    return df.to_dict(orient='list', into=dict)


@app.task(bind=True, name='elists.dump_registered')
def dump_registered(self):
    log.debug(f'dumping registered students...')

    dt_now = timezone.make_naive(timezone.now())
    df = CheckInSession.dump_registered_students()

    notifier_bot.send_doc(
        file_obj=io.BytesIO(df.to_csv(index=False).encode('utf-8')),
        file_name=dt_now.strftime("registered_students_%H-%M.csv"),
        caption=f'Список зареєстрованих студентів станом на '
                f'{dt_now.strftime("%H:%M")} #registered_dump',
    )

    log.info(f'Successfully created mini-dump of registered students.')
    return df.to_dict(orient='list', into=dict)


@app.task(bind=True, name='elists.make_pdf_report')
def make_pdf_report(self):
    log.debug(f'making pdf report...')

    dt_now = timezone.make_naive(timezone.now())
    df = CheckInSession.make_report()

    os.environ['MLPBACKEND'] = 'agg'
    ax = matplotlib.pyplot.subplot(111, frame_on=False)  # no visible frame
    ax.xaxis.set_visible(False)  # hide the x axis
    ax.yaxis.set_visible(False)  # hide the y axis
    matplotlib.table.table(
        ax,
        cellText=df.values,
        rowLabels=None,
        colLabels=df.columns,
        colWidths=[0.05, 0.3, 0.15, 0.1, 0.2, 0.2],
        cellLoc='left',
        loc='center',
    )

    buf = io.BytesIO()
    matplotlib.pyplot.savefig(
        buf,
        format='pdf',
        #papertype='a4',
        #quality=95,
        orientation='portrait',
        bbox_inches='tight',
    )
    buf.seek(0)
    matplotlib.pyplot.close()

    notifier_bot.send_doc(
        file_obj=buf,
        file_name='report_23-10-18.pdf',
        caption=f'Протокол виборів делегатів до КСУ 23 жовтня 2018 року #report',
    )

    log.info('Successfully sent PDF report.')
    return df.to_dict(orient='list', into=dict)
