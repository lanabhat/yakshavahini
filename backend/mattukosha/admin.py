from django.contrib import admin

from .models import MattukoshaEntry


@admin.register(MattukoshaEntry)
class MattukoshaEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'name_of_the_mattu', 'status', 'date_english', 'created_at')
    list_filter = ('status',)
    search_fields = ('entry_id', 'name_of_the_mattu')
