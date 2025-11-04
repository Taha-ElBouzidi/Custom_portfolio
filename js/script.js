document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.querySelector('#year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    const navToggle = document.querySelector('.nav__toggle');
    const navLinks = document.querySelector('.nav__links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('is-open');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('is-open');
            });
        });
    }

    const filterButtons = document.querySelectorAll('.filter-button');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length && galleryItems.length) {
        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const filterValue = button.dataset.filter;

                filterButtons.forEach((btn) => btn.classList.remove('is-active'));
                button.classList.add('is-active');

                galleryItems.forEach((item) => {
                    const itemCategory = item.dataset.category;
                    const shouldShow = filterValue === 'all' || itemCategory === filterValue;
                    item.style.display = shouldShow ? 'block' : 'none';
                });
            });
        });
    }

    const lightbox = document.querySelector('.lightbox');
    const lightboxImage = document.querySelector('.lightbox__image');
    const lightboxCaption = document.querySelector('.lightbox__caption');
    const lightboxClose = document.querySelector('.lightbox__close');

    if (lightbox && lightboxImage && lightboxCaption) {
        galleryItems.forEach((item) => {
            item.addEventListener('click', () => {
                const imgEl = item.querySelector('img');
                const captionEl = item.querySelector('figcaption');

                if (!imgEl) return;

                lightboxImage.src = imgEl.src;
                lightboxImage.alt = imgEl.alt;
                lightboxCaption.textContent = captionEl ? captionEl.textContent : '';

                lightbox.setAttribute('aria-hidden', 'false');
                lightbox.classList.add('is-visible');
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('is-visible');
            lightbox.setAttribute('aria-hidden', 'true');
            lightboxImage.src = '';
            lightboxCaption.textContent = '';
        };

        lightboxClose?.addEventListener('click', closeLightbox);

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox.classList.contains('is-visible')) {
                closeLightbox();
            }
        });
    }
});
