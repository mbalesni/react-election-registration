import logging
import sqlalchemy
import pprint
import time

import pandas as pd
from django.conf import settings

from .models import Student
from evs.celeryapp import app

log = logging.getLogger('student.tasks')


@app.task(bind=True)
def collect_statistics(self):
    start_time = time.time()
    log.info(f'collect_statistics: request accepted')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)

    df = pd.read_sql_table(Student._meta.db_table, eng)

    total_students = len(df)
    total_voted = len(df[df['status'] == Student.STATUS_VOTED])

    stats = {
        'total_voted': total_voted,
        'total_students': total_students,
    }
    log.info(
        f'collect_statistics: finished in {int(time.time() - start_time)} seconds'
        f'\n{pprint.pformat(stats)}')
    return stats
