from collections import OrderedDict

from django.contrib import admin
from django.http import HttpRequest

from .models import CheckInSession


@admin.register(CheckInSession)
class CheckInSessionAdmin(admin.ModelAdmin):
    empty_value_display = 'Н/Д'
    time_fmt = '%H:%M:%S'

    change_list_filter_template = "admin/filter_listing.html"
    change_list_template = "admin/change_list_filter_sidebar.html"
    view_on_site = False
    time_hierarchy = 'start_time'
    ordering = ('-status', 'start_time')
    search_fields = ('student__full_name',)
    readonly_fields = (
        'show_is_open',
        'show_start_time',
        'show_status',
        'show_end_time',
        'show_staff',
        'show_student',
        'show_structural_unit',
    )

    list_display = (
        'start_time',
        'status',
        'staff',
        'student',
        'show_structural_unit',
        'show_is_open',
        'end_time',
    )
    list_display_links = ('start_time',)
    list_filter = ('status', 'staff', 'student')

    READONLY_FIELDSETS = (
        (None, {
            'fields': (
                ('show_staff', 'show_start_time'),
                ('show_is_open', 'show_end_time'),
                'show_status',
                ('show_student', 'show_structural_unit'),
            )
        }),
    )

    def get_actions(self, request):
        return OrderedDict()

    def get_fieldsets(self, request: HttpRequest, obj: CheckInSession = None):
        # TODO: if `obj is None` -> redirect to list with error message
        return self.READONLY_FIELDSETS

    def show_is_open(self, obj: CheckInSession) -> str:
        return "Відкрита" if obj.is_open else "Закрита о"

    show_is_open.short_description = "Відкрита/Закрита"

    def show_status(self, obj: CheckInSession) -> str:
        return dict(CheckInSession.STATUS_CHOICES)[obj.status]

    show_status.short_description = 'Статус'

    def show_start_time(self, obj: CheckInSession) -> str:
        return obj.start_time.strftime(self.time_fmt)

    show_start_time.short_description = 'Час початку'

    def show_end_time(self, obj: CheckInSession) -> str:
        time = obj.end_time
        if time is None:
            return self.empty_value_display
        else:
            return obj.end_time.strftime(self.time_fmt)

    show_end_time.short_description = 'Час завершення'

    def show_staff(self, obj: CheckInSession) -> str:
        return str(obj.staff)

    show_staff.short_description = 'Член ВКС'

    def show_student(self, obj: CheckInSession) -> str:
        if obj.student:
            return f'{obj.student.full_name} {obj.student.get_joined_edu_year_display()}'
        else:
            return self.empty_value_display

    show_student.short_description = 'Виборець'

    def show_structural_unit(self, obj: CheckInSession) -> str:
        if obj.student:
            return str(obj.student.structural_unit)
        else:
            return self.empty_value_display

    show_structural_unit.short_description = "Структурний підрозділ (факультет/інститут)"
