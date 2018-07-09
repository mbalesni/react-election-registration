import pytest

from django.core import exceptions
from .models import Student, StructuralUnit, Specialty


@pytest.mark.django_db
class TestStudent:

    @pytest.fixture()
    def student_kwargs(self) -> dict:
        return dict(
            full_name="Testing Test Testson",
            student_ticket_number="12345678",
            date_of_birth="1999-07-12",
            form_of_study="FUL",
            educational_degree="BAC",
            year="Y3",
            specialty='105',
            structural_unit='FRECS',
        )

    def create_models(self, structural_unit, specialty, **kwargs):
        su = StructuralUnit(name=structural_unit)
        su.save()
        sp = Specialty(name=specialty)
        sp.save()
        s = Student.create(**kwargs, specialty=sp, structural_unit=su)
        return s, sp, su

    def test_joined_edu_year(self, student_kwargs):
        s, *_ = self.create_models(**student_kwargs)
        assert s.get_joined_edu_year_display() == 'bachelor-3'

    def test_validation(self, student_kwargs):
        s, *_ = self.create_models(**student_kwargs)

        s.student_ticket_number += 's'
        s.year += '5'
        s.form_of_study = 'new'
        s.educational_degree = 'puple'
        with pytest.raises(exceptions.ValidationError) as excinfo:
            s.full_clean()
