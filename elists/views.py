from .constants import (
    RESPONSE_TOKEN, REQUEST_TICKET_NUMBER, REQUEST_DOC_NUM, REQUEST_DOC_TYPE,
    REQUEST_STUDENT_TOKEN,
)
from .middleware import Request, mark
from .models import CheckInSession, Student


@mark(require_session=False)
def start_new_session(request: Request):
    staff = request.elists_cisi.staff

    if CheckInSession.staff_has_open_sessions(staff):
        raise PermissionError('Staff already has open sessions.')

    session = CheckInSession.start_new_session(staff)
    request.elists_cisi.assign_session(session)
    return {RESPONSE_TOKEN: session.create_token()}


@mark()
def search_student_by_ticket_number(request: Request):
    session = request.elists_cisi.session
    ticket_number = request.elists_cisi.data[REQUEST_TICKET_NUMBER]
    student = Student.search_by_ticket_number(ticket_number)

    if not CheckInSession.student_allowed_to_assign(student):
        if CheckInSession.objects.filter(student=student, status=0):
            raise ValueError('Student had already voted.')
        else:
            raise ValueError('Student has open session(s).')
    if session.status != CheckInSession.STATUS_STARTED:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')


    return {
        "full_name": student.full_name,
        "educational_degree": student.educational_degree,
        "year": student.year,
        "form_of_study": student.form_of_study,
        REQUEST_STUDENT_TOKEN: student.create_token(),
        RESPONSE_TOKEN: session.create_token(),
    }


@mark()
def submit_student(request: Request):
    session = request.elists_cisi.session
    student_token = request.elists_cisi.data[REQUEST_STUDENT_TOKEN]
    doc_type = request.elists_cisi.data[REQUEST_DOC_TYPE]
    doc_num = request.elists_cisi.data[REQUEST_DOC_NUM]

    student = Student.get_student_by_token(student_token)
    session.assign_student(
        student=student,
        doc_type=doc_type,
        doc_num=doc_num,
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
    return {'logged_in': 'yes'}
