from django.contrib import admin
from .models import UserMovieActivity
from .models import Collection
# Register your models here.

@admin.register(UserMovieActivity)
class UserMovieActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie_title', 'movie_id', 'is_watched', 'is_interested', 'in_collection')
    list_filter = ('is_watched', 'is_interested', 'in_collection')
    search_fields = ('movie_title', 'user__username')

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_default', 'created_at')
    search_fields = ('name', 'user__username')