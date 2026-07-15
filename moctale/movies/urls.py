from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/',views.dashboard,name='dashboard'),
    path("collection/<int:collection_id>/",views.collection_detail,name="collection_detail",),
    path('<str:media_type>/<int:media_id>/',views.media_detail,name='media_detail'),
    path('schedule/',views.schedule, name='Schedule'),
    path('movies/api/schedule-feed/',views.schedule_feed, name='schedule_feed_api'),
    path('movies/api/search/', views.live_search_api, name='live_search_api'),
    path('toggle-activity/', views.toggle_movie_action, name='toggle_movie_action'),
    path('collection/toggle-movie/', views.toggle_collection_movie, name='toggle_collection_movie'),
    path('collection/create/', views.create_custom_collection, name='create_custom_collection'),
    path('bookmark/',views.bookmarks,name='bookmarks'),
    path('watched/',views.watchedlist,name='watchedlist'),
    path('collection/update/<int:collection_id>/', views.update_collection, name='update_collection'),
    path('collection/update-banner/<int:collection_id>/', views.update_collection_banner, name='update_collection_banner'),
    path('collection/delete/<int:collection_id>/', views.delete_collection, name='delete_collection'),
    path('review/submit/', views.submit_review, name='submit_review'),
    path('activity/<int:activity_id>/like/', views.toggle_activity_like, name='toggle_activity_like'),
    path('activity/<int:activity_id>/delete/', views.toggle_activity_delete_review, name='toggle_activity_delete_review'),
]
