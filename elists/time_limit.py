from django.conf import settings
from django.utils import timezone


class TimeLimitController:

    def __init__(self, start_dt: str, end_dt: str, datefmt: str, enabled: bool):
        self._start_dt = timezone.datetime.strptime(start_dt, datefmt)
        self._end_dt = timezone.datetime.strptime(end_dt, datefmt)
        self._enabled = enabled

        if not enabled:
            self.check = lambda *args, **kwargs: True

    @property
    def start_dt(self) -> timezone.datetime:
        return self._start_dt

    @property
    def end_dt(self) -> timezone.datetime:
        return self._end_dt

    @property
    def enabled(self) -> bool:
        return self._enabled

    def check(self):
        now = timezone.make_naive(timezone.now())
        return self._start_dt < now < self._end_dt


time_limit_controller = TimeLimitController(
    start_dt=settings.ELECTIONS_START_DT,
    end_dt=settings.ELECTIONS_END_DT,
    datefmt=settings.ELECTIONS_DATEFMT,
    enabled=settings.ELECTIONS_ENABLE_TIME_LIMIT,
)
