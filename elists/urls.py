from django.urls import path

from . import views

urlpatterns = [
    path('start_new_session', views.start_new_session, name='start_new_session'),
    path('get_student_by_ticket_number', views.get_student_by_ticket_number, name='get_student_by_ticket_number'),
    path('complete_session', views.complete_session, name='complete_session'),
    path('cancel_session', views.cancel_session, name='cancel_session'),
    path('close_sessions', views.close_sessions, name='close_sessions'),
    path('refresh_auth', views.refresh_auth, name='refresh_auth'),
]
