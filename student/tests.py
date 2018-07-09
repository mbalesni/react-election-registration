import pytest

from django.core import exceptions
from .models import Student


@pytest.mark.django_db
class TestStudent:

    @pytest.fixture(scope='class')
    def student_kwargs(self) -> dict:
        return dict(
            full_name="Testing Test Testson",
            student_ticket_number="12345678",
            date_of_birth="1999-07-12",
            structural_unit="REX",
            specialty="105 Applied physics",
            form_of_study="FUL",
            educational_degree="BAC",
            year="y3",
        )

    def test_joined_edu_year(self, student_kwargs):
        s = Student.create(**student_kwargs)
        assert s.get_joined_edu_year_display() == 'bachelor-3'

    def test_validation(self, student_kwargs):
        s = Student.create(**student_kwargs)

        s.student_ticket_number += 's'
        s.year += '5'
        s.form_of_study = 'new'
        s.educational_degree = 'puple'
        with pytest.raises(exceptions.ValidationError) as excinfo:
            s.full_clean()
