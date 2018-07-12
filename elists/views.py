from .constants import RESPONSE_TOKEN
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
def get_student_by_ticket_number(request: Request):
    session = request.elists_cisi.session
    ticket_number = request.elists_cisi.data['student_ticket_number']
    student = Student.get_student_by_ticket_number(ticket_number)

    if not CheckInSession.student_allowed_to_assign(student):
        if CheckInSession.objects.filter(student=student, status=0):
            raise ValueError('Student had already voted.')
        else:
            raise ValueError('Student has open session(s).')
    if session.status != CheckInSession.STATUS_STARTED:
        raise PermissionError(
            f'Wrong session status: [{session.status}] "{session.status_verbose}".')

    session.assign_student(student)
    return {
        "full_name": student.full_name,
        "educational_degree": student.educational_degree,
        "year": student.year,
        RESPONSE_TOKEN: session.create_token(),
    }


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
