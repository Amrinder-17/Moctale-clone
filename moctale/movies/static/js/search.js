document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('searchOpenBtn');
    
    // SAFETY CHECK: Quit silently if the navbar button isn't rendered on this layout view
    if (!openBtn) return;

    // Grab modal nodes if they exist natively in the template markup
    let searchModal = document.getElementById('moctaleSearchModal');

    // ==========================================================================
    // MODAL AUTOMATIC INJECTION BACKUP
    // ==========================================================================
    if (!searchModal) {
        searchModal = document.createElement('div');
        searchModal.id = 'moctaleSearchModal';
        searchModal.className = 'search-overlay-modal-screen';
        searchModal.innerHTML = `
            <div class="search-modal-inner-box">
                <div class="search-input-bar-row">
                    <i class="bi bi-search modal-glass-icon"></i>
                    <input type="text" id="liveSearchInput" placeholder="Search for Movies, Shows, Anime, Cast & Crew or Users..." autocomplete="off">
                    <button id="searchCloseBtn" class="close-overlay-x">&times;</button>
                </div>
                <div class="search-tabs-row">
                    <span class="tab-item active">Content</span>
                    <span class="tab-item">Collections</span>
                    <span class="tab-item">Cast & Crew</span>
                    <span class="tab-item">Users</span>
                </div>
                <div class="search-results-display-area">
                    <div id="searchDefaultState" class="modal-empty-state-pane">
                        <div class="history-circle"><i class="bi bi-search"></i></div>
                        <h3>No recent searches</h3>
                        <p>Your search history will appear here</p>
                    </div>
                    <div id="liveResultsGrid" class="live-results-grid hidden"></div>
                </div>
            </div>
        `;
        document.body.appendChild(searchModal);
    }

    // Re-bind internal overlay DOM targets
    const closeBtn = document.getElementById('searchCloseBtn');
    const searchInput = document.getElementById('liveSearchInput');
    const defaultState = document.getElementById('searchDefaultState');
    const resultsGrid = document.getElementById('liveResultsGrid');

    // ==========================================================================
    // EVENT ACTIONS CORE
    // ==========================================================================
    
    const closeModal = () => {
        openBtn.classList.remove('search-active'); 
        searchModal.style.setProperty('display', 'none', 'important');
        searchModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (searchInput) searchInput.value = '';
        if (resultsGrid) resultsGrid.classList.add('hidden');
        if (defaultState) defaultState.style.setProperty('display', 'block', 'important');
    };

    // Open Trigger
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isCurrentlyActive = openBtn.classList.contains('search-active');

        if (isCurrentlyActive) {
            closeModal();
        } else {
            openBtn.classList.add('search-active'); 
            searchModal.style.setProperty('display', 'flex', 'important');
            searchModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Freeze main layout scroll
            
            setTimeout(() => {
                if (searchInput) searchInput.focus();
            }, 120);
        }
    });

    // Close Actions
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }
    
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            closeModal();
        }
    });

    // ==========================================================================
    // BACKEND LIVE STREAM API PIPELINE
    // ==========================================================================
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length === 0) {
                if (resultsGrid) resultsGrid.classList.add('hidden');
                if (defaultState) defaultState.style.setProperty('display', 'block', 'important');
                return;
            }

            debounceTimer = setTimeout(() => {
                // 💡 THE FIX: Prepend the required '/media/' root prefix to fix your 404 errors
                fetch(`/media/movies/api/search/?query=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => renderLiveResults(data.results))
                    .catch(err => console.error("Search Fetch Exception Routing Trace:", err));
            }, 300);
        });
    }

    function renderLiveResults(results) {
        if (!resultsGrid || !defaultState) return;
        resultsGrid.innerHTML = '';
        
        if (!results || results.length === 0) {
            resultsGrid.innerHTML = `<div style="color: #717685; text-align: center; width: 100%; padding-top: 40px; font-size: 1.1rem;">No titles match your search criteria.</div>`;
            resultsGrid.classList.remove('hidden');
            defaultState.style.setProperty('display', 'none', 'important');
            return;
        }

        // Inside static/js/search.js -> renderLiveResults function loop block:
    results.forEach(item => {
        const cardLink = document.createElement('a');
        cardLink.href = `/media/${item.media_type}/${item.id}/`;
        cardLink.className = 'search-result-card-item text-decoration-none';

        const displayTitle = item.title || item.name || 'Untitled Production';
        
        // Extract release year seamlessly from YYYY-MM-DD formats strings
        let releaseYear = 'N/A';
        const rawDate = item.release_date || item.first_air_date;
        if (rawDate && rawDate !== 'Undated') {
            releaseYear = rawDate.split('-')[0];
        }

        // Format and clean media label display strings variants
        const mediaLabel = item.media_type === 'movie' ? 'Movie' : 'TV Show';

        cardLink.innerHTML = `
            <div class="search-horizontal-card">
                <div class="search-horizontal-poster">
                    <img src="${item.poster_path}" alt="${displayTitle}" loading="lazy">
                </div>
                <div class="search-horizontal-details">
                    <h3 class="search-item-title">${displayTitle}</h3>
                    <p class="search-item-meta">${releaseYear} • ${mediaLabel}</p>
                </div>
            </div>
        `;
        resultsGrid.appendChild(cardLink);
    });

        defaultState.style.setProperty('display', 'none', 'important');
        resultsGrid.classList.remove('hidden');
    }
});