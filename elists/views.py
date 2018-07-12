import json

from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_POST

from .models import CheckInSession, Student, Staff


# FIXME: get Staff object from session
def get_staff():
    return Staff.objects.first()


REQUEST_TOKEN = 'check_in_session_token'
RESPONSE_TOKEN = 'check_in_session_token'


class EListsCheckInSessionInfo:

    def __init__(self, staff: Staff, data: dict, session: CheckInSession =None):
        self.staff = staff
        self.data = data
        self.session = session

    def assign_session(self, session: CheckInSession):
        self.session = session

    @property
    def status_code(self) -> int:
        return self.session.status

    @property
    def status_name(self) -> str:
        return self.session.status_verbose

    def get_status_dict(self) -> dict or None:
        if self.session is None:
            return None
        else:
            return {
                'code': self.status_code,
                'name': self.status_name,
            }

    def retrieve_session(self) -> CheckInSession:
        token = self.data.get(REQUEST_TOKEN, None)
        if token is None:
            raise PermissionError(
                f'Provide "{REQUEST_TOKEN}" field to perform this action.')
        session = CheckInSession.get_session_by_token(token)
        self.session = session
        return session


# created to abuse PyCharms type hints
class Request(HttpRequest):
    def __init__(self):
        self.elists_cisi = EListsCheckInSessionInfo(Staff(), {})
        super().__init__()


class EListsMiddleware:

    MARK_ATTR_NAME = 'elists_mark'
    REQUIRE_SESSION_MARK = 'elists__require_session'

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: Request):
        data = json.loads(request.body)
        staff = get_staff()

        request.elists_cisi = EListsCheckInSessionInfo(staff, data)

        response = self.get_response(request)
        return response

    def process_view(self, request: Request, view_func, view_args, view_kwargs):
        if not (hasattr(view_func, self.MARK_ATTR_NAME) and
                getattr(view_func, self.MARK_ATTR_NAME)):
            return None

        try:
            if getattr(view_func, self.REQUIRE_SESSION_MARK):
                request.elists_cisi.retrieve_session()

            data = view_func(request, *view_args, **view_kwargs)
        except Exception as exc:
            response_status_code = 400
            data = None
            error = self._convert_exception(exc)
        else:
            response_status_code = 200
            error = None

        resp = {}
        if request.elists_cisi.session:
            resp['status'] = request.elists_cisi.get_status_dict()
        if error:
            resp['error'] = error
        if data:
            resp['data'] = data

        response = JsonResponse(resp)
        response.status_code = response_status_code
        return response

    def _convert_exception(self, exc: Exception) -> dict:
        return {
            'message': str(exc),
            'type'   : str(type(exc).__name__),
        }

    @classmethod
    def mark(cls, *, require_session=True):
        def wrapper(view):
            view = require_POST(view)
            setattr(view, cls.MARK_ATTR_NAME, True)
            setattr(view, cls.REQUIRE_SESSION_MARK, require_session)
            return view
        return wrapper


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
