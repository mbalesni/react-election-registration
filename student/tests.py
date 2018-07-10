import typing

import pytest
from django.core import exceptions

from .models import Student, StructuralUnit, Specialty

STUDENT_KWARGS = dict(
        full_name="Testing Test Testson",
        student_ticket_number="12345678",
        date_of_birth="1999-07-12",
        form_of_study="FUL",
        educational_degree="BAC",
        year="Y3",
        specialty='105',
        structural_unit='FRECS',
    )


def create_models(structural_unit, specialty, **kwargs) -> typing.Tuple[Student, Specialty, StructuralUnit]:
    su = StructuralUnit(name=structural_unit)
    su.save()
    sp = Specialty(name=specialty)
    sp.save()
    s = Student.create(**kwargs, specialty=sp, structural_unit=su)
    return s, sp, su


@pytest.mark.django_db
class TestStudent:

    def test_joined_edu_year(self):
        s, *_ = create_models(**STUDENT_KWARGS)
        assert s.get_joined_edu_year_display() == 'bachelor-3'

    def test_validation(self):
        s, *_ = create_models(**STUDENT_KWARGS)

        s.student_ticket_number += 's'
        s.year += '5'
        s.form_of_study = 'new'
        s.educational_degree = 'puple'
        with pytest.raises(exceptions.ValidationError) as excinfo:
            s.full_clean()
