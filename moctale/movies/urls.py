from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/',views.dashboard,name='dashboard'),
    path('<str:media_type>/<int:media_id>/',views.media_detail,name='media_detail'),
    path('schedule/',views.schedule, name='Schedule'),
    path('/movies/api/schedule-feed/?',views.schedule_feed, name='schedule_feed_api'),
    path('movies/api/search/', views.live_search_api, name='live_search_api'),
]
