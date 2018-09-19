from collections import OrderedDict

from django.conf import settings
from django.contrib import admin, messages
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse

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
        'show_time_summary',
        'start_time',
        'status',
        'staff',
        'student',
        'doc_type',
        'doc_num',
        'end_time',
        #'student__full_name',
        #'student__structural_unit',
        #'student__specialty',
        #'student__educational_degree',
        #'student__year',
    )

    list_display = (
        'show_time_summary',
        'start_time',
        'status',
        'staff',
        'student',
        'doc_type',
        'end_time',
    )
    list_display_links = ('show_time_summary',)
    list_filter = (
        'status',
        'staff',
        'doc_type',
        #'student',
        #'student__structural_unit',
        'student__educational_degree',
        'student__year',
        'student__form_of_study',
    )

    READONLY_FIELDSETS = (
        (None, {
            'fields': (
                'show_time_summary',
                ('start_time', 'end_time'),
                'status',
            ),
        }),
        ('Про члена ВКС', {
            'fields': (
                'staff',
            ),
        }),
        ('Про виборця', {
            'fields': (
                'student',
                'doc_type',
                'doc_num',
                #'student__full_name',
                #'student__structural_unit',
                #'student__specialty',
                #('student__educational_degree', 'student__year'),
                # TODO: add 'student__registered_at'
            ),
        }),
    )

    def get_actions(self, request) -> OrderedDict:
        if request.user.is_superuser and settings.DEBUG:
            return super().get_actions(request)
        return OrderedDict()

    def get_fieldsets(self, request: HttpRequest, obj: CheckInSession = None) -> tuple:
        return self.READONLY_FIELDSETS

    def add_view(self, request, form_url='', extra_context=None) -> HttpResponse:
        messages.error(request, 'CheckInSession object can not be manually created.')
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
