from django.contrib import admin

from .models import SanghatanaKoshaEntry


@admin.register(SanghatanaKoshaEntry)
class SanghatanaKoshaEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'name_of_the_org', 'type_of_org', 'status', 'created_at')
    list_filter = ('status', 'type_of_org', 'yakshagana_category')
    search_fields = ('entry_id', 'name_of_the_org', 'head_quarter')
