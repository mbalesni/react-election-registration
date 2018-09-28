import logging
import sqlalchemy
import pprint
import time
from django.utils import timezone

import pandas as pd
from django.conf import settings

from .models import Student
from evs.celeryapp import app
from tgapp.bots_api import notifier_bot

log = logging.getLogger('student.tasks')


@app.task(bind=True)
def collect_statistics(self):
    start_time = time.time()
    log.debug(f'collect_statistics: request accepted')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)

    df = pd.read_sql_table(Student._meta.db_table, eng)
    dt = timezone.make_naive(timezone.now())

    total_students = len(df)
    total_voted = len(df[df['status'] == Student.STATUS_VOTED])

    end_time = time.time()
    stats = {
        'total_voted': total_voted,
        'total_students': total_students,
    }
    log.debug(f'collect_statistics: sending telegram message...')
    notifier_bot.send_message(f'''
-- Статистика станом на {dt.strftime("%H:%M")} --
    
* Cтудентів проголосувало - {total_voted}''')

    log.info(
        f'collect_statistics: finished in {int(end_time - start_time)} seconds'
        f'\n{pprint.pformat(stats)}')

    return stats
