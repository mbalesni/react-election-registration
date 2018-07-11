from collections import OrderedDict

from django.contrib import admin

from .models import Student, StructuralUnit, Specialty

# Register your models here.
admin.site.register([StructuralUnit, Specialty])


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):

    change_list_filter_template = "admin/filter_listing.html"
    change_list_template = "admin/change_list_filter_sidebar.html"
    view_on_site = False
    empty_value_display = 'Н/Д'

    readonly_fields = (
        'full_name',
        'ticket_number',
        'structural_unit',
        'specialty',
        'educational_degree',
        'year',
        'date_of_birth',
        'form_of_study',
    )
    list_display = (
        'full_name',
        'ticket_number',
        'structural_unit',
        'specialty',
        'educational_degree',
        'year',
        'form_of_study',
    )
    list_filter = (
        'structural_unit',
        'specialty',
        'educational_degree',
        'year',
        'form_of_study',
    )
    ordering = tuple([*list_filter, 'full_name'])
    search_fields = ('full_name', 'ticket_number',)
    fieldsets = (
        (None, {
            'fields': (
                'full_name',
                'structural_unit',
                'specialty',
                'form_of_study',
                ('educational_degree', 'year'),
            ),
        }),
        ('Документи', {
            'fields' : ('ticket_number',),
            'classes': ('grp-collapse grp-open',),
        }),
        ('Конфіденційна інформація', {
            'fields' : ('date_of_birth',),
            'classes': ('grp-collapse grp-closed',),
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        if request.user.is_superuser or obj is None:
            return ()
        else:
            return self.readonly_fields

    def get_actions(self, request):
        return OrderedDict()
