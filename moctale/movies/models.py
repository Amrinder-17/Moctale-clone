from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
import os
from django.utils.translation import gettext_lazy as _

def collection_banner_path(instance, filename):
    # Organizes uploaded banners into media/collections/user_id/filename
    return f'collections/user_{instance.user.id}/{filename}'

# Create your models here.

class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    banner = models.ImageField(upload_to=collection_banner_path, blank=True, null=True)
    is_default = models.BooleanField(default=False)  # True for the auto-generated "Username's Watchlist"
    created_at = models.DateTimeField(auto_now_add=True)


    
class UserMovieActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='movie_activities')
    movie_id = models.IntegerField()
    likes = models.ManyToManyField(User, related_name='liked_activities', blank=True)
    poster_path = models.CharField(max_length=255, blank=True, null=True)
    media_type = models.CharField(
        max_length=10,
        choices=[("movie", "Movie"), ("tv", "TV Show")],
        default="movie"
    )
    movie_title = models.CharField(max_length=255)
    
    is_watched = models.BooleanField(default=False)
    is_interested = models.BooleanField(default=False)  
    in_collection = models.BooleanField(default=False)
    Collections = models.ManyToManyField('Collection', related_name="movies", blank=True)

    notification_sent = models.BooleanField(default=False) 
    updated_at = models.DateTimeField(auto_now=True)

    # --- YOUR NEW RATING FIELDS SYSTEM ---
    class ScoreChoices(models.IntegerChoices):
        Skip = 1, _('Skip')
        Timepass = 2, _('Timepass')
        GoForIt = 3, _('GoForIt')
        Perfection = 4, _('Perfection')

    # Allow null/blank because a user might add a movie to their "watchlist" without rating it yet
    score = models.IntegerField(choices=ScoreChoices.choices, blank=True, null=True)
    review_text = models.TextField(blank=True, null=True) 
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        blank=True, 
        null=True, 
        related_name='replies'
    )

    class Meta:
        unique_together = ('user', 'movie_id')
    
    def total_likes(self):
        return self.likes.count()

    def review_date_formatted(self):
        """Returns readable date like '18 Jul 2026'."""
        return self.updated_at.strftime("%d %b %Y")

    def review_year(self):
        """Returns the year the review was posted/updated."""
        return self.updated_at.year
    
    def __str__(self):
        # Shows rating label if it exists, otherwise just the title
        rating_str = f" [{self.get_score_display()}]" if self.score else ""
        return f"{self.user.username} - {self.movie_title}{rating_str}"


    

@receiver(post_save, sender=User)
def create_default_watchlist(sender, instance, created, **kwargs):
    if created:
        # Automatically generates the baseline collection folder on signup
        Collection.objects.create(
            user=instance,
            name=f"{instance.username}'s Watchlist",
            is_default=True
        )

@property
def banner_url(self):
    if self.banner and hasattr(self.banner, 'url'):
        return self.banner.url
    return f"{settings.STATIC_URL}movies/images/default_collection_banner.png"