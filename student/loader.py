import pandas as pd
import os

from .models import Student, StructuralUnit, Specialty
from django.conf import settings


SPECIALTY_NAME = 'specialty NAME'
SPECIALTY_ID = 'specialty ID'
STRUCTURAL_UNIT_NAME = 'structural_unit NAME'
STRUCTURAL_UNIT_ID = 'structural_unit ID'
FULL_NAME = 'full_name'
YEAR = 'year'
FORM_OF_STUDY = 'form_of_study'
EDUCATIONAL_DEGREE = 'educational_degree'
TICKET_NUMBER = 'ticket_number'
STUDENT_ID = 'student ID'


def read_csv(file_path: str, sep=',', qoute='"') -> pd.DataFrame:
    df = pd.read_csv(
        filepath_or_buffer=file_path,
        sep=sep,
        quotechar=qoute,
    )

    # shuffle
    df = df.sample(frac=1).reset_index(drop=True)

    return df


def load_structural_units(df: pd.DataFrame):
    names_arr = df[STRUCTURAL_UNIT_NAME].unique()
    ids = []

    for name in names_arr:
        structural_unit, created = StructuralUnit.objects.get_or_create(name=name)
        ids.append(structural_unit.id)
        if created:
            print(f'Created structural unit "{structural_unit.name}".')

    name_to_id = {name: id_ for name, id_ in zip(names_arr, ids)}

    df[STRUCTURAL_UNIT_ID] = df[STRUCTURAL_UNIT_NAME].apply(lambda name: name_to_id[name])


def load_specialties(df: pd.DataFrame):
    names_arr = df[SPECIALTY_NAME].unique()
    ids = []

    for name in names_arr:
        specialty, created = Specialty.objects.get_or_create(name=name)
        ids.append(specialty.id)
        if created:
            print(f'Created structural unit "{specialty.name}".')

    name_to_id = {name: id_ for name, id_ in zip(names_arr, ids)}

    df[SPECIALTY_ID] = df[SPECIALTY_NAME].apply(lambda name: name_to_id[name])


def load_student(row):
    FORM_OF_STUDY_DICT = {name: code for code, name in Student.FORM_OF_STUDY_CHOICES}
    EDUCATIONAL_DEGREE_DICT = {name: code for code, name in Student.EDUCATIONAL_DEGREE_CHOICES}

    full_name = row[FULL_NAME]
    structural_unit_id = row[STRUCTURAL_UNIT_ID]
    specialty_id = row[SPECIALTY_ID]
    educational_degree = row[EDUCATIONAL_DEGREE]
    year = row[YEAR]
    form_of_study = row[FORM_OF_STUDY]
    ticket_number = row[TICKET_NUMBER]

    # checks
    form_of_study_code = FORM_OF_STUDY_DICT[form_of_study]
    educational_degree_code = EDUCATIONAL_DEGREE_DICT[educational_degree]

    # write into db
    student, created = Student.objects.get_or_create(
        full_name=full_name,
        structural_unit_id=structural_unit_id,
        specialty_id=specialty_id,
        educational_degree=educational_degree_code,
        year=year,
        form_of_study=form_of_study_code,
        ticket_number=None if pd.isna(ticket_number) else ticket_number,
    )

    return student.id


def load_students(df: pd.DataFrame):
    for i, row in df.iterrows():
        load_student(row)


def load_from(filename: str):
    file_path = os.path.join(settings.BASE_DIR, filename)
    df = read_csv(file_path=file_path)
    load_structural_units(df)
    load_specialties(df)
    load_students(df)
