from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from student.models import Student, ChoiceEnum

# for better flexibility
Staff: type = User


class CheckInSession(models.Model):

    class Status(ChoiceEnum):
        STARTED = 'Just STARTED'
        IN_PROGRESS = 'Checking in'
        CANCELED = 'Canceled'
        COMPLETED = 'Completed'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20, choices=Status.as_choices(), default=Status.STARTED.name)

    start_time = models.TimeField(auto_now_add=True)
    end_time = models.TimeField(null=True)

    def __repr__(self) -> str:
        return f'<CheckInSession #{self.id} [{self.status}] by "{self.staff}">'

    def __str__(self) -> str:
        return f'Check-in session [{self.status}] by "{self.staff}" from {self.start_time}'

    @property
    def is_open(self) -> bool:
        return self.status in (
            self.Status.STARTED.name,
            self.Status.IN_PROGRESS.name,
        )

    @classmethod
    def staff_has_open_sessions(cls, staff: Staff) -> bool:
        return cls.objects.filter(
            staff=staff,
            status__in=(
                cls.Status.STARTED.name,
                cls.Status.IN_PROGRESS.name
            ),
        ).count() > 0

    @classmethod
    def student_allowed_to_assign(cls, student: Student) -> bool:
        return cls.objects.filter(
            student=student,
            status__in=(
                cls.Status.STARTED.name,      # no other sessions
                cls.Status.IN_PROGRESS.name,  # no other sessions
                cls.Status.COMPLETED.name,    # can't vote twice
            ),
        ).count() == 0

    @classmethod
    def start_new_session(cls, staff: Staff) -> 'CheckInSession' or None:
        """ Checks if `staff` has open sessions. Starts new session for `staff`.
        Records `start_time`, assigns `Status.std` status and lefts `student`
        and `end_time` unassigned.

        :param staff: logged in staff
        :return: model if everything was OK, else returns None
        """
        if cls.staff_has_open_sessions(staff):
            return None

        # assigns default status, NULL student_id and end_time
        new_check_in_session = cls(staff=staff)

        # nothing to validate
        new_check_in_session.save()

        return new_check_in_session

    @classmethod
    def assign_student_to_session(cls, session: 'CheckInSession',
                                  student: Student) -> 'CheckInSession' or None:
        """ Checks if `student` has open sessions. Assigns `student` to given
        `session` and updates status to `IN_PROGRESS` value. """
        if not (cls.student_allowed_to_assign(student) and
                session.status == cls.Status.STARTED.name):
            return None

        session.student = student
        session.status = cls.Status.IN_PROGRESS.name
        session.save()
        return session

    @classmethod
    def complete_session(cls, session: 'CheckInSession') -> 'CheckInSession' or None:
        """ Assigns current time to `end_time` and `COMPLETED` status. """
        if not session.is_open or session.student is None:
            return None

        session.end_time = timezone.now().time()
        session.status = cls.Status.COMPLETED.name

        session.save()
        return session

    @classmethod
    def cancel_session(cls, session: 'CheckInSession') -> 'CheckInSession' or None:
        """ Assigns current time to `end_time` and `CANCELED` status. """
        if not session.is_open:
            return None

        session.end_time = timezone.now().time()
        session.status = cls.Status.CANCELED.name

        session.save()
        return session
