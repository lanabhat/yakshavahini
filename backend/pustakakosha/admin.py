from django.contrib import admin

from .models import Author, Category, Contributor, Publisher, PustakaKoshaEntry


@admin.register(PustakaKoshaEntry)
class PustakaKoshaEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_id', 'book_name', 'category', 'publisher', 'status', 'created_at')
    list_filter = ('status', 'category', 'publisher')
    search_fields = ('entry_id', 'book_name', 'isbn')
    filter_horizontal = ('authors', 'contributors')


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Contributor)
class ContributorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
