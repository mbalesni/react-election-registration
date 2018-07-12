from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from student.models import Student

# for better flexibility
Staff = User


class CheckInSession(models.Model):

    STATUS_STARTED = 1
    STATUS_IN_PROGRESS = 2
    STATUS_CANCELED = -1
    STATUS_COMPLETED = 0
    STATUS_CHOICES = (
        (STATUS_STARTED, "started"),
        (STATUS_IN_PROGRESS, "in_progress"),
        (STATUS_CANCELED, "canceled"),
        (STATUS_COMPLETED, "completed"),
    )
    """ Open status are natural numbers (positive integers), while 'completed' 
    is 0 (like exit code) and 'canceled' is -1 (something went wrong). """

    # references
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        null=True,
        verbose_name='Виборець',
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        verbose_name='Член ВКС',
    )

    # status
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        verbose_name='Статус',
    )

    # time marks
    start_time = models.TimeField(
        auto_now_add=True,
        verbose_name='Час початку',
    )
    end_time = models.TimeField(
        null=True,
        verbose_name='Час завершення',
    )

    def __repr__(self) -> str:
        return f'<CheckInSession #{self.id} [{self.status}] by "{self.staff}">'

    def __str__(self) -> str:
        return f'Сесія [{self.get_status_display()}] почата "{self.staff}" о {self.start_time.strftime("%H:%M")}'

    @property
    def is_open(self) -> bool:
        return self.status > 0

    @property
    def status_verbose(self) -> str:
        return dict(self.STATUS_CHOICES)[self.status]

    @classmethod
    def student_allowed_to_assign(cls, student: Student) -> bool:
        return cls.objects.filter(student=student, status__gte=0).count() == 0

    @classmethod
    def get_session_by_staff(cls, staff) -> 'CheckInSession' or None:
        try:
            return cls.objects.get(staff=staff, status__gt=0)
        except models.ObjectDoesNotExist:
            return None

    @classmethod
    def staff_has_open_sessions(cls, staff: Staff) -> bool:
        return cls.get_session_by_staff(staff) is not None

    @classmethod
    def start_new_session(cls, staff: Staff) -> 'CheckInSession' or None:
        """ Checks if `staff` has open sessions. Starts new session for `staff`.
        Records `start_time`, assigns `Status.std` status and lefts `student`
        and `end_time` unassigned.

        :param staff: logged in staff
        :return: model if everything was OK, else returns None
        """
        if cls.staff_has_open_sessions(staff):
            raise PermissionError('Staff already has open session.')

        # assigns default status, NULL student_id and end_time
        new_check_in_session = cls(staff=staff, status=cls.STATUS_STARTED)

        # nothing to validate
        new_check_in_session.save()

        return new_check_in_session

    @classmethod
    def assign_student_to_session(cls, session: 'CheckInSession',
                                  student: Student) -> 'CheckInSession' or None:
        """ Checks if `student` has open sessions. Assigns `student` to given
        `session` and updates status to `IN_PROGRESS` value. """
        if not cls.student_allowed_to_assign(student):
            if cls.objects.filter(student=student, status=0):
                raise ValueError('Student had already voted.')
            else:
                raise ValueError('Student has open session(s).')
        if session.status != cls.STATUS_STARTED:
            raise PermissionError(
                f'Wrong session status: [{session.status}] "{session.status_verbose}".')

        session.student = student
        session.status = cls.STATUS_IN_PROGRESS
        session.save()
        return session

    @classmethod
    def complete_session(cls, session: 'CheckInSession') -> 'CheckInSession' or None:
        """ Assigns current time to `end_time` and `COMPLETED` status. """
        if session.student is None:
            raise ValueError('No student assigned.')
        if not session.is_open:
            raise ValueError('Session is already closed.')

        session.end_time = timezone.now().time()
        session.status = cls.STATUS_COMPLETED

        session.save()
        return session

    @classmethod
    def cancel_session(cls, session: 'CheckInSession') -> 'CheckInSession' or None:
        """ Assigns current time to `end_time` and `CANCELED` status. """
        if not session.is_open:
            raise ValueError('Session is already closed.')

        session.end_time = timezone.now().time()
        session.status = cls.STATUS_CANCELED

        session.save()
        return session
