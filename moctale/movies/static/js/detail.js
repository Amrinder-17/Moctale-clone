document.addEventListener('DOMContentLoaded', () => {
    const banner = document.querySelector('.movie-detail-hero-banner');
    if (!banner) return;

    const trailerUrl = banner.dataset.trailerUrl;
    if (!trailerUrl) return;

    banner.classList.add('has-trailer');

    banner.addEventListener('click', (event) => {
        if (event.target.closest('.poster-column, .info-column, .action-buttons-vertical, .banner-play-icon-wrapper, button, a')) {
            return;
        }

        window.open(trailerUrl, '_blank', 'noopener,noreferrer');
    });
});
