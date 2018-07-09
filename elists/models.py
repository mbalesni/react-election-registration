import typing

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

from student.models import Student, ChoiceEnum


# for better flexibility
Staff: type = User


class CheckInSession(models.Model):

    class Status(ChoiceEnum):
        STARTED = 'Just STARTED'
        IN_PROGRESS = 'Checking in'
        CANCELED = 'Canceled'
        COMPLETED = 'Completed'

        @classmethod
        def closed_statuses(cls) -> typing.Tuple[str, str]:
            return cls.CANCELED.name, cls.COMPLETED.name

    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=3, choices=Status.as_choices(), default=Status.STARTED.name)

    start_time = models.TimeField(auto_now_add=True)
    end_time = models.TimeField(null=True)

    @property
    def is_open(self) -> bool:
        return self.status not in self.Status.closed_statuses()

    # TODO: add methods to modify, with `is_open` check inside, use it methods below

    @classmethod
    def staff_has_open_sessions(cls, staff: Staff) -> bool:
        open_sessions = cls.objects.filter(
            staff=staff, status__in=cls.Status.closed_statuses())
        return open_sessions.count() > 1

    @classmethod
    def student_has_open_sessions(cls, student: Student) -> bool:
        open_sessions = cls.objects.filter(
            student=student, status__in=cls.Status.closed_statuses())
        return open_sessions.count() > 1

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
        if cls.student_has_open_sessions(student):
            return None

        session.student = student
        session.status = cls.Status.IN_PROGRESS.name
        session.save()
        return session

    @classmethod
    def complete_session(cls, session: 'CheckInSession') -> None:
        """ Assigns current time to `end_time` and `COMPLETED` status. """
        session.end_time = timezone.now()
        session.status = cls.Status.COMPLETED.name
        session.save()

    @classmethod
    def cancel_session(cls, session: 'CheckInSession') -> None:
        """ Assigns current time to `end_time` and `CANCELED` status. """
        session.end_time = timezone.now()
        session.status = cls.Status.CANCELED.name
        session.save()
