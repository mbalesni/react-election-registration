# Generated by Django 2.1 on 2018-10-06 17:50

from django.db import migrations, models
import student.models


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0013_auto_20180930_0509'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='ticket_number',
            field=models.IntegerField(blank=True, db_index=True, null=True, unique=True, validators=[student.models.validate_student_ticket_number], verbose_name='Номер студентського квитка'),
        ),
    ]
