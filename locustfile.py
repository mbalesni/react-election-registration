import os

from locust import HttpLocust, TaskSet, task, clients

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "evs.settings")
django.setup()
from student.models import Student

TEST_USER_USERNAME = 'testuser'
TEST_USER_PASSWORD = 'Testing0'

TEST_STUDENT_TICKET_NUMBER = '11111111'

CSRF_TOKEN_COOKIE = 'csrftoken'
SESSION_ID_COOKIE = 'sessionid'

CSRF_TOKEN_POST = 'csrfmiddlewaretoken'

ELISTS_FRONT_URL = '/elists/front'
ADMIN_LOGOUT_URL = 'admin/logout/'
ADMIN_LOGIN_URL = f'admin/login/?next={ELISTS_FRONT_URL}'


class MyTaskSet(TaskSet):
    client: clients.HttpSession

    def on_start(self):

        # prepare user
        admin_login_get_response = self.client.get(url=ADMIN_LOGIN_URL)
        csrf_token = admin_login_get_response.cookies.get(CSRF_TOKEN_COOKIE)

        admin_login_post_response = self.client.post(
            url=ADMIN_LOGIN_URL,
            data={
                'username'     : 'testuser',
                'password'     : 'Testing0',
                'next'         : ELISTS_FRONT_URL,
                CSRF_TOKEN_POST: csrf_token,
            },
            headers={
                'Referer': admin_login_get_response.url,
            },
        )

        self.csrf_token = admin_login_post_response.cookies.get(CSRF_TOKEN_COOKIE)
        self.session_id = admin_login_post_response.cookies.get(SESSION_ID_COOKIE)

    def on_stop(self):
        admin_logout_response = self.client.get(
            url=ADMIN_LOGOUT_URL,
            cookies={
                SESSION_ID_COOKIE: self.session_id,
                CSRF_TOKEN_COOKIE: self.csrf_token,
            },
        )

    # === --- ===

    def api(self, path: str, data: dict =None) -> dict:
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
                SESSION_ID_COOKIE: self.session_id,
                CSRF_TOKEN_COOKIE: self.csrf_token,
            },
            # headers={
            #     'Content-Type': 'application/json',
            # }
        )
        return resp.json()

    # === --- ===

    @task(1)
    def general_task(self):
        # close_sessions
        close_sessions_resp = self.api('close_sessions')
        print(close_sessions_resp)

        # me
        me_resp = self.api('me')
        print(me_resp)

        # start_session
        start_session_resp = self.api('start_new_session')
        print(start_session_resp)
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # search student
        search_student_req = {
            'check_in_session_token': check_in_session_token,
            'student': {
                'ticket_number': TEST_STUDENT_TICKET_NUMBER,
            }
        }
        search_student_resp = self.api('search_by_ticket_number', search_student_req)
        print(search_student_resp)
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # submit student
        submit_student_req = {
            'check_in_session_token': check_in_session_token,
            'student'               : {
                'token': search_student_resp['data']['student']['token'],
                'doc_type': 0,
                'doc_num': TEST_STUDENT_TICKET_NUMBER,
            }
        }
        submit_student_resp = self.api('submit_student', submit_student_req)
        print(submit_student_resp)
        check_in_session_token = start_session_resp['data']['check_in_session']['token']

        # complete session
        complete_session_req = {
            'check_in_session_token': check_in_session_token,
        }
        complete_session_resp = self.api('complete_session', complete_session_req)
        print(complete_session_resp)

        # --- reset student
        obj = Student.objects.get(
            ticket_number=TEST_STUDENT_TICKET_NUMBER,
        )
        obj.status = Student.STATUS_FREE
        obj.save()


class MyLocust(HttpLocust):
    task_set = MyTaskSet

    min_wait = 5 * 1000
    max_wait = 5 * 1000
