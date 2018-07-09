from django.contrib import admin
from .models import Student, StructuralUnit, Specialty

# Register your models here.
admin.site.register([StructuralUnit, Specialty, Student])
