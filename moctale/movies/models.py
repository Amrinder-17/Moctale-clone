from django.db import models
from django.contrib.auth.models import User

from django.db.models.signals import post_save
from django.dispatch import receiver


# Create your models here.

class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=150)
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