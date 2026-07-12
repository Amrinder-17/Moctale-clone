document.addEventListener('DOMContentLoaded', function () {
    const reviewForm = document.querySelector('.custom-review-card');
    const textarea = document.getElementById('reviewTextArea');
    const counter = document.getElementById('charCounter');
    const postButton = document.querySelector('.custom-post-btn');

    // ==========================================
    // 1. LIVE CHARACTER COUNTER
    // ==========================================
    textarea.addEventListener('input', function () {
        const currentLength = textarea.value.length;
        counter.textContent = `${currentLength}/1000`;

        // Subtle visual cue: turn counter red if approaching limit
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
        event.preventDefault(); // Stop page from hard-reloading

        // Grab the selected radio button value
        const selectedRadio = reviewForm.querySelector('input[name="score"]:checked');
        const scoreValue = selectedRadio ? selectedRadio.value : null;
        const reviewText = textarea.value.trim();

        // Validation check
        if (!scoreValue) {
            alert("Please select a rating before posting!");
            return;
        }

        // Disable button to prevent double-clicks/spamming the database
        postButton.disabled = true;
        postButton.textContent = "Posting...";

        // Collect form data safely (automatically handles CSRF tokens)
        const formData = new FormData(reviewForm);
        
        formData.set('review_text', textarea.value.trim());

        // Send AJAX request to your Django view
        fetch(reviewForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest', // Tells Django this is an AJAX request
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Success actions: Clear out text inputs
                textarea.value = '';
                counter.textContent = '0/1000';
                
                // Reset post button status
                postButton.disabled = false;
                postButton.textContent = "Post";

                // Optional: Trigger a notification or slide your new review into a list below!
                alert("Review posted successfully!");
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

