from .constants import (
    RESPONSE_TOKEN, REQUEST_TICKET_NUMBER, REQUEST_DOC_NUM, REQUEST_DOC_TYPE,
    REQUEST_STUDENT_TOKEN, RESPONSE_STUDENT_STATUS, RESPONSE_STUDENT_STATUS_CODE, RESPONSE_STUDENT_STATUS_NAME,
)
from .middleware import EListsMiddleware, Request
from .models import CheckInSession, Student


@EListsMiddleware.mark(require_session=False)
def start_new_session(request: Request):
    staff = request.elists_cisi.staff

    if CheckInSession.staff_has_open_sessions(staff):
        raise PermissionError('Staff already has open sessions.')

    session = CheckInSession.start_new_session(staff)
    request.elists_cisi.assign_session(session)
    return {RESPONSE_TOKEN: session.create_token()}


@EListsMiddleware.mark()
def search_student_by_ticket_number(request: Request):
    session = request.elists_cisi.session
    if not session.just_started:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')

    ticket_number = request.elists_cisi.data[REQUEST_TICKET_NUMBER]
    student = Student.search_by_ticket_number(ticket_number)

    return {
        "full_name": student.full_name,
        "educational_degree": student.educational_degree,
        "year": student.year,
        "form_of_study": student.form_of_study,
        RESPONSE_STUDENT_STATUS: {
            RESPONSE_STUDENT_STATUS_CODE: student.status,
            RESPONSE_STUDENT_STATUS_NAME: student.status_verbose,
        },
        REQUEST_STUDENT_TOKEN: student.create_token(),
        RESPONSE_TOKEN: session.create_token(),
    }


@EListsMiddleware.mark()
def submit_student(request: Request):
    session = request.elists_cisi.session
    student_token = request.elists_cisi.data[REQUEST_STUDENT_TOKEN]
    doc_type = request.elists_cisi.data[REQUEST_DOC_TYPE]
    doc_num = request.elists_cisi.data[REQUEST_DOC_NUM]

    student = Student.get_student_by_token(student_token)
    if not student.allowed_to_assign:
        raise PermissionError(f'This student is not allowed to assign.')
    if not session.just_started:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')

    session.assign_student(
        student=student,
        doc_type=doc_type,
        doc_num=doc_num,
    )


@EListsMiddleware.mark()
def complete_session(request: Request):
    session = request.elists_cisi.session

    if session.student is None:
        raise ValueError('No student assigned.')
    if not session.is_open:
        raise ValueError('Session is already closed.')

    session.complete()


@EListsMiddleware.mark()
def cancel_session(request: Request):
    session = request.elists_cisi.session

    if not session.is_open:
        raise ValueError('Session is already closed.')

    session.cancel()


@EListsMiddleware.mark(require_session=False)
def close_sessions(request: Request):
    staff = request.elists_cisi.staff
    CheckInSession.close_sessions(staff)


@EListsMiddleware.mark(require_session=False)
def refresh_auth(request: Request):
    return {'logged_in': 'yes'}
