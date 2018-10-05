from django.urls import path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('api/start_new_session', views.start_new_session, name='start_new_session'),
    path('api/submit_student', views.submit_student, name='submit_student'),
    path('api/search_by_name', views.search_by_name, name='search_by_name'),
    path('api/search_by_ticket_number', views.search_by_ticket_number, name='search_by_ticket_number'),
    path('api/complete_session', views.complete_session, name='complete_session'),
    path('api/cancel_session', views.cancel_session, name='cancel_session'),
    path('api/close_sessions', views.close_sessions, name='close_sessions'),
    path('api/me', views.me, name='staff_me'),
    path('front', TemplateView.as_view(template_name='index.html'), name='front'),
]
