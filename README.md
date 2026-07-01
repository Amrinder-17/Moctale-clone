# 🎬 Moctale — Media Tracking & Discovery Platform

Moctale is a premium dark-themed media discovery and tracking platform built with **Django**, designed for users who want to explore, organize, and track movies, TV shows, and anime in a seamless experience.

Powered by **TMDB API**, Moctale combines personalized media tracking with interactive UI behavior, real-time updates, and collection management.

---

## ✨ Features

### 🔍 Dynamic Media Discovery
- Explore trending and popular media content
- Search dynamically across multiple categories:
  - Content
  - Collections
  - Cast & Crew
  - Users
- Detailed media pages with metadata, trailers, and release information

### 🎯 User Activity Tracking

#### ✅ Watched History
Track completed titles and maintain a personalized viewing history.

#### 🔔 Watchlist / Notify Me
Mark upcoming content and prioritize future releases.

#### 📁 Custom Collections
Create and manage custom media collections using many-to-many relationship mapping.

---

## ⚡ Interactive User Experience

Moctale focuses heavily on responsive interaction and smooth transitions.

### AJAX Powered State Updates
- Real-time UI mutations
- No full-page refreshes
- Dynamic state synchronization

### UI Effects
- Smooth fade-out removal animations
- Live layout updates
- Instant interaction feedback

---

# 🛠 Tech Stack

## Backend

| Technology | Purpose |
|-----------|---------|
| Django | Backend Framework |
| Python 3 | Application Runtime |
| SQLite / MySQL | Database |
| Requests | External API communication |
| Django Browser Reload | Development hot-reload |

---

## Frontend

| Technology | Purpose |
|-----------|---------|
| Tailwind CSS | Utility-first styling |
| Bootstrap 5 | Responsive layout system |
| Vanilla JavaScript | Async interactions |
| Fetch API | Client ↔ Server communication |

---

# 🏗 Architecture

```text
Frontend (Tailwind + Bootstrap)
        │
        ▼
Vanilla JS (Fetch API)
        │
        ▼
Django Views
        │
        ▼
TMDB REST API
        │
        ▼
Database Persistence
(SQLite / MySQL)
```

---

# 💾 Core Data Model

```python
class UserMovieActivity(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='movie_activities'
    )

    movie_id = models.IntegerField()
    movie_title = models.CharField(max_length=255)

    poster_path = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    is_watched = models.BooleanField(default=False)
    is_interested = models.BooleanField(default=False)

    in_collection = models.BooleanField(default=False)

    Collections = models.ManyToManyField(
        Collection,
        related_name="movies",
        blank=True
    )

    notification_sent = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'movie_id')
```

---

# 📡 Media State Workflow

```text
[ Media Card ]
      │
      ▼
(User Clicks Action)
      │
      ▼
[ Fetch API ]
      │
      ▼
POST → /toggle-activity/
      │
      ▼
toggle_movie_action()
      │
      ▼
Database Mutation
      │
      ▼
JSON Response
      │
      ▼
Live UI Animation
```

---

# 🔧 Core Routes

## Activity Mutation

```text
POST /toggle-activity/
```

Payload:

```json
{
  "movie_id": 123,
  "movie_title": "Movie Name",
  "action": "watched",
  "poster_path": "/poster.jpg"
}
```

Response:

```json
{
  "success": true,
  "action": "watched",
  "is_active": false
}
```

---

## Dashboard Aggregation

```text
GET /watchedlist/
```

Responsible for:
- Loading watched entities
- Building compatible media schemas
- Rendering reusable card components

---

# 📅 Release Schedule Dashboard

Track:

- Seasonal anime releases
- Ongoing TV shows
- K-drama broadcasts
- Upcoming OTT launches

Features:
- Timeline synchronization
- Notification-ready workflow
- Media release filtering

---

# 🚀 Local Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/moctale.git
```

```bash
cd moctale
```

## Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Configure Environment

Create `.env`

```env
TMDB_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key
DEBUG=True
```

## Run Migrations

```bash
python manage.py migrate
```

## Start Server

```bash
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000
```

---

# 📷 Screenshots

Add screenshots here:

```text
assets/
├── dashboard.png
├── detail-page.png
├── collections.png
└── watched-history.png
```

---

# 🌟 Future Improvements

- Recommendation engine
- User following system
- Social reviews
- AI-powered discovery
- Multi-device sync
- Push notifications

---

# 🙌 Acknowledgements

- TMDB for media metadata and assets
- Django community
- Bootstrap & Tailwind teams

---

> Built to make media discovery feel interactive, personal, and cinematic.
