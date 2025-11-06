(() => {
    'use strict';

    const PATH_BY_SLUG = {
        home: 'index.html',
        about: 'about.html',
        portfolio: 'portfolio.html',
        contact: 'contact.html',
    };

    document.addEventListener('DOMContentLoaded', () => {
        initSite().catch((error) => console.error('Site initialisation failed:', error));
    });

    async function initSite() {
        if (!window.Supa) {
            console.error('Supabase helpers not loaded. Ensure js/supa.js is included.');
            return;
        }

        renderYear();
        setupNavToggle();
        showInitialLoading();

        await window.Supa.ensureSeedData();

        const pages = await window.Supa.getPages();
        renderNavigation(pages);

        const pageSlug = getCurrentSlug();

        switch (document.body.dataset.page) {
            case 'home':
                await renderHomePage();
                break;
            case 'about':
                await renderAboutPage();
                break;
            case 'portfolio':
                await renderPortfolioPage();
                break;
            case 'contact':
                await renderContactPage();
                break;
            case 'dynamic':
                await renderDynamicPage(pageSlug);
                break;
            default:
                break;
        }

        hideInitialLoading();
    }

    function getCurrentSlug() {
        const pageKey = document.body.dataset.page;
        if (pageKey === 'dynamic') {
            const params = new URLSearchParams(window.location.search);
            return params.get('slug');
        }
        return pageKey;
    }

    function renderYear() {
        const yearEl = document.querySelector('#year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    function showInitialLoading() {
        document.querySelectorAll('[data-gallery]').forEach((container) => {
            renderLoading(container);
        });
    }

    function hideInitialLoading() {
        document.querySelectorAll('[data-gallery]').forEach((container) => {
            if (container.dataset.loadingSpinner) {
                clearElement(container);
            }
        });
    }

    async function renderHomePage() {
        const images = await window.Supa.getImagesByPage('home');
        const heroImages = images.filter((image) => image.is_hero);
        const heroImage = heroImages.length ? heroImages[0] : images[0];
        const remaining = images.filter((image) => image.id !== heroImage?.id);

        applyHeroImage('home', heroImage);

        const featuredGrid = document.querySelector('[data-gallery="home"]');
        renderFeaturedCards(featuredGrid, remaining);
    }

    async function renderAboutPage() {
        const images = await window.Supa.getImagesByPage('about');
        const portraitImage = images.find((image) => image.is_portrait) || images.find((image) => image.is_hero) || images[0];
        const remaining = images.filter((image) => image.id !== portraitImage?.id);

        applyHeroImage('about', portraitImage);
        renderGenericGallery('about', 'About', remaining);
    }

    async function renderContactPage() {
        const images = await window.Supa.getImagesByPage('contact');
        const heroImage = images.find((image) => image.is_hero) || images[0];
        const remaining = images.filter((image) => image.id !== heroImage?.id);

        applyHeroImage('contact', heroImage);
        renderGenericGallery('contact', 'Contact', remaining);
    }

    async function renderPortfolioPage() {
        const images = await window.Supa.getImagesByPage('portfolio');
        const heroImage = images.find((image) => image.is_hero) || images[0];
        applyHeroImage('portfolio', heroImage);

        const galleryImages = images.slice();
        const filterContainer = document.querySelector('[data-filter-container]');
        const galleryContainer = document.querySelector('[data-gallery="portfolio"]');

        if (!filterContainer || !galleryContainer) {
            return;
        }

        const categories = Array.from(
            new Set(
                galleryImages
                    .map((image) => image.category)
                    .filter((value) => typeof value === 'string' && value.trim().length > 0)
            )
        );

        let currentFilter = 'all';

        function renderFilters() {
            clearElement(filterContainer);

            const allButton = createFilterButton('All', 'all', currentFilter === 'all');
            filterContainer.append(allButton);

            categories
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .forEach((category) => {
                    const button = createFilterButton(category, category, currentFilter === category);
                    filterContainer.append(button);
                });
        }

        function createFilterButton(label, value, isActive) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'filter-button';
            button.dataset.filter = value;
            button.textContent = label;
            if (isActive) {
                button.classList.add('is-active');
            }
            button.addEventListener('click', () => {
                currentFilter = value;
                renderFilters();
                renderGallery();
            });
            return button;
        }

        function renderGallery() {
            clearElement(galleryContainer);

            const filtered = galleryImages.filter((image) => {
                if (currentFilter === 'all') {
                    return true;
                }
                return image.category === currentFilter;
            });

            if (!filtered.length) {
                renderEmptyState(
                    galleryContainer,
                    currentFilter === 'all'
                        ? 'Upload portfolio imagery from the dashboard.'
                        : `No imagery in the “${currentFilter}” category yet.`
                );
                return;
            }

            filtered.forEach((image) => {
                const figure = createGalleryFigure(image, 'Portfolio');
                figure.dataset.lightbox = 'true';
                galleryContainer.append(figure);
            });

            setupLightbox(galleryContainer);
        }

        renderFilters();
        renderGallery();
    }

    async function renderDynamicPage(slug) {
        const container = document.querySelector('[data-dynamic-page]');
        if (!container) {
            return;
        }
        if (!slug) {
            renderDynamicFallback(container, 'Page Not Found', 'Create a page from the dashboard or confirm the URL.');
            return;
        }

        const page = await window.Supa.getPageBySlug(slug);
        if (!page) {
            renderDynamicFallback(container, 'Page Not Found', 'Create a page from the dashboard or confirm the URL.');
            return;
        }

        const images = await window.Supa.getImagesByPage(slug);
        const heroImage = images.find((image) => image.is_hero) || images[0];
        const remaining = images.filter((image) => image.id !== heroImage?.id);

        applyHeroImage('dynamic', heroImage);

        const titleEl = document.querySelector('[data-dynamic-title]');
        const eyebrowEl = document.querySelector('[data-dynamic-eyebrow]');
        const descriptionEl = document.querySelector('[data-dynamic-description]');
        const galleryTitleEl = document.querySelector('[data-dynamic-gallery-title]');
        const galleryDescriptionEl = document.querySelector('[data-dynamic-gallery-description]');

        if (titleEl) {
            titleEl.textContent = page.title;
        }
        if (eyebrowEl) {
            eyebrowEl.textContent = `Page • ${page.slug}`;
        }
        if (descriptionEl) {
            descriptionEl.textContent = 'This page was created from the dashboard. Add imagery in the admin to populate it.';
        }
        if (galleryTitleEl) {
            galleryTitleEl.textContent = `${page.title} Gallery`;
        }
        if (galleryDescriptionEl) {
            galleryDescriptionEl.textContent = 'Imagery assigned to this page will appear here automatically.';
        }

        renderGenericGallery('dynamic', page.title, remaining);
    }

    function renderDynamicFallback(container, title, message) {
        const titleEl = document.querySelector('[data-dynamic-title]');
        const descriptionEl = document.querySelector('[data-dynamic-description]');
        const gallery = container.querySelector('[data-gallery]');

        if (titleEl) {
            titleEl.textContent = title;
        }
        if (descriptionEl) {
            descriptionEl.textContent = message;
        }
        if (gallery) {
            clearElement(gallery);
            renderEmptyState(gallery, 'No page selected. Add a page from the dashboard to begin.');
        }
    }

    function applyHeroImage(slug, image) {
        const heroElement = document.querySelector(`[data-hero-image="${slug}"]`);
        if (!heroElement) {
            return;
        }

        if (!image) {
            heroElement.style.backgroundImage = '';
            heroElement.classList.add('is-empty');
            return;
        }

        const url = window.Supa.resolveImageUrl(image);
        heroElement.style.backgroundImage = url ? `url('${url}')` : '';
        heroElement.classList.remove('is-empty');
    }

    function renderFeaturedCards(container, images) {
        if (!container) {
            return;
        }

        clearElement(container);

        if (!images.length) {
            renderEmptyState(container, 'Add imagery to the Home category to populate this showcase.');
            return;
        }

        images.forEach((image) => {
            const card = document.createElement('article');
            card.className = 'card';

            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'card__image';
            const url = window.Supa.resolveImageUrl(image);
            imageWrapper.style.backgroundImage = url ? `url('${url}')` : '';

            const body = document.createElement('div');
            body.className = 'card__body';

            const title = document.createElement('h3');
            title.textContent = image.title || 'Untitled capture';

            const description = document.createElement('p');
            description.textContent = image.description || 'Edit this description from the dashboard.';

            const link = document.createElement('a');
            link.className = 'card__link';
            link.href = 'portfolio.html';
            link.textContent = image.category ? `Explore ${image.category}` : 'View in portfolio';

            body.append(title, description, link);
            card.append(imageWrapper, body);
            container.append(card);
        });
    }

    function renderGenericGallery(slug, pageTitle, images) {
        const containers = document.querySelectorAll(`[data-gallery="${slug}"]`);
        if (!containers.length) {
            return;
        }

        containers.forEach((container) => {
            clearElement(container);

            if (!images.length) {
                renderEmptyState(container, `Add imagery to the ${pageTitle} page from the dashboard.`);
                return;
            }

            images.forEach((image) => {
                const figure = createGalleryFigure(image, pageTitle);
                container.append(figure);
            });
        });
    }

    function createGalleryFigure(image, pageTitle) {
        const figure = document.createElement('figure');
        figure.className = 'dynamic-gallery__item';

        const imgEl = document.createElement('img');
        imgEl.src = window.Supa.resolveImageUrl(image);
        imgEl.alt = image.title || `${pageTitle} gallery image`;

        const caption = document.createElement('figcaption');
        caption.textContent = image.description || image.title || 'Visual story from the archive.';

        figure.append(imgEl, caption);
        return figure;
    }

    function renderEmptyState(container, message) {
        clearElement(container);
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-state';
        placeholder.textContent = message;
        container.append(placeholder);
    }

    function renderLoading(container) {
        if (!container) {
            return;
        }
        clearElement(container);
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<span></span><span></span><span></span>';
        container.append(spinner);
        container.dataset.loadingSpinner = 'true';
    }

    function clearElement(element) {
        if (!element) {
            return;
        }
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        delete element.dataset.loadingSpinner;
    }

    function setupLightbox(container) {
        const lightbox = document.querySelector('.lightbox');
        if (!container || !lightbox) {
            return;
        }

        if (container.dataset.lightboxBound) {
            return;
        }
        container.dataset.lightboxBound = 'true';

        const lightboxImage = lightbox.querySelector('.lightbox__image');
        const lightboxCaption = lightbox.querySelector('.lightbox__caption');
        const closeButton = lightbox.querySelector('.lightbox__close');

        const closeLightbox = () => {
            lightbox.classList.remove('is-visible');
            lightbox.setAttribute('aria-hidden', 'true');
            if (lightboxImage) {
                lightboxImage.src = '';
            }
            if (lightboxCaption) {
                lightboxCaption.textContent = '';
            }
        };

        container.addEventListener('click', (event) => {
            const target = event.target.closest('[data-lightbox]');
            if (!target) {
                return;
            }
            const imgEl = target.querySelector('img');
            const captionEl = target.querySelector('figcaption');
            if (!imgEl || !lightboxImage) {
                return;
            }
            lightboxImage.src = imgEl.src;
            lightboxImage.alt = imgEl.alt;
            if (lightboxCaption) {
                lightboxCaption.textContent = captionEl ? captionEl.textContent : '';
            }
            lightbox.setAttribute('aria-hidden', 'false');
            lightbox.classList.add('is-visible');
        });

        closeButton?.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        if (!lightbox.dataset.bound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && lightbox.classList.contains('is-visible')) {
                    closeLightbox();
                }
            });
            lightbox.dataset.bound = 'true';
        }
    }

    function renderNavigation(pages) {
        const navContainer = document.querySelector('[data-nav]');
        if (!navContainer) {
            return;
        }

        clearElement(navContainer);
        const activeSlug = getCurrentSlug();

        pages
            .slice()
            .sort((a, b) => {
                const orderA = typeof a.nav_order === 'number' ? a.nav_order : 0;
                const orderB = typeof b.nav_order === 'number' ? b.nav_order : 0;
                return orderA - orderB;
            })
            .forEach((page) => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = page.title;
                link.href = PATH_BY_SLUG[page.slug] || `page.html?slug=${encodeURIComponent(page.slug)}`;
                if (page.slug === activeSlug) {
                    link.classList.add('is-active');
                }
                listItem.append(link);
                navContainer.append(listItem);
            });
    }

    function setupNavToggle() {
        const navToggle = document.querySelector('.nav__toggle');
        const navLinks = document.querySelector('.nav__links');

        if (!navToggle || !navLinks) {
            return;
        }

        if (!navToggle.dataset.bound) {
            navToggle.dataset.bound = 'true';
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('is-open');
            });
        }

        if (!navLinks.dataset.bound) {
            navLinks.dataset.bound = 'true';
            navLinks.addEventListener('click', (event) => {
                if (event.target.tagName === 'A') {
                    navLinks.classList.remove('is-open');
                }
            });
        }
    }
})();
