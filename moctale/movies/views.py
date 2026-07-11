import requests
from django.shortcuts import render
from django.conf import settings
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from .models import Collection, UserMovieActivity
from django.db.models import Count



@cache_page(3600)
@login_required
def dashboard(request):
    if not request.user.is_authenticated:
        return render(request, 'home/welcome.html')

    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"

    today = datetime.today()
    two_months_ago = today - timedelta(days=60)

    str_today = today.strftime('%Y-%m-%d')
    str_start_date = two_months_ago.strftime('%Y-%m-%d')
    
    
    params = {
        'api_key': api_key,
        'language': 'en-IN',
        'sort_by': 'popularity.desc',   
        'primary_release_date.gte': str_start_date, 
        'primary_release_date.lte': str_today,   
        'vote_count.gte': 50,                       
        'page': 1
    }

    dashboard_data = {
        'popular': [],
        'editors_choice': [],
        'netflix': [],
        'prime_video': [],
        'crunchyroll': []
    }

    try:
        
        pop_res = requests.get(f"{base_url}/movie/popular", params=params)
        dashboard_data['popular'] = pop_res.json().get('results', [])[:8]

        # 2. Hand-Picked Editors' Choice 

        # 2. Hand-Picked Editors' Choice 
        my_curated_ids = [157336, 27205, 19995, 603, 118340, 299534]
        for movie_id in my_curated_ids:
            detail_res = requests.get(f"{base_url}/movie/{movie_id}", params=params)
            if detail_res.status_code == 200:
                movie_data = detail_res.json()
                movie_data['media_type'] = 'movie' # Adds explicit tracking tag
                dashboard_data['editors_choice'].append(movie_data)


        # 3. Global Streaming Services (Netflix & Prime Video Movies)
        for platform, provider_id in [('netflix', 8), ('prime_video', 119)]:
            discover_params = params.copy()
            discover_params.update({
                'with_watch_providers': provider_id,
                'watch_region': 'IN',
                'sort_by': 'popularity.desc'
            })


            movie_res = requests.get(f"{base_url}/discover/movie", params=discover_params)
            platform_movies = movie_res.json().get('results',[])
            tv_res= requests.get(f"{base_url}/discover/tv",params=discover_params)
            platform_tv=tv_res.json().get('results',[])
            for movie in platform_movies:
                movie['media_type'] = 'movie'
            for show in platform_tv:
                show['media_type'] = 'tv'
            combined_list=platform_movies+platform_tv
            combined_list.sort(key=lambda x: x.get('popularity', 0), reverse=True)

            dashboard_data[platform] = combined_list[:8]
        # 4. Anime  (Crunchyroll Popular TV Series)
        crunchy_params = params.copy()
        crunchy_params.update({
            'with_watch_providers': 283,
            'watch_region': 'IN',
            'sort_by': 'popularity.desc'
        })
        crunchy_res = requests.get(f"{base_url}/discover/tv", params=crunchy_params)
        platform_anime = crunchy_res.json().get('results', [])
        for anime in platform_anime:
            anime['media_type'] = 'tv'
        dashboard_data['crunchyroll'] = [a for a in platform_anime if a.get('poster_path')][:7]

    except Exception as e:
        print(f"Moctale Dashboard Error Log: {e}")

    return render(request, 'movies/dashboard.html', {'sections': dashboard_data})

def _video_watch_url(video):
    site = video.get('site')
    key = video.get('key')
    if not key:
        return None
    if site == 'YouTube':
        return f"https://www.youtube.com/watch?v={key}"
    if site == 'Vimeo':
        return f"https://vimeo.com/{key}"
    return None


def _pick_trailer_link(videos):
    playable = [video for video in videos if _video_watch_url(video)]
    if not playable:
        return None

    priority_types = ('Trailer', 'Teaser', 'Clip', 'Featurette')
    for video_type in priority_types:
        for video in playable:
            if video.get('type') == video_type and video.get('official'):
                return _video_watch_url(video)
        for video in playable:
            if video.get('type') == video_type:
                return _video_watch_url(video)

    return _video_watch_url(playable[0])

@login_required
def media_detail(request, media_type, media_id):
    print(">>> media_detail called")
    # 1. Protect unauthenticated request passes gracefully
    if not request.user.is_authenticated:
        return render(request, 'home/welcome.html')
    
    
        
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"  # Standardized base path structure
    detail_url = f"{base_url}/{media_type}/{media_id}"

    params = {
        'api_key': api_key,
        'language': 'en-US',
        'append_to_response': 'videos',
    }
    activity = None
    user_collection =[]
    if request.user.is_authenticated:
        activity = UserMovieActivity.objects.filter(user=request.user, movie_id=media_id).first()
        user_collections = request.user.collections.all().order_by('-is_default', 'name')
        if not request.user.collections.filter(is_default=True).exists():
            Collection.objects.create(
                user=request.user,
                name=f"{request.user.username}'s Watchlist",
                is_default=True
            )
    
    try:
        # 2. Fetch primary media details first
        response = requests.get(detail_url, params=params)
        if response.status_code == 200:
            media_data = response.json()
            media_data['media_type'] = media_type
        else:
            return render(request, 'movies/404.html', status=404)

        # 3. Fetch credits data
        credits_res = requests.get(f"{base_url}/{media_type}/{media_id}/credits", params={'api_key': api_key, 'language': 'en-US'})
        credits_data = credits_res.json() if credits_res.status_code == 200 else {}

        trailer_link = _pick_trailer_link(media_data.get('videos', {}).get('results', []))
        video_url = f"{base_url}/{media_type}/{media_id}/videos"

        if not trailer_link:
            try:
                video_res = requests.get(video_url, params={'api_key': api_key})
                if video_res.status_code == 200:
                    trailer_link = _pick_trailer_link(video_res.json().get('results', []))
            except Exception as video_err:
                print(f"Failed to fetch trailer track: {video_err}")
        # 💡 Use this syntax when your import is: from datetime import datetime
        today_string = datetime.now().date().isoformat()
        if media_type == 'tv':
            release_date = media_data.get('first_air_date') or 'Undated'
        else:
            release_date = media_data.get('release_date') or 'Undated'
            media_data['release_date'] = release_date
        
        context = {
            'movie': media_data,
            'credits': credits_data,
            'media_type': media_type,
            'trailer_link': trailer_link,
            'user_collections': user_collections,
            'today': today_string,
            'activity': activity,
        }

        # 6. Render everything safely inside the try block
        return render(request, 'movies/detail.html', context)

    except Exception as e:
        print(f"Detail Fetch Error: {e}")
        # Global fallback if any of the critical requests above explode
        return render(request, 'movies/404.html', status=500)

@cache_page(3600)
@login_required
def schedule(request):
    return render(request, 'movies/recent_releases.html')



def _schedule_release_label(source, media_type, rel_date):
    year = rel_date[:4] if rel_date and rel_date != 'Undated' else 'TBA'
    if source == 'cinemas':
        return f"In Theatre • {year}"
    if source == 'upcoming':
        prefix = 'New Season' if media_type == 'tv' else 'Upcoming'
        return f"{prefix} • {year}"
    prefix = 'New Season' if media_type == 'tv' else 'OTT Release'
    return f"{prefix} • {year}"

@login_required
def schedule_feed(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            'error': 'Authentication required', 
            'redirect_url': reverse('home') 
        }, status=401)
        
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"

    page = int(request.GET.get('page', 1))
    source = request.GET.get('source', 'cinemas')
    media_filter = request.GET.get('media', 'all')
    is_upcoming = request.GET.get('upcoming', 'false').lower() == 'true' or source == 'upcoming'

    today = datetime.today()
    start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
    end_date = (today + timedelta(days=90)).strftime('%Y-%m-%d')

    # 1. Setup base initialization params map
    params = {
        'api_key': api_key,
        'language': 'en-IN',
        'page': page,
    }

    if source == 'cinemas':
        discover_url = f"{base_url}/movie/now_playing"
        params['region'] = 'IN'
    else:
        discover_url = f"{base_url}/discover/movie"
        params['region'] = 'IN'
        params['watch_region'] = 'IN'
        
        # Establish default timeline fallback windows
        use_tv = media_filter == 'tv' or (media_filter == 'all' and page % 2 == 0)
        if use_tv:
            discover_url = f"{base_url}/discover/tv"
            params['sort_by'] = 'first_air_date.desc'
            params['air_date.gte'] = start_date
            params['air_date.lte'] = end_date
            params.pop('release_date.gte', None)
            params.pop('release_date.lte', None)
        else:
            discover_url = f"{base_url}/discover/movie"
            params['sort_by'] = 'release_date.desc'
            params['release_date.gte'] = start_date
            params['release_date.lte'] = end_date
            params.pop('air_date.gte', None)
            params.pop('air_date.lte', None)

        # 2. Overrides Engine Filters Group
        if source == 'crunchyroll':
            params['with_watch_providers'] = '283'
            params['with_genres'] = '16'              
            params['with_original_language'] = 'ja'   
            params['watch_region'] = 'US'             
            
            params.pop('region', None)
            params.pop('air_date.gte', None)
            params.pop('air_date.lte', None)
            params.pop('release_date.gte', None)
            params.pop('release_date.lte', None)
            
            discover_url = f"{base_url}/discover/tv"
            
            if is_upcoming:
                params['sort_by'] = 'first_air_date.asc'     
                params['first_air_date.gte'] = end_date      
            else:
                if page == 1:
                    params['first_air_date.gte'] = start_date
                    params['first_air_date.lte'] = end_date
                else:
                    params['first_air_date.lte'] = end_date

        elif source == 'netflix':
            params['with_watch_providers'] = '8'
        elif source == 'prime':
            params['with_watch_providers'] = '119'
            

        if source == 'upcoming' or is_upcoming:
            params['with_original_language'] = 'hi|ta|te|ml|kn|bn|en'
            params.pop('air_date.gte', None)
            params.pop('air_date.lte', None)
            params.pop('release_date.gte', None)
            params.pop('release_date.lte', None)
            params['popularity.gte'] = 5.0
            
            # 1. 🇮🇳 Force target search specifically to the Indian localized market
            params['region'] = 'IN'
            params['watch_region'] = 'IN'
            
            
            use_tv = media_filter == 'tv' or (media_filter == 'all' and page % 2 == 0)
            if use_tv:
                discover_url = f"{base_url}/discover/tv"
                params['sort_by'] = 'first_air_date.asc'
                params['first_air_date.gte'] = end_date
            else:
                discover_url = f"{base_url}/discover/movie"
                params['sort_by'] = 'primary_release_date.asc'
                params['primary_release_date.gte'] = end_date
            
    try:
        response = requests.get(discover_url, params=params)
        if response.status_code != 200:
            return JsonResponse({'results': []}, status=200)
            
        raw_json = response.json()
        raw_items = raw_json.get('results', [])
        processed_items = []

        for item in raw_items:
            title = item.get('title') or item.get('name') or 'Untitled Production'
            rel_date = item.get('release_date') or item.get('first_air_date') or 'Undated'
            overview = item.get('overview', '')
            
            vote_avg = item.get('vote_average', 0)
            vote_count = item.get('vote_count', 0)
            
            # 🚀 UPDATED LOOP SAFEGUARD:
            # Let BOTH crunchyroll and global upcoming queries bypass the 0-vote block
            if source not in ['crunchyroll', 'upcoming'] and not is_upcoming and (vote_avg == 0 or vote_count == 0):
                continue 
            elif source == 'crunchyroll' and not overview:
                continue

            current_media_type = 'tv' if 'discover/tv' in discover_url else 'movie'
            if media_filter in ('movie', 'tv') and current_media_type != media_filter:
                continue

            if item.get('poster_path') and rel_date != 'Undated':
                processed_items.append({
                    'id': item.get('id'),
                    'title': title,
                    'release_date': rel_date,
                    'poster_path': f"https://image.tmdb.org/t/p/w342{item.get('poster_path')}",
                    'release_label': _schedule_release_label(source, current_media_type, rel_date),
                    'media_type': current_media_type,
                })
        
        sliced_items = processed_items[:15]
        return JsonResponse({'results': sliced_items}, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def live_search_api(request):
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"
    today = datetime.today().date()
    thirty_days_ago = today - timedelta(days=30)

    movie_url=f"{base_url}/discover/movie"
    params={
        'api_key':api_key,
        'language':'en-US',
        'primary_release_date.gte': thirty_days_ago,
        'primary_release_date.lte': today,
        'sort_by': 'primary_release_date.desc',
        'region': 'IN',            
        'watch_region': 'IN',
    }

    movie_data = requests.get(movie_url, params=params).json().get('results', [])
    tv_url = f"{base_url}/discover/tv"

    tv_data=requests.get(tv_url,params=params).json().get('results',[])
    combined_releases = []
    
    query = request.GET.get('query', '').strip()
    if not query:
        return JsonResponse({'results': []}, status=200)
        
    search_type = request.GET.get('type', 'content')
    
    if search_type == 'person':
        search_url = f"{base_url}/search/person"
    elif search_type == 'collections':
        search_url = f"{base_url}/search/collection"
    else: 
        search_url = f"{base_url}/search/multi"

    params = {
        'api_key': api_key,
        'query': query,
        'language': 'en-IN', 
        'include_adult': 'false',
        'page': 1
    }
    
    try:
        response = requests.get(search_url, params=params)
        if response.status_code == 200:
            raw_results = response.json().get('results', [])
            processed_results = []
            
            for item in raw_results:
                # --- CAST & CREW ---
                if search_type == 'person':
                    profile = item.get('profile_path')
                    processed_results.append({
                        'id': item.get('id'),
                        'name': item.get('name') or 'Unknown Person',
                        'known_for_department': item.get('known_for_department') or 'Cast/Crew',
                        'profile_path': f"https://image.tmdb.org/t/p/w185{profile}" if profile else None
                    })
                    
                # --- MOVIES & TV SHOWS ---
                else:
                    media_type = item.get('media_type') or 'movie'
                    
                    # Ensure both 'movie' and 'tv' are processed
                    if media_type in ['movie', 'tv']:
                        title = item.get('title') or item.get('name') or 'Untitled Production'
                        poster = item.get('poster_path')
                        
                        processed_results.append({
                            'id': item.get('id'),
                            'title': title,
                            'media_type': media_type,
                            'poster_path': f"https://image.tmdb.org/t/p/w342{poster}" if poster else None,
                            'vote_average': round(item.get('vote_average', 0), 1),
                            'release_date': item.get('release_date') or item.get('first_air_date') or 'Undated',
                        })
                            
            return JsonResponse({'results': processed_results}, status=200)
        return JsonResponse({'results': []}, status=response.status_code)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@login_required
@require_POST
def toggle_movie_action(request):
    movie_id = request.POST.get('movie_id')
    movie_title = request.POST.get('movie_title', 'Unknown_Title')
    media_type = request.POST.get("media_type", "movie")
    action = request.POST.get('action')
    poster_path = request.POST.get('poster_path')

    if not movie_id or action not in ['watched', 'interested', 'collection']:
        return JsonResponse({'success': False, 'error': 'Invalid parameters.'}, status=400)
    
    activity, created = UserMovieActivity.objects.get_or_create(
        user=request.user,
        movie_id=movie_id,
        defaults={
            "movie_title": movie_title,
            "poster_path": poster_path,
            "media_type": media_type,
        }
    )
    
    # 🚀 1. TRACK ACCURATE DIRTY DATA STATE
    updated = False

    if activity.media_type != media_type:
        activity.media_type = media_type
        updated = True

    if poster_path and activity.poster_path != poster_path:
        activity.poster_path = poster_path
        updated = True

    # 🛑 2. THE BUG FIX: If 'updated' is true, save it now so later flag operations don't lose it!
    # Removing the redundant block below this ensures clean SQL performance.
    if updated:
        activity.save(update_fields=["media_type", "poster_path"])

    # 🟢 Action Flag Machine Business Logic
    if action == 'watched':
        activity.is_watched = not activity.is_watched
        is_active = activity.is_watched
        if activity.is_watched:
            activity.is_interested = False
    
    elif action == 'interested':
        activity.is_interested = not activity.is_interested
        is_active = activity.is_interested
        if activity.is_interested:
            activity.is_watched = False

    elif action == 'collection':
        activity.in_collection = not activity.in_collection
        is_active = activity.in_collection

    # 🚀 3. PERSIST THE FINAL LOGICAL STATE
    activity.save()

    # 🧹 Garbage Collector Clean up Check
    if (
        not activity.is_watched
        and not activity.is_interested
        and not activity.in_collection # 🟢 Safe check before checking ManyToMany relationships
        and not activity.Collections.exists()
    ):
        activity.delete()

    return JsonResponse({
        'success': True,
        'action': action,
        'is_active': is_active
    })

@login_required
@require_POST
def toggle_collection_movie(request):
    """Adds or removes a movie from a specific collection folder."""
    movie_id = request.POST.get('movie_id')
    movie_title = request.POST.get('movie_title', 'Unknown Title')
    media_type = request.POST.get("media_type", "movie")
    collection_id = request.POST.get('collection_id')

    collection = get_object_or_404(Collection, id=collection_id, user=request.user)

    # Fetch or initialize activity bridge record
    activity, created = UserMovieActivity.objects.get_or_create(
        user=request.user,
        movie_id=movie_id,
        defaults={
            "movie_title": movie_title,
            "media_type": media_type,
        }
    )

    activity.media_type = media_type
    activity.save(update_fields=["media_type"])

    if collection in activity.Collections.all():
        activity.Collections.remove(collection)
        in_collection = False
    else:
        activity.Collections.add(collection)
        in_collection = True

    # Determine if this movie is saved in ANY collections now (to style the main button)
    has_any_collection = activity.Collections.exists()
    if (
        not activity.is_watched
        and not activity.is_interested
        and not activity.Collections.exists()
    ):
        activity.delete()

    return JsonResponse({
        'success': True,
        'in_collection': in_collection,
        'has_any_collection': has_any_collection
    })


@login_required
@require_POST
def create_custom_collection(request):
    """Creates a brand new custom collection folder on-the-fly via AJAX."""
    name = request.POST.get('name', '').strip()
    
    if not name:
        return JsonResponse({'success': False, 'error': 'Name cannot be empty.'}, status=400)

    if request.user.collections.filter(name__iexact=name).exists():
        return JsonResponse({'success': False, 'error': 'A collection with this name already exists.'}, status=400)

    collection = Collection.objects.create(user=request.user, name=name)

    return JsonResponse({
        'success': True,
        'id': collection.id,
        'name': collection.name
    })


@login_required
def bookmarks(request):
    collections= request.user.collections.all().annotate(total_movies=Count('movies')
    ).order_by('-is_default','-created_at')
    context={
        "collections":collections
    }
    return render(request,'movies/bookmark.html',context)


@login_required
def watchedlist(request):
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"

    watched_activities = UserMovieActivity.objects.filter(
        user=request.user,
        is_watched=True
    ).order_by('-updated_at')

    watched_media = []

    for activity in watched_activities:

        media = {
            'id': activity.movie_id,
            'title': activity.movie_title,
            'name': activity.movie_title,
            'poster_path': None,
            'vote_average': 0,
             "media_type": activity.media_type,
        }

        try:
            response = requests.get(
                f"{base_url}/{activity.media_type}/{activity.movie_id}",
                params={"api_key": api_key}
            )

            if response.status_code == 200:
                tmdb = response.json()

                media.update({
                    'poster_path': tmdb.get('poster_path'),
                    'vote_average': round(
                        tmdb.get('vote_average', 0), 1
                    )
                })

        except Exception as e:
            print(e)

        watched_media.append(media)

    return render(
        request,
        "movies/watchedlist.html",
        {
            "movies": watched_media,
            "watched_media": watched_media,
            "watched_items": watched_activities
        }
    )

def collection_detail(request, collection_id):
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"

    collection = get_object_or_404(
        Collection,
        id=collection_id,
        user=request.user
    )

    collection_media = []

    for activity in collection.movies.all():

        media = {
            "id": activity.movie_id,
            "title": activity.movie_title,
            "name": activity.movie_title,
            "poster_path": activity.poster_path,  # Use stored poster first
            "vote_average": 0,
            "media_type": activity.media_type,
        }

        try:
            response = requests.get(
                f"{base_url}/{activity.media_type}/{activity.movie_id}",
                params={"api_key": api_key}
            )

            if response.status_code == 200:
                tmdb = response.json()

                media.update({
                    "poster_path": tmdb.get("poster_path", activity.poster_path),
                    "vote_average": round(tmdb.get("vote_average", 0), 1),
                    "title": tmdb.get("title") or tmdb.get("name") or activity.movie_title,
                    "name": tmdb.get("name") or tmdb.get("title") or activity.movie_title,
                })

        except Exception as e:
            print(e)

        collection_media.append(media)

    return render(
        request,
        "movies/collection.html",
        {
            "collection": collection,
            "movies": collection_media,
        }
    )

@login_required
def update_collection(request, collection_id):
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
    
    if request.method == "POST" and is_ajax:
        collection = get_object_or_404(Collection, id=collection_id, user=request.user)
        
        name = request.POST.get('name' ,'').strip()
        description = request.POST.get('description','').strip()
        
        if name: 
            collection.name = name
        if description: 
            collection.description = description
        
        collection.save()
            
        return JsonResponse({
            "status": "success", 
            "name": name, 
            "description": description
        })
        
    return JsonResponse({"status": "fail", "error": "Invalid request type"}, status=400)
    

@login_required
def update_collection_banner(request, collection_id):
    # Verify that the request is an AJAX POST request
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
    
    if request.method == "POST" and is_ajax:
        # Securely grab the collection belonging ONLY to the logged-in user
        collection = get_object_or_404(Collection, id=collection_id, user=request.user)
        
        # Grab the file from the FILES dictionary array
        uploaded_banner = request.FILES.get('banner')
        
        if uploaded_banner:
            collection.banner = uploaded_banner
            collection.save()
            
            # Send the updated database media folder URL path back to the client
            return JsonResponse({
                "status": "success",
                "banner_url": collection.banner.url
            })
            
        return JsonResponse({"status": "fail", "error": "No file uploaded"}, status=400)
        
    return JsonResponse({"status": "fail", "error": "Invalid request type"}, status=400)


@login_required
def delete_collection(request, collection_id):
    # Verify that the request is an AJAX POST request
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'
    
    if request.method == "POST" and is_ajax:
        # Securely grab the collection belonging ONLY to the logged-in user
        collection = get_object_or_404(Collection, id=collection_id, user=request.user)
        
        collection.delete()
        return JsonResponse({
            "status": "success",
            "redirect_url": reverse('bookmarks')
        })
            
        
    return JsonResponse({"status": "fail", "error": "Invalid request type"}, status=400)


# @login_required
# def user_ratedlist(request):
#     # Grabs all activities for the logged-in user, sorted by most recently updated
#     activities = request.user.movie_activities.all().order_by('-updated_at')
    
#     return render(request, 'ratedlist.html', {'activities': activities})

