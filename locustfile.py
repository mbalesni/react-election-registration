import os
import logging

from locust import HttpLocust, TaskSet, task, clients

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "evs.settings")
django.setup()

from student.models import Student, StructuralUnit, Specialty
from elists.models import Staff, CheckInSession

ITERATION_COUNTER = 0

CSRF_TOKEN_COOKIE = 'csrftoken'
SESSION_ID_COOKIE = 'sessionid'

CSRF_TOKEN_POST = 'csrfmiddlewaretoken'

ELISTS_FRONT_URL = '/elists/front'
ADMIN_LOGOUT_URL = 'admin/logout/'
ADMIN_LOGIN_URL = f'admin/login/?next={ELISTS_FRONT_URL}'

log = logging.getLogger('locust')
log.setLevel(logging.INFO)


class Session:

    def __init__(self, num: int):
        self.num = num
        self.student = self.create_student(num)
        self.staff = self.create_staff(num)

    def set_credentials(self, csrf_token, session_id):
        self.csrf_token = csrf_token
        self.session_id = session_id

    def create_student(self, num: int) -> Student:
        student, created = Student.objects.get_or_create(
            full_name='Test Testing Testson',
            ticket_number=str(1000_0000 + num),
            structural_unit=StructuralUnit.objects.get_or_create(name=f'Test structural unit #{num}')[0],
            specialty=Specialty.objects.get_or_create(name=f'Test specialty #{num}')[0],
            form_of_study=1,
            year=1,
            educational_degree=1,
        )
        if not created:
            student.status = Student.STATUS_FREE
            student.save()

        return student

    def create_staff(self, num: int) -> Staff:
        staff, created = Staff.objects.get_or_create(
            username=f'testuser{num}',
        )
        if created:
            staff.set_password(f'Password{num}')
            staff.is_staff = True
            staff.save()
        else:
            CheckInSession.close_sessions(staff)

        return staff


class MyTaskSet(TaskSet):
    client: clients.HttpSession

    def log_in(self, username, password) -> tuple:

        # prepare user
        admin_login_get_response = self.client.get(url=ADMIN_LOGIN_URL)
        csrf_token = admin_login_get_response.cookies.get(CSRF_TOKEN_COOKIE)

        admin_login_post_response = self.client.post(
            url=ADMIN_LOGIN_URL,
            data={
                'username'     : username,
                'password'     : password,
                'next'         : ELISTS_FRONT_URL,
                CSRF_TOKEN_POST: csrf_token,
            },
            headers={
                'Referer': admin_login_get_response.url,
            },
        )

        csrf_token = admin_login_post_response.cookies.get(CSRF_TOKEN_COOKIE)
        session_id = admin_login_post_response.cookies.get(SESSION_ID_COOKIE)

        return csrf_token, session_id

    def log_out(self, csrf_token, session_id):
        admin_logout_response = self.client.get(
            url=ADMIN_LOGOUT_URL,
            cookies={
                SESSION_ID_COOKIE: session_id,
                CSRF_TOKEN_COOKIE: csrf_token,
            },
        )

    # === --- ===

    def api(self, path: str, data: dict or None, session) -> dict:
        # if data is None:
        #     json = b'{}'
        # else:
        #     json = None
        if data is None:
            json = {}

        resp = self.client.post(
            url=f'api/elists/{path}',
            # data=data,
            json=data,
            cookies={
                SESSION_ID_COOKIE: session.session_id,
                CSRF_TOKEN_COOKIE: session.csrf_token,
            },
            catch_response=True,
            # headers={
            #     'Content-Type': 'application/json',
            # }
        )

        if resp.status_code != 200:
            raise RuntimeError(f'#{session.num} | status error on "{path}" :: {resp.status_code} {resp.content}')
        else:
            resp.success()

        try:
            resp_data = resp.json()
        except:
            raise RuntimeError(
                f'#{session.num} | json error on "{path}" :: {resp}'
            ) from None

        return resp_data

    # === --- ===

    @task(1)
    def general_task(self):
        global ITERATION_COUNTER
        ITERATION_COUNTER += 1
        iteration = int(ITERATION_COUNTER)

        log.info(f'iteration #{iteration} | starting')
        session = Session(iteration)

        csrf_token, session_id = self.log_in(session.staff.username, f'Password{iteration}')
        session.set_credentials(csrf_token, session_id)

        # close_sessions
        close_sessions_resp = self.api('close_sessions', None, session)
        log.debug(f'iteration #{iteration} | close sessions :: {close_sessions_resp}')

        # me
        me_resp = self.api('me', None, session)
        log.debug(f'iteration #{iteration} | me :: {me_resp}')

        # start_session
        start_session_resp = self.api('start_new_session', None, session)
        log.debug(f'iteration #{iteration} | start session :: {start_session_resp}')
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # search student
        search_student_req = {
            'check_in_session_token': check_in_session_token,
            'student': {
                'ticket_number': session.student.ticket_number,
            }
        }
        search_student_resp = self.api('search_by_ticket_number', search_student_req, session)
        log.debug(f'iteration #{iteration} | search student :: {search_student_resp}')
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # submit student
        submit_student_req = {
            'check_in_session_token': check_in_session_token,
            'student'               : {
                'token': search_student_resp['data']['student']['token'],
                'doc_type': 0,
                'doc_num': session.student.ticket_number,
            }
        }
        submit_student_resp = self.api('submit_student', submit_student_req, session)
        log.debug(f'iteration #{iteration} | submit student :: {submit_student_resp}')
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # complete session
        complete_session_req = {
            'check_in_session_token': check_in_session_token,
        }
        complete_session_resp = self.api('complete_session', complete_session_req, session)
        log.debug(f'iteration #{iteration} | complete session :: {complete_session_resp}')

        self.log_out(csrf_token, session_id)


class MyLocust(HttpLocust):
    task_set = MyTaskSet

    min_wait = 5 * 1000
    max_wait = 5 * 1000
