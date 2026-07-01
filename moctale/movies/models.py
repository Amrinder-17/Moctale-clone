from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
import os

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
    user=models.ForeignKey(User, on_delete=models.CASCADE , related_name='movie_activities')
    movie_id=models.IntegerField()
    
    movie_title = models.CharField(max_length=255)
    
    is_watched = models.BooleanField(default=False)
    is_interested = models.BooleanField(default=False)  # Acts as "Notify Me"
    in_collection = models.BooleanField(default=False)
    Collections= models.ManyToManyField(Collection,related_name="movies", blank=True)

    notification_sent = models.BooleanField(default=False) # Prevents spamming duplicate alerts
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together= ('user','movie_id')
    
    def __str__(self):
        return f"{self.user.username} - {self.movie_title}"
    

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