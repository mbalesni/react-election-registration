from django.contrib.auth.models import User


# for better flexibility
Staff = User


RESPONSE_TOKEN = 'check_in_session_token'
RESPONSE_STUDENT_TOKEN = 'student_token'

REQUEST_TOKEN = 'check_in_session_token'
REQUEST_DOC_TYPE = 'doc_type'
REQUEST_DOC_NUM = 'doc_num'
REQUEST_TICKET_NUMBER = 'ticket_number'
REQUEST_STUDENT_TOKEN = 'student_token'
