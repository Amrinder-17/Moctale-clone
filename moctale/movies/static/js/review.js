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
            counter.textContent = `${currentLength}/1000`;

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
    if (onlyreviewform) {
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
            formData.set('review_text', textarea.value.trim());

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
                    // Map score keys to labels
                    const ratingLabels = {
                        '1': 'Skip',
                        '2': 'Timepass',
                        '3': 'Go for it',
                        '4': 'Perfection'
                    };
                    const readableScore = ratingLabels[data.score] || data.score;

                    // Clone the inner markup from your current avatar inside the form
                    const avatarContainer = reviewForm.querySelector('.d-flex.align-items-center.gap-2.flex-shrink-0');
                    let avatarHtml = '';
                    if (avatarContainer) {
                        const avatarEl = avatarContainer.querySelector('img, .avatar-circle');
                        avatarHtml = avatarEl ? avatarEl.outerHTML : '';
                    }

                    // Construct the dynamic card layout, matching your exact dark styles and actions
                    const newReviewHtml = `
                        <div class="custom-review-card p-3 rounded-4 d-flex flex-column text-white animate-fade-in mb-3"
                             style="background-color: #1a1a1a !important;">
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
                                
                                <div class="d-flex align-items-center gap-2">
                                    <span class="static-pill-badge score-color-${data.score}">
                                        ${readableScore}
                                    </span>
                                    <div class="dropdown">
                                        <div data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                                            <i class="bi bi-three-dots cursor-pointer-icon text-secondary"></i>
                                        </div>
                                        <ul class="dropdown-menu dropdown-menu-end bg-dark border-secondary">
                                            <li><a class="dropdown-item text-light" href="#">Edit review</a></li>
                                            <li><hr class="dropdown-divider border-secondary"></li>
                                            <li>
                                                <form action="/activity/${data.activity_id}/delete/" method="POST" class="delete-review-form" style="display:inline;">
                                                    <input type="hidden" name="csrfmiddlewaretoken" value="${reviewForm.querySelector('[name=csrfmiddlewaretoken]').value}">
                                                    <button type="submit" class="dropdown-item text-danger d-flex align-items-center gap-2 bg-transparent border-0">
                                                        <i class="bi bi-trash-fill"></i> Delete review
                                                    </button>
                                                </form>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div class="review-display-body text-light mb-3" style="font-size: 0.88rem; white-space: pre-line;">
                                ${data.review_text ? data.review_text : '<span class="text-muted italic small">Rated without a written review.</span>'}
                            </div>

                            <div class="d-flex align-items-center justify-content-between w-100 text-secondary mt-1" style="font-size: 0.95rem; padding-left: 2px;">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="d-flex align-items-center gap-1.5 review-box cursor-pointer-icon">
                                        <form action="/activity/like/${data.activity_id}/toggle/" method="POST" class="like-review-form" style="display:inline;">
                                            <input type="hidden" name="csrfmiddlewaretoken" value="${reviewForm.querySelector('[name=csrfmiddlewaretoken]').value}">
                                            <button type="submit" class="btn btn-sm btn-link like-btn p-0 border-0">
                                                <i class="bi bi-heart text-muted align-middle fs-5"></i>
                                            </button>
                                        </form>
                                        <span class="like-count font-weight-bold ml-1">0</span>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center gap-1.5 cursor-pointer-icon">
                                    <i class="bi bi-chat"></i>
                                    <span style="font-size: 0.78rem;" class="fw-semibold"></span>
                                </div>
                            </div>
                        </div>
                    `;

                    // Inject the new review card right inside the container feed
                    const reviewsContainer = document.getElementById('user-review-section-wrapper');
                    if (reviewsContainer) {
                        const noReviewsMsg = reviewsContainer.querySelector('.no-reviews-msg');
                        if (noReviewsMsg) noReviewsMsg.remove();

                        // Target the top element below the entry block
                        reviewsContainer.insertAdjacentHTML('afterbegin', newReviewHtml);
                    }

                    // Reset Form State safely
                    textarea.value = '';
                    counter.textContent = '0/1000';
                    
                    const defaultRadio = document.getElementById('score_timepass');
                    if (defaultRadio) defaultRadio.checked = true;

                    postButton.disabled = false;
                    postButton.textContent = "Post";

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
    // 3. GLOBAL EVENT DELEGATION FOR INNER SUB-FORMS
    // ==========================================
    document.body.addEventListener('submit', function (event) {
        const targetForm = event.target;

        // --- HANDLE DYNAMIC DELETIONS ---
        if (targetForm.classList.contains('delete-review-form')) {
            event.preventDefault();

            if (!confirm("Are you sure you want to delete this review?")) return;

            const reviewCard = targetForm.closest('.custom-review-card');
            fetch(targetForm.action, {
                method: 'POST',
                body: new FormData(targetForm),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) throw new Error('Network error during deletion.');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    window.location.reload();}
            })
            .catch(error => console.error('Error handling delete:', error));
        }

        // --- HANDLE DYNAMIC LIKES ---
        if (targetForm.classList.contains('like-review-form')) {
            event.preventDefault();

            const likeIcon = targetForm.querySelector('.bi');
            const reviewBox = targetForm.closest('.review-box');
            const likeCountSpan = reviewBox ? reviewBox.querySelector('.like-count') : null;

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
                if (data.success) {
                    if (likeIcon && likeCountSpan) {
                        if (data.liked) {
                            likeIcon.className = 'bi bi-heart-fill text-danger align-middle fs-5';
                        } else {
                            likeIcon.className = 'bi bi-heart text-muted align-middle fs-5';
                        }
                        likeCountSpan.textContent = data.total_likes;
                    }
                }
            })
            .catch(error => console.error('Error handling like:', error));
        }
    });

    // ==========================================
// 1. TOGGLE DISPLAY VS EDIT FORM MODES
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
                viewModeCard.classList.add('d-none');     // Hide regular display card
                editModeCard.classList.remove('d-none');  // Show edit form layout
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
                editModeCard.classList.add('d-none');      // Hide edit form structure
                viewModeCard.classList.remove('d-none');   // Show regular display card
            }
        }
    }
});

// ==========================================
// 2. ASYNC EDIT FORM SUBMISSION
// ==========================================
document.body.addEventListener('submit', function (event) {
    const targetForm = event.target;
    
    // Check if the form being submitted belongs to the edit block wrapper
    const editContainer = targetForm.closest('.review-edit-mode');
    if (!editContainer) return;

    event.preventDefault(); // Stop page from hard-reloading

    const saveButton = targetForm.querySelector('button[type="submit"]');
    const wrapper = targetForm.closest('#user-review-section-wrapper');
    const textarea = targetForm.querySelector('#editReviewTextArea');

    // Prevent double submissions
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    const formData = new FormData(targetForm);
    if (textarea) {
        formData.set('review_text', textarea.value.trim());
    }

    fetch(targetForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network error trying to save update.');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Mapping tables to mirror values back into your View Mode UI components
            const ratingLabels = { '1': 'Skip', '2': 'Timepass', '3': 'Go for it', '4': 'Perfection' };
            const readableScore = ratingLabels[data.score] || data.score;

            if (wrapper) {
                const viewModeCard = wrapper.querySelector('.review-view-mode');
                
                // Update badge text and score styling dynamically
                const badge = viewModeCard.querySelector('.static-pill-badge');
                if (badge) {
                    badge.className = `static-pill-badge score-color-${data.score}`;
                    badge.textContent = readableScore;
                }

                // Update text block area layout
                const textBody = viewModeCard.querySelector('.review-display-body');
                if (textBody) {
                    if (data.review_text) {
                        textBody.className = "review-display-body text-light mb-3";
                        textBody.style.fontSize = "0.88rem";
                        textBody.style.whiteSpace = "pre-line";
                        textBody.textContent = data.review_text;
                    } else {
                        textBody.innerHTML = '<span class="text-muted italic small">Rated without a written review.</span>';
                    }
                }

                // Update the smart time layout label if sent by view response
                const timeLabel = viewModeCard.querySelector('.text-secondary.opacity-75');
                if (timeLabel && data.created_at) {
                    timeLabel.textContent = data.created_at;
                }

                const likeCountSpan = viewModeCard.querySelector('.like-count');
                if (likeCountSpan && data.total_likes !== undefined) {
                    likeCountSpan.textContent = data.total_likes;
                }

                // Flip display visibility back seamlessly
                editContainer.classList.add('d-none');
                viewModeCard.classList.remove('d-none');
            }

            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save Changes";
            }
        } else {
            alert("Error updating review: " + data.error);
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save Changes";
            }
        }
    })
    .catch(error => {
        console.error('Error handling edit save:', error);
        alert("Something went wrong saving changes.");
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });
});
});