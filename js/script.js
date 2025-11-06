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

        navLinks.addEventListener('click', (event) => {
            if (event.target.matches('a')) {
                navLinks.classList.remove('is-open');
            }
        });
    }

    const state = {
        category: 'all',
        tag: 'all',
    };

    const gallery = document.querySelector('.portfolio-gallery');
    const filterSection = document.querySelector('.portfolio-filter');
    let tagsContainer = null;

    const applyFilter = () => {
        if (!gallery) return;
        const items = gallery.querySelectorAll('.gallery-item');
        items.forEach((item) => {
            const category = item.dataset.category || 'all';
            const tags = (item.dataset.tags || '')
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            const matchesCategory = state.category === 'all' || state.category === category;
            const matchesTag = state.tag === 'all' || tags.includes(state.tag);
            const isVisible = matchesCategory && matchesTag;
            item.toggleAttribute('hidden', !isVisible);
        });
    };

    const setCategoryFilter = (value) => {
        state.category = value;
        if (filterSection) {
            filterSection.querySelectorAll('.filter-button').forEach((button) => {
                button.classList.toggle('is-active', button.dataset.filter === value);
            });
        }
        applyFilter();
    };

    const setTagFilter = (value) => {
        state.tag = value;
        if (tagsContainer) {
            tagsContainer.querySelectorAll('.portfolio-tags__button').forEach((button) => {
                button.classList.toggle('is-active', button.dataset.tag === value);
            });
        }
        applyFilter();
    };

    if (filterSection) {
        filterSection.addEventListener('click', (event) => {
            const button = event.target.closest('.filter-button');
            if (!button) return;
            event.preventDefault();
            setCategoryFilter(button.dataset.filter || 'all');
        });
    }

    if (gallery) {
        const lightbox = document.querySelector('.lightbox');
        const lightboxImage = document.querySelector('.lightbox__image');
        const lightboxCaption = document.querySelector('.lightbox__caption');
        const lightboxClose = document.querySelector('.lightbox__close');

        const closeLightbox = () => {
            if (!lightbox || !lightboxImage || !lightboxCaption) return;
            lightbox.classList.remove('is-visible');
            lightbox.setAttribute('aria-hidden', 'true');
            lightboxImage.src = '';
            lightboxCaption.textContent = '';
        };

        gallery.addEventListener('click', (event) => {
            const item = event.target.closest('.gallery-item');
            if (!item || !lightbox || !lightboxImage || !lightboxCaption) return;

            const imgEl = item.querySelector('img');
            const captionEl = item.querySelector('figcaption');
            if (!imgEl) return;

            lightboxImage.src = imgEl.src;
            lightboxImage.alt = imgEl.alt || '';
            lightboxCaption.textContent = captionEl ? captionEl.textContent : '';
            lightbox.setAttribute('aria-hidden', 'false');
            lightbox.classList.add('is-visible');
        });

        lightboxClose?.addEventListener('click', () => {
            closeLightbox();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeLightbox();
            }
        });

        lightbox?.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('portfolio:rendered', (event) => {
        if (!filterSection) return;
        const tags = Array.isArray(event.detail?.tags) ? event.detail.tags : [];
        if (!tags.length) {
            if (tagsContainer) {
                tagsContainer.remove();
                tagsContainer = null;
            }
            state.tag = 'all';
            applyFilter();
            return;
        }

        if (!tagsContainer) {
            tagsContainer = document.createElement('div');
            tagsContainer.className = 'portfolio-tags';
            tagsContainer.addEventListener('click', (clickEvent) => {
                const button = clickEvent.target.closest('.portfolio-tags__button');
                if (!button) return;
                clickEvent.preventDefault();
                setTagFilter(button.dataset.tag || 'all');
            });
            filterSection.appendChild(tagsContainer);
        }

        tagsContainer.innerHTML = '';

        const createButton = (value, label, isActive = false) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'portfolio-tags__button';
            button.dataset.tag = value;
            button.textContent = label;
            if (isActive) {
                button.classList.add('is-active');
            }
            return button;
        };

        tagsContainer.appendChild(createButton('all', 'All Tags', state.tag === 'all'));

        tags
            .sort((a, b) => a.localeCompare(b))
            .forEach((tag) => {
                const button = createButton(tag, tag, state.tag === tag);
                tagsContainer.appendChild(button);
            });

        applyFilter();
    });

    const ensureEnvLoaded = () =>
        new Promise((resolve) => {
            if (window.env) {
                resolve();
                return;
            }

            const existing = document.querySelector('script[data-env-loader]');
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => resolve(), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'js/env.js';
            script.async = false;
            script.dataset.envLoader = 'true';
            script.addEventListener('load', () => resolve(), { once: true });
            script.addEventListener('error', () => resolve(), { once: true });
            document.head.appendChild(script);
        });

    const loadPublicModule = async () => {
        try {
            const module = await import('./public.js');
            if (typeof module.initPublicSite === 'function') {
                await module.initPublicSite();
            }
        } catch (error) {
            console.error('Failed to load dynamic content', error);
        }
    };

    ensureEnvLoaded().then(loadPublicModule);
});
