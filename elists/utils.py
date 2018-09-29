import time
from datetime import datetime, timedelta

from django.utils import timezone


def get_current_naive_datetime() -> time:
    return timezone.make_naive(timezone.now())


def time_diff(t1: time, t2: time) -> timedelta:
    dt1, dt2 = (datetime.combine(datetime.today().date(), t) for t in (t1, t2))
    return dt2 - dt1


def time_diff_formatted(start: time, end: time) -> str:
    diff: timedelta = time_diff(start, end)
    minutes = diff.seconds // 60
    seconds = diff.seconds % 60
    string = f'{seconds}с.'
    if minutes > 0:
        string = f'{minutes}хв. ' + string
    return string
