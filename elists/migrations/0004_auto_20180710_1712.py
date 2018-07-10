# Generated by Django 2.0.7 on 2018-07-10 17:12

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('elists', '0003_auto_20180710_1059'),
    ]

    operations = [
        migrations.AlterField(
            model_name='checkinsession',
            name='end_time',
            field=models.TimeField(null=True, verbose_name='End time'),
        ),
        migrations.AlterField(
            model_name='checkinsession',
            name='staff',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='check_in_session',
                                    to=settings.AUTH_USER_MODEL, verbose_name='Staff'),
        ),
        migrations.AlterField(
            model_name='checkinsession',
            name='start_time',
            field=models.TimeField(auto_now_add=True, verbose_name='Start time'),
        ),
        migrations.AlterField(
            model_name='checkinsession',
            name='status',
            field=models.IntegerField(choices=[(1, 'started'), (2, 'in_progress'), (-1, 'canceled'), (0, 'completed')],
                                      verbose_name='Status'),
        ),
        migrations.AlterField(
            model_name='checkinsession',
            name='student',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name='check_in_session', to='student.Student', verbose_name='Student'),
        ),
    ]