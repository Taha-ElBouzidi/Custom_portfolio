const STORAGE_KEY = 'portfolioCMSData';
const DATA_VERSION = 1;

const defaultData = {
    version: DATA_VERSION,
    pages: [
        {
            id: 'home',
            name: 'Home',
            slug: 'home',
            path: 'index.html',
            description: 'Landing page and featured stories.',
            type: 'builtin',
            order: 0,
            showInNav: true,
        },
        {
            id: 'about',
            name: 'About',
            slug: 'about',
            path: 'about.html',
            description: 'Background and story of the photographer.',
            type: 'builtin',
            order: 1,
            showInNav: true,
        },
        {
            id: 'portfolio',
            name: 'Portfolio',
            slug: 'portfolio',
            path: 'portfolio.html',
            description: 'Comprehensive showcase of work.',
            type: 'builtin',
            order: 2,
            showInNav: true,
        },
        {
            id: 'contact',
            name: 'Contact',
            slug: 'contact',
            path: 'contact.html',
            description: 'Booking information and direct links.',
            type: 'builtin',
            order: 3,
            showInNav: true,
        },
    ],
    images: [
        {
            id: 'home-hero',
            pageId: 'home',
            title: 'Medina Sunrise',
            description: 'Signature hero imagery welcoming visitors to the portfolio.',
            src: 'image/index/hero.jpeg',
            tags: ['featured'],
            createdAt: 1,
        },
        {
            id: 'home-card-1',
            pageId: 'home',
            title: 'Marrakech Portraits',
            description: 'Editorial portraits with bold color contrasts from dusk sessions.',
            src: 'image/index/1.jpg',
            tags: ['portraits'],
            createdAt: 2,
        },
        {
            id: 'home-card-2',
            pageId: 'home',
            title: 'Royal Moroccan Lens',
            description: 'Hospitality narratives created for boutique riads across Marrakech.',
            src: 'image/index/2.jpg',
            tags: ['royal-moroccan-lens'],
            createdAt: 3,
        },
        {
            id: 'home-card-3',
            pageId: 'home',
            title: 'Creative Collaborations',
            description: 'Cross-genre collaborations with Moroccan designers and tastemakers.',
            src: 'image/index/3.jpg',
            tags: ['collaborations'],
            createdAt: 4,
        },
        {
            id: 'about-hero',
            pageId: 'about',
            title: 'Studio Portrait',
            description: 'A portrait of Mehdii El Marouazi in the Marrakech studio.',
            src: 'image/about/hero.png',
            tags: ['studio'],
            createdAt: 5,
        },
        {
            id: 'about-gallery-1',
            pageId: 'about',
            title: 'Behind the Lens',
            description: 'Documenting Marrakech architecture and texture studies.',
            src: 'image/index/1.jpg',
            tags: ['studio-notes'],
            createdAt: 6,
        },
        {
            id: 'portfolio-1',
            pageId: 'portfolio',
            title: 'Portrait Study',
            description: 'Highlighting natural light portraiture from the medina.',
            src: 'image/index/1.jpg',
            tags: ['portraits'],
            createdAt: 7,
        },
        {
            id: 'portfolio-2',
            pageId: 'portfolio',
            title: 'Hospitality Narrative',
            description: 'Storytelling for a boutique riad under Royal Moroccan Lens.',
            src: 'image/index/2.jpg',
            tags: ['royal-moroccan-lens'],
            createdAt: 8,
        },
        {
            id: 'portfolio-3',
            pageId: 'portfolio',
            title: 'Creative Collaboration',
            description: 'A lifestyle vignette styled with local artists.',
            src: 'image/index/3.jpg',
            tags: ['collaborations'],
            createdAt: 9,
        },
        {
            id: 'contact-hero',
            pageId: 'contact',
            title: 'Booking Highlight',
            description: 'Visual cue for the bookings hub in Marrakech.',
            src: 'image/index/2.jpg',
            tags: ['bookings'],
            createdAt: 10,
        },
        {
            id: 'contact-gallery-1',
            pageId: 'contact',
            title: 'Hospitality Welcome',
            description: 'Warm interiors highlighting booking destinations.',
            src: 'image/index/3.jpg',
            tags: ['bookings'],
            createdAt: 11,
        },
    ],
};

let stateData = null;
let adminModule = null;

document.addEventListener('DOMContentLoaded', () => {
    stateData = ensureData();
    adminModule = createAdminModule();

    renderYear();
    renderAll();

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            stateData = ensureData();
            renderAll();
            if (document.body.dataset.page === 'admin') {
                adminModule.render(stateData);
            }
        }
    });
});

function renderAll() {
    renderNavigation(stateData);
    renderPage(stateData);
}

function renderPage(data) {
    const pageKey = document.body.dataset.page;

    switch (pageKey) {
        case 'home':
            renderHomePage(data);
            break;
        case 'about':
            renderAboutPage(data);
            break;
        case 'portfolio':
            renderPortfolioPage(data);
            break;
        case 'contact':
            renderContactPage(data);
            break;
        case 'dynamic':
            renderDynamicPage(data);
            break;
        case 'admin':
            adminModule.init();
            adminModule.render(data);
            break;
        default:
            break;
    }
}
function ensureData() {
    const stored = loadData();
    const normalized = normalizeData(stored);
    if (!stored || JSON.stringify(stored) !== JSON.stringify(normalized)) {
        saveData(normalized, { silent: true });
    }
    return normalized;
}

function loadData() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw);
    } catch (error) {
        console.error('Unable to parse stored data:', error);
        return null;
    }
}

function saveData(data, options = {}) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (!options.silent) {
        stateData = data;
    }
}

function normalizeData(rawData) {
    const data = rawData ? cloneData(rawData) : cloneData(defaultData);

    if (!Array.isArray(data.pages)) {
        data.pages = [];
    }
    if (!Array.isArray(data.images)) {
        data.images = [];
    }

    const defaults = cloneData(defaultData);
    const normalizedPages = [];

    defaults.pages.forEach((defaultPage) => {
        const existing = data.pages.find((page) => page.id === defaultPage.id || page.slug === defaultPage.slug);
        if (existing) {
            normalizedPages.push({
                ...defaultPage,
                ...existing,
                id: defaultPage.id,
                path: defaultPage.path,
                type: 'builtin',
                showInNav: existing.showInNav === false ? false : true,
            });
        } else {
            normalizedPages.push(defaultPage);
        }
    });

    data.pages
        .filter((page) => !normalizedPages.some((existing) => existing.id === page.id))
        .forEach((page) => {
            const slug = page.slug ? page.slug : toPageSlug(page.name || 'page');
            normalizedPages.push({
                id: page.id || createId('page'),
                name: page.name || 'Untitled Page',
                slug,
                path: page.path || `page.html?slug=${encodeURIComponent(slug)}`,
                description: page.description || '',
                order: typeof page.order === 'number' ? page.order : normalizedPages.length,
                type: 'custom',
                showInNav: page.showInNav === false ? false : true,
            });
        });

    normalizedPages.forEach((page, index) => {
        if (typeof page.order !== 'number') {
            page.order = index;
        }
        if (!page.slug) {
            page.slug = toPageSlug(page.name || `page-${index}`);
        }
        if (page.type === 'custom') {
            page.path = `page.html?slug=${encodeURIComponent(page.slug)}`;
        }
    });

    const normalizedImages = data.images
        .map((image, index) => {
            if (!image.pageId || !image.src) {
                return null;
            }
            const tags = Array.isArray(image.tags)
                ? image.tags.map((tag) => toTagSlug(tag)).filter(Boolean)
                : typeof image.tags === 'string'
                ? image.tags.split(',').map((tag) => toTagSlug(tag)).filter(Boolean)
                : [];
            return {
                id: image.id || createId('image'),
                pageId: image.pageId,
                title: image.title || 'Untitled capture',
                description: image.description || '',
                src: image.src,
                tags,
                createdAt: typeof image.createdAt === 'number' ? image.createdAt : Date.now() + index,
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return {
        version: DATA_VERSION,
        pages: normalizedPages.sort((a, b) => (a.order || 0) - (b.order || 0)),
        images: normalizedImages,
    };
}

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

function mutateData(mutator) {
    const draft = cloneData(stateData);
    mutator(draft);
    const normalized = normalizeData(draft);
    stateData = normalized;
    saveData(stateData);
    renderAll();
}
function createId(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 10)}-${Date.now()}`;
}

function toPageSlug(value) {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'page';
}

function toTagSlug(value) {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function formatTagLabel(slug) {
    return slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getCurrentPageId(data) {
    const body = document.body;
    if (!body) {
        return null;
    }

    const key = body.dataset.page;
    if (key === 'dynamic') {
        const slug = getDynamicSlug();
        const page = getPageBySlug(data, slug);
        return page ? page.id : null;
    }
    if (key === 'admin') {
        return 'admin';
    }
    const page = getPageById(data, key);
    return page ? page.id : key;
}

function getPageById(data, id) {
    return data.pages.find((page) => page.id === id);
}

function getPageBySlug(data, slug) {
    if (!slug) {
        return null;
    }
    return data.pages.find((page) => page.slug === slug);
}

function getPageImages(data, pageId) {
    return data.images
        .filter((image) => image.pageId === pageId)
        .slice()
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function getDynamicSlug() {
    const body = document.body;
    if (body.dataset.dynamicSlug) {
        return body.dataset.dynamicSlug || null;
    }
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    body.dataset.dynamicSlug = slug || '';
    return slug;
}

function clearElement(element) {
    if (!element) {
        return;
    }
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function renderEmptyState(container, message) {
    if (!container) {
        return;
    }
    const placeholder = document.createElement('div');
    placeholder.className = 'empty-state';
    placeholder.textContent = message;
    container.append(placeholder);
}

function applyHeroImage(pageId, images) {
    const heroElement = document.querySelector(`[data-hero-image="${pageId}"]`);
    if (!heroElement) {
        return { heroImage: null, remaining: images };
    }

    if (!images.length) {
        heroElement.classList.add('is-empty');
        heroElement.style.backgroundImage = '';
        return { heroImage: null, remaining: images };
    }

    const [heroImage, ...rest] = images;
    heroElement.classList.remove('is-empty');
    heroElement.style.backgroundImage = `url('${heroImage.src}')`;
    return { heroImage, remaining: rest };
}
function renderYear() {
    const yearEl = document.querySelector('#year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

function renderNavigation(data) {
    const navContainer = document.querySelector('[data-nav]');
    if (!navContainer) {
        return;
    }

    const currentPageId = getCurrentPageId(data);
    clearElement(navContainer);

    data.pages
        .filter((page) => page.showInNav !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((page) => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.textContent = page.name;
            link.href = page.path || `${page.slug}.html`;
            if (page.id === currentPageId) {
                link.classList.add('is-active');
            }
            listItem.append(link);
            navContainer.append(listItem);
        });

    const adminListItem = document.createElement('li');
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.textContent = 'Dashboard';
    if (document.body.dataset.page === 'admin') {
        adminLink.classList.add('is-active');
    }
    adminListItem.append(adminLink);
    navContainer.append(adminListItem);

    setupNavToggle();
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
            const target = event.target;
            if (target && target.tagName === 'A') {
                navLinks.classList.remove('is-open');
            }
        });
    }
}
function renderHomePage(data) {
    const pageId = 'home';
    const images = getPageImages(data, pageId);
    const { remaining } = applyHeroImage(pageId, images);
    const grid = document.querySelector('[data-gallery="home"]');
    renderFeaturedCards(grid, remaining);
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
        imageWrapper.style.backgroundImage = `url('${image.src}')`;

        const body = document.createElement('div');
        body.className = 'card__body';

        const title = document.createElement('h3');
        title.textContent = image.title || 'Untitled capture';

        const description = document.createElement('p');
        description.textContent = image.description || 'Edit this description from the dashboard.';

        const link = document.createElement('a');
        link.className = 'card__link';
        link.href = 'portfolio.html';
        link.textContent = image.tags && image.tags.length ? `Explore ${formatTagLabel(image.tags[0])}` : 'View in portfolio';

        body.append(title, description, link);
        card.append(imageWrapper, body);
        container.append(card);
    });
}

function renderAboutPage(data) {
    const pageId = 'about';
    const page = getPageById(data, pageId);
    const images = getPageImages(data, pageId);
    const { remaining } = applyHeroImage(pageId, images);
    renderGenericGallery(pageId, page?.name || 'About', remaining);
}

function renderContactPage(data) {
    const pageId = 'contact';
    const page = getPageById(data, pageId);
    const images = getPageImages(data, pageId);
    const { remaining } = applyHeroImage(pageId, images);
    renderGenericGallery(pageId, page?.name || 'Contact', remaining);
}

function renderGenericGallery(pageId, pageName, images) {
    const containers = document.querySelectorAll(`[data-gallery="${pageId}"]`);
    if (!containers.length) {
        return;
    }

    containers.forEach((container) => {
        clearElement(container);
        if (!images.length) {
            renderEmptyState(container, `Add imagery to the ${pageName} category from the dashboard.`);
            return;
        }

        images.forEach((image) => {
            const figure = document.createElement('figure');
            figure.className = 'dynamic-gallery__item';

            const imgEl = document.createElement('img');
            imgEl.src = image.src;
            imgEl.alt = image.title || `${pageName} gallery image`;

            const caption = document.createElement('figcaption');
            caption.textContent = image.description || image.title || 'Visual story from the archive.';

            figure.append(imgEl, caption);
            container.append(figure);
        });
    });
}

function renderPortfolioPage(data) {
    const pageId = 'portfolio';
    const page = getPageById(data, pageId);
    const images = getPageImages(data, pageId);
    const { heroImage, remaining } = applyHeroImage(pageId, images);
    const galleryImages = heroImage ? [heroImage, ...remaining] : remaining;

    const filterContainer = document.querySelector('[data-filter-container]');
    const galleryContainer = document.querySelector('[data-gallery="portfolio"]');

    if (!filterContainer || !galleryContainer) {
        return;
    }

    const tags = new Set();
    galleryImages.forEach((image) => {
        if (Array.isArray(image.tags) && image.tags.length) {
            image.tags.forEach((tag) => tags.add(tag));
        }
    });

    if (!tags.size) {
        tags.add('highlights');
    }

    let currentFilter = 'all';

    function renderFilters() {
        clearElement(filterContainer);
        const allButton = createFilterButton('All', 'all', currentFilter === 'all');
        filterContainer.append(allButton);

        Array.from(tags)
            .sort()
            .forEach((tag) => {
                const button = createFilterButton(formatTagLabel(tag), tag, currentFilter === tag);
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
        if (!galleryImages.length) {
            renderEmptyState(galleryContainer, 'Upload portfolio imagery from the dashboard.');
            return;
        }

        galleryImages.forEach((image) => {
            const imageTags = Array.isArray(image.tags) ? image.tags : [];
            if (currentFilter !== 'all' && !imageTags.includes(currentFilter)) {
                return;
            }

            const figure = document.createElement('figure');
            figure.className = 'gallery-item';
            figure.dataset.category = imageTags.join(',');
            figure.dataset.lightbox = 'true';

            const imgEl = document.createElement('img');
            imgEl.src = image.src;
            imgEl.alt = image.title || `${page?.name || 'Portfolio'} image`;

            const caption = document.createElement('figcaption');
            caption.textContent = image.description || image.title || 'Portfolio capture';

            figure.append(imgEl, caption);
            galleryContainer.append(figure);
        });

        if (!galleryContainer.children.length) {
            renderEmptyState(
                galleryContainer,
                currentFilter === 'all'
                    ? 'Upload portfolio imagery from the dashboard.'
                    : `No imagery tagged “${formatTagLabel(currentFilter)}” yet.`
            );
        }
    }

    renderFilters();
    renderGallery();
    setupLightbox(galleryContainer);
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
function renderDynamicPage(data) {
    const slug = getDynamicSlug();
    const container = document.querySelector('[data-dynamic-page]');
    const titleEl = document.querySelector('[data-dynamic-title]');
    const eyebrowEl = document.querySelector('[data-dynamic-eyebrow]');
    const descriptionEl = document.querySelector('[data-dynamic-description]');
    const galleryTitleEl = document.querySelector('[data-dynamic-gallery-title]');
    const galleryDescriptionEl = document.querySelector('[data-dynamic-gallery-description]');

    if (!container) {
        return;
    }

    if (!slug) {
        if (titleEl) {
            titleEl.textContent = 'Page Not Found';
        }
        if (descriptionEl) {
            descriptionEl.textContent = 'Create a page from the dashboard or confirm the URL.';
        }
        const gallery = container.querySelector('[data-gallery]');
        if (gallery) {
            clearElement(gallery);
            renderEmptyState(gallery, 'No page selected. Add a page from the dashboard to begin.');
        }
        return;
    }

    const page = getPageBySlug(data, slug);
    if (!page) {
        if (titleEl) {
            titleEl.textContent = 'Page Not Found';
        }
        if (descriptionEl) {
            descriptionEl.textContent = 'The requested page could not be located. Check the navigation menu.';
        }
        const gallery = container.querySelector('[data-gallery]');
        if (gallery) {
            clearElement(gallery);
            renderEmptyState(gallery, 'Create a page from the dashboard to publish new stories.');
        }
        return;
    }

    document.title = `${page.name} | Mehdii El Marouazi`;
    document.body.dataset.dynamicSlug = page.slug;

    const heroEl = container.querySelector('[data-hero-image]');
    if (heroEl) {
        heroEl.dataset.heroImage = page.id;
    }
    container.querySelectorAll('[data-gallery]').forEach((gallery) => {
        gallery.dataset.gallery = page.id;
    });

    if (titleEl) {
        titleEl.textContent = page.name;
    }
    if (eyebrowEl) {
        eyebrowEl.textContent = page.eyebrow || 'Custom Page';
    }
    if (descriptionEl) {
        descriptionEl.textContent = page.description || 'Use the dashboard to add a description for this page.';
    }
    if (galleryTitleEl) {
        galleryTitleEl.textContent = `${page.name} Gallery`;
    }
    if (galleryDescriptionEl) {
        galleryDescriptionEl.textContent = 'Imagery assigned to this page appears in the curated grid below.';
    }

    const images = getPageImages(data, page.id);
    const { remaining } = applyHeroImage(page.id, images);
    renderGenericGallery(page.id, page.name, remaining);
}
function createAdminModule() {
    const elements = {};
    let initialized = false;

    function init() {
        if (initialized) {
            return;
        }
        initialized = true;

        elements.pageForm = document.querySelector('#page-form');
        elements.pageName = document.querySelector('#page-name');
        elements.pageDescription = document.querySelector('#page-description');
        elements.pageList = document.querySelector('#page-list');

        elements.imageForm = document.querySelector('#image-form');
        elements.imageId = document.querySelector('#image-id');
        elements.imageTitle = document.querySelector('#image-title');
        elements.imageDescription = document.querySelector('#image-description');
        elements.imageTags = document.querySelector('#image-tags');
        elements.imagePage = document.querySelector('#image-page');
        elements.imageFile = document.querySelector('#image-file');
        elements.imageFormHeading = document.querySelector('#image-form-heading');
        elements.cancelEdit = document.querySelector('#cancel-edit');
        elements.imageList = document.querySelector('#image-list');

        if (elements.imageFile) {
            elements.imageFile.required = true;
        }

        elements.pageForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = elements.pageName?.value.trim();
            const description = elements.pageDescription?.value.trim() || '';
            if (!name) {
                return;
            }
            addPage(name, description);
            elements.pageForm.reset();
        });

        elements.imageForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleImageSubmit();
        });

        elements.cancelEdit?.addEventListener('click', () => {
            resetImageForm();
        });
    }

    async function handleImageSubmit() {
        if (!elements.imageForm) {
            return;
        }
        const imageId = elements.imageId?.value.trim();
        const title = elements.imageTitle?.value.trim() || 'Untitled capture';
        const description = elements.imageDescription?.value.trim() || '';
        const tagsInput = elements.imageTags?.value || '';
        const tags = tagsInput
            .split(',')
            .map((tag) => toTagSlug(tag))
            .filter(Boolean);
        const pageId = elements.imagePage?.value;
        const file = elements.imageFile?.files?.[0] || null;

        if (!pageId) {
            return;
        }

        if (!imageId && !file) {
            elements.imageFile?.focus();
            return;
        }

        let dataUrl = null;
        if (file) {
            dataUrl = await readFileAsDataUrl(file);
        }

        if (imageId) {
            mutateData((draft) => {
                const image = draft.images.find((item) => item.id === imageId);
                if (!image) {
                    return;
                }
                image.title = title;
                image.description = description;
                image.pageId = pageId;
                image.tags = tags;
                if (dataUrl) {
                    image.src = dataUrl;
                }
            });
        } else {
            mutateData((draft) => {
                draft.images.push({
                    id: createId('image'),
                    pageId,
                    title,
                    description,
                    src: dataUrl || '',
                    tags,
                    createdAt: Date.now(),
                });
            });
        }

        resetImageForm();
    }

    function resetImageForm() {
        elements.imageForm?.reset();
        if (elements.imageId) {
            elements.imageId.value = '';
        }
        if (elements.imageFile) {
            elements.imageFile.value = '';
            elements.imageFile.required = true;
        }
        if (elements.imageFormHeading) {
            elements.imageFormHeading.textContent = 'Add Imagery';
        }
        if (elements.cancelEdit) {
            elements.cancelEdit.hidden = true;
        }
    }

    function startEditingImage(image) {
        if (!elements.imageForm) {
            return;
        }
        if (elements.imageId) {
            elements.imageId.value = image.id;
        }
        if (elements.imageTitle) {
            elements.imageTitle.value = image.title || '';
        }
        if (elements.imageDescription) {
            elements.imageDescription.value = image.description || '';
        }
        if (elements.imageTags) {
            elements.imageTags.value = (image.tags || []).map((tag) => formatTagLabel(tag)).join(', ');
        }
        if (elements.imagePage) {
            elements.imagePage.value = image.pageId;
        }
        if (elements.imageFile) {
            elements.imageFile.value = '';
            elements.imageFile.required = false;
        }
        if (elements.imageFormHeading) {
            elements.imageFormHeading.textContent = 'Edit Imagery';
        }
        if (elements.cancelEdit) {
            elements.cancelEdit.hidden = false;
        }
    }

    function populatePageSelect(data) {
        if (!elements.imagePage) {
            return;
        }
        const previousValue = elements.imagePage.value;
        clearElement(elements.imagePage);

        data.pages
            .filter((page) => page.id !== 'admin')
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach((page) => {
                const option = document.createElement('option');
                option.value = page.id;
                option.textContent = page.name;
                elements.imagePage.append(option);
            });

        if (previousValue && elements.imagePage.querySelector(`option[value="${previousValue}"]`)) {
            elements.imagePage.value = previousValue;
        }
    }

    function renderPageList(data) {
        if (!elements.pageList) {
            return;
        }
        clearElement(elements.pageList);

        data.pages
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach((page) => {
                const chip = document.createElement('div');
                chip.className = 'admin-page-chip';

                const meta = document.createElement('div');
                meta.className = 'admin-page-chip__meta';

                const title = document.createElement('strong');
                title.textContent = page.name;

                const slug = document.createElement('span');
                slug.textContent = page.type === 'custom' ? `Custom • ${page.slug}` : `Default • ${page.slug}`;

                meta.append(title, slug);
                chip.append(meta);

                if (page.type === 'custom') {
                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.className = 'admin-card__button admin-card__button--danger';
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', () => {
                        if (window.confirm('Delete this page and all of its imagery?')) {
                            deletePage(page.id);
                        }
                    });
                    chip.append(deleteButton);
                }

                elements.pageList.append(chip);
            });
    }

    function renderImageList(data) {
        if (!elements.imageList) {
            return;
        }
        clearElement(elements.imageList);

        if (!data.images.length) {
            renderEmptyState(elements.imageList, 'Upload imagery to build your library.');
            return;
        }

        data.images.forEach((image) => {
            const card = document.createElement('article');
            card.className = 'admin-card';

            const preview = document.createElement('div');
            preview.className = 'admin-card__preview';
            preview.style.backgroundImage = `url('${image.src}')`;

            const content = document.createElement('div');
            content.className = 'admin-card__content';

            const title = document.createElement('h3');
            title.textContent = image.title || 'Untitled capture';

            const pageMeta = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = 'Page: ';
            pageMeta.append(strong, document.createTextNode(getPageById(data, image.pageId)?.name || 'Unknown page'));

            const description = document.createElement('p');
            description.textContent = image.description || 'No description yet.';

            content.append(title, pageMeta, description);

            if (image.tags && image.tags.length) {
                const tagsRow = document.createElement('div');
                tagsRow.className = 'admin-card__tags';
                image.tags.forEach((tag) => {
                    const tagEl = document.createElement('span');
                    tagEl.textContent = formatTagLabel(tag);
                    tagsRow.append(tagEl);
                });
                content.append(tagsRow);
            }

            const actions = document.createElement('div');
            actions.className = 'admin-card__actions';

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'admin-card__button';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                startEditingImage(image);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'admin-card__button admin-card__button--danger';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                if (window.confirm('Delete this image?')) {
                    deleteImage(image.id);
                }
            });

            actions.append(editButton, deleteButton);
            content.append(actions);

            card.append(preview, content);
            elements.imageList.append(card);
        });
    }

    function addPage(name, description) {
        mutateData((draft) => {
            const baseSlug = toPageSlug(name);
            let slug = baseSlug;
            let attempt = 1;
            while (draft.pages.some((page) => page.slug === slug)) {
                slug = `${baseSlug}-${attempt++}`;
            }
            const maxOrder = draft.pages.reduce((acc, page) => (typeof page.order === 'number' ? Math.max(acc, page.order) : acc), 0);
            draft.pages.push({
                id: createId('page'),
                name,
                slug,
                description,
                type: 'custom',
                showInNav: true,
                order: maxOrder + 1,
                path: `page.html?slug=${encodeURIComponent(slug)}`,
            });
        });
    }

    function deletePage(pageId) {
        mutateData((draft) => {
            draft.pages = draft.pages.filter((page) => page.id !== pageId);
            draft.images = draft.images.filter((image) => image.pageId !== pageId);
        });
        if (elements.imagePage && elements.imagePage.value === pageId) {
            resetImageForm();
        }
    }

    function deleteImage(imageId) {
        mutateData((draft) => {
            draft.images = draft.images.filter((image) => image.id !== imageId);
        });
    }

    function render(data) {
        if (!initialized) {
            return;
        }
        populatePageSelect(data);
        renderPageList(data);
        renderImageList(data);
    }

    return { init, render };
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
