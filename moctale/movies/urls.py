from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/',views.dashboard,name='dashboard'),
    path('<str:media_type>/<int:media_id>/',views.media_detail,name='media_detail'),
    path('schedule/',views.schedule, name='Schedule'),
    path('movies/api/schedule-feed/',views.schedule_feed, name='schedule_feed_api'),
    path('movies/api/search/', views.live_search_api, name='live_search_api'),
    path('toggle-activity/', views.toggle_movie_action, name='toggle_movie_action'),
    path('collection/toggle-movie/', views.toggle_collection_movie, name='toggle_collection_movie'),
    path('collection/create/', views.create_custom_collection, name='create_custom_collection'),
    path('bookmark/',views.bookmarks,name='bookmarks'),
]
