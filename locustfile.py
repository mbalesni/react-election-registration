from locust import HttpLocust, TaskSet, task, clients

TESTUSER_USERNAME = 'testuser'
TESTUSER_PASSWORD = 'Testing0'

CSRF_TOKEN_COOKIE = 'csrftoken'
SESSION_ID_COOKIE = 'sessionid'

CSRF_TOKEN_POST = 'csrfmiddlewaretoken'

ELISTS_FRONT_URL = '/elists/front'
ADMIN_LOGOUT_URL = 'admin/logout/'
ADMIN_LOGIN_URL = f'admin/login/?next={ELISTS_FRONT_URL}'


class MyTaskSet(TaskSet):
    client: clients.HttpSession

    def on_start(self):
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
        print(admin_logout_response.status_code)


class MyLocust(HttpLocust):
    task_set = MyTaskSet
