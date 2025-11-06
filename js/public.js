import { supabase } from './supabase.js';

const CANONICAL_PAGES = ['home', 'about', 'portfolio', 'contact'];
const CATEGORY_MAP = {
    home: 'Home',
    about: 'About',
    portfolio: 'Portfolio',
    contact: 'Contact',
};

const escapeHtml = (value = '') =>
    value
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const safeUrl = (value) => {
    if (!value) return null;
    try {
        const base = window.location.origin === 'null' ? window.location.href : window.location.origin;
        const url = new URL(value, base);
        if (['http:', 'https:', 'data:'].includes(url.protocol)) {
            return url.href;
        }
    } catch (error) {
        console.warn('Invalid URL', value, error);
    }
    return null;
};

const getActiveSlug = () => {
    const path = window.location.pathname.replace(/^\//, '');
    if (!path || path.endsWith('/') || path === 'index.html') return 'home';
    if (path.includes('about')) return 'about';
    if (path.includes('portfolio')) return 'portfolio';
    if (path.includes('contact')) return 'contact';
    return 'home';
};

const orderImagesQuery = (query) =>
    query
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

const parseCtaTag = (tags = []) => {
    const ctaTag = tags.find((tag) => tag.startsWith('cta:'));
    if (!ctaTag) {
        return null;
    }
    const [, payload] = ctaTag.split(':');
    if (!payload) return null;
    const [label, href] = payload.split('|');
    return {
        label: label?.trim() || 'View series',
        href: href?.trim() || '#',
    };
};

const renderNavigation = async (activeSlug) => {
    const navList = document.querySelector('.nav__links');
    if (!navList) return;

    const { data, error } = await supabase
        .from('pages')
        .select('slug, title, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to load navigation', error);
        return;
    }

    const pages = (data || []).filter((page) => CANONICAL_PAGES.includes(page.slug));

    if (!pages.length) {
        navList.innerHTML = CANONICAL_PAGES.map((slug) => {
            const href = slug === 'home' ? 'index.html' : `${slug}.html`;
            const isActive = slug === activeSlug;
            return `<li><a href="${href}" class="${isActive ? 'is-active' : ''}">${CATEGORY_MAP[slug]}</a></li>`;
        }).join('');
        return;
    }

    navList.innerHTML = pages
        .map((page) => {
            const slug = page.slug;
            const href = slug === 'home' ? 'index.html' : `${slug}.html`;
            const isActive = slug === activeSlug;
            const title = escapeHtml(page.title || CATEGORY_MAP[slug] || 'Page');
            return `<li><a href="${href}" class="${isActive ? 'is-active' : ''}">${title}</a></li>`;
        })
        .join('');
};

const renderHome = async (settings) => {
    const heroImage = document.querySelector('.hero__image');
    const heroEyebrow = document.querySelector('.hero__eyebrow');
    const heroTitle = document.querySelector('.hero h1');
    const heroTagline = document.querySelector('.hero__tagline');

    if (heroImage) {
        const heroUrl = safeUrl(settings?.hero_image_url);
        if (heroUrl) {
            heroImage.style.backgroundImage = `url('${heroUrl}')`;
        }
    }

    if (heroEyebrow) heroEyebrow.textContent = settings?.hero_eyebrow || 'Artistic Photographer';
    if (heroTitle) heroTitle.textContent = settings?.hero_title || 'Aria Lumen';
    if (heroTagline) heroTagline.textContent = settings?.hero_subtitle || 'Capturing ethereal narratives through light, shadow, and memory.';

    const introTitle = document.querySelector('.intro__text h2');
    const introBody = document.querySelector('.intro__text p');
    if (introTitle) introTitle.textContent = settings?.home_intro_title || 'Fragments of Light';
    if (introBody) introBody.textContent = settings?.home_intro_body ||
        'Welcome to an immersive exploration of visual storytelling where each frame is crafted to hold a whisper of wonder.';

    const statsContainer = document.querySelector('.intro__stats');
    if (statsContainer) {
        const stats = Array.isArray(settings?.home_stats) && settings.home_stats.length
            ? settings.home_stats
            : [
                  { number: '12+', label: 'Years creating imagery' },
                  { number: '80+', label: 'Exhibitions & showcases' },
                  { number: '30', label: 'Awards received' },
              ];
        statsContainer.innerHTML = stats
            .map(
                (stat) => `
                <div>
                    <span class="stat__number">${escapeHtml(stat.number)}</span>
                    <span class="stat__label">${escapeHtml(stat.label)}</span>
                </div>
            `,
            )
            .join('');
    }

    const featuredHeading = document.querySelector('.featured .section-heading h2');
    const featuredDescription = document.querySelector('.featured .section-heading p');
    if (featuredHeading) featuredHeading.textContent = settings?.home_featured_title || 'Featured Series';
    if (featuredDescription) featuredDescription.textContent =
        settings?.home_featured_description ||
        'A selection of ongoing photographic explorations across portraiture, landscape, and abstract visual poetry.';

    const grid = document.querySelector('.featured__grid');
    if (!grid) return;

    let query = supabase.from('images').select('id, title, caption, url, tags, sort_order').eq('page_slug', 'home');
    query = orderImagesQuery(query);
    const { data: images, error } = await query;

    if (error) {
        console.error('Failed to load home images', error);
        return;
    }

    const cards = (images || []).filter((image) => safeUrl(image.url)).slice(0, 3);
    if (!cards.length) return;

    grid.innerHTML = cards
        .map((image) => {
            const imageUrl = safeUrl(image.url);
            const title = escapeHtml(image.title || 'Series');
            const caption = escapeHtml(image.caption || 'Add a description in Supabase.');
            const cta = parseCtaTag(image.tags || []);
            const linkHref = cta?.href || 'portfolio.html';
            const linkLabel = escapeHtml(cta?.label || 'View series');
            return `
                <article class="card">
                    <div class="card__image" style="background-image: url('${imageUrl}')"></div>
                    <div class="card__body">
                        <h3>${title}</h3>
                        <p>${caption}</p>
                        <a href="${linkHref}" class="card__link">${linkLabel}</a>
                    </div>
                </article>
            `;
        })
        .join('');
};

const renderAbout = async (settings) => {
    const heroImageEl = document.querySelector('.about-hero__image img');
    const heroTitleEl = document.querySelector('.about-hero__content h1');
    const heroBodyEl = document.querySelector('.about-hero__content p');

    let query = supabase.from('images').select('title, url').eq('page_slug', 'about').limit(1);
    query = orderImagesQuery(query);
    const { data: images, error } = await query;
    if (error) {
        console.error('Failed to load about portrait', error);
    }

    const portrait = images?.find((image) => safeUrl(image.url));
    if (heroImageEl && portrait) {
        heroImageEl.src = safeUrl(portrait.url);
        heroImageEl.alt = portrait.title ? `${portrait.title}` : 'Portrait of Aria Lumen';
    }

    if (heroTitleEl) heroTitleEl.textContent = settings?.about_hero_title || 'The Artist Behind the Lens';
    if (heroBodyEl) heroBodyEl.textContent = settings?.about_hero_body ||
        'Aria Lumen is an experiential photographer whose work explores the liminal spaces between reality and dreamscape.';

    const defaultBackground = [
        'Raised among the northern lights, Aria developed a fascination with light play that transformed into a lifelong photographic journey.',
        'She studied visual arts at the Institute of Modern Imagery and has collaborated with galleries across the globe.',
    ];
    const backgroundParagraphs = [settings?.about_background, settings?.about_background_more].filter(Boolean);
    const backgroundColumn = document.querySelector('.about-details__column:nth-child(1)');
    if (backgroundColumn) {
        const copy = backgroundParagraphs.length ? backgroundParagraphs : defaultBackground;
        backgroundColumn.innerHTML = `<h2>Background</h2>${copy
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join('')}`;
    }

    const defaultExperience = [
        'Over the past decade, Aria has worked with cultural institutions, editorial magazines, and independent creatives to craft evocative visual narratives.',
        'Her process blends analog techniques with contemporary experimentation, inviting viewers to dwell in the spaces between emotion and memory.',
    ];
    const experienceParagraphs = [settings?.about_experience, settings?.about_experience_more].filter(Boolean);
    const experienceColumn = document.querySelector('.about-details__column:nth-child(2)');
    if (experienceColumn) {
        const copy = experienceParagraphs.length ? experienceParagraphs : defaultExperience;
        experienceColumn.innerHTML = `<h2>Experience</h2>${copy
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join('')}`;
    }

    const awardsList = document.querySelector('.about-awards ul');
    if (awardsList) {
        const awards = Array.isArray(settings?.about_awards) && settings.about_awards.length
            ? settings.about_awards
            : [
                  '2023 — Lumina International Photography Grand Prize',
                  '2022 — "Echoes of Light" solo exhibition at Prism Gallery, Berlin',
                  '2021 — Featured artist, Aurora Contemporary Arts Festival',
                  '2020 — "Silent City" series, Urban Visions Showcase, New York',
              ];
        awardsList.innerHTML = awards.map((award) => `<li>${escapeHtml(award)}</li>`).join('');
    }
};

const buildPortfolioFigure = (image, anchorMap) => {
    const imageUrl = safeUrl(image.url);
    if (!imageUrl) return '';
    const category = (image.tags || []).find((tag) => ['portrait', 'landscape', 'abstract'].includes(tag)) || 'portrait';
    const caption = escapeHtml(image.caption || image.title || 'Untitled image');
    const title = escapeHtml(image.title || 'Portfolio image');
    const id = anchorMap.has(category) ? '' : ` id="${category}"`;
    anchorMap.add(category);
    const tagList = (image.tags || []).filter((tag) => !['portrait', 'landscape', 'abstract'].includes(tag));
    const tagAttr = tagList.join(',');

    return `
        <figure class="gallery-item" data-category="${category}" data-tags="${escapeHtml(tagAttr)}"${id}>
            <img src="${imageUrl}" alt="${title}" />
            <figcaption>${caption}</figcaption>
        </figure>
    `;
};

const renderPortfolio = async (settings) => {
    const heroTitle = document.querySelector('.portfolio-hero h1');
    const heroBody = document.querySelector('.portfolio-hero p');
    if (heroTitle) heroTitle.textContent = 'Portfolio';
    if (heroBody) heroBody.textContent = settings?.portfolio_intro || 'Curated collections across portrait, landscape, and abstract studies.';

    const gallery = document.querySelector('.portfolio-gallery');
    if (!gallery) return;

    let query = supabase
        .from('images')
        .select('id, title, caption, url, tags, sort_order')
        .eq('page_slug', 'portfolio');
    query = orderImagesQuery(query);
    const { data: images, error } = await query;

    if (error) {
        console.error('Failed to load portfolio images', error);
        return;
    }

    if (!images || !images.length) {
        gallery.innerHTML = '<p class="gallery-status">Add portfolio images in Supabase to populate this grid.</p>';
        document.dispatchEvent(new CustomEvent('portfolio:rendered', { detail: { tags: [] } }));
        return;
    }

    const anchorMap = new Set();
    const html = images.map((image) => buildPortfolioFigure(image, anchorMap)).join('');
    gallery.innerHTML = html;

    const tagSet = new Set();
    images.forEach((image) => {
        (image.tags || []).forEach((tag) => {
            if (!['portrait', 'landscape', 'abstract'].includes(tag)) {
                tagSet.add(tag);
            }
        });
    });

    document.dispatchEvent(new CustomEvent('portfolio:rendered', { detail: { tags: Array.from(tagSet) } }));
};

const SOCIAL_ICONS = {
    instagram: `
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm11 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z" />
        </svg>
    `,
    linkedin: `
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M4.5 3A1.5 1.5 0 1 1 3 4.5 1.5 1.5 0 0 1 4.5 3zM3 8h3v13H3zm6 0h3v1.9h.1a3.3 3.3 0 0 1 3-1.6c3.2 0 3.9 2.1 3.9 4.7V21h-3v-6.3c0-1.5 0-3.4-2.1-3.4s-2.4 1.7-2.4 3.3V21H9z" />
        </svg>
    `,
    behance: `
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M4 7h4.4c2.6 0 4.1 1.3 4.1 3.3 0 1.4-.8 2.4-1.9 2.8 1.5.4 2.4 1.6 2.4 3.2 0 2.3-1.6 3.7-4.5 3.7H4zm3 3v2h1.7c1 0 1.6-.4 1.6-1s-.6-1-1.6-1zm0 4v2.3h2c1.1 0 1.8-.5 1.8-1.2s-.6-1.1-1.8-1.1zm10.6-5.5c2.4 0 3.5 1.6 3.6 3.4h-5.6c.1 1.2.9 2 2.3 2 .9 0 1.6-.3 2.2-1l1.7 1.2c-.8 1.2-2.1 2-3.9 2-3 0-4.7-2-4.7-4.5 0-2.6 1.6-4.6 4.4-4.6zm1.7 2.6c-.2-.9-.8-1.4-1.7-1.4-.9 0-1.5.5-1.7 1.4zM14 7h5v1.5h-5z" />
        </svg>
    `,
};

const getSocialIcon = (label = '') => {
    const key = label.toLowerCase();
    if (key.includes('instagram')) return SOCIAL_ICONS.instagram;
    if (key.includes('linkedin')) return SOCIAL_ICONS.linkedin;
    if (key.includes('behance')) return SOCIAL_ICONS.behance;
    return `
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 5c-1.7 0-3 .7-3 2.4V19h2v-3.6c0-.7.4-1.4 1-1.4s1 .7 1 1.4V19h2v-3.6c0-1.7-1.3-2.4-3-2.4z" />
        </svg>
    `;
};

const renderContact = async (settings) => {
    const heroBody = document.querySelector('.contact-hero p');
    if (heroBody) heroBody.textContent = settings?.contact_intro || 'For collaborations, commissions, or exhibition inquiries, please reach out via the form below.';

    const directBlock = document.querySelector('.contact-details__block');
    if (directBlock) {
        directBlock.innerHTML = `
            <h2>Direct</h2>
            <p>Email: <a href="mailto:${escapeHtml(settings?.contact_email || 'hello@arialumen.com')}">${escapeHtml(settings?.contact_email || 'hello@arialumen.com')}</a></p>
            <p>Phone: <a href="tel:${escapeHtml(settings?.contact_phone || '+1234567890')}">${escapeHtml(settings?.contact_phone || '+1 (234) 567-890')}</a></p>
            <p>${escapeHtml(settings?.contact_studio || '123 Aurora Lane, Suite 5, Lumen City, Wonderland 00000')}</p>
        `;
    }

    const socialList = document.querySelector('.social-links');
    if (socialList) {
        const { data: links, error } = await supabase
            .from('social_links')
            .select('label, url')
            .order('label', { ascending: true });
        if (error) {
            console.error('Failed to load social links', error);
            return;
        }
        const items = (links || []).map((link) => {
            const href = safeUrl(link.url) || '#';
            const label = escapeHtml(link.label || 'Social');
            return `
                <li>
                    <a href="${href}" target="_blank" rel="noreferrer">
                        ${getSocialIcon(link.label)}
                        ${label}
                    </a>
                </li>
            `;
        });
        socialList.innerHTML = items.join('');
    }
};

const fetchSiteSettings = async () => {
    const { data, error } = await supabase
        .from('site_settings')
        .select(
            `hero_title, hero_subtitle, hero_image_url, hero_eyebrow,
             home_intro_title, home_intro_body, home_stats, home_featured_title, home_featured_description,
             about_hero_title, about_hero_body, about_background, about_background_more,
             about_experience, about_experience_more, about_awards,
             portfolio_intro,
             contact_intro, contact_email, contact_phone, contact_studio`
        )
        .limit(1)
        .maybeSingle();
    if (error) {
        console.error('Failed to load site settings', error);
    }
    return data || {};
};

export const initPublicSite = async () => {
    const activeSlug = getActiveSlug();
    await renderNavigation(activeSlug);

    const settings = await fetchSiteSettings();

    if (activeSlug === 'home') {
        await renderHome(settings);
    } else if (activeSlug === 'about') {
        await renderAbout(settings);
    } else if (activeSlug === 'portfolio') {
        await renderPortfolio(settings);
    } else if (activeSlug === 'contact') {
        await renderContact(settings);
    }

    document.dispatchEvent(new CustomEvent('public:ready'));
};
