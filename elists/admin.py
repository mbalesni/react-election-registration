from collections import OrderedDict

from django.conf import settings
from django.db.models import QuerySet
from django.contrib import admin, messages
from django.http import HttpRequest, HttpResponseRedirect, HttpResponse

from .models import CheckInSession


@admin.register(CheckInSession)
class CheckInSessionAdmin(admin.ModelAdmin):

    change_list_filter_template = "admin/filter_listing.html"
    change_list_template = "admin/change_list_filter_sidebar.html"
    view_on_site = False
    empty_value_display = 'Н/Д'

    time_hierarchy = 'start_dt'
    ordering = ('-status', '-start_dt')
    search_fields = ('student__full_name',)
    readonly_fields = (
        'show_time_summary',
        'start_dt',
        'status',
        'staff',
        'student',
        'doc_type',
        'doc_num',
        'end_dt',
        'show_ballot_number',
        'student__full_name',
        'student__structural_unit',
        'student__specialty',
        'student__educational_degree',
        'student__year',
        'staff__username',
        'staff__first_name',
        'staff__last_name',
    )
    list_select_related = ('student', 'staff')
    list_display = (
        'show_time_summary',
        'start_dt',
        'status',
        'staff',
        'student',
        'doc_type',
        'end_dt',
        'show_ballot_number',
    )
    list_display_links = ('show_time_summary',)
    list_filter = (
        'status',
        'staff',
        'doc_type',
        'student__structural_unit',
        'student__educational_degree',
        'student__year',
        'student__form_of_study',
    )

    READONLY_FIELDSETS = (
        (None, {
            'fields': (
                'show_time_summary',
                ('start_dt', 'end_dt'),
                'status',
                'show_ballot_number',
            ),
        }),
        ('Про члена ВКС', {
            'fields': (
                'staff__username',
                ('staff__first_name', 'staff__last_name', ),
            ),
            'classes': ('grp-collapse grp-open',),
        }),
        ('Про документ', {
            'fields': (
                'doc_type',
                'doc_num',
            ),
            'classes': ('grp-collapse grp-open',),
        }),
        ('Про виборця', {
            'fields': (
                'student__full_name',
                'student__structural_unit',
                'student__specialty',
                ('student__educational_degree', 'student__year'),
            ),
            'classes': ('grp-collapse grp-closed',),
        }),
    )

    def get_queryset(self, request):
        qs: QuerySet = super().get_queryset(request=request)

        if request.user.is_superuser:
            return qs

        staff = request.user
        return qs.filter(staff=staff)

    def get_list_filter(self, request):
        if request.user.is_superuser:
            return super().get_list_filter(request=request)
        else:
            return ('status', 'doc_type', )

    def get_actions(self, request) -> OrderedDict:
        if request.user.is_superuser and settings.DEBUG:
            return super().get_actions(request)
        return OrderedDict()

    def get_fieldsets(self, request: HttpRequest, obj: CheckInSession = None) -> tuple:
        return self.READONLY_FIELDSETS

    def add_view(self, request, form_url='', extra_context=None) -> HttpResponse:
        messages.error(request, 'CheckInSession object can not be manually created.')
        return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    def student__full_name(self, obj):
        return obj.student.full_name
    student__full_name.short_description = 'ПІБ'

    def student__structural_unit(self, obj):
        return obj.student.show_structural_unit()
    student__structural_unit.short_description = 'Структурний підрозділ'

    def student__specialty(self, obj):
        return obj.student.show_specialty()
    student__specialty.short_description = 'Спеціальність'

    def student__year(self, obj):
        return obj.student.year
    student__year.short_description = 'Курс'

    def student__educational_degree(self, obj):
        return obj.student.educational_degree
    student__educational_degree.short_description = 'Освітній рівень'

    def student__form_of_study(self, obj):
        return obj.student.form_of_study
    student__form_of_study.short_description = 'Форма навчання'

    def staff__first_name(self, obj):
        return obj.staff.first_name
    staff__first_name.short_description = 'Ім\'я'

    def staff__last_name(self, obj):
        return obj.staff.last_name
    staff__last_name.short_description = 'Призвище'

    def staff__username(self, obj):
        return f'@{obj.staff.username}'
    staff__username.short_description = 'Ім\'я користувача'
