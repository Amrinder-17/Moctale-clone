from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class UserMovieActivity(models.Model):
    user=models.ForeignKey(User, on_delete=models.CASCADE , related_name='movie_activities')
    movie_id=models.IntegerField()
    movie_title = models.CharField(max_length=255)
    
    is_watched = models.BooleanField(default=False)
    is_interested = models.BooleanField(default=False)  # Acts as "Notify Me"
    in_collection = models.BooleanField(default=False)

    notification_sent = models.BooleanField(default=False) # Prevents spamming duplicate alerts
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together= ('user','movie_id')
    
    def __str__(self):
        return f"{self.user.username} - {self.movie_title}"