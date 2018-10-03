from django.urls import path

from . import views

urlpatterns = [
    path('start_new_session', views.start_new_session, name='start_new_session'),
    path('submit_student', views.submit_student, name='submit_student'),
    path('search_by_name', views.search_by_name, name='search_by_name'),
    path('search_by_ticket_number', views.search_by_ticket_number, name='search_by_ticket_number'),
    path('complete_session', views.complete_session, name='complete_session'),
    path('cancel_session', views.cancel_session, name='cancel_session'),
    path('close_sessions', views.close_sessions, name='close_sessions'),
    path('me', views.me, name='staff_me'),
]
