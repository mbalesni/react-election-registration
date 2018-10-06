import io
import logging
import pprint

import pandas as pd
import sqlalchemy
from django.conf import settings
from django.utils import timezone

from evs.celeryapp import app
from tgapp.tasks import async_publish, notifier_bot
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
        'datetime': dt,
        'total_voted': total_voted,
        'total_students': total_students,
    }

    log.debug(f'collect_statistics: sending telegram message...')
    tg_msg = (
        f'-- Статистика станом на {dt.strftime("%H:%M")} --'
        f'```'
        f'* Всього проголосувало {total_voted} студентів'
        f'```'
    )
    async_publish(msg=tg_msg, digest='student stats', duplicate=True)

    log.info(
        f'collect_statistics: {pprint.pformat(stats)}')

    return stats


@app.task(bind=True, name='student.mini_dump')
def mini_dump(self):
    EDUCATIONAL_DEGREE_CODE_TO_NAME = dict(Student.EDUCATIONAL_DEGREE_CHOICES)

    log.debug(f'mini_dump: request accepted')

    eng: sqlalchemy.engine.Engine = sqlalchemy.create_engine(settings.DATABASE_URL)
    origin = pd.read_sql_table(Student._meta.db_table, eng)
    dt_now = timezone.make_naive(timezone.now())

    registered = origin[origin['status'] == Student.STATUS_VOTED]

    df = pd.DataFrame({
        'ПІБ': registered['full_name'],
        'Час останнього оновлення': [
            timezone.make_naive(dt).strftime('%H:%M')
            for dt in registered['status_update_dt']
        ],
        'Освітній рівень': [EDUCATIONAL_DEGREE_CODE_TO_NAME[code] for code in registered['educational_degree']],
        'Курс': registered['year'],
    })

    notifier_bot.send_message(
        f'Список зареєстрованих студентів станом на {dt_now.strftime("%H:%M")}'
    )
    notifier_bot.send_doc(
        file_obj=io.BytesIO(df.to_csv(index=False).encode('utf-8')),
        file_name=dt_now.strftime("registered_students_%H-%M.csv"),
    )

    return df.to_dict(orient='list', into=dict)
