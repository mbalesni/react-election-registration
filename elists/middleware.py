import json

from django.http import JsonResponse, HttpRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST

from .constants import (
    RESPONSE_STUDENT_DATA_EDUCATIONAL_DEGREE, RESPONSE_STUDENT_DATA_FORM_OF_STUDY,
    RESPONSE_STUDENT_DATA, RESPONSE_STUDENT_DATA_FULL_NAME, RESPONSE_STUDENT_TOKEN, RESPONSE_STUDENT_DATA_YEAR,
    RESPONSE_STUDENT_STATUS, RESPONSE_STUDENT_STATUS_CODE, RESPONSE_STUDENT_STATUS_NAME,
    RESPONSE_STUDENT_DATA_SPECIALTY, RESPONSE_CHECK_IN_SESSION_STATUS, RESPONSE_CHECK_IN_SESSION_STATUS_CODE,
    RESPONSE_CHECK_IN_SESSION_STATUS_NAME, RESPONSE_CHECK_IN_SESSION, RESPONSE_DATA, RESPONSE_ERROR,
    RESPONSE_ERROR_MESSAGE, RESPONSE_ERROR_TYPE, REQUEST_CHECK_IN_SESSION_TOKEN, RESPONSE_CHECK_IN_SESSION_TOKEN,
    RESPONSE_STUDENT_DATA_STRUCTURAL_UNIT,
    Staff,
    RESPONSE_STAFF_FIRST_NAME, RESPONSE_STAFF_LAST_NAME, RESPONSE_STAFF_USERNAME,
)
from .models import Student, CheckInSession
from errorsapp import exceptions as wfe

REQUIRE_SESSION_MARK = 'elists__require_session'


def serialize_exception(exc: Exception) -> dict:
    return {
        RESPONSE_ERROR_MESSAGE: str(exc),
        RESPONSE_ERROR_TYPE   : str(type(exc).__name__),
    }


def serialize_student(student: Student) -> dict:
    return {
        RESPONSE_STUDENT_TOKEN: student.create_token(),
        RESPONSE_STUDENT_DATA: {
            RESPONSE_STUDENT_DATA_FULL_NAME          : student.full_name,
            RESPONSE_STUDENT_DATA_EDUCATIONAL_DEGREE : student.educational_degree,
            RESPONSE_STUDENT_DATA_YEAR               : student.year,
            RESPONSE_STUDENT_DATA_FORM_OF_STUDY      : student.form_of_study,
            RESPONSE_STUDENT_DATA_SPECIALTY          : str(student.specialty),
            RESPONSE_STUDENT_DATA_STRUCTURAL_UNIT    : str(student.structural_unit),
        },
        RESPONSE_STUDENT_STATUS: {
            RESPONSE_STUDENT_STATUS_CODE: student.status,
            RESPONSE_STUDENT_STATUS_NAME: student.status_verbose,
        },
    }


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

    def retrieve_session(self) -> CheckInSession:
        token = self.data.get(REQUEST_CHECK_IN_SESSION_TOKEN, None)
        if token is None:
            raise wfe.MissingCheckInSessionToken()
        try:
            session = CheckInSession.get_session_by_token(token)
        except wfe.CheckInSessionTokenExpired:
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
            session_before = request.elists_cisi.retrieve_session()

        data = view_func(request, *view_args, **view_kwargs)
    except Exception as exc:
        response_status_code = 400
        data = None
        error = serialize_exception(exc)
    else:
        response_status_code = 200
        error = None

    if data is None:
        data = {}
    if request.elists_cisi.session:
        data[RESPONSE_CHECK_IN_SESSION] = serialize_session(request.elists_cisi.session)

    resp = {}
    if error:
        resp[RESPONSE_ERROR] = error
    if data:
        resp[RESPONSE_DATA] = data

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
