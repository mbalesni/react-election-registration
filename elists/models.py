from django.db import models
from django.contrib.auth.models import User

from student.models import Student, ChoiceEnum


class CheckInSession(models.Model):

    class Status(ChoiceEnum):
        std = 'started'
        ckn = 'checking'
        cnl = 'canceled'
        cpl = 'completed'

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE)
    staff = models.ForeignKey(
        User, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=3, choices=Status.as_choices())
    start_time = models.TimeField()
    end_time = models.TimeField()
