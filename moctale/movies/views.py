import requests
from django.shortcuts import render
from django.conf import settings

def dashboard(request):
    if not request.user.is_authenticated:
        return render(request, 'home/welcome.html')

    api_key = settings.TMDB_API_KEY
    base_url = "https://api.tmdb.org/3"
    
    # Simple, reliable base parameters
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
        # 1. Popular Raw Worldwide Trends (Top 7)
        pop_res = requests.get(f"{base_url}/movie/popular", params=params)
        dashboard_data['popular'] = pop_res.json().get('results', [])[:7]

        # 2. Hand-Picked Editors' Choice 
        # Put whatever TMDB movie ID numbers you want inside this array!
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
            res = requests.get(f"{base_url}/discover/movie", params=discover_params)
            dashboard_data[platform] = [m for m in res.json().get('results', []) if m.get('poster_path')][:7]

        # 4. Anime Hub (Crunchyroll Popular TV Series)
        crunchy_params = params.copy()
        crunchy_params.update({
            'with_watch_providers': 283,
            'watch_region': 'IN',
            'sort_by': 'popularity.desc'
        })
        crunchy_res = requests.get(f"{base_url}/discover/tv", params=crunchy_params)
        dashboard_data['crunchyroll'] = [m for m in crunchy_res.json().get('results', []) if m.get('poster_path')][:7]

    except Exception as e:
        print(f"Moctale Dashboard Error Log: {e}")

    return render(request, 'movies/dashboard.html', {'sections': dashboard_data})