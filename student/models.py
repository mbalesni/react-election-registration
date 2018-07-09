import enum
import typing

from django.db import models
from django.core import validators
from django.utils import timezone
from django.core import exceptions


### helpers
class ChoiceEnum(enum.Enum):
    """ For using enums as choices in Django ORM
    Stolen from http://anthonyfox.io/2017/02/choices-for-choices-in-django-charfields/ """

    @classmethod
    def as_choices(cls) -> typing.Tuple[typing.Tuple[str, str], ...]:
        return tuple((pair.name, pair.value) for pair in cls)

    @classmethod
    def iter_names(cls) -> typing.Iterable[str]:
        yield from (p.name for p in cls)

    @classmethod
    def validate(cls, value: str):
        if value not in cls.iter_names():
            raise exceptions.ValidationError(f'{value} not in {list(cls.iter_names())}')


### validators
def validate_student_full_name(value: str):
    if not value.istitle():
        raise exceptions.ValidationError(f'Full name must pass `istitle` check.')


def validate_student_ticket_number(value: str):
    if not len(value) == 8 or not value.isdigit():
        raise exceptions.ValidationError(f'Student ticket number must contain exact 8 digits.')


### Actual models
class StructuralUnit(models.Model):

    name = models.CharField(max_length=100)

    def __repr__(self) -> str:
        return f'<StructuralUnit #{self.id} "{self.name}">'

    def __str__(self) -> str:
        return str(self.name)


class Specialty(models.Model):

    name = models.CharField(max_length=100)

    def __repr__(self) -> str:
        return f'<Specialty #{self.id} "{self.name}">'

    def __str__(self) -> str:
        return str(self.name)


class Student(models.Model):
    """ Represent's student of the university.
    All fields aren't NULL, or blank. """

    class FormOfStudy(ChoiceEnum):
        EXT = "external"
        FUL = "full-time"

    class EducationalDegree(ChoiceEnum):
        MAS = "master"
        BAC = "bachelor"

    class Year(ChoiceEnum):
        Y1 = "1"
        Y2 = "2"
        Y3 = "3"
        Y4 = "4"

    # identifiers
    full_name = models.CharField(
        max_length=100, validators=[validate_student_full_name])
    student_ticket_number = models.CharField(
        max_length=8, validators=[validate_student_ticket_number])
    date_of_birth = models.DateField()

    # foreign keys
    structural_unit = models.ForeignKey(
        StructuralUnit, on_delete=models.CASCADE)
    specialty = models.ForeignKey(
        Specialty, on_delete=models.CASCADE)

    # enums
    form_of_study = models.CharField(
        max_length=3, choices=FormOfStudy.as_choices())
    educational_degree = models.CharField(
        max_length=3, choices=EducationalDegree.as_choices())
    year = models.CharField(
        max_length=3, choices=Year.as_choices())

    @classmethod
    def create(cls, full_name: str,
               student_ticket_number: str,
               date_of_birth: str or timezone.datetime,
               structural_unit: StructuralUnit,
               specialty: Specialty,
               form_of_study: str,
               educational_degree: str,
               year: str):
        m = cls()

        m.full_name = full_name
        m.student_ticket_number = student_ticket_number
        m.date_of_birth = date_of_birth
        m.structural_unit = structural_unit
        m.specialty = specialty
        m.form_of_study = form_of_study
        m.educational_degree = educational_degree
        m.year = year

        m.full_clean()
        m.save()
        return m

    def clean(self) -> None:
        self.validate_educational_degree_with_year(self.educational_degree, self.year)

    @classmethod
    def validate_educational_degree_with_year(cls, educational_degree: str, year: str):
        if educational_degree == cls.EducationalDegree.MAS.name and \
                year not in list(cls.Year.iter_names())[:2]:
            raise exceptions.ValidationError('Masters could be only on 1-2 years of study.')
        if educational_degree == cls.EducationalDegree.BAC.name and \
                year not in list(cls.Year.iter_names()):
            raise exceptions.ValidationError('Masters could be only on 1-4 years of study.')

    def get_joined_edu_year_display(self) -> str:
        return f'{self.get_educational_degree_display()}-{self.get_year_display()}'

    def __repr__(self) -> str:
        return f'<Student #{self.id} "{self.full_name}">'

    def __str__(self) -> str:
        return str(self.full_name)
