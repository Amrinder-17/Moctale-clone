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

        // 💡 Create a unique storage key combining the platform type and active page index
        const cacheKey = `schedule_${activeSource}_page_${currentPage}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        // 🛠️ CHECK BROWSER STORAGE FIRST
        if (cachedData) {
            const data = JSON.parse(cachedData);
            renderScheduleChunk(data);
            currentPage++;
            isFetching = false;
            if (scrollLoader) scrollLoader.classList.add('hidden');
            return; // Exit out cleanly, no server network request needed!
        }

        const baseFeedUrl = window.MoctaleConfig ? window.MoctaleConfig.scheduleFeedUrl : '/media/movies/api/schedule-feed/';
        
        fetch(`${baseFeedUrl}?source=${activeSource}&page=${currentPage}`)
            .then(res => {
                if (!res.ok) throw new Error(`Server answered with an invalid HTTP response code: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.results || data.results.length === 0) {
                    endOfDataReached = true;
                    if (currentPage === 1) renderEmptyState();
                    return;
                }

                // 💡 WRITE TO BROWSER CACHE FOR NEXT TIME
                sessionStorage.setItem(cacheKey, JSON.stringify(data.results));

                renderScheduleChunk(data.results);
                currentPage++; 
            })
            .catch(err => console.error("Schedule Stream pipeline breakdown failure:", err))
            .finally(() => {
                isFetching = false;
                if (scrollLoader) scrollLoader.classList.add('hidden');
            });
    }

    // ==========================================================================
    // DOM ELEMENT GROUPING RENDER ENGINE
    // ==========================================================================
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
            
            // Avoid appending duplicate items if the DOM grid elements already contain them
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
                <p>No confirmed schedule releases cataloged under this segment layout window targets.</p>
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

    // Run baseline execution
    fetchScheduleChunk();
});