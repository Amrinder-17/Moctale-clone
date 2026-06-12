import requests
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse


def dashboard(request):
    if not request.user.is_authenticated:
        return render(request, 'home/welcome.html')

    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"
    
    
    params = {
        'api_key': api_key,
        'language': 'en-US',
        'page': 1,
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

        my_curated_ids = [157336, 27205, 19995, 603, 118340, 299534]
        for movie_id in my_curated_ids:
            detail_res = requests.get(f"{base_url}/movie/{movie_id}", params=params)
            if detail_res.status_code == 200:
                dashboard_data['editors_choice'].append(detail_res.json())

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
        if response.status_code==200 :
            media_data=response.json()
        else:
            return render(request, 'movies/404.html', status=404)
    except Exception as e:
        print(f"Detail Fetch Error: {e}")
        media_data = None
    context={
        'media':media_data,
        'media_type':media_type
    }
    return render(request, 'movies/detail.html', context)

def live_search_api(request):
    """
    Asynchronous JSON backend API endpoint. 
    Listens to background requests without reloading the active layout page template.
    """
    api_key = settings.TMDB_API_KEY
    base_url = "https://api.themoviedb.org/3"
    
    user_query = request.GET.get('query', '').strip()
    processed_results = []

    if user_query:
        search_url = f"{base_url}/search/multi"
        params = {
            'api_key': api_key,
            'language': 'en-US',
            'query': user_query,
            'page': 1,
            'include_adult': 'false'
        }
        
        try:
            response = requests.get(search_url, params=params)
            if response.status_code == 200:
                raw_data = response.json().get('results', [])
                
                for item in raw_data:
                    # Sanitize entries down to titles with a valid poster art background asset path
                    if item.get('media_type') in ['movie', 'tv'] and item.get('poster_path'):
                        processed_results.append({
                            'id': item.get('id'),
                            'title': item.get('title') or item.get('name'),
                            'media_type': item.get('media_type'),
                            'poster_path': f"https://image.tmdb.org/t/p/w342{item.get('poster_path')}",
                            'vote_average': round(item.get('vote_average', 0), 1)
                        })
        except Exception as e:
            print(f"Async Search Exception: {e}")

    # Return raw decoupled database values cleanly arrayed back into the JSON engine
    return JsonResponse({'results': processed_results})