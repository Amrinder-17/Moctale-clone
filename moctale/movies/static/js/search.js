document.addEventListener('DOMContentLoaded', () => {
    // 1. Target the element nodes from your dashboard HTML
    const openBtn = document.getElementById('searchOpenBtn');
    const searchModal = document.getElementById('moctaleSearchModal');
    const closeBtn = document.getElementById('searchCloseBtn');
    const searchInput = document.getElementById('liveSearchInput');
    const defaultState = document.getElementById('searchDefaultState');
    const resultsGrid = document.getElementById('liveResultsGrid');

    // SAFETY GUARD: Exit quietly if the search elements aren't present on the current page view
    if (!openBtn || !searchModal) {
        console.log("Moctale Search Engine: UI elements not found on this view layer.");
        return;
    }

    // ==========================================================================
    // 2. MODAL TOGGLE EVENT CONTROLLERS
    // ==========================================================================
    
    // Open the full-screen overlay panel
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();    // 🛑 IRONCLAD FIX: Absolutely stops the page from scrolling/jumping down
        e.stopPropagation();   // Stops event bubbling chaos
        
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Locks main background viewport scrollbars
        
        // Auto-focus the input cursor so you can start typing instantly
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 120);
    });

    // Close functionality engine
    const closeModal = () => {
        searchModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restores normal background page scrolling
        
        if (searchInput) searchInput.value = ''; // Resets input characters
        if (resultsGrid) resultsGrid.classList.add('hidden');
        if (defaultState) defaultState.style.setProperty('display', 'block', 'important');
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }
    
    // Close modal instantly if the user clicks out onto the blurry surrounding background area
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeModal();
        }
    });

    // Premium Quality-of-Life: Close the modal if the user presses the 'Escape' key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            closeModal();
        }
    });

    // ==========================================================================
    // 3. ASYNCHRONOUS NETWORK DATA DEBOUNCER ENGINE
    // ==========================================================================
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            // Revert instantly to the neutral history state window if field is cleared
            if (query.length === 0) {
                if (resultsGrid) resultsGrid.classList.add('hidden');
                if (defaultState) defaultState.style.setProperty('display', 'block', 'important');
                return;
            }

            // Wait 300 milliseconds after typing halts before executing fetch database pipeline
            debounceTimer = setTimeout(() => {
                fetch(`/movies/api/search/?query=${encodeURIComponent(query)}`)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP network anomaly: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        renderLiveResults(data.results);
                    })
                    .catch(err => console.error("Moctale Search API pipeline exception:", err));
            }, 300);
        });
    }

    // ==========================================================================
    // 4. DYNAMIC DOM RENDER GENERATOR
    // ==========================================================================
    function renderLiveResults(results) {
        if (!resultsGrid || !defaultState) return;
        
        resultsGrid.innerHTML = ''; // Clear previous query cards
        
        // Fallback message layout if no matches crawl back from TMDB
        if (!results || results.length === 0) {
            resultsGrid.innerHTML = `
                <div style="color: #717685; text-align: center; width: 100%; padding-top: 40px; font-size: 1.1rem; font-weight: 500;">
                    No media content titles match your search criteria.
                </div>`;
            resultsGrid.classList.remove('hidden');
            defaultState.style.setProperty('display', 'none', 'important');
            return;
        }

        // Loop through array rows and map movie profiles directly onto dashboard card configurations
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

        // Toggle layout viewport view spaces smoothly
        defaultState.style.setProperty('display', 'none', 'important');
        resultsGrid.classList.remove('hidden');
    }
});