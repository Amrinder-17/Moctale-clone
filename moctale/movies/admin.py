from django.contrib import admin
from .models import UserMovieActivity
from .models import Collection
# Register your models here.

@admin.register(UserMovieActivity)
class UserMovieActivityAdmin(admin.ModelAdmin):
    # Added 'score' and 'short_review' to the display grid
    list_display = ('user', 'movie_title', 'score', 'short_review', 'is_watched', 'is_interested', 'in_collection')
    list_filter = ('score', 'is_watched', 'is_interested', 'in_collection')
    search_fields = ('movie_title', 'user__username', 'review_text')
    readonly_fields = ('movie_id',)
    def short_review(self, obj):
        if obj.review_text:
            return obj.review_text[:40] + "..." if len(obj.review_text) > 40 else obj.review_text
        return "-"
    short_review.short_description = 'Review Preview'

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_default', 'created_at')
    search_fields = ('name', 'user__username')