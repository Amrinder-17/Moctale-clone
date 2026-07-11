from django.db import models
from django.contrib.auth.models import User

class profile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)

    profile_picture=models.ImageField(upload_to='profiles/',default='default_avatar.png')
    bio=models.TextField(max_length=300,blank=True)

# Create your models here.
