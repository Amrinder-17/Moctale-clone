document.addEventListener('DOMContentLoaded', () => {
    const streamContainer = document.getElementById('scheduleTimelineStream');
    const scrollLoader = document.getElementById('timelineScrollLoader');
    const sourceButtons = document.querySelectorAll('.source-tab-btn');

    if (!streamContainer) return;

    let currentPage = 1;
    let activeSource = 'cinemas';
    let isFetching = false;
    let endOfDataReached = false;

    function fetchScheduleChunk() {
        if (isFetching || endOfDataReached) return;
        
        isFetching = true;
        if (scrollLoader) scrollLoader.classList.remove('hidden');

        // 🚀 ROUTING SWITCH: If source is 'upcoming', set the backend flag to true
        const isUpcomingMode = (activeSource === 'upcoming');
        
        const cacheKey = `schedule_${activeSource}_page_${currentPage}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        // Check cache storage
        if (cachedData) {
            const data = JSON.parse(cachedData);
            renderScheduleChunk(data);
            currentPage++;
            isFetching = false;
            if (scrollLoader) scrollLoader.classList.add('hidden');
            return;
        }

        let baseFeedUrl = window.MoctaleConfig ? window.MoctaleConfig.scheduleFeedUrl : '/media/movies/api/schedule-feed/';
        baseFeedUrl = baseFeedUrl.replace(/(\?|\/|%3F)+$/, '');

        if (!baseFeedUrl.startsWith('/')) {
            baseFeedUrl = '/' + baseFeedUrl;
        }

        // Appends the conditional upcoming query string seamlessly
        const targetUrl = `${baseFeedUrl}/?source=${activeSource}&page=${currentPage}&upcoming=${isUpcomingMode}`;

        console.log("Requesting clean target mapping link:", targetUrl);

        fetch(targetUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Server answered with invalid status: ${res.status}`);
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
            .catch(err => console.error("Schedule Stream pipeline failure:", err))
            .finally(() => {
                isFetching = false;
                if (scrollLoader) scrollLoader.classList.add('hidden');
            });
    }

    function renderScheduleChunk(items) {
        items.forEach(item => {
            const dateObj = new Date(item.release_date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
            });

            let dateSection = document.querySelector(`[data-date-group="${item.release_date}"]`);
            
            if (!dateSection) {
                dateSection = document.createElement('div');
                dateSection.className = 'timeline-date-block';
                dateSection.setAttribute('data-date-group', item.release_date);
                dateSection.innerHTML = `
                    <div class="timeline-date-header-separator">
                        <span class="date-text-badge">${formattedDate}</span>
                        <div class="separator-axis-line"></div>
                    </div>
                    <div class="timeline-cards-grid-row"></div>
                `;
                streamContainer.appendChild(dateSection);
            }

            const gridRow = dateSection.querySelector('.timeline-cards-grid-row');
            if (gridRow.querySelector(`[data-item-id="${item.id}"]`)) return;

            const cardLink = document.createElement('a');
            cardLink.href = `/media/${item.media_type}/${item.id}/`; 
            cardLink.className = 'schedule-media-card-link text-decoration-none';
            cardLink.setAttribute('data-item-id', item.id);
            
            cardLink.innerHTML = `
                <div class="schedule-media-card">
                    <div class="schedule-poster-box">
                        <img src="${item.poster_path}" alt="${item.title}" loading="lazy">
                        <div class="schedule-card-score">${item.vote_average}</div>
                    </div>
                    <h4 class="schedule-card-title mt-2">${item.title}</h4>
                </div>
            `;
            gridRow.appendChild(cardLink);
        });
    }

    function renderEmptyState() {
        streamContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-calendar-x d-block mb-3" style="font-size: 2.5rem;"></i>
                <p>No confirmed schedule releases found for this view.</p>
            </div>`;
    }

    window.addEventListener('scroll', () => {
        if (endOfDataReached) return;
        if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 250)) {
            fetchScheduleChunk();
        }
    });

    sourceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sourceButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            activeSource = btn.getAttribute('data-source');
            currentPage = 1;
            endOfDataReached = false;
            streamContainer.innerHTML = '';

            fetchScheduleChunk();
        });
    });

    fetchScheduleChunk();
});