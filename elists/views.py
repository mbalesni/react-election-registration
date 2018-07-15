from .constants import (
    RESPONSE_STUDENT, REQUEST_STUDENT_TICKET_NUMBER, REQUEST_STUDENT_DOC_NUM,
    REQUEST_STUDENT_DOC_TYPE, REQUEST_STUDENT_TOKEN, REQUEST_STUDENT,
)
from .middleware import Request, mark, serialize_student
from .models import CheckInSession, Student


@mark(require_session=False)
def start_new_session(request: Request):
    staff = request.elists_cisi.staff

    if CheckInSession.staff_has_open_sessions(staff):
        raise PermissionError('Staff already has open sessions.')

    session = CheckInSession.start_new_session(staff)
    request.elists_cisi.assign_session(session)


@mark()
def search_student_by_ticket_number(request: Request):
    session = request.elists_cisi.session
    if not session.just_started:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')

    ticket_number = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_TICKET_NUMBER]
    student = Student.search_by_ticket_number(ticket_number)

    return {
        RESPONSE_STUDENT: serialize_student(student),
    }


@mark()
def submit_student(request: Request):
    session = request.elists_cisi.session
    student_token = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_TOKEN]
    student_doc_type = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_DOC_TYPE]
    student_doc_num = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_DOC_NUM]

    student = Student.get_student_by_token(student_token)
    if not student.allowed_to_assign:
        raise PermissionError(f'This student is not allowed to assign.')
    if not session.just_started:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')

    session.assign_student(
        student=student,
        doc_type=student_doc_type,
        doc_num=student_doc_num,
    )


@mark()
def complete_session(request: Request):
    session = request.elists_cisi.session

    if session.student is None:
        raise ValueError('No student assigned.')
    if not session.is_open:
        raise ValueError('Session is already closed.')

    session.complete()


@mark()
def cancel_session(request: Request):
    session = request.elists_cisi.session

    if not session.is_open:
        raise ValueError('Session is already closed.')

    session.cancel()


@mark(require_session=False)
def close_sessions(request: Request):
    staff = request.elists_cisi.staff
    CheckInSession.close_sessions(staff)


@mark(require_session=False)
def refresh_auth(request: Request):
    pass
