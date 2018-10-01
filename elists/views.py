import logging

from .constants import (
    RESPONSE_STUDENT, RESPONSE_STUDENTS, RESPONSE_STAFF,
    REQUEST_STUDENT_TICKET_NUMBER, REQUEST_STUDENT_DOC_NUM,
    REQUEST_STUDENT_DOC_TYPE, REQUEST_STUDENT_TOKEN, REQUEST_STUDENT,
    REQUEST_STUDENT_FULL_NAME,
)
from .middleware import Request, api_wrap, serialize_student, serialize_staff
from .models import CheckInSession, Student
from errorsapp import exceptions as wfe

log = logging.getLogger('elists.views')


@api_wrap(require_session=False)
def start_new_session(request: Request):
    staff = request.elists_cisi.staff
    session = CheckInSession.start_new_session(staff)
    request.elists_cisi.assign_session(session)


@api_wrap()
def search_by_ticket_number(request: Request):
    session = request.elists_cisi.session
    if not session.just_started:
        raise wfe.CheckInSessionWrongStatus(
            context={
                'current_status_code': session.status,
                'current_status_name': session.status_verbose,
            },
        )

    ticket_number = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_TICKET_NUMBER]
    student = Student.search_by_ticket_number(ticket_number)

    return {
        RESPONSE_STUDENT: serialize_student(student),
    }


@api_wrap()
def search_by_name(request: Request):
    session = request.elists_cisi.session
    if not session.just_started:
        raise wfe.CheckInSessionWrongStatus(
            context={
                'current_status_code': session.status,
                'current_status_name': session.status_verbose,
            },
        )

    full_name = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_FULL_NAME]
    students = Student.search_by_full_name(full_name=full_name)

    return {
        RESPONSE_STUDENTS: [
            serialize_student(student) for student in students
        ]
    }


@api_wrap()
def submit_student(request: Request):
    session = request.elists_cisi.session
    student_token = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_TOKEN]
    student_doc_type = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_DOC_TYPE]
    student_doc_num = request.elists_cisi.data[REQUEST_STUDENT][REQUEST_STUDENT_DOC_NUM]

    student = Student.get_student_by_token(student_token)
    session.assign_student(
        student=student,
        doc_type=student_doc_type,
        doc_num=student_doc_num,
    )


@api_wrap()
def complete_session(request: Request):
    session = request.elists_cisi.session
    session.complete()


@api_wrap()
def cancel_session(request: Request):
    session = request.elists_cisi.session
    session.cancel()


@api_wrap(require_session=False)
def close_sessions(request: Request):
    staff = request.elists_cisi.staff
    CheckInSession.close_sessions(staff)


@api_wrap(require_session=False)
def me(request: Request):
    return {
        RESPONSE_STAFF: serialize_staff(request.elists_cisi.staff),
    }
