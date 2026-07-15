document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.querySelector('.custom-review-card');
    const textarea = document.getElementById('reviewTextArea');
    const counter = document.getElementById('charCounter');
    const postButton = document.querySelector('.custom-post-btn');
    
    // Target the main container where all your reviews live
    const reviewsContainer = document.getElementById('reviewsContainer'); 

    // ==========================================
    // 1. LIVE CHARACTER COUNTER
    // ==========================================
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

    // ==========================================
    // 2. ASYNC AJAX FORM SUBMISSION
    // ==========================================
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
                // 1. Map the numeric score value back to your custom text labels
                // 1. Map the numeric score value back to your custom text labels
const ratingLabels = {
    '1': 'Skip',
    '2': 'Timepass',
    '3': 'Go for it',
    '4': 'Perfection'
};
const readableScore = ratingLabels[data.score] || data.score;

// 2. Clone the inner markup from your current avatar element inside the form 
const avatarContainer = reviewForm.querySelector('.d-flex.align-items-center.gap-2.flex-shrink-0');
let avatarHtml = '';
if (avatarContainer) {
    // Clones either the img tag or the customized letter fallback circle exactly
    const avatarEl = avatarContainer.querySelector('img, .avatar-circle');
    avatarHtml = avatarEl ? avatarEl.outerHTML : '';
}

// 3. Construct the exact card filler structure match
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

            <span class="static-pill-badge score-color-${data.score}">
                ${readableScore}
            </span>
        </div>

        <div class="review-display-body text-light mb-3" style="font-size: 0.88rem; white-space: pre-line;">
            ${data.review_text ? data.review_text : '<span class="text-muted italic small">Rated without a written review.</span>'}
        </div>

        <div class="d-flex align-items-center justify-content-between w-100 text-secondary mt-1" style="font-size: 0.95rem; padding-left: 2px;">
            <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center gap-1.5 review-box cursor-pointer-icon">
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

                // 4. Inject the new review card right at the top of your feed container
                const reviewsContainer = document.getElementById('user-review-section-wrapper');
                if (reviewsContainer) {
                    const noReviewsMsg = reviewsContainer.querySelector('.no-reviews-msg');
                    if (noReviewsMsg) noReviewsMsg.remove();

                    reviewsContainer.insertAdjacentHTML('afterbegin', newReviewHtml);
                }

                // 5. Reset Form State
                textarea.value = '';
                counter.textContent = '0/1000';
                
                // Re-check the default 'Timepass' radio button status
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
});