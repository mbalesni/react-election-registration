import typing
import logging

from django.core import exceptions, signing
from django.db import models
from django.utils import timezone

# WorkFlow Errors
from errorsapp import exceptions as wfe

log = logging.getLogger('student.models')


### validators
def validate_student_full_name(value: str):
    if not value.istitle() or \
            len(value) <= 5 or \
            len(value.split(' ')) < 1:
        raise exceptions.ValidationError(
            f'Full name must pass `istitle` check, '
            f'be longer than 5 symbols and'
            f'contain at one space.')


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

    STATUS_FREE = 0
    STATUS_IN_PROGRESS = 1
    STATUS_VOTED = 2
    STATUS_CHOICES = (
        (STATUS_FREE, 'Вільний'),
        (STATUS_IN_PROGRESS, 'В процесі'),
        (STATUS_VOTED, 'Проголосував'),
    )

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

    # meta
    registered_datetime = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата і час реєстрації',
    )
    status = models.IntegerField(
        choices=STATUS_CHOICES,
        default=STATUS_FREE,
        verbose_name='Статус',
    )
    status_update_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Час останнього оновлення',
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

    @property
    def status_verbose(self) -> str:
        return dict(self.STATUS_CHOICES)[self.status]

    @property
    def has_voted(self) -> bool:
        return self.status == self.STATUS_VOTED

    @property
    def has_open_session(self) -> bool:
        return self.status == self.STATUS_IN_PROGRESS

    @property
    def allowed_to_assign(self) -> bool:
        return self.status == self.STATUS_FREE

    @classmethod
    def validate_educational_degree_with_year(cls, educational_degree: int, year: int):
        if educational_degree == 2 and year not in (1, 2):
            raise exceptions.ValidationError('Masters could be only on 1-2 years of study.')
        if educational_degree == 1 and year not in (1, 2, 3, 4):
            raise exceptions.ValidationError('Bachelors could be only on 1-4 years of study.')

    @classmethod
    def search_by_full_name(cls, full_name: str) -> typing.Tuple['Student']:
        log.debug(f'searching by full name "{full_name}"')

        try:
            full_name = str(full_name)
            validate_student_full_name(full_name)
        except (exceptions.ValidationError, ValueError) as exc:
            raise wfe.FullNameWrongFormat() from exc

        students = cls.objects.filter(
            full_name__trigram_similar=full_name,
        )
        if not students:
            raise wfe.StudentNameNotFound()
        return tuple(students)

    @classmethod
    def search_by_ticket_number(cls, ticket_number_string: str) -> 'Student':
        """
        Gets Student by provided ticket number and raises IndexError if failed.
        Validates input and raises ValuerError if it has wrong format.

        :raises ValueError: if string's format is invalid
        :raises IndexError: if no student found
        :param ticket_number_string: 8 digits string
        :return: Student model
        """
        log.debug(f'searching by ticket number "{ticket_number_string}"')

        try:
            ticket_number = int(ticket_number_string)
            validate_student_ticket_number(ticket_number)
        except (exceptions.ValidationError, ValueError) as exc:
            raise wfe.TicketNumberWrongFormat() from exc

        try:
            return cls.objects.get(ticket_number=ticket_number)
        except models.ObjectDoesNotExist:
            raise wfe.TicketNumberNotFound()

    @classmethod
    def get_student_by_token(cls, token: str) -> 'Student':
        try:
            query: dict = signing.loads(token, max_age=None)
        except signing.BadSignature:
            raise wfe.StudentTokenBadSignature()

        # if we had given that token, than object must exist, and be valid
        return cls.objects.get(**query)

    def create_token(self) -> str:
        return signing.dumps(dict(id=self.id))

    def update_status(self, status: int):
        assert status in dict(self.STATUS_CHOICES).keys()

        if self.status == status:
            raise wfe.StudentStatusAlreadyTheSame()
        if self.status == self.STATUS_VOTED:
            raise wfe.StudentStatusCantChangeBecauseVoted()
        if self.status == self.STATUS_FREE and status == self.STATUS_VOTED:
            raise wfe.StudentStatusCantChangeBecauseFree()

        self.status = status
        self.status_update_time = timezone.make_naive(timezone.now()).time()
        log.info(f'Student #{self.id} updated status: [{self.status}] {self.status_verbose}')
        self.save()

    def show_registration_time(self) -> str:
        yesterday = timezone.datetime.today() - timezone.timedelta(1)
        edge = timezone.datetime(yesterday.year, yesterday.month, yesterday.day, 23, 59, 59)
        if self.registered_datetime < timezone.make_aware(edge):
            return 'Зареєстрований завчасно'
        else:
            return f'Зареєстрований о {self.registered_datetime.strftime("%H:%M:%S")}'
    show_registration_time.short_description = 'Час реєстрації'

    def show_specialty(self) -> str:
        return str(self.specialty)

    def get_joined_edu_year_display(self) -> str:
        return f'{self.get_educational_degree_display()}-{self.get_year_display()}'

    def __repr__(self) -> str:
        return f'<Student #{self.id} "{self.full_name}">'

    def __str__(self) -> str:
        return str(self.full_name)
