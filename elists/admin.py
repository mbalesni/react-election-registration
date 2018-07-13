from collections import OrderedDict

from django.conf import settings
from django.contrib import admin, messages
from django.http import HttpRequest, HttpResponseRedirect

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
        if request.user.is_superuser and settings.DEBUG:
            return super().get_actions(request)
        return OrderedDict()

    def get_fieldsets(self, request: HttpRequest, obj: CheckInSession = None):
        return self.READONLY_FIELDSETSx

    def add_view(self, request, form_url='', extra_context=None):
        messages.error(request, 'CheckInSession object can not be manually created.')
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
