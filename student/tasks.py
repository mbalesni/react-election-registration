import logging
import pprint

import pandas as pd
import sqlalchemy
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import publish, notify
from .models import Student

log = logging.getLogger('student.tasks')


@app.task(bind=True, name='student.collect_statistics')
def collect_statistics(self):
    log.debug(f'collect_statistics: request accepted')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
    df = pd.read_sql_table(Student._meta.db_table, eng)
    dt = timezone.make_naive(timezone.now())

    total_voted = len(df[df['status'] == Student.STATUS_VOTED])

    stats = {
        'datetime': dt.strftime(f'%H:%M'),
        'total_voted': total_voted,
    }

    log.debug(f'collect_statistics: sending telegram message...')
    tg_msg = (
        f'-- Статистика станом на {dt.strftime("%H:%M")} --\n'
        f'```\n'
        f'* Всього проголосувало {total_voted} студентів\n'
        f'```'
    )
    publish(message=tg_msg, digest='student stats')
    notify(message=tg_msg, digest='student stats')

    log.info(
        f'collect_statistics: {pprint.pformat(stats)}')

    return stats
