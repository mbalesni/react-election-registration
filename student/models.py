import enum
import typing

from django.core import exceptions
from django.db import models
from django.utils import timezone


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


def table_to_dict(model: models.Model):
    return {
        obj.name: obj
        for obj in model.objects.all()
    }


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

    YEAR_CHOICES = tuple((i, str(i)) for i in (1, 2, 3, 4))
    EDUCATIONAL_DEGREE_CHOICES = tuple((i+1, s) for i, s in enumerate([
        'Bachelor',  # Бакалавр
        'Master',    # Магістр
    ]))
    FORM_OF_STUDY_CHOICES = tuple((i+1, s) for i, s in enumerate([
        'External',   # Заочна
        'Full-time',  # денна
    ]))

    # identifiers
    full_name = models.CharField(
        max_length=100,
        validators=[validate_student_full_name],
        verbose_name='Full name',  # ПІБ
    )
    ticket_number = models.CharField(
        max_length=8,
        validators=[validate_student_ticket_number],
        verbose_name='Student ticket number',  # Номер студентського квитка
    )
    date_of_birth = models.DateField(
        verbose_name='Date of birth',  # Дата народження
    )

    # foreign keys
    structural_unit = models.ForeignKey(
        StructuralUnit,
        on_delete=models.PROTECT,
        verbose_name='Structural unit (faculty/institute)',  # Структурний підрозділ (факультет/інститут)
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        verbose_name='Specialty',  # Спеціальність
    )

    # constant choices
    form_of_study = models.IntegerField(
        choices=FORM_OF_STUDY_CHOICES,
        verbose_name='Form of study',  # Форма навчання
    )
    educational_degree = models.IntegerField(
        choices=EDUCATIONAL_DEGREE_CHOICES,
        verbose_name='Educational degree',  # Освітній ступінь
    )
    year = models.IntegerField(
        choices=YEAR_CHOICES,
        verbose_name='Year',  # Курс
    )

    @classmethod
    def create(cls, full_name: str,
               ticket_number: str,
               date_of_birth: str or timezone.datetime,
               structural_unit: StructuralUnit,
               specialty: Specialty,
               form_of_study: int,
               educational_degree: int,
               year: int):
        m = cls()

        m.full_name = full_name
        m.ticket_number = ticket_number
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
    def validate_educational_degree_with_year(cls, educational_degree: int, year: int):
        if educational_degree == 2 and year not in (1, 2):
            raise exceptions.ValidationError('Masters could be only on 1-2 years of study.')
        if educational_degree == 1 and year not in (1, 2, 3, 4):
            raise exceptions.ValidationError('Bachelors could be only on 1-4 years of study.')

    def get_joined_edu_year_display(self) -> str:
        return f'{self.get_educational_degree_display()}-{self.get_year_display()}'

    def __repr__(self) -> str:
        return f'<Student #{self.id} "{self.full_name}">'

    def __str__(self) -> str:
        return str(self.full_name)
