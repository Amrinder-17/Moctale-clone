document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('searchOpenBtn');
    
    // SAFETY CHECK: Quit silently if the navbar button isn't rendered on this layout view
    if (!openBtn) return;

    // Grab modal nodes if they exist natively in the template markup
    let searchModal = document.getElementById('moctaleSearchModal');

    // ==========================================================================
    // MODAL AUTOMATIC INJECTION BACKUP
    // ==========================================================================
    // If you forgot to include the modal HTML template in this page, 
    // this block dynamically builds and injects it right into the body root!
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

        // Check if modal is currently open or closed
        const isCurrentlyActive = openBtn.classList.contains('search-active');

        if (isCurrentlyActive) {
            closeModal();
        } else {
            // Morph icon to Cross via layout transition rules
            openBtn.classList.add('search-active'); 
            
            // Pop open overlay container panel
            searchModal.style.setProperty('display', 'flex', 'important');
            searchModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Freeze main layout scroll tracking
            
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
                fetch(`/movies/api/search/?query=${encodeURIComponent(query)}`)
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

        results.forEach(item => {
            const cardLink = document.createElement('a');
            cardLink.href = `/movies/${item.media_type}/${item.id}/`;
            cardLink.className = 'card-link';
            cardLink.innerHTML = `
                <div class="poster-card">
                    <img src="${item.poster_path}" alt="${item.title}" loading="lazy">
                    <div class="card-overlay">
                        <h3>${item.title}</h3>
                        <div class="card-meta"><span>⭐ ${item.vote_average}</span></div>
                    </div>
                </div>
            `;
            resultsGrid.appendChild(cardLink);
        });

        defaultState.style.setProperty('display', 'none', 'important');
        resultsGrid.classList.remove('hidden');
    }
});