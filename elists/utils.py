import time

from django.utils import timezone

from .constants import Staff


def get_current_naive_time() -> time:
    return timezone.make_naive(timezone.now()).time()


# FIXME: get Staff object from session
def get_staff():
    return Staff.objects.first()
