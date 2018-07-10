import pytest
from django.utils import timezone

from student.tests import STUDENT_KWARGS, create_models as create_student_models
from .models import CheckInSession, Staff, Student


def create_staff_account() -> Staff:
    s = Staff(username='VKS staff')
    s.save()
    return s


@pytest.mark.django_db
class TestCheckInSession:

    def test_start_new_session(self):
        staff = create_staff_account()
        now = timezone.now().time()

        session = CheckInSession.start_new_session(staff)
        assert isinstance(session, CheckInSession)
        assert session.status == CheckInSession.Status.STARTED.name
        assert session.is_open
        assert now < session.start_time
        assert session.start_time < timezone.now().time()
        assert session.end_time is None
        assert session.student is None
        assert session.staff == staff
        assert CheckInSession.staff_has_open_sessions(staff)
        assert CheckInSession.start_new_session(staff) is None

    def test_cancel_fresh_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        CheckInSession.cancel_session(session)

        assert session.status == CheckInSession.Status.CANCELED.name
        assert session.end_time < timezone.now().time()
        assert session.start_time < session.end_time
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)

    def test_assign_student(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        session = CheckInSession.start_new_session(staff)
        session = CheckInSession.assign_student_to_session(session, student)

        assert isinstance(session, CheckInSession)
        assert session.status == CheckInSession.Status.IN_PROGRESS.name
        assert session.start_time < timezone.now().time()
        assert session.end_time is None
        assert session.student == student
        assert session.is_open
        assert CheckInSession.staff_has_open_sessions(staff)
        assert not CheckInSession.student_allowed_to_assign(student)

    def test_cancel_inprogress_session(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        session = CheckInSession.start_new_session(staff)
        CheckInSession.assign_student_to_session(session, student)
        CheckInSession.cancel_session(session)

        assert session.status == CheckInSession.Status.CANCELED.name
        assert session.end_time < timezone.now().time()
        assert session.start_time < session.end_time
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert CheckInSession.student_allowed_to_assign(student)

    def test_complete_session(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        session = CheckInSession.start_new_session(staff)
        CheckInSession.assign_student_to_session(session, student)
        CheckInSession.complete_session(session)

        assert session.status == CheckInSession.Status.COMPLETED.name
        assert session.end_time < timezone.now().time()
        assert session.start_time < session.end_time
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert not CheckInSession.student_allowed_to_assign(student)

    def test_complete_canceled_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        # if `cancel_session` works fine, than we don't need to test case when
        # student was assigned before canceling
        CheckInSession.cancel_session(session)
        assert CheckInSession.complete_session(session) is None

    def test_complete_fresh_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        assert CheckInSession.complete_session(session) is None

    def test_staff_has_open_sessions(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        assert not CheckInSession.staff_has_open_sessions(staff)

        s1 = CheckInSession.start_new_session(staff)
        assert CheckInSession.staff_has_open_sessions(staff)
        CheckInSession.cancel_session(s1)
        assert not CheckInSession.staff_has_open_sessions(staff)

        s2 = CheckInSession.start_new_session(staff)
        assert CheckInSession.staff_has_open_sessions(staff)
        CheckInSession.assign_student_to_session(s2, student)
        assert CheckInSession.staff_has_open_sessions(staff)
        CheckInSession.complete_session(s2)
        assert not CheckInSession.staff_has_open_sessions(staff)

    def test_student_allowed_to_assign(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        assert CheckInSession.student_allowed_to_assign(student)

        s1 = CheckInSession.start_new_session(staff)
        CheckInSession.assign_student_to_session(s1, student)
        assert not CheckInSession.student_allowed_to_assign(student)
        CheckInSession.cancel_session(s1)
        assert CheckInSession.student_allowed_to_assign(student)

        s2 = CheckInSession.start_new_session(staff)
        CheckInSession.assign_student_to_session(s2, student)
        CheckInSession.complete_session(s2)
        assert not CheckInSession.student_allowed_to_assign(student)
