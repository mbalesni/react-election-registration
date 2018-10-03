import logging
import pprint

import pandas as pd
import sqlalchemy
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp import tasks
from .models import Student

log = logging.getLogger('student.tasks')


@app.task(bind=True, name='student.collect_statistics')
def collect_statistics(self):
    log.debug(f'collect_statistics: request accepted')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)

    df = pd.read_sql_table(Student._meta.db_table, eng)
    dt = timezone.make_naive(timezone.now())

    total_students = len(df)
    total_voted = len(df[df['status'] == Student.STATUS_VOTED])

    stats = {
        'total_voted': total_voted,
        'total_students': total_students,
    }

    log.debug(f'collect_statistics: sending telegram message...')
    tg_msg = f'''
-- Статистика станом на {dt.strftime("%H:%M")} --
    
* Cтудентів проголосувало - {total_voted}'''
    tasks.notify.delay(message=tg_msg)

    log.info(
        f'collect_statistics: {pprint.pformat(stats)}')

    return stats
