import json
import logging

from django.http import JsonResponse, HttpRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from raven.contrib.django.raven_compat.models import client

from errorsapp import exceptions as wfe
from tgapp.tasks import tg_notify
from .constants import (
    RESPONSE_STUDENT_DATA_EDUCATIONAL_DEGREE, RESPONSE_STUDENT_DATA_FORM_OF_STUDY,
    RESPONSE_STUDENT_DATA, RESPONSE_STUDENT_DATA_FULL_NAME, RESPONSE_STUDENT_TOKEN, RESPONSE_STUDENT_DATA_YEAR,
    RESPONSE_STUDENT_STATUS, RESPONSE_STUDENT_STATUS_CODE, RESPONSE_STUDENT_STATUS_NAME,
    RESPONSE_STUDENT_DATA_SPECIALTY, RESPONSE_CHECK_IN_SESSION_STATUS, RESPONSE_CHECK_IN_SESSION_STATUS_CODE,
    RESPONSE_CHECK_IN_SESSION_STATUS_NAME, RESPONSE_CHECK_IN_SESSION, RESPONSE_DATA, RESPONSE_ERROR,
    RESPONSE_ERROR_MESSAGE, RESPONSE_ERROR_TYPE, REQUEST_CHECK_IN_SESSION_TOKEN, RESPONSE_CHECK_IN_SESSION_TOKEN,
    RESPONSE_STUDENT_DATA_STRUCTURAL_UNIT, RESPONSE_STUDENT_DATA_TICKET_NUMBER,
    Staff,
    RESPONSE_STAFF_FIRST_NAME, RESPONSE_STAFF_LAST_NAME, RESPONSE_STAFF_USERNAME,
)
from .models import Student, CheckInSession

log = logging.getLogger('elists.api')

REQUIRE_SESSION_MARK = 'elists__require_session'


def serialize_exception(exc: Exception) -> dict:
    return {
        RESPONSE_ERROR_MESSAGE: str(exc),
        RESPONSE_ERROR_TYPE   : str(type(exc).__name__),
    }


def serialize_student(student: Student) -> dict:
    dictionary = {
        RESPONSE_STUDENT_DATA: {
            RESPONSE_STUDENT_DATA_FULL_NAME          : student.full_name,
            RESPONSE_STUDENT_DATA_EDUCATIONAL_DEGREE : student.educational_degree,
            RESPONSE_STUDENT_DATA_YEAR               : student.year,
            RESPONSE_STUDENT_DATA_FORM_OF_STUDY      : student.form_of_study,
            RESPONSE_STUDENT_DATA_SPECIALTY          : student.show_specialty(),
            RESPONSE_STUDENT_DATA_STRUCTURAL_UNIT    : student.show_structural_unit(),
            RESPONSE_STUDENT_DATA_TICKET_NUMBER      : student.ticket_number,
        },
        RESPONSE_STUDENT_STATUS: {
            RESPONSE_STUDENT_STATUS_CODE: student.status,
            RESPONSE_STUDENT_STATUS_NAME: student.status_verbose,
        },
    }
    if student.allowed_to_assign:
        dictionary[RESPONSE_STUDENT_TOKEN] = student.create_token()
    return dictionary


def serialize_session(session: CheckInSession) -> dict:
    json = {
        RESPONSE_CHECK_IN_SESSION_STATUS: {
            RESPONSE_CHECK_IN_SESSION_STATUS_CODE: session.status,
            RESPONSE_CHECK_IN_SESSION_STATUS_NAME: session.status_verbose,
        },
    }
    if session.is_open:
        json.update({
            RESPONSE_CHECK_IN_SESSION_TOKEN: session.create_token()
        })
    return json


def serialize_staff(staff: Staff) -> dict:
    return {
        RESPONSE_STAFF_USERNAME: staff.username,
        RESPONSE_STAFF_LAST_NAME: staff.last_name,
        RESPONSE_STAFF_FIRST_NAME: staff.first_name,
    }


class InData:

    def __init__(self, initial: dict, path: str =None):
        self._storage = dict()
        self._path = path

        self._recursively_load(dictionary=initial)

    @property
    def path(self) -> str:
        return self._path

    def _recursively_load(self, dictionary: dict):
        for key, val in dictionary.items():
            if isinstance(val, dict):
                path = f'{self._path}.{key}' if self._path else key
                self._storage[key] = InData(val, path=path)
            else:
                self._storage[key] = val

    def get(self, item: str, default=None):
        return self._storage.get(item, default)

    def __getitem__(self, item: str):
        if item not in self._storage.keys():
            raise wfe.RequestJSONFieldMissing(
                context={
                    'msg': f'"{item}" not found under "{self.path}" path.',
                }
            )

        return self._storage[item]

    def __setitem__(self, key, value):
        raise wfe.ProgrammingError(
            context={'msg': f'{self.__class__.__name__} is read-only.'},
        )


class EListsCheckInSessionInfo:

    def __init__(self, staff: Staff, data: dict, session: CheckInSession =None):
        self._staff = staff
        self._data = InData(data)
        self._session = session

    @property
    def data(self):
        return self._data

    @property
    def staff(self) -> Staff:
        return self._staff

    @property
    def session(self) -> CheckInSession:
        return self._session

    @property
    def status_code(self) -> int:
        return self._session.status

    @property
    def status_name(self) -> str:
        return self._session.status_verbose

    def assign_session(self, session: CheckInSession):
        self._session = session

    def retrieve_session(self) -> CheckInSession:
        token = self._data.get(REQUEST_CHECK_IN_SESSION_TOKEN, None)
        if token is None:
            raise wfe.MissingCheckInSessionToken()
        try:
            session = CheckInSession.get_session_by_token(token)
        except wfe.CheckInSessionTokenExpired:
            # because there must be no more than 1 open session
            CheckInSession.close_sessions(self._staff)
            # session = CheckInSession.get_session_by_staff(self.staff)
            # if session:
            #     session.cancel()
            raise

        self._session = session
        return session


# created to abuse PyCharms type hints
class Request(HttpRequest):
    def __init__(self):
        self.elists_cisi = EListsCheckInSessionInfo(Staff(), {})
        self.user = Staff()
        super().__init__()


def process_view(request: Request, view_func, view_args, view_kwargs):
    endpoint = request.path.split('/')[-1]
    user_name = f'@{"ANON" if request.user.is_anonymous else request.user.username}'
    user_ip = f"IP{request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')}"

    log.debug(f'request: {endpoint} {user_name} from {user_ip}')

    staff = request.user
    if not staff.is_staff:
        log.warning(f'Forbidden request to {endpoint} from {user_ip}')
        return HttpResponseForbidden(b'Please, log in to access this page')

    # read body
    request_body = request.body
    if request_body:
        in_data = json.loads(request_body)
    else:
        in_data = {}
    request.elists_cisi = EListsCheckInSessionInfo(staff, in_data)

    out_data = None
    error = None
    response_status_code = 500
    try:
        try:
            if getattr(view_func, REQUIRE_SESSION_MARK):
                session_before = request.elists_cisi.retrieve_session()

            out_data = view_func(request, *view_args, **view_kwargs)
        except wfe.BaseWorkflowError:
            raise
        except Exception as exc:
            log_msg = f'Unexpected error ({endpoint} {user_name} {user_ip}): {str(exc)}'
            log.exception(log_msg)
            tg_notify(f'`elists.api` *middleware*\n{log_msg}', digest='api error')
            client.captureException()
            raise wfe.ProgrammingError() from exc
    except wfe.CheckInSessionAlreadyClosed:
        response_status_code = 200
        error = None
    except wfe.BaseWorkflowError as exc:
        log.debug(f'workflow error ({endpoint} {user_name} {user_ip}): {str(exc)}')
        response_status_code = 400
        error = {
            'code': exc.get_code(),
            'name': exc.get_name(),
            'context': exc.get_context(),
        }
    else:
        response_status_code = 200
        error = None

    if out_data is None:
        out_data = {}
    if request.elists_cisi.session:
        out_data[RESPONSE_CHECK_IN_SESSION] = serialize_session(request.elists_cisi.session)

    resp = {}
    if error:
        resp[RESPONSE_ERROR] = error
    if out_data:
        resp[RESPONSE_DATA] = out_data

    log.info(f'response: {endpoint} {response_status_code} {user_name} {user_ip}')

    response = JsonResponse(resp)
    response.status_code = response_status_code
    return response


def api_wrap(*, require_session=True):
    def decorator(view):
        setattr(view, REQUIRE_SESSION_MARK, require_session)

        def decorated(request, *view_args, **view_kwargs):
            r = process_view(request, view, view_args, view_kwargs)
            if r:
                return r
            return view(request, *view_args, **view_kwargs)

        decorated = require_POST(decorated)
        decorated = csrf_exempt(decorated)
        return decorated

    return decorator
