import requests
from django.shortcuts import render
from django.conf import settings
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.cache import cache_page


@cache_page(3600)
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


def media_detail(request, media_type, media_id):
    if not request.user.is_authenticated:
        return render(request,'home/welcome.html')
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"
    detail_url = f"{base_url}/{media_type}/{media_id}"

    params={
        'api_key':api_key,
        'language':'en-US'
    }
    try:
        response=requests.get(detail_url,params=params)
        credits_res = requests.get(f"{base_url}/{media_type}/{media_id}/credits", params=params)
        credits_data = credits_res.json()
        if response.status_code==200 :
            media_data=response.json()
        else:
            return render(request, 'movies/404.html', status=404)
    except Exception as e:
        print(f"Detail Fetch Error: {e}")
        media_data = None
    context={
        'movie':media_data,
        'media_type':media_type,
        'credits': credits_data
    }
    return render(request, 'movies/detail.html', context)

@cache_page(3600)
def schedule(request):
    return render(request, 'movies/recent_releases.html')

def schedule_feed(request):
    if not request.user.is_authenticated:
        return render(request,'home/welcome.html')
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"

    page = int(request.GET.get('page', 1))
    source = request.GET.get('source', 'cinemas')

    today = datetime.today()
    start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
    end_date = (today + timedelta(days=90)).strftime('%Y-%m-%d')

    discover_url = f"{base_url}/discover/movie"
    params = {
        'api_key': api_key,
        'language': 'en-IN',
        'region': 'IN',
        'watch_region': 'IN',
        'sort_by': 'release_date.desc', # Sorts systematically from newest down
        'page': page,
    }

    if source == 'cinemas':
        params.update({
            'primary_release_date.gte': start_date,
            'primary_release_date.lte': end_date,
            'with_release_type': '3|2', # Theatrical wide or limited cinema rollouts
        })

    else:
        # Toggle discovery ecosystem flags to process streaming platforms parameters
        # If source is crunchyroll, check both movies and TV shows since anime follows mixed mappings
        if source == 'crunchyroll':
            discover_url = f"{base_url}/discover/tv" if page % 2 == 0 else f"{base_url}/discover/movie"
            params['with_watch_providers'] = '283'
        elif source == 'netflix':
            discover_url = f"{base_url}/discover/movie" # Can layer toggle scripts for TV/Movies chunks
            params['with_watch_providers'] = '8'
        elif source == 'prime':
            discover_url = f"{base_url}/discover/movie"
            params['with_watch_providers'] = '119'
            
        params.update({
            'air_date.gte': start_date,
            'air_date.lte': end_date,
        })
    try:
        response = requests.get(discover_url, params=params)
        if response.status_code != 200:
            return JsonResponse({'results': []}, status=200)
            
        raw_items = response.json().get('results', [])
        processed_items = []
        
        # Inside movies/views.py -> schedule_feed_api function loop:
        for item in raw_items:
            title = item.get('title') or item.get('name') or 'Untitled Production'
            rel_date = item.get('release_date') or item.get('first_air_date') or 'Undated'
            
            vote_avg = item.get('vote_average', 0)
            vote_count = item.get('vote_count', 0)
            
            if vote_avg == 0 or vote_count == 0:
                continue 

            display_score = f"⭐ {round(vote_avg, 1)}" if vote_count > 0 else "N/A"

            # 💡 THE FIX: Dynamically determine media type based on our active discover endpoint
            # Crunchyroll toggles between TV and Movie; Cinemas/Netflix/Prime query movies here.
            current_media_type = 'tv' if 'discover/tv' in discover_url else 'movie'

            if item.get('poster_path') and rel_date != 'Undated':
                processed_items.append({
                    'id': item.get('id'),
                    'title': title,
                    'release_date': rel_date,
                    'poster_path': f"https://image.tmdb.org/t/p/w342{item.get('poster_path')}",
                    'vote_average': display_score,
                    'media_type': current_media_type, # 💡 Pass this down to the JavaScript client
                })
        
        # Enforce your precise layout slicing constraint requirement: Load next 15 entries
        sliced_items = processed_items[:15]
        return JsonResponse({'results': sliced_items}, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

def live_search_api(request):
    """
    Handles real-time search queries by contacting TMDB's multi-search endpoint.
    """
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"
    
    # Extract the user's typed string from the GET parameters
    query = request.GET.get('query', '').strip()
    
    # Quietly return an empty list if there's no text to parse
    if not query:
        return JsonResponse({'results': []}, status=200)
        
    search_url = f"{base_url}/search/multi"
    params = {
        'api_key': api_key,
        'query': query,
        'language': 'en-IN', # Localized preferences matching India
        'include_adult': 'false',
        'page': 1
    }
    
    try:
        response = requests.get(search_url, params=params)
        
        if response.status_code == 200:
            raw_results = response.json().get('results', [])
            processed_results = []
            
                        # Inside movies/views.py -> live_search_api function loop:

            for item in raw_results:
                media_type = item.get('media_type')
                
                if media_type in ['movie', 'tv']:
                    title = item.get('title') or item.get('name') or 'Untitled'
                    poster = item.get('poster_path')
                    
                    if poster:
                        # 💡 THE FIX: Extract raw date keys so JavaScript can read them
                        release_date = item.get('release_date') or 'Undated'
                        first_air_date = item.get('first_air_date') or 'Undated'

                        processed_results.append({
                            'id': item.get('id'),
                            'title': title,
                            'media_type': media_type,
                            'poster_path': f"https://image.tmdb.org/t/p/w342{poster}",
                            'vote_average': round(item.get('vote_average', 0), 1),
                            
                            # 💡 Pass them down into the JSON payload object
                            'release_date': release_date,
                            'first_air_date': first_air_date,
                        })
            return JsonResponse({'results': processed_results}, status=200)
            
        else:
            return JsonResponse({'results': []}, status=response.status_code)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)