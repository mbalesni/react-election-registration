from django.core import exceptions, signing
from django.db import models
from django.utils import timezone


### validators
def validate_student_full_name(value: str):
    if not value.istitle():
        raise exceptions.ValidationError(
            f'Full name must pass `istitle` check.')


def validate_student_ticket_number(value: int):
    if not 1000_0000 < value < 9999_9999:
        raise exceptions.ValidationError(
            f'Student ticket number must contain exactly 8 digits.')


### Actual models
class StructuralUnit(models.Model):
    class Meta:
        verbose_name = 'Структурний підрозділ'
        verbose_name_plural = 'Структурні підрозділи'

    name = models.CharField(max_length=100, verbose_name='Назва')

    def __repr__(self) -> str:
        return f'<StructuralUnit #{self.id} "{self.name}">'

    def __str__(self) -> str:
        return str(self.name)


class Specialty(models.Model):
    class Meta:
        verbose_name = 'Спеціальність'
        verbose_name_plural = 'Спеціальності'

    name = models.CharField(max_length=100, verbose_name='Назва')

    def __repr__(self) -> str:
        return f'<Specialty #{self.id} "{self.name}">'

    def __str__(self) -> str:
        return str(self.name)


class Student(models.Model):
    """ Represent's student of the university.
    All fields aren't NULL, or blank. """

    class Meta:
        verbose_name = 'Студент'
        verbose_name_plural = 'Студенти'

    YEAR_CHOICES = tuple((i, str(i)) for i in (1, 2, 3, 4))
    EDUCATIONAL_DEGREE_CHOICES = tuple((i+1, s) for i, s in enumerate([
        'Бакалавр',
        'Магістр',
    ]))
    FORM_OF_STUDY_CHOICES = tuple((i+1, s) for i, s in enumerate([
        'Денна',
        'Заочна',
    ]))

    # identifiers
    full_name = models.CharField(
        max_length=100,
        validators=[validate_student_full_name],
        verbose_name='Призвище Ім\'я По-батькові',  # ПІБ
    )
    ticket_number = models.IntegerField(
        unique=True,
        validators=[validate_student_ticket_number],
        verbose_name='Номер студентського квитка',  # Номер студентського квитка
    )
    registered_datetime = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата і час реєстрації',
    )

    # foreign keys
    structural_unit = models.ForeignKey(
        StructuralUnit,
        on_delete=models.PROTECT,
        verbose_name='Структурний підрозділ (факультет/інститут)',  # Структурний підрозділ (факультет/інститут)
    )
    specialty = models.ForeignKey(
        Specialty,
        on_delete=models.PROTECT,
        verbose_name='Спеціальність',  # Спеціальність
    )

    # constant choices
    form_of_study = models.IntegerField(
        choices=FORM_OF_STUDY_CHOICES,
        verbose_name='Форма навчання',  # Форма навчання
    )
    educational_degree = models.IntegerField(
        choices=EDUCATIONAL_DEGREE_CHOICES,
        verbose_name='Освітній ступінь',  # Освітній ступінь
    )
    year = models.IntegerField(
        choices=YEAR_CHOICES,
        verbose_name='Курс',  # Курс
    )

    @classmethod
    def create(cls, full_name: str,
               ticket_number: int,
               structural_unit: StructuralUnit,
               specialty: Specialty,
               form_of_study: int,
               educational_degree: int,
               year: int):
        m = cls()

        m.full_name = full_name
        m.ticket_number = ticket_number
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

    @classmethod
    def search_for_students(cls, search_query: str, educational_degree: int, year: int):
        raise NotImplementedError("Need to implement search with query...")
        return cls.objects.filter(
            ticket_number__isnull=False,
            educational_degree=educational_degree,
            year=year,
            checkinsession__status__lt=0,
            # FIXME: ### full_name__trigram_similar=search_query,
        )

    @classmethod
    def get_student_by_ticket_number(cls, ticket_number_string: str) -> 'Student':
        """
        Gets Student by provided ticket number and raises IndexError if failed.
        Validates input and raises ValuerError if it has wrong format.

        :raises ValueError: if string's format is invalid
        :raises IndexError: if no student found
        :param ticket_number_string: 8 digits string
        :return: Student model
        """
        try:
            ticket_number = int(ticket_number_string)
            validate_student_ticket_number(ticket_number)
        except (exceptions.ValidationError, ValueError) as exc:
            raise ValueError('Wrong format of the ticket number.') from exc

        try:
            return cls.objects.get(ticket_number=ticket_number)
        except models.ObjectDoesNotExist:
            raise IndexError('No student found with provided ticket number')

    @classmethod
    def get_student_by_token(cls, token: str):
        try:
            student_ticket_number: str = signing.Signer().unsign(token)
        except signing.BadSignature:
            raise RuntimeError('Bad student token signature.')

        # if we had given that token, than object must exist, and be valid
        return cls.objects.get(ticket_number=int(student_ticket_number))

    def create_token(self) -> str:
        return signing.Signer().sign(str(self.ticket_number))

    def show_registration_time(self) -> str:
        yesterday = timezone.datetime.today() - timezone.timedelta(1)
        edge = timezone.datetime(yesterday.year, yesterday.month, yesterday.day, 23, 59, 59)
        if self.registered_datetime < timezone.make_aware(edge):
            return 'Зареєстрований завчасно'
        else:
            return f'Зареєстрований о {self.registered_datetime.strftime("%H:%M:%S")}'
    show_registration_time.short_description = 'Час реєстрації'

    def get_joined_edu_year_display(self) -> str:
        return f'{self.get_educational_degree_display()}-{self.get_year_display()}'

    def __repr__(self) -> str:
        return f'<Student #{self.id} "{self.full_name}">'

    def __str__(self) -> str:
        return str(self.full_name)
