document.addEventListener('DOMContentLoaded', () => {
    const streamContainer = document.getElementById('scheduleTimelineStream');
    const scrollLoader = document.getElementById('timelineScrollLoader');
    const sourceButtons = document.querySelectorAll('.schedule-source-btn');
    const mediaFilterButtons = document.querySelectorAll('.media-filter-btn');

    if (!streamContainer) return;

    let currentPage = 1;
    let activeSource = 'cinemas';
    let activeMediaFilter = 'all';
    let isFetching = false;
    let endOfDataReached = false;

    function setLoaderVisible(visible) {
        if (!scrollLoader) return;
        scrollLoader.classList.toggle('d-none', !visible);
    }

    function setActiveSourceButton(selectedBtn) {
        const source = selectedBtn.getAttribute('data-source');
        sourceButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-source') === source);
        });
    }

    function setActiveMediaButton(selectedBtn) {
        mediaFilterButtons.forEach(btn => {
            btn.classList.toggle('active', btn === selectedBtn);
        });
    }

    function applyMediaFilter() {
        streamContainer.querySelectorAll('.movie-schedule-card-link').forEach(link => {
            const itemType = link.dataset.mediaType;
            const show = activeMediaFilter === 'all' || itemType === activeMediaFilter;
            link.classList.toggle('d-none', !show);
        });

        streamContainer.querySelectorAll('.timeline-date-block').forEach(block => {
            const visibleCards = block.querySelectorAll('.movie-schedule-card-link:not(.d-none)');
            block.classList.toggle('d-none', visibleCards.length === 0);
        });
    }

    function fetchScheduleChunk() {
        if (isFetching || endOfDataReached) return;

        isFetching = true;
        setLoaderVisible(true);

        const isUpcomingMode = activeSource === 'upcoming';
        const cacheKey = `schedule_${activeSource}_${activeMediaFilter}_page_${currentPage}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            renderScheduleChunk(JSON.parse(cachedData));
            currentPage++;
            isFetching = false;
            setLoaderVisible(false);
            return;
        }

        let baseFeedUrl = window.MoctaleConfig
            ? window.MoctaleConfig.scheduleFeedUrl
            : '/media/movies/api/schedule-feed/';
        baseFeedUrl = baseFeedUrl.replace(/(\?|\/|%3F)+$/, '');
        if (!baseFeedUrl.startsWith('/')) {
            baseFeedUrl = '/' + baseFeedUrl;
        }

        const targetUrl = `${baseFeedUrl}/?source=${activeSource}&page=${currentPage}&upcoming=${isUpcomingMode}&media=${activeMediaFilter}`;

        fetch(targetUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.results || data.results.length === 0) {
                    endOfDataReached = true;
                    if (currentPage === 1) renderEmptyState();
                    return;
                }

                sessionStorage.setItem(cacheKey, JSON.stringify(data.results));
                renderScheduleChunk(data.results);
                currentPage++;
            })
            .catch(err => console.error('Schedule feed error:', err))
            .finally(() => {
                isFetching = false;
                setLoaderVisible(false);
            });
    }

    function formatDateBadge(dateStr) {
        const dateObj = new Date(`${dateStr}T00:00:00`);
        return {
            weekday: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            day: dateObj.getDate(),
            month: dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
        };
    }

    function renderScheduleChunk(items) {
        items.forEach(item => {
            let dateSection = streamContainer.querySelector(`[data-date-group="${item.release_date}"]`);

            if (!dateSection) {
                const badge = formatDateBadge(item.release_date);
                dateSection = document.createElement('div');
                dateSection.className = 'timeline-date-block';
                dateSection.setAttribute('data-date-group', item.release_date);
                dateSection.innerHTML = `
                    <div class="timeline-date-row">
                        <div class="calendar-date-badge">
                            <span class="date-weekday">${badge.weekday}</span>
                            <span class="date-day">${badge.day}</span>
                            <span class="date-month">${badge.month}</span>
                        </div>
                        <div class="timeline-cards-grid-row"></div>
                    </div>
                `;
                streamContainer.appendChild(dateSection);
            }

            const gridRow = dateSection.querySelector('.timeline-cards-grid-row');
            if (gridRow.querySelector(`[data-item-id="${item.id}"][data-media-type="${item.media_type}"]`)) return;

            const cardLink = document.createElement('a');
            cardLink.href = `/media/${item.media_type}/${item.id}/`;
            cardLink.className = 'movie-schedule-card-link text-decoration-none';
            cardLink.setAttribute('data-item-id', item.id);
            cardLink.setAttribute('data-media-type', item.media_type);

            cardLink.innerHTML = `
                <div class="movie-schedule-card">
                    <div class="poster-display-wrapper">
                        <img src="${item.poster_path}" alt="${item.title}" class="card-poster-img" loading="lazy">
                    </div>
                    <div class="card-meta-details">
                        <h2>${item.title}</h2>
                        <p>${item.release_label}</p>
                    </div>
                </div>
            `;
            gridRow.appendChild(cardLink);
        });

        applyMediaFilter();
    }

    function renderEmptyState() {
        streamContainer.innerHTML = `
            <div class="schedule-empty-state">
                <i class="bi bi-calendar-x"></i>
                <p>No releases found for this view.</p>
            </div>`;
    }

    function resetAndFetch() {
        currentPage = 1;
        endOfDataReached = false;
        streamContainer.innerHTML = '';
        fetchScheduleChunk();
    }

    window.addEventListener('scroll', () => {
        if (endOfDataReached) return;
        if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 250)) {
            fetchScheduleChunk();
        }
    });

    sourceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            activeSource = btn.getAttribute('data-source');
            setActiveSourceButton(btn);
            resetAndFetch();
        });
    });

    mediaFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextFilter = btn.getAttribute('data-media');
            if (nextFilter === activeMediaFilter) return;

            activeMediaFilter = nextFilter;
            setActiveMediaButton(btn);

            if (activeMediaFilter === 'all') {
                applyMediaFilter();
            } else {
                resetAndFetch();
            }
        });
    });

    fetchScheduleChunk();
});
