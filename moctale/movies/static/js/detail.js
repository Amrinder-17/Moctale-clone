document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       1. HERO BANNER & TRAILER MANAGER
       ========================================================================== */
    const banner = document.querySelector('.movie-detail-hero-banner');
    if (banner) {
        const trailerUrl = banner.dataset.trailerUrl;
        
        if (trailerUrl) {
            banner.classList.add('has-trailer');

            banner.addEventListener('click', (event) => {
                // 🛑 CRITICAL SAFETY: Added '.movie-action-panel' and its children to the ignore list
                if (event.target.closest('.poster-column, .info-column, .action-buttons-vertical, .movie-action-panel, .banner-play-icon-wrapper, button, a')) {
                    return;
                }
                window.open(trailerUrl, '_blank', 'noopener,noreferrer');
            });
        }
    }

    /* ==========================================================================
       2. USER ACTIVITY BUTTON TRACKER (AJAX ENGINE)
       ========================================================================== */
    const actionPanel = document.querySelector('.movie-action-panel');
    if (!actionPanel) return; // Exit gracefully if interaction buttons aren't on this page

    // Gather global identifiers from the wrapper data attributes
    const movieId = actionPanel.dataset.movieId;
    const movieTitle = actionPanel.dataset.title;
    const csrfToken = actionPanel.querySelector('[name=csrfmiddlewaretoken]').value;

    // Attach event listeners to all buttons containing the .btn-action class rules
    actionPanel.querySelectorAll('.btn-action').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevents the click from bubbling up to the banner background
            
            const action = button.dataset.action;
            if (!action) return;

            // Build dynamic form payload
            const formData = new FormData();
            formData.append('movie_id', movieId);
            formData.append('movie_title', movieTitle);
            formData.append('action', action);

            try {
                const response = await fetch('/media/toggle-activity/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken
                    },
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // Toggle the visual active layout highlight state
                    button.classList.toggle('active', data.is_active);

                    // Update button typography text labels seamlessly on-the-fly
                    const textNode = button.querySelector('.btn-text');
                    if (textNode) {
                        if (action === 'watched') {
                            textNode.textContent = data.is_active ? 'Watched' : 'Mark as Watched';
                        } else if (action === 'interested') {
                            textNode.textContent = data.is_active ? 'Interested (Notified)' : 'Mark as Interested';
                        } else if (action === 'collection') {
                            textNode.textContent = data.is_active ? 'In Collection' : 'Add to Collection';
                        }
                    }
                    
                    // 🔄 Mutual Exclusion State Rule Sync
                    if (data.is_active) {
                        if (action === 'watched') {
                            const interestedBtn = actionPanel.querySelector('[data-action="interested"]');
                            if (interestedBtn) {
                                interestedBtn.classList.remove('active');
                                const intText = interestedBtn.querySelector('.btn-text');
                                if (intText) intText.textContent = 'Mark as Interested';
                            }
                        } else if (action === 'interested') {
                            const watchedBtn = actionPanel.querySelector('[data-action="watched"]');
                            if (watchedBtn) {
                                watchedBtn.classList.remove('active');
                                const watchedText = watchedBtn.querySelector('.btn-text');
                                if (watchedText) watchedText.textContent = 'Mark as Watched';
                            }
                        }
                    }

                } else {
                    console.error('Action failed:', data.error);
                }
            } catch (err) {
                console.error('Error connecting to view controller gateway:', err);
            }
        });
    });
});