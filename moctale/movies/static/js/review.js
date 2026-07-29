document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.querySelector('.custom-review-card');
    const onlyreviewform = document.querySelector('.no-reviews-msg');
    const textarea = document.getElementById('reviewTextArea');
    const counter = document.getElementById('charCounter');
    const postButton = document.querySelector('.custom-post-btn');

    // ==========================================
    // HELPER: BUILD HTML FOR INDIVIDUAL REPLIES
    // ==========================================
    function buildReplyHtml(r, csrfToken) {
        const isLiked = r.is_liked;
        const heartIconClass = isLiked ? 'bi bi-heart-fill text-danger' : 'bi bi-heart text-muted';
        
        const avatarHtml = r.profile_picture 
            ? `<img src="${r.profile_picture}" class="avatar-img rounded-circle" style="width: 26px; height: 26px; object-fit: cover;">`
            : `<div class="avatar-circle d-flex align-items-center justify-content-center fw-bold text-uppercase" style="width: 26px; height: 26px; background-color: #3a3a3a; font-size: 0.75rem; border-radius: 50%;">${r.user.slice(0,1)}</div>`;

        // Render options menu (Edit / Delete) if user owns this reply
        const optionsMenuHtml = r.is_owner ? `
            <div class="dropdown ms-auto">
                <div data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer; padding: 0.15rem;">
                    <i class="bi bi-three-dots cursor-pointer-icon text-secondary" style="font-size: 0.85rem;"></i>
                </div>
                <ul class="dropdown-menu dropdown-menu-end bg-dark border-secondary" style="font-size: 0.8rem;">
                    <li><a class="dropdown-item text-light edit-reply-btn" href="#">Edit reply</a></li>
                    <li><hr class="dropdown-divider border-secondary my-1"></li>
                    <li>
                        <form action="/media/activity/${r.id}/delete/" method="POST" class="delete-review-form" style="display:inline;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                            <button type="submit" class="dropdown-item text-danger bg-transparent border-0 w-100 text-start">
                                <i class="bi bi-trash-fill"></i> Delete
                            </button>
                        </form>
                    </li>
                </ul>
            </div>
        ` : '';

        return `
            <div class="reply-item py-2 border-bottom border-secondary border-opacity-10 text-white reply-card-wrapper" data-reply-id="${r.id}">
                <!-- VIEW MODE -->
                <div class="reply-view-mode">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        ${avatarHtml}
                        <span class="fw-bold text-light" style="font-size: 0.82rem;">${r.user}</span>
                        <span class="text-secondary opacity-75" style="font-size: 0.7rem;">${r.updated_at}</span>
                        ${optionsMenuHtml}
                    </div>

                    <p class="mb-1 text-light opacity-90 ps-4 reply-text-body" style="font-size: 0.85rem; line-height: 1.4;">${r.review_text}</p>

                    <!-- LIKE BUTTON FOR REPLY -->
                    <div class="d-flex align-items-center gap-1.5 ps-4 text-secondary" style="font-size: 0.8rem;">
                        <form action="/media/activity/${r.id}/like/" method="POST" class="like-review-form" style="display:inline;">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                            <button type="submit" class="btn btn-sm btn-link like-btn p-0 border-0">
                                <i class="${heartIconClass} align-middle" style="font-size: 0.9rem;"></i>
                            </button>
                        </form>
                        <span class="like-count font-weight-bold" style="font-size: 0.78rem;">${r.likes_count}</span>
                    </div>
                </div>

                <!-- EDIT MODE FORM (Hidden by default) -->
                <div class="reply-edit-mode ps-4 d-none">
                    <form class="edit-reply-submit-form d-flex gap-2 align-items-center mt-1" action="/media/activity/${r.id}/edit/" method="POST">
                        <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                        <textarea name="review_text" class="form-control bg-dark text-white border-secondary rounded-3 px-2 py-1" rows="1" style="font-size: 0.82rem;" required>${r.review_text}</textarea>
                        <button type="button" class="btn btn-link text-secondary btn-sm p-0 text-decoration-none cancel-reply-edit-btn" style="font-size: 0.78rem;">Cancel</button>
                        <button type="submit" class="btn btn-primary btn-sm rounded-pill px-2.5 py-0.5 flex-shrink-0" style="font-size: 0.78rem;">Save</button>
                    </form>
                </div>
            </div>
        `;
    }

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
    // 2. MAIN POST FORM SUBMISSION (TOP-LEVEL REVIEW)
    // ==========================================
    if (onlyreviewform && reviewForm) {
        reviewForm.addEventListener('submit', function (event) {
            if (reviewForm.classList.contains('reply-submit-form')) return;

            event.preventDefault(); 

            const selectedRadio = reviewForm.querySelector('input[name="score"]:checked');
            const scoreValue = selectedRadio ? selectedRadio.value : null;

            if (!scoreValue) {
                alert("Please select a rating before posting!");
                return;
            }

            if (postButton) {
                postButton.disabled = true;
                postButton.textContent = "Posting...";
            }

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

                    const newReviewWrapperHtml = `
                        <div id="user-review-section-wrapper" style="margin-left: 0; margin-right: auto;">
                            <div class="custom-review-card p-3 rounded-4 d-flex flex-column text-white review-view-mode animate-fade-in card-feed-item"
                                style="background-color: #1a1a1a !important;" data-review-id="${data.activity_id}">
                                
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

                                <div class="review-display-body text-light mb-3" style="font-size: 0.88rem; white-space: pre-line;">
                                    ${data.review_text ? data.review_text : '<span class="text-muted italic small">Rated without a written review.</span>'}
                                </div>
                                
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
                                        <button type="button" class="btn btn-sm btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-1 toggle-reply-box-btn">
                                            <i class="bi bi-chat fs-5"></i>
                                            <span style="font-size: 0.78rem;" class="fw-semibold">Reply</span>
                                        </button>
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

                                <div class="reply-form-wrapper mt-3 d-none">
                                    <form class="reply-submit-form d-flex gap-2 align-items-center" action="/reviews/submit/" method="POST">
                                        <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                                        <input type="hidden" name="movie_id" value="${movieId}">
                                        <input type="hidden" name="movie_title" value="${movieTitle}">
                                        <input type="hidden" name="media_type" value="${mediaType}">
                                        <input type="hidden" name="parent_id" value="${data.activity_id}">

                                        <textarea name="review_text" class="form-control bg-dark text-white border-secondary rounded-3" rows="1" placeholder="Write a reply..." style="font-size: 0.85rem;" required></textarea>
                                        <button type="submit" class="btn btn-primary btn-sm rounded-pill px-3 flex-shrink-0">Reply</button>
                                    </form>
                                </div>
                                <div class="replies-list-container mt-3 ps-3 border-start border-secondary border-opacity-25 d-none"></div>
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

                    const outerTargetContainer = onlyreviewform.parentElement;
                    if (outerTargetContainer) {
                        onlyreviewform.remove();
                        outerTargetContainer.insertAdjacentHTML('afterbegin', newReviewWrapperHtml);
                    }
                } else {
                    alert("Error posting review: " + data.error);
                    if (postButton) {
                        postButton.disabled = false;
                        postButton.textContent = "Post";
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Something went wrong. Please try again.");
                if (postButton) {
                    postButton.disabled = false;
                    postButton.textContent = "Post";
                }
            });
        });
    }

    // ==========================================
    // 3. GLOBAL CLICK DELEGATION
    // ==========================================
    document.body.addEventListener('click', function (event) {
        // --- EDIT MAIN REVIEW ---
        const editBtn = event.target.closest('.edit-review-btn');
        if (editBtn) {
            event.preventDefault();
            const wrapper = editBtn.closest('#user-review-section-wrapper');
            if (wrapper) {
                const viewModeCard = wrapper.querySelector('.review-view-mode');
                const editModeCard = wrapper.querySelector('.review-edit-mode');
                if (viewModeCard && editModeCard) {
                    viewModeCard.classList.add('d-none');
                    editModeCard.classList.remove('d-none');
                }
            }
            return;
        }

        // --- CANCEL EDIT MAIN REVIEW ---
        const cancelBtn = event.target.closest('.cancel-edit-btn');
        if (cancelBtn) {
            event.preventDefault();
            const wrapper = cancelBtn.closest('#user-review-section-wrapper');
            if (wrapper) {
                const viewModeCard = wrapper.querySelector('.review-view-mode');
                const editModeCard = wrapper.querySelector('.review-edit-mode');
                if (viewModeCard && editModeCard) {
                    editModeCard.classList.add('d-none');
                    viewModeCard.classList.remove('d-none');
                }
            }
            return;
        }

        // --- TOGGLE INLINE REPLY FORM ---
        const toggleReplyBtn = event.target.closest('.toggle-reply-box-btn');
        if (toggleReplyBtn) {
            event.preventDefault();
            const card = toggleReplyBtn.closest('.card-feed-item');
            if (card) {
                const replyFormWrapper = card.querySelector('.reply-form-wrapper');
                if (replyFormWrapper) {
                    replyFormWrapper.classList.toggle('d-none');
                    if (!replyFormWrapper.classList.contains('d-none')) {
                        const textarea = replyFormWrapper.querySelector('textarea');
                        if (textarea) textarea.focus();
                    }
                }
            }
            return;
        }

        // --- LOAD / TOGGLE REPLIES ---
        const loadRepliesBtn = event.target.closest('.load-replies-btn');
        if (loadRepliesBtn) {
            event.preventDefault();
            const parentId = loadRepliesBtn.dataset.parentId;
            const card = loadRepliesBtn.closest('.card-feed-item');
            const repliesContainer = card ? card.querySelector('.replies-list-container') : null;
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

            if (!repliesContainer) return;

            if (!repliesContainer.classList.contains('d-none')) {
                repliesContainer.classList.add('d-none');
                const btnSpan = loadRepliesBtn.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'View replies';
                return;
            }

            fetch(`/media/reviews/${parentId}/replies/`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    repliesContainer.innerHTML = '';
                    data.replies.forEach(r => {
                        repliesContainer.insertAdjacentHTML('beforeend', buildReplyHtml(r, csrfToken));
                    });

                    repliesContainer.classList.remove('d-none');
                    const btnSpan = loadRepliesBtn.querySelector('span');
                    if (btnSpan) btnSpan.textContent = 'Hide replies';
                }
            })
            .catch(err => console.error('Error fetching replies:', err));
            return;
        }

        // --- TOGGLE REPLY EDIT MODE ---
        const editReplyBtn = event.target.closest('.edit-reply-btn');
        if (editReplyBtn) {
            event.preventDefault();
            const wrapper = editReplyBtn.closest('.reply-card-wrapper');
            if (wrapper) {
                wrapper.querySelector('.reply-view-mode').classList.add('d-none');
                wrapper.querySelector('.reply-edit-mode').classList.remove('d-none');
            }
            return;
        }

        // --- CANCEL REPLY EDIT MODE ---
        const cancelReplyEditBtn = event.target.closest('.cancel-reply-edit-btn');
        if (cancelReplyEditBtn) {
            event.preventDefault();
            const wrapper = cancelReplyEditBtn.closest('.reply-card-wrapper');
            if (wrapper) {
                wrapper.querySelector('.reply-edit-mode').classList.add('d-none');
                wrapper.querySelector('.reply-view-mode').classList.remove('d-none');
            }
            return;
        }
    });

    // ==========================================
    // 4. GLOBAL FORM SUBMISSION DELEGATION
    // ==========================================
    document.body.addEventListener('submit', function (event) {
        const targetForm = event.target;
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

        // --- SUBMIT NEW REPLY VIA AJAX ---
        if (targetForm.classList.contains('reply-submit-form')) {
            event.preventDefault();

            const card = targetForm.closest('.card-feed-item');
            const formData = new FormData(targetForm);
            const repliesContainer = card ? card.querySelector('.replies-list-container') : null;
            const textarea = targetForm.querySelector('textarea');
            const submitBtn = targetForm.querySelector('button[type="submit"]');

            if (submitBtn) submitBtn.disabled = true;

            fetch(targetForm.action || '/reviews/submit/', {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.is_reply) {
                    const r = data.reply;
                    r.is_owner = true; // User just posted this reply

                    if (repliesContainer) {
                        repliesContainer.classList.remove('d-none');
                        repliesContainer.insertAdjacentHTML('beforeend', buildReplyHtml(r, csrfToken));
                    }

                    if (textarea) textarea.value = '';
                    const replyFormWrapper = targetForm.closest('.reply-form-wrapper');
                    if (replyFormWrapper) replyFormWrapper.classList.add('d-none');
                } else {
                    alert(data.error || "Failed to post reply.");
                }
                if (submitBtn) submitBtn.disabled = false;
            })
            .catch(err => {
                console.error('Error submitting reply:', err);
                if (submitBtn) submitBtn.disabled = false;
            });

            return;
        }

        // --- SAVE EDITED REPLY VIA AJAX ---
        if (targetForm.classList.contains('edit-reply-submit-form')) {
            event.preventDefault();

            const wrapper = targetForm.closest('.reply-card-wrapper');
            const formData = new FormData(targetForm);
            const submitBtn = targetForm.querySelector('button[type="submit"]');

            if (submitBtn) submitBtn.disabled = true;

            fetch(targetForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const textBody = wrapper.querySelector('.reply-text-body');
                    if (textBody) textBody.textContent = data.review_text;

                    wrapper.querySelector('.reply-edit-mode').classList.add('d-none');
                    wrapper.querySelector('.reply-view-mode').classList.remove('d-none');
                } else {
                    alert(data.error || "Failed to update reply.");
                }
                if (submitBtn) submitBtn.disabled = false;
            })
            .catch(err => {
                console.error('Error updating reply:', err);
                if (submitBtn) submitBtn.disabled = false;
            });

            return;
        }

        // --- HANDLE DYNAMIC DELETIONS (REVIEWS & REPLIES) ---
        if (targetForm.classList.contains('delete-review-form')) {
            event.preventDefault();
            if (!confirm("Are you sure you want to delete this item?")) return;

            const replyWrapper = targetForm.closest('.reply-card-wrapper');

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
                    if (replyWrapper) {
                        replyWrapper.remove(); // Remove reply row dynamically
                    } else {
                        window.location.reload(); // Reload for top-level review deletion
                    }
                }
            })
            .catch(error => console.error('Error handling delete:', error));

            return;
        }

        // --- HANDLE DYNAMIC LIKES (REVIEWS & REPLIES) ---
        if (targetForm.classList.contains('like-review-form')) {
            event.preventDefault(); 

            const likeIcon = targetForm.querySelector('.bi');
            const card = targetForm.closest('.reply-card-wrapper') || targetForm.closest('.custom-review-card') || targetForm.closest('.card-feed-item');
            const likeCountSpan = card ? card.querySelector('.like-count') : null;

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
                    if (likeIcon) {
                        if (data.liked) {
                            likeIcon.className = 'bi bi-heart-fill text-danger align-middle';
                        } else {
                            likeIcon.className = 'bi bi-heart text-muted align-middle';
                        }
                    }
                    if (likeCountSpan) {
                        likeCountSpan.textContent = data.total_likes;
                    }
                }
            })
            .catch(error => console.error('Error handling like:', error));

            return;
        }

        // --- SAVE EDITED TOP-LEVEL REVIEW ---
        const editContainer = targetForm.closest('.review-edit-mode');
        if (editContainer && !targetForm.classList.contains('edit-reply-submit-form')) {
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