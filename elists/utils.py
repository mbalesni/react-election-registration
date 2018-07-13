import time

from django.utils import timezone


def get_current_naive_time() -> time:
    return timezone.make_naive(timezone.now()).time()
