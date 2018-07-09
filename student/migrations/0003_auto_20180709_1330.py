# Generated by Django 2.0.7 on 2018-07-09 13:30

from django.db import migrations, models
import student.models


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0002_auto_20180709_1305'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='full_name',
            field=models.CharField(max_length=100, validators=[student.models.validate_student_full_name]),
        ),
    ]
