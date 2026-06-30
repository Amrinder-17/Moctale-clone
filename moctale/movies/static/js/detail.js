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
                // 🛑 SAFETY SHIELD: Stop the banner from hijacking clicks if they happen inside the modal dialog layers
                if (event.target.closest('#collectionModal, .modal-content, .modal-backdrop')) {
                    return;
                }
                
                if (event.target.closest('.poster-column, .info-column, .action-buttons-vertical, .movie-action-panel, button, a')) {
                    return;
                }
                window.open(trailerUrl, '_blank', 'noopener,noreferrer');
            });
        }
    }

    /* ==========================================================================
       2. WATCHED / INTERESTED SINGLE AJAX TRIGGERS
       ========================================================================== */
    const actionPanel = document.querySelector('.movie-action-panel');
    if (actionPanel) {
        const movieId = actionPanel.dataset.movieId;
        const movieTitle = actionPanel.dataset.title;
        const csrfToken = actionPanel.querySelector('[name=csrfmiddlewaretoken]').value;

        actionPanel.querySelectorAll('.btn-watched').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stops event from bubbling to banner
                
                const action = button.dataset.action;
                const formData = new FormData();
                formData.append('movie_id', movieId);
                formData.append('movie_title', movieTitle);
                formData.append('action', action);

                try {
                    const response = await fetch('/media/toggle-activity/', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': csrfToken },
                        body: formData
                    });
                    const data = await response.json();

                    if (data.success) {
                        button.classList.toggle('active', data.is_active);
                        const textNode = button.querySelector('.btn-text');
                        if (textNode) {
                            if (action === 'watched') {
                                textNode.textContent = data.is_active ? 'Watched' : 'Mark as Watched';
                            } else if (action === 'interested') {
                                textNode.textContent = data.is_active ? 'Interested (Notified)' : 'Mark as Interested';
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error syncing baseline tracking state:', err);
                }
            });
        });
    }

    /* ==========================================================================
       3. MODAL SUB-FORM ACCORDION TOGGLE
       ========================================================================== */
    const btnShowCreateForm = document.getElementById('btnShowCreateForm');
    const createCollectionForm = document.getElementById('createCollectionForm');

    if (btnShowCreateForm && createCollectionForm) {
        btnShowCreateForm.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevents parent backdrop interceptors from killing this action
            createCollectionForm.classList.toggle('d-none');
        });
    }

    /* ==========================================================================
       4. COLLECTIONS SELECTION & CREATION AJAX ENGINE
       ========================================================================== */
    const listContainer = document.getElementById('collectionsListContainer');
    if (listContainer) {
        const movieId = listContainer.dataset.movieId;
        const mainCollectionBtn = document.querySelector('.btn-collection');
        const mainPanel = document.querySelector('.movie-action-panel');
        const movieTitle = mainPanel ? mainPanel.dataset.title : '';
        const csrfToken = listContainer.querySelector('[name=csrfmiddlewaretoken]').value;

        // A. Listen for Checkbox updates (Toggling movie inside folders)
        listContainer.addEventListener('change', async (e) => {
            if (!e.target.classList.contains('collection-checkbox')) return;

            const checkbox = e.target;
            const collectionId = checkbox.dataset.collectionId;

            const formData = new FormData();
            formData.append('movie_id', movieId);
            formData.append('movie_title', movieTitle);
            formData.append('collection_id', collectionId);

            try {
                const response = await fetch('/media/collection/toggle-movie/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken },
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    // Instantly sync the visual state of the external main detail button
                    if (mainCollectionBtn) {
                        mainCollectionBtn.classList.toggle('active', data.has_any_collection);
                        const textSpan = mainCollectionBtn.querySelector('.btn-text');
                        if (textSpan) {
                            textSpan.textContent = data.has_any_collection ? 'In Collection' : 'Add to Collection';
                        }
                    }
                }
            } catch (err) {
                console.error('Error modifying folder collection membership:', err);
            }
        });

        // B. Handle Async Creation of new folders
        const btnSubmit = document.getElementById('btnSubmitNewCollection');
        const inputName = document.getElementById('newCollectionName');

        if (btnSubmit && inputName && createCollectionForm) {
            btnSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const nameValue = inputName.value.trim();
                if (!nameValue) return;

                const formData = new FormData();
                formData.append('name', nameValue);

                try {
                    const response = await fetch('/media/collection/create/', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': csrfToken },
                        body: formData
                    });
                    const data = await response.json();

                    if (data.success) {
                        const itemsContainer = listContainer.querySelector('.d-flex.flex-column');
                        
                        // Structural markup to inject the newly generated collection row live into the list
                        const itemHtml = `
                            <label class="collection-item d-flex align-items-center justify-content-between p-2 rounded">
                                <div class="d-flex align-items-center gap-3">
                                    <input type="checkbox" class="collection-checkbox" data-collection-id="${data.id}">
                                    <span class="collection-name text-white-50">${data.name}</span>
                                </div>
                                <span class="lock-icon text-muted"><i class="bi bi-unlock"></i></span>
                            </label>
                        `;
                        
                        // Clear the empty placeholder string if this is the first item added
                        if (itemsContainer.innerHTML.includes('No collections available.')) {
                            itemsContainer.innerHTML = '';
                        }
                        
                        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
                        inputName.value = '';
                        createCollectionForm.classList.add('d-none');
                    }
                } catch (err) {
                    console.error('Error handling creation execution engine:', err);
                }
            });
        }
    }
});