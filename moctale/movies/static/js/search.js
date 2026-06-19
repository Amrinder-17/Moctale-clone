document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('searchOpenBtn');
    
    // SAFETY CHECK: Quit silently if the navbar button isn't rendered on this layout view
    if (!openBtn) return;

    // Grab modal nodes if they exist natively in the template markup
    let searchModal = document.getElementById('moctaleSearchModal');

    // ==========================================================================
    // MODAL AUTOMATIC INJECTION BACKUP
    // ==========================================================================
    // Inside static/js/search.js -> Replace the modal injection block with this:
    if (!searchModal) {
        searchModal = document.createElement('div');
        searchModal.id = 'moctaleSearchModal';
        
        // 💡 FORCE UNIFORM MODAL OVERLAY STYLING
        searchModal.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: rgba(11, 12, 16, 0.98) !important; /* Deep dark slate transparency */
            z-index: 99999 !important; /* Ensures it sits above all components */
            display: none;
            justify-content: center !important;
            padding-top: 5vh !important;
            backdrop-filter: blur(8px) !important;
        `;

        searchModal.innerHTML = `
            <div class="search-modal-inner-box" style="width: 100% !important; max-width: 800px !important; padding: 0 20px !important; box-sizing: border-box !important;">
                
                <div class="search-input-bar-row" style="display: flex !important; align-items: center !important; background: #16171b !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important; padding: 12px 20px !important; gap: 14px !important; width: 100% !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;">
                    <i class="bi bi-search modal-glass-icon" style="color: #717685 !important; font-size: 1.3rem !important;"></i>
                    <input type="text" id="liveSearchInput" class="search-input-field" placeholder="Search for Movies, Shows, Anime..." autocomplete="off" style="background: transparent !important; border: none !important; color: #ffffff !important; font-size: 1.15rem !important; width: 100% !important; outline: none !important; box-shadow: none !important; padding: 0 !important;">
                    <button id="searchCloseBtn" class="close-overlay-x" style="background: transparent !important; border: none !important; color: #717685 !important; font-size: 1.8rem !important; cursor: pointer !important; line-height: 1 !important; padding: 0 !important; transition: color 0.2s;">&times;</button>
                </div>
                
                <div class="search-tabs-row" style="display: flex !important; gap: 24px !important; margin: 24px 0 12px 4px !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; padding-bottom: 12px !important; font-size: 0.95rem !important; color: #717685 !important;">
                    <span class="tab-item active" style="color: #ffffff !important; font-weight: 600 !important; border-bottom: 2px solid #ffffff !important; padding-bottom: 10px !important; cursor: pointer !important;">Content</span>
                    <span class="tab-item" style="cursor: pointer !important;">Collections</span>
                    <span class="tab-item" style="cursor: pointer !important;">Cast & Crew</span>
                    <span class="tab-item" style="cursor: pointer !important;">Users</span>
                </div>
                
                <div class="search-results-display-area" style="max-height: 70vh !important; overflow-y: auto !important; padding-right: 4px !important;">
                    <div id="searchDefaultState" class="modal-empty-state-pane" style="text-align: center !important; color: #717685 !important; padding-top: 80px !important;">
                        <div class="history-circle" style="font-size: 2rem !important; margin-bottom: 12px !important;"><i class="bi bi-search"></i></div>
                        <h3 style="color: #ffffff !important; font-size: 1.3rem !important; margin-bottom: 6px !important;">No recent searches</h3>
                        <p style="margin: 0 !important; font-size: 0.9rem !important;">Your search history will appear here</p>
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