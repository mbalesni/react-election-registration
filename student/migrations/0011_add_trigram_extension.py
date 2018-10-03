# created manually by @iAnanich

from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('student', '0010_auto_20180714_0246'),
    ]

    operations = [
        TrigramExtension(),
    ]
