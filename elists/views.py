import json

from django.http import JsonResponse, HttpResponseBadRequest, HttpRequest
from django.views.decorators.http import require_POST

from .models import CheckInSession, Student, Staff


# FIXME: get Staff object from session
def get_staff():
    return Staff.objects.first()


@require_POST
def start_new_session(request: HttpRequest):
    staff = get_staff()
    session = CheckInSession.start_new_session(staff)
    if session:
        return JsonResponse({})
    else:
        return HttpResponseBadRequest(b'Staff already has open session.')


@require_POST
def get_student_by_ticket_number(request: HttpRequest):
    staff = get_staff()
    session = CheckInSession.get_session_by_staff(staff)
    if session is None:
        return HttpResponseBadRequest(b'No session assigned.')
    ticket_number = json.loads(request.body)['ticket_number']
    try:
        student = Student.get_student_by_ticket_number(ticket_number)
    except (ValueError, IndexError) as exc:
        return HttpResponseBadRequest(str(exc).encode('utf-8'))
    session = CheckInSession.assign_student_to_session(session, student)
    if session:
        return JsonResponse({})
    else:
        return HttpResponseBadRequest(b'Student not allowed to assign or session status is wrong.')


@require_POST
def complete_session(request: HttpRequest):
    staff = get_staff()
    session = CheckInSession.get_session_by_staff(staff)
    if session is None:
        return HttpResponseBadRequest(b'No session assigned.')
    # FIXME: is_open check makes overhead
    session = CheckInSession.complete_session(session)
    if session:
        return JsonResponse({})
    else:
        return HttpResponseBadRequest(b'Session was already closed.')


@require_POST
def cancel_session(request: HttpRequest):
    staff = get_staff()
    session = CheckInSession.get_session_by_staff(staff)
    if session is None:
        return HttpResponseBadRequest(b'No session assigned.')
    # FIXME: is_open check makes overhead
    session = CheckInSession.cancel_session(session)
    if session:
        return JsonResponse({})
    else:
        return HttpResponseBadRequest(b'Session was already closed.')
