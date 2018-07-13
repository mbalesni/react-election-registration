import typing

import pytest
from django.core import exceptions

from .models import Student, StructuralUnit, Specialty

STUDENT_KWARGS = dict(
        full_name="Testing Test Testson",
        ticket_number=12345678,
        form_of_study=1,
        educational_degree=1,
        year=3,
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
        assert s.get_joined_edu_year_display() == 'Бакалавр-3'

    def test_validation(self):
        s, *_ = create_models(**STUDENT_KWARGS)

        s.ticket_number += 1_0000_0000
        s.year += 5
        s.form_of_study = 'new'
        s.educational_degree = 'puple'
        with pytest.raises(exceptions.ValidationError) as excinfo:
            s.full_clean()

    def test_get_student_by_ticket_number(self):
        s, *_ = create_models(**STUDENT_KWARGS)

        assert Student.get_student_by_ticket_number(STUDENT_KWARGS['ticket_number']) == s

        with pytest.raises(IndexError) as exc:
            Student.get_student_by_ticket_number('11111111')

        with pytest.raises(ValueError) as exc:
            Student.get_student_by_ticket_number('12345')

    def test_token(self):
        student = create_models(**STUDENT_KWARGS)[0]
        token = student.create_token()
        assert Student.get_student_by_token(token) == student
