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
        'show_registration_time',
        'structural_unit',
        'specialty',
        'educational_degree',
        'year',
        'form_of_study',
        'status',
        'status_update_time',
    )
    list_display = (
        'full_name',
        'ticket_number',
        'show_registration_time',
        'status',
        'status_update_time',
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
        'status',
        'status_update_time',
    )
    ordering = tuple([*list_filter, 'full_name'])
    search_fields = ('full_name', 'ticket_number',)
    FIELDSETS = (
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
    )
    STATE_FIELDSET = (
        'Стан',
        {
            'fields': (
                'show_registration_time',
                ('status', 'status_update_time', ),
            ),
            'classes': ('grp-collapse grp-open',),
        },
    )

    def get_readonly_fields(self, request, obj=None):
        if request.user.is_superuser or obj is None:
            return ('show_registration_time', )
        else:
            return self.readonly_fields

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(self.FIELDSETS)
        if obj is not None:
            fieldsets = (fieldsets[0], self.STATE_FIELDSET, *fieldsets[1:])
        return fieldsets

    def get_actions(self, request):
        return OrderedDict()
