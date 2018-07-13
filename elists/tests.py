import pytest

from student.models import Student
from student.tests import STUDENT_KWARGS, create_models as create_student_models
from .constants import Staff
from .models import CheckInSession
from .utils import get_current_naive_time


def create_staff_account() -> Staff:
    s = Staff(username='VKS staff')
    s.save()
    return s


@pytest.mark.django_db
class TestCheckInSession:

    def test_start_new_session(self):
        time_before = get_current_naive_time()
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        assert isinstance(session, CheckInSession)
        assert session.status == CheckInSession.STATUS_STARTED
        assert time_before < session.start_time < get_current_naive_time()
        assert session.is_open
        assert session.end_time is None
        assert session.student is None
        assert session.staff == staff
        assert CheckInSession.staff_has_open_sessions(staff)
        # TODO: to WEB ## assert CheckInSession.start_new_session(staff) is None

    def test_cancel_fresh_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        session.cancel()

        assert session.status == CheckInSession.STATUS_CANCELED
        assert session.start_time < session.end_time < get_current_naive_time()
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)

    def test_assign_student(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        doc_type = 0
        doc_num = str(student.ticket_number)

        session = CheckInSession.start_new_session(staff)
        session = session.assign_student(student, doc_type, doc_num)

        assert isinstance(session, CheckInSession)
        assert session.status == CheckInSession.STATUS_IN_PROGRESS
        assert session.end_time is None
        assert session.student == student
        assert session.is_open
        assert CheckInSession.staff_has_open_sessions(staff)
        assert not CheckInSession.student_allowed_to_assign(student)

    # TODO: convert to WEB
    @pytest.mark.skip
    def test_cancel_inprogress_session(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        session = CheckInSession.start_new_session(staff)
        session.assign_student(student)
        session.cancel()

        assert session.status == CheckInSession.STATUS_CANCELED
        assert session.start_time < session.end_time < get_current_naive_time()
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert CheckInSession.student_allowed_to_assign(student)

    def test_complete_session(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        session = CheckInSession.start_new_session(staff)
        session.assign_student(student)
        session.complete()

        assert session.status == CheckInSession.STATUS_COMPLETED
        assert session.start_time < session.end_time < get_current_naive_time()
        assert not session.is_open
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert not CheckInSession.student_allowed_to_assign(student)

    # TODO: convert to WEB
    @pytest.mark.skip
    def test_complete_canceled_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        # if `cancel_session` works fine, than we don't need to test case when
        # student was assigned before canceling
        session.cancel()
        assert session.complete()

    # TODO: convert to WEB
    @pytest.mark.skip
    def test_complete_fresh_session(self):
        staff = create_staff_account()

        session = CheckInSession.start_new_session(staff)
        assert session.complete(session) is None

    def test_staff_has_open_sessions(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        assert not CheckInSession.staff_has_open_sessions(staff)

        s1 = CheckInSession.start_new_session(staff)
        assert CheckInSession.staff_has_open_sessions(staff)
        s1.cancel()
        assert not CheckInSession.staff_has_open_sessions(staff)

        s2 = CheckInSession.start_new_session(staff)
        assert CheckInSession.staff_has_open_sessions(staff)
        s2.assign_student(student)
        assert CheckInSession.staff_has_open_sessions(staff)
        s2.complete()
        assert not CheckInSession.staff_has_open_sessions(staff)

    def test_student_allowed_to_assign(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        assert CheckInSession.student_allowed_to_assign(student)

        s1 = CheckInSession.start_new_session(staff)
        s1.assign_student(student)
        assert not CheckInSession.student_allowed_to_assign(student)
        s1.cancel()
        assert CheckInSession.student_allowed_to_assign(student)

        s2 = CheckInSession.start_new_session(staff)
        s2.assign_student(student)
        s2.complete()
        assert not CheckInSession.student_allowed_to_assign(student)

    def test_get_session_by_staff(self):
        staff = create_staff_account()
        student: Student = create_student_models(**STUDENT_KWARGS)[0]

        s1 = CheckInSession.start_new_session(staff)
        assert CheckInSession.get_session_by_staff(staff) == s1
        s1.cancel()
        assert CheckInSession.get_session_by_staff(staff) is None

        s2 = CheckInSession.start_new_session(staff)
        assert CheckInSession.get_session_by_staff(staff) == s2
        s2.assign_student(student)
        assert CheckInSession.get_session_by_staff(staff) == s2
        s2.complete()
        assert CheckInSession.get_session_by_staff(staff) is None

    def test_close_sessions(self):
        staff = create_staff_account()

        s1 = CheckInSession.start_new_session(staff)
        CheckInSession.close_sessions(staff)
        assert CheckInSession.objects.get(id=s1.id).status == CheckInSession.STATUS_CANCELED
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert CheckInSession.get_session_by_staff(staff) is None

        s2 = CheckInSession.start_new_session(staff)
        student: Student = create_student_models(**STUDENT_KWARGS)[0]
        s2.assign_student(student)
        CheckInSession.close_sessions(staff)
        assert CheckInSession.objects.get(id=s2.id).status == CheckInSession.STATUS_CANCELED
        assert not CheckInSession.staff_has_open_sessions(staff)
        assert CheckInSession.get_session_by_staff(staff) is None

    def test_token(self):
        staff = create_staff_account()
        session = CheckInSession.start_new_session(staff)
        token = session.create_token()
        assert CheckInSession.get_session_by_token(token) == session
