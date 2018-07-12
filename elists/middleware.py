import json

from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_POST

from .constants import REQUEST_TOKEN, Staff
from .models import CheckInSession
from .utils import get_staff


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
