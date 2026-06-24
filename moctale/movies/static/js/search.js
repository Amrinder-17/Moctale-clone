document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('searchOpenBtn');
    
    if (!openBtn) return;

    // Grab modal nodes if they exist natively in the template markup
    let searchModal = document.getElementById('moctaleSearchModal');

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
                    <span class="tab-item active" data-type="content" style="color: #ffffff !important; font-weight: 600 !important; border-bottom: 2px solid #ffffff !important; padding-bottom: 10px !important; cursor: pointer !important;">Content</span>
                    <span class="tab-item" data-type="collections" style="cursor: pointer !important; padding-bottom: 10px !important;">Collections</span>
                    <span class="tab-item" data-type="person" style="cursor: pointer !important; padding-bottom: 10px !important;">Cast & Crew</span>
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

    const searchInput = document.getElementById('liveSearchInput');
    const defaultState = document.getElementById('searchDefaultState');
    const resultsGrid = document.getElementById('liveResultsGrid');
    const closeBtn = document.getElementById('searchCloseBtn'); // Added this declaration to fix potential error
    const tabItems = searchModal.querySelectorAll('.tab-item');

    let currentSearchType ; 
    let debounceTimer;

    // Helper to completely clear input and results
    const clearSearchUI = () => {
        if (resultsGrid) {
            resultsGrid.classList.add('hidden');
            resultsGrid.style.setProperty('display', 'none', 'important');
        }
        if (defaultState) {
            // Bring back the empty state cleanly ONLY when input is empty
            defaultState.style.setProperty('display', 'block', 'important');
        }
    };
    
    const closeModal = () => {
        openBtn.classList.remove('search-active'); 
        searchModal.style.setProperty('display', 'none', 'important');
        searchModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (searchInput) searchInput.value = '';
        clearSearchUI();
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

    const tabsRow = searchModal.querySelector('.search-tabs-row');
    
    // --- TAB  TOGGLE CONTROLLER ---
    // --- TAB TOGGLE CONTROLLER ---
    if (tabsRow) {
        tabsRow.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-item');
            if (!clickedTab) return;

            // 1. Clear visual active states across all sibling tabs
            tabsRow.querySelectorAll('.tab-item').forEach(t => {
                t.classList.remove('active');
                t.style.cssText = 'cursor: pointer !important; padding-bottom: 10px !important;';
            });

            // 2. Assign active state styling on the selected node
            clickedTab.classList.add('active');
            clickedTab.style.cssText = 'color: #ffffff !important; font-weight: 600 !important; solid #ffffff !important; padding-bottom: 10px !important; cursor: pointer !important;';

            // 3. Read 'data-tab' tracking value
            const rawTabValue = clickedTab.getAttribute('data-tab') || 'content';
            
            // Translate tab keys to map cleanly with your view definitions
            if (rawTabValue === 'cast') {
                currentSearchType = 'person';
            } else {
                currentSearchType = rawTabValue;
            }
            
            if (searchInput) {
                // 💡 4. THE CRITICAL FIX: Clear the textbox and clear out old results
                searchInput.value = ''; 
                clearSearchUI(); 

                // 5. Update text placeholder values smoothly based on the active tab
                if (currentSearchType === 'person') {
                    searchInput.placeholder = "Search for Actors, Directors, Writers...";
                } else if (currentSearchType === 'collections') {
                    searchInput.placeholder = "Search for Collections...";
                } else if (currentSearchType === 'users') {
                    searchInput.placeholder = "Search for Users...";
                } else {
                    searchInput.placeholder = "Search for Movies, Shows, Anime...";
                }

                // 💡 6. THE REFOCUS FIX: Automatically force the cursor back into the input field
                // Wrapping in a tiny timeout ensures the browser completes the style painting before focusing
                setTimeout(() => {
                    searchInput.focus();
                }, 10);
            }
        });
    }

    // --- BACKEND LIVE STREAM API PIPELINE ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length === 0) {
                clearSearchUI();
                return;
            }

            debounceTimer = setTimeout(() => {
                // 💡 NOTICE: No 'let' or 'const' before currentSearchType here!
                // This forces JavaScript to look up and read the actual active tab state.
                console.log("Dispatching fetch pipeline with type state:", currentSearchType); 

                fetch(`/media/movies/api/search/?query=${encodeURIComponent(query)}&type=${currentSearchType}`)
                    .then(res => res.json())
                    .then(data => renderLiveResults(data.results, currentSearchType))
                    .catch(err => console.error("Search Fetch Exception Routing Trace:", err));
            }, 300);
        });
    }

    function renderLiveResults(results, type) {
        if (!resultsGrid || !defaultState) return;
        resultsGrid.innerHTML = '';
        
        if (!results || results.length === 0) {
            resultsGrid.innerHTML = `<div style="color: #717685; text-align: center; width: 100%; padding-top: 40px; font-size: 1.1rem;">No results match your search criteria.</div>`;
            resultsGrid.classList.remove('hidden');
            defaultState.style.setProperty('display', 'none', 'important');
            return;
        }

        // 💡 Ensure the master grid element expands nicely to handle layouts
        resultsGrid.style.cssText = `
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
            gap: 16px !important;
            padding-top: 16px !important;
            box-sizing: border-box !important;
        `;

        results.forEach(item => {
            const cardLink = document.createElement('a');
            cardLink.className = 'search-result-card-item text-decoration-none';
            cardLink.style.cssText = "text-decoration: none !important; display: block;";

            if (type === 'person') {
                // --- 👤 CAST & CREW LAYOUT (CIRCULAR VERTICAL CARD) ---
                cardLink.href = `/media/person/${item.id}/`;
                const displayName = item.name || 'Unknown Individual';
                const departmentLabel = item.known_for_department || 'Cast/Crew';
                const profileImg = item.profile_path ? item.profile_path : 'https://placehold.co/300x450/16171b/717685?text=No+Image';

                cardLink.innerHTML = `
                    <div class="search-person-card" style="background-color: #1e2026 !important; border-radius: 12px !important; padding: 16px !important; display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 12px !important; box-sizing: border-box !important; height: 100% !important;">
                        <div class="search-person-avatar-wrapper" style="width: 100px !important; height: 100px !important; border-radius: 50% !important; overflow: hidden !important; display: flex !important; justify-content: center !important; align-items: center !important; background-color: #16171b !important;">
                            <img src="${profileImg}" alt="${displayName}" loading="lazy" style="width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;">
                        </div>
                        <div class="search-person-details" style="width: 100% !important;">
                            <h3 class="search-item-title" style="color: #ffffff !important; font-size: 1.05rem !important; font-weight: 600 !important; margin: 0 0 4px 0 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;">${displayName}</h3>
                            <p class="search-item-meta" style="color: #717685 !important; font-size: 0.85rem !important; margin: 0 !important;">${departmentLabel}</p>
                        </div>
                    </div>
                `;
            } else {
                // --- 🎬 MOVIES & TV SHOWS LAYOUT (HORIZONTAL POSTER CARD) ---
                cardLink.href = `/media/${item.media_type || 'movie'}/${item.id}/`;
                const displayTitle = item.title || item.name || 'Untitled Production';
                
                let releaseYear = 'N/A';
                const rawDate = item.release_date || item.first_air_date;
                if (rawDate && rawDate !== 'Undated') {
                    releaseYear = rawDate.split('-')[0];
                }

                const mediaLabel = item.media_type === 'movie' ? 'Movie' : 'TV Show';
                const posterImg = item.poster_path ? item.poster_path : 'https://placehold.co/300x450/16171b/717685?text=No+Poster';

                cardLink.innerHTML = `
                    <div class="search-movie-horizontal-card" style="background-color: #1e2026 !important; border-radius: 12px !important; padding: 12px !important; display: flex !important; align-items: center !important; gap: 16px !important; box-sizing: border-box !important; height: 100% !important;">
                        <div class="search-horizontal-poster" style="width: 65px !important; min-width: 65px !important; height: 95px !important; border-radius: 6px !important; overflow: hidden !important; background-color: #16171b !important;">
                            <img src="${posterImg}" alt="${displayTitle}" loading="lazy" style="width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;">
                        </div>
                        <div class="search-horizontal-details" style="flex: 1 !important; min-width: 0 !important;">
                            <h3 class="search-item-title" style="color: #ffffff !important; font-size: 1.1rem !important; font-weight: 600 !important; margin: 0 0 4px 0 !important; display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; text-overflow: ellipsis !important; line-height: 1.3 !important;">${displayTitle}</h3>
                            <p class="search-item-meta" style="color: #717685 !important; font-size: 0.9rem !important; margin: 0 !important;">${releaseYear} • ${mediaLabel}</p>
                        </div>
                    </div>
                `;
            }
            resultsGrid.appendChild(cardLink);
        });

        if (results.length > 0) {
            // 1. Force hide the default state pane completely using standard CSS visibility properties
            defaultState.style.display = 'none';
            defaultState.style.setProperty('display', 'none', 'important');
            
            // 2. Uncover and reveal your cards grid layout cleanly
            resultsGrid.classList.remove('hidden');
            resultsGrid.style.display = 'grid';
            resultsGrid.style.setProperty('display', 'grid', 'important');
        } else {
            // If results array is empty, run your clean empty fallback state layout instead
            resultsGrid.innerHTML = `<div style="color: #717685; text-align: center; width: 100%; padding-top: 40px; font-size: 1.1rem;">No results match your search criteria.</div>`;
            resultsGrid.classList.remove('hidden');
            defaultState.style.setProperty('display', 'none', 'important');
        }
    }
});