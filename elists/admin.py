from collections import OrderedDict

from django.contrib import admin
from django.http import HttpRequest

from .models import CheckInSession


@admin.register(CheckInSession)
class CheckInSessionAdmin(admin.ModelAdmin):

    change_list_filter_template = "admin/filter_listing.html"
    change_list_template = "admin/change_list_filter_sidebar.html"
    view_on_site = False
    empty_value_display = 'Н/Д'

    time_hierarchy = 'start_time'
    ordering = ('-status', '-start_time')
    search_fields = ('student__full_name',)
    readonly_fields = (
        'start_time',
        'status',
        'staff',
        'student',
        'show_is_open',
        'end_time',
    )

    list_display = (
        'start_time',
        'status',
        'staff',
        'student',
        'show_is_open',
        'end_time',
    )
    list_display_links = ('start_time',)
    list_filter = ('status', 'staff', 'student')

    READONLY_FIELDSETS = (
        (None, {
            'fields': (
                ('staff', 'start_time'),
                ('show_is_open', 'end_time'),
                'status',
                'student',
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
