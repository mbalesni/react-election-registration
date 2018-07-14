import json

from django.http import JsonResponse, HttpRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST

from .constants import REQUEST_TOKEN, Staff
from .models import CheckInSession

REQUIRE_SESSION_MARK = 'elists__require_session'


def convert_exception(exc: Exception) -> dict:
    return {
        'message': str(exc),
        'type'   : str(type(exc).__name__),
    }


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
        try:
            session = CheckInSession.get_session_by_token(token)
        except TimeoutError:
            # because there must be no more than 1 open session
            CheckInSession.close_sessions(self.staff)
            # session = CheckInSession.get_session_by_staff(self.staff)
            # if session:
            #     session.cancel()
            raise

        self.session = session
        return session


# created to abuse PyCharms type hints
class Request(HttpRequest):
    def __init__(self):
        self.elists_cisi = EListsCheckInSessionInfo(Staff(), {})
        self.user = Staff
        super().__init__()


def process_view(request: Request, view_func, view_args, view_kwargs):
    staff = request.user
    if not staff.is_staff:
        return HttpResponseForbidden(b'Please, log in to access this page')

    # read body
    request_body = request.body
    data = json.loads(request_body)
    request.elists_cisi = EListsCheckInSessionInfo(staff, data)

    try:
        if getattr(view_func, REQUIRE_SESSION_MARK):
            session = request.elists_cisi.retrieve_session()

        data = view_func(request, *view_args, **view_kwargs)
    except Exception as exc:
        response_status_code = 400
        data = None
        error = convert_exception(exc)
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


def mark(*, require_session=True):
    def decorator(view):
        setattr(view, REQUIRE_SESSION_MARK, require_session)

        def decorated(request, *view_args, **view_kwargs):
            r = process_view(request, view, view_args, view_kwargs)
            if r:
                return r
            return view(request, *view_args, **view_kwargs)

        decorated = require_POST(decorated)
        return decorated

    return decorator