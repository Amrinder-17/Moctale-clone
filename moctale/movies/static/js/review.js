document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.querySelector('.custom-review-card');
    const onlyreviewform = document.querySelector('.no-reviews-msg');
    const textarea = document.getElementById('reviewTextArea');
    const counter = document.getElementById('charCounter');
    const postButton = document.querySelector('.custom-post-btn');

    // ==========================================
    // 1. LIVE CHARACTER COUNTER
    // ==========================================
    if (textarea) {
        textarea.addEventListener('input', function () {
            const currentLength = textarea.value.length;
            if (counter) counter.textContent = `${currentLength}/1000`;

            if (currentLength >= 900) {
                counter.classList.remove('text-secondary');
                counter.classList.add('text-danger');
            } else {
                counter.classList.remove('text-danger');
                counter.classList.add('text-secondary');
            }
        });
    }

    // ==========================================
    // 2. MAIN POST FORM SUBMISSION (AJAX)
    // ==========================================
    if (onlyreviewform && reviewForm) {
        reviewForm.addEventListener('submit', function (event) {
            event.preventDefault(); 

            const selectedRadio = reviewForm.querySelector('input[name="score"]:checked');
            const scoreValue = selectedRadio ? selectedRadio.value : null;

            if (!scoreValue) {
                alert("Please select a rating before posting!");
                return;
            }

            postButton.disabled = true;
            postButton.textContent = "Posting...";

            const formData = new FormData(reviewForm);
            if (textarea) formData.set('review_text', textarea.value.trim());

            fetch(reviewForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const ratingLabels = { '1': 'Skip', '2': 'Timepass', '3': 'Go for it', '4': 'Perfection' };
                    const readableScore = ratingLabels[data.score] || data.score;

                    // Extract the logged-in user's avatar asset
                    const avatarContainer = reviewForm.querySelector('.d-flex.align-items-center.gap-2.flex-shrink-0');
                    let avatarHtml = '';
                    if (avatarContainer) {
                        const avatarEl = avatarContainer.querySelector('img, .avatar-circle');
                        avatarHtml = avatarEl ? avatarEl.outerHTML : '';
                    }

                    const csrfToken = reviewForm.querySelector('[name=csrfmiddlewaretoken]').value;
                    const movieId = reviewForm.querySelector('[name=movie_id]').value;
                    const movieTitle = reviewForm.querySelector('[name=movie_title]').value;
                    const mediaType = reviewForm.querySelector('[name=media_type]').value;

                    // Build the detailed dual-mode view block matching your template layout perfectly
                    const newReviewWrapperHtml = `
                        <div id="user-review-section-wrapper" style="margin-left: 0; margin-right: auto;">
        
                        <div class="custom-review-card p-3 rounded-4 d-flex flex-column text-white review-view-mode animate-fade-in"
                            style="background-color: #1a1a1a !important;">
                            
                            <!-- Top Row: Profile Details & Rating Badge on the far right -->
                            <div class="d-flex align-items-center justify-content-between w-100 mb-2">
                                <div class="d-flex align-items-center gap-2">
                                    ${avatarHtml}
                                    <div class="d-flex flex-column">
                                        <span class="fw-bold text-light small lh-1">${data.user_name}</span>
                                        <span class="text-secondary opacity-75 mt-0.5" style="font-size: 0.72rem;">
                                            ${data.created_at}
                                        </span>
                                    </div>
                                </div>

                                <span class="static-pill-badge score-color-${data.score}">
                                    ${readableScore}
                                </span>
                            </div>

                            <!-- Middle Row: Independent Review Text Body -->
                            <div class="review-display-body text-light mb-3" style="font-size: 0.88rem; white-space: pre-line;">
                                ${data.review_text ? data.review_text : '<span class="text-muted italic small">Rated without a written review.</span>'}
                            </div>
                            
                            <!-- Bottom Row: Likes/Chats on left, Dropdown menu on the far right -->
                            <div class="d-flex align-items-center justify-content-between w-100 text-secondary mt-auto" style="font-size: 0.95rem; padding-left: 2px;">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="d-flex align-items-center gap-1.5 review-box cursor-pointer-icon">
                                        <form action="/media/activity/${data.activity_id}/like/" method="POST" class="like-review-form" style="display:inline;">
                                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                            <button type="submit" class="btn btn-sm btn-link like-btn p-0 border-0">
                                                <i class="bi bi-heart text-muted align-middle fs-5"></i>
                                            </button>
                                        </form>
                                        <span class="like-count font-weight-bold ml-1">0</span>
                                    </div>
                                    <div class="d-flex align-items-center gap-1.5 cursor-pointer-icon">
                                        <i class="bi bi-chat"></i>
                                    </div>
                                </div>

                                <div class="dropdown">
                                    <div data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer; padding: 0.25rem;">
                                        <i class="bi bi-three-dots cursor-pointer-icon text-secondary"></i>
                                    </div>
                                    <ul class="dropdown-menu dropdown-menu-end bg-dark border-secondary">
                                        <li><a class="dropdown-item text-light edit-review-btn" href="#">Edit review</a></li>
                                        <li><hr class="dropdown-divider border-secondary"></li>
                                        <li>
                                            <form action="/media/activity/${data.activity_id}/delete/" method="POST" class="delete-review-form" style="display:inline;">
                                                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                                <button type="submit" class="dropdown-item text-danger bg-transparent border-0 w-100 text-start">
                                                    <i class="bi bi-trash-fill"></i> Delete review
                                                </button>
                                            </form>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- EDIT MODE FORM -->
                        <div class="review-edit-mode d-none">
                            <form method="POST" action="${reviewForm.action}" class="custom-review-card p-3 rounded-4 d-flex flex-column gap-3">
                                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                <input type="hidden" name="movie_id" value="${movieId}">
                                <input type="hidden" name="movie_title" value="${movieTitle}">
                                <input type="hidden" name="media_type" value="${mediaType}">
                                
                                <div class="d-flex align-items-center justify-content-between w-100 gap-3 flex-wrap">
                                    <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                        ${avatarHtml}
                                        <span class="fw-semibold text-light small">@${data.user_name}</span>
                                    </div>

                                    <div class="rating-pill-group d-flex align-items-center rounded-pill">
                                        <input type="radio" name="score" id="score_skip" value="1" class="btn-check" ${data.score == 1 ? 'checked' : ''}>
                                        <label for="score_skip" class="pill-btn pill-skip text-center">Skip</label>

                                        <input type="radio" name="score" id="score_timepass" value="2" class="btn-check" ${data.score == 2 ? 'checked' : ''}>
                                        <label for="score_timepass" class="pill-btn pill-timepass text-center">Timepass</label>

                                        <input type="radio" name="score" id="score_goforit" value="3" class="btn-check" ${data.score == 3 ? 'checked' : ''}>
                                        <label for="score_goforit" class="pill-btn pill-goforit text-center">Go for it</label>

                                        <input type="radio" name="score" id="score_perfection" value="4" class="btn-check" ${data.score == 4 ? 'checked' : ''}>
                                        <label for="score_perfection" class="pill-btn pill-perfection text-center">Perfection</label>
                                    </div>
                                </div>

                                <div class="w-100 position-relative flex-grow-1">
                                    <textarea name="review_text" id="editReviewTextArea" class="form-control custom-textarea border-0 border-bottom rounded-0 px-0 pb-1 bg-transparent text-white w-100" placeholder="Update your review..." maxlength="1000">${data.review_text ? data.review_text : ''}</textarea>
                                </div>

                                <div class="d-flex justify-content-end align-items-center gap-2 w-100 mt-auto">
                                    <button type="button" class="btn btn-link text-secondary text-decoration-none rounded-pill px-3.5 py-1 small cancel-edit-btn">Cancel</button>
                                    <button type="submit" class="galaxybtn">
                                        <strong>Save Changes</strong>
                                        <div id="container-stars"><div id="stars"></div></div>
                                        <div id="glow"><div class="circle"></div><div class="circle"></div></div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    `;

                    // Select the parent entry zone container wrapper
                    const outerTargetContainer = onlyreviewform.parentElement;
                    if (outerTargetContainer) {
                        onlyreviewform.remove(); // Safely remove entry card
                        outerTargetContainer.insertAdjacentHTML('afterbegin', newReviewWrapperHtml);
                    }
                } else {
                    alert("Error posting review: " + data.error);
                    postButton.disabled = false;
                    postButton.textContent = "Post";
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Something went wrong. Please try again.");
                postButton.disabled = false;
                postButton.textContent = "Post";
            });
        });
    }

    // ==========================================
    // 3. GLOBAL EVENT DELEGATION FOR CLICK TRIGGERS
    // ==========================================
    document.body.addEventListener('click', function (event) {
        // --- CLICKED EDIT BUTTON ---
        if (event.target.classList.contains('edit-review-btn')) {
            event.preventDefault();
            const wrapper = event.target.closest('#user-review-section-wrapper');
            if (wrapper) {
                const viewModeCard = wrapper.querySelector('.review-view-mode');
                const editModeCard = wrapper.querySelector('.review-edit-mode');
                if (viewModeCard && editModeCard) {
                    viewModeCard.classList.add('d-none');
                    editModeCard.classList.remove('d-none');
                }
            }
        }

        // --- CLICKED CANCEL BUTTON ---
        if (event.target.classList.contains('cancel-edit-btn')) {
            event.preventDefault();
            const wrapper = event.target.closest('#user-review-section-wrapper');
            if (wrapper) {
                const viewModeCard = wrapper.querySelector('.review-view-mode');
                const editModeCard = wrapper.querySelector('.review-edit-mode');
                if (viewModeCard && editModeCard) {
                    editModeCard.classList.add('d-none');
                    viewModeCard.classList.remove('d-none');
                }
            }
        }
    });

    // ==========================================
    // 4. GLOBAL EVENT DELEGATION FOR ALL FORM SUBMISSIONS
    // ==========================================
    document.body.addEventListener('submit', function (event) {
        const targetForm = event.target;

        // --- HANDLE DYNAMIC DELETIONS ---
        if (targetForm.classList.contains('delete-review-form')) {
            event.preventDefault();
            if (!confirm("Are you sure you want to delete this review?")) return;

            fetch(targetForm.action, {
                method: 'POST',
                body: new FormData(targetForm),
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network error during deletion.');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    window.location.reload();
                }
            })
            .catch(error => console.error('Error handling delete:', error));
        }

       // --- HANDLE DYNAMIC LIKES ---
        if (targetForm.classList.contains('like-review-form')) {
            event.preventDefault(); 

            const likeIcon = targetForm.querySelector('.bi');
            
            // Find the count span safely by going up to the closest flex container or card wrapper
            const reviewCard = targetForm.closest('.custom-review-card') || targetForm.closest('#user-review-section-wrapper');
            const likeCountSpan = reviewCard ? reviewCard.querySelector('.like-count') : null;

            fetch(targetForm.action, {
                method: 'POST',
                body: new FormData(targetForm),
                headers: { 
                    'X-Requested-With': 'XMLHttpRequest' 
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network error during like action.');
                return response.json();
            })
            .then(data => {
                if (data.success || data.liked !== undefined) {
                    // Update the icon heart styling state seamlessly
                    if (likeIcon) {
                        if (data.liked) {
                            likeIcon.className = 'bi bi-heart-fill text-danger align-middle fs-5';
                        } else {
                            likeIcon.className = 'bi bi-heart text-muted align-middle fs-5';
                        }
                    }
                    // Update the counter text
                    if (likeCountSpan) {
                        likeCountSpan.textContent = data.total_likes;
                    }
                }
            })
            .catch(error => console.error('Error handling like:', error));
        }
        // --- HANDLE ASYNC EDIT FORM SAVE ---
        const editContainer = targetForm.closest('.review-edit-mode');
        if (editContainer && !targetForm.classList.contains('delete-review-form') && !targetForm.classList.contains('like-review-form')) {
            event.preventDefault();

            const saveButton = targetForm.querySelector('button[type="submit"]');
            const wrapper = targetForm.closest('#user-review-section-wrapper');
            const editTexarea = targetForm.querySelector('#editReviewTextArea');

            if (saveButton) {
                saveButton.disabled = true;
                const strongText = saveButton.querySelector('strong');
                if (strongText) strongText.textContent = "Saving...";
            }

            const formData = new FormData(targetForm);
            if (editTexarea) formData.set('review_text', editTexarea.value.trim());

            fetch(targetForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network error trying to save update.');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const ratingLabels = { '1': 'Skip', '2': 'Timepass', '3': 'Go for it', '4': 'Perfection' };
                    const readableScore = ratingLabels[data.score] || data.score;

                    if (wrapper) {
                        const viewModeCard = wrapper.querySelector('.review-view-mode');
                        
                        const badge = viewModeCard.querySelector('.static-pill-badge');
                        if (badge) {
                            badge.className = `static-pill-badge score-color-${data.score}`;
                            badge.textContent = readableScore;
                        }

                        const textBody = viewModeCard.querySelector('.review-display-body');
                        if (textBody) {
                            if (data.review_text) {
                                textBody.className = "review-display-body text-light mb-3";
                                textBody.textContent = data.review_text;
                            } else {
                                textBody.innerHTML = '<span class="text-muted italic small">Rated without a written review.</span>';
                            }
                        }

                        const likeCountSpan = viewModeCard.querySelector('.like-count');
                        if (likeCountSpan && data.total_likes !== undefined) {
                            likeCountSpan.textContent = data.total_likes;
                        }

                        editContainer.classList.add('d-none');
                        viewModeCard.classList.remove('d-none');
                    }
                } else {
                    alert("Error updating review: " + data.error);
                }
                if (saveButton) {
                    saveButton.disabled = false;
                    const strongText = saveButton.querySelector('strong');
                    if (strongText) strongText.textContent = "Save Changes";
                }
            })
            .catch(error => {
                console.error('Error handling edit save:', error);
                alert("Something went wrong saving changes.");
                if (saveButton) {
                    saveButton.disabled = false;
                    const strongText = saveButton.querySelector('strong');
                    if (strongText) strongText.textContent = "Save Changes";
                }
            });
        }
    });
});