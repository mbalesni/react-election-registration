import enum
import typing

from django.db import models
from django.utils import timezone


class ChoiceEnum(enum.Enum):
    """ For using enums as choices in Django ORM
    Stolen from http://anthonyfox.io/2017/02/choices-for-choices-in-django-charfields/ """

    @classmethod
    def as_choices(cls) -> typing.Tuple[typing.Tuple[str, str], ...]:
        return tuple((pair.name, pair.value) for pair in cls)


# Create your models here.

class Student(models.Model):
    """ Represent's student of the university.
    All fields aren't NULL, or blank. """

    class StructuralUnit(ChoiceEnum):
        REX = "Faculty of radio-physics, electronics and computer systems"

    class FormOfStudy(ChoiceEnum):
        EXT = "external"
        FUL = "full-time"

    class EducationalDegree(ChoiceEnum):
        MAS = "master"
        BAC = "bachelor"

    class Year(ChoiceEnum):
        y1 = "1"
        y2 = "2"
        y3 = "3"
        y4 = "4"

    full_name = models.CharField(max_length=100)
    student_ticket_number = models.CharField(max_length=8)
    date_of_birth = models.DateField()

    form_of_study = models.CharField(max_length=3, choices=FormOfStudy.as_choices())
    educational_degree = models.CharField(max_length=3, choices=EducationalDegree.as_choices())
    year = models.CharField(max_length=3, choices=Year.as_choices())

    structural_unit = models.CharField(max_length=3, choices=StructuralUnit.as_choices())
    specialty = models.CharField(max_length=100)
