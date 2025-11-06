import { supabase } from './supabase.js';

const CANONICAL_PAGES = ['home', 'about', 'portfolio', 'contact'];
const CATEGORY_LABELS = {
    home: 'Home',
    about: 'About',
    portfolio: 'Portfolio',
    contact: 'Contact',
};

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULTS = {
    heroImage: 'https://cdn2.dumpor.io/a/5bf153f7-dc81-4647-b3f4-32ff0c11c773.jpg',
    heroEyebrow: 'Creative Photography',
    heroTitle: 'Mehdii El Marouazi',
    heroSubtitle:
        'Moroccan photographer capturing luminous stories of Marrakech, lifestyle, and culture for the Royal Moroccan Lens community.',
    homeIntroTitle: 'Royal Moroccan Lens',
    homeIntroBody:
        'Founder and lead creative behind <span class="highlight">@royalmoroccanlens</span>, Mehdii El Marouazi crafts saturated, cinematic imagery that celebrates Morocco’s architecture, hospitality, and vibrant street life. His feed blends refined styling with candid emotion, inviting audiences into the pulse of Marrakech.',
    homeStats: [
        { number: '12.7k', label: 'Instagram followers engaged' },
        { number: '337', label: 'Published stories and posts' },
        { number: 'Marrakech', label: 'Home base & booking hub' },
    ],
    homeFeaturedTitle: 'Featured Focus',
    homeFeaturedDescription:
        'Curations inspired by Mehdii’s Instagram storytelling—from intimate Marrakech portraits to the polished brand experiences crafted under the Royal Moroccan Lens studio.',
    homeCards: [
        {
            title: 'Marrakech Portraits',
            caption: 'Editorial portraits with bold color contrast, translating the city’s energy into cinematic frames.',
            url: 'image/index/1.jpg',
            ctaLabel: 'Explore portrait stories',
            ctaHref: 'portfolio.html#portraits',
        },
        {
            title: 'Royal Moroccan Lens',
            caption: 'Signature commissions and hospitality narratives produced for the Royal Moroccan Lens collective.',
            url: 'image/index/2.jpg',
            ctaLabel: 'View studio highlights',
            ctaHref: 'portfolio.html#royalmoroccanlens',
        },
        {
            title: 'Creative Collaborations',
            caption: 'Cross-genre shoots with local creatives, designers, and cultural tastemakers across Morocco.',
            url: 'image/index/3.jpg',
            ctaLabel: 'See collaborative work',
            ctaHref: 'portfolio.html#collaborations',
        },
    ],
    aboutHeroTitle: 'The Vision Behind Royal Moroccan Lens',
    aboutHeroBody:
        'Mehdii El Marouazi is a Marrakech-based photographer and founder of <span class="highlight">@royalmoroccanlens</span>. His creative photography pairs saturated color palettes with refined styling to document Morocco’s modern culture, luxury spaces, and vibrant street life.',
    aboutImage: 'image/about/hero.png',
    aboutBackground:
        'Rooted in Marrakech, Mehdii’s eye is shaped by the city’s interplay of texture, pattern, and warm evening light. He built Royal Moroccan Lens as a platform to showcase Moroccan hospitality, architecture, and lifestyle through cinematic stills.',
    aboutBackgroundMore:
        'The Instagram community he leads has grown to over 12.7k followers and 337 published stories, reflecting a sustained dialogue with locals, travelers, and global collaborators who are drawn to Morocco’s spirit.',
    aboutExperience:
        'Mehdii collaborates with boutique hotels, designers, and cultural tastemakers to create polished campaigns that retain the authenticity of Marrakech. Each commission is approached as a story in motion, with bookings coordinated directly via Instagram DM to maintain a personal connection.',
    aboutExperienceMore:
        'The Royal Moroccan Lens workflow leans into natural light, unexpected angles, and saturated chromatic palettes to evoke the mood of each location—from rooftop gatherings to intimate portrait sessions.',
    aboutAwards: [
        '2024 — Founder and lead photographer of the Royal Moroccan Lens studio collective.',
        '2024 — 12.7k+ followers engaging with Marrakech storytelling on Instagram.',
        '2023 — Surpassed 337 published posts chronicling Morocco’s creative culture.',
        'Ongoing — Direct booking pipeline via Instagram DM for bespoke shoots in Marrakech.',
    ],
    portfolioIntro:
        'Curated sets echoing the Instagram presence of <span class="highlight">@mehdii_el_marouazi</span>—creative portraits, Royal Moroccan Lens commissions, and cross-genre collaborations shaped in Marrakech.',
    portfolioImages: [
        {
            category: 'portraits',
            url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
            alt: 'Creative portrait from Marrakech session',
            caption: 'Marrakech Portraits — Luminous dusk session',
            tags: ['portraits', 'marrakech', 'dusk'],
        },
        {
            category: 'portraits',
            url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
            alt: 'Editorial portrait with saturated color palette',
            caption: 'Marrakech Portraits — Editorial palette study',
            tags: ['portraits', 'editorial', 'color'],
        },
        {
            category: 'portraits',
            url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80',
            alt: 'Street portrait captured in Marrakech',
            caption: 'Marrakech Portraits — Medina street light',
            tags: ['portraits', 'street', 'medina'],
        },
        {
            category: 'royalmoroccanlens',
            url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
            alt: 'Royal Moroccan Lens hospitality showcase',
            caption: 'Royal Moroccan Lens — Riad hospitality story',
            tags: ['royalmoroccanlens', 'hospitality', 'riad'],
        },
        {
            category: 'royalmoroccanlens',
            url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            alt: 'Detail from Royal Moroccan Lens commission',
            caption: 'Royal Moroccan Lens — Architectural detail',
            tags: ['royalmoroccanlens', 'architecture', 'detail'],
        },
        {
            category: 'royalmoroccanlens',
            url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
            alt: 'Lifestyle vignette styled by Royal Moroccan Lens',
            caption: 'Royal Moroccan Lens — Lifestyle vignette',
            tags: ['royalmoroccanlens', 'lifestyle'],
        },
        {
            category: 'collaborations',
            url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
            alt: 'Collaboration with Moroccan designer',
            caption: 'Creative Collaborations — Designer spotlight',
            tags: ['collaborations', 'designer'],
        },
        {
            category: 'collaborations',
            url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
            alt: 'Editorial collaboration for cultural tastemaker',
            caption: 'Creative Collaborations — Editorial story',
            tags: ['collaborations', 'editorial'],
        },
        {
            category: 'collaborations',
            url: 'https://images.unsplash.com/photo-1529338296731-c4280a079ffa?auto=format&fit=crop&w=1200&q=80',
            alt: 'Partnership shoot featuring Marrakech musician',
            caption: 'Creative Collaborations — Music & lifestyle',
            tags: ['collaborations', 'music'],
        },
    ],
    contactIntro:
        'Share project details below or reach out directly via Instagram DM—the primary booking channel highlighted on <a href="https://www.instagram.com/mehdii_el_marouazi/" target="_blank" rel="noreferrer">@mehdii_el_marouazi</a>.',
    contactEmail: 'Marouazi10@gmail.com',
    contactPhone: '+212 600-000000',
    contactStudio: 'Studio: Marrakech, Morocco — available for travel upon request.',
};

const SOCIAL_FALLBACKS = [
    { label: 'Instagram', url: 'https://www.instagram.com/mehdii_el_marouazi/' },
    { label: 'LinkedIn', url: '#' },
    { label: 'Behance', url: '#' },
];

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
        const base = window?.location?.origin && window.location.origin !== 'null' ? window.location.origin : undefined;
        const url = base ? new URL(value, base) : new URL(value);
        if (['http:', 'https:'].includes(url.protocol)) {
            return url.href;
        }
        if (!url.protocol && value.startsWith('/')) {
            return value;
        }
    } catch (error) {
        console.warn('Invalid URL skipped', value, error);
    }
    return null;
};

const getActiveSlug = () => {
    const path = window.location.pathname.replace(/^\//, '');
    if (!path || path === 'index.html' || path === '') return 'home';
    if (path.includes('about')) return 'about';
    if (path.includes('portfolio')) return 'portfolio';
    if (path.includes('contact')) return 'contact';
    return 'home';
};

const parseJson = (value, fallback) => {
    if (!value) return fallback;
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};

const orderImagesQuery = (query) =>
    query.order('sort_order', { ascending: true, nullsFirst: true }).order('created_at', { ascending: true });

const parseTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags.filter((tag) => typeof tag === 'string' && tag.trim().length).map((tag) => tag.trim());
};

const splitTags = (tags) => {
    const parsed = parseTags(tags);
    const result = { tags: [], categories: [] };
    parsed.forEach((tag) => {
        if (tag.startsWith('category:')) {
            result.categories.push(tag.replace('category:', '').trim());
        } else {
            result.tags.push(tag);
        }
    });
    return result;
};

const parseCtaTag = (tags = []) => {
    const parsed = parseTags(tags);
    const ctaTag = parsed.find((tag) => tag.startsWith('cta:'));
    if (!ctaTag) return null;
    const [, payload] = ctaTag.split(':');
    if (!payload) return null;
    const [label, href] = payload.split('|');
    return {
        label: (label || '').trim() || 'View series',
        href: (href || '#').trim() || '#',
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
    }

    const pages = Array.isArray(data) && data.length ? data.filter((page) => CANONICAL_PAGES.includes(page.slug)) : CANONICAL_PAGES.map((slug) => ({ slug, title: CATEGORY_LABELS[slug] }));

    const navHtml = pages
        .map((page) => {
            const slug = page.slug;
            const href = slug === 'home' ? 'index.html' : `${slug}.html`;
            const title = escapeHtml(page.title || CATEGORY_LABELS[slug] || slug);
            const isActive = slug === activeSlug;
            return `<li><a href="${href}" class="${isActive ? 'is-active' : ''}">${title}</a></li>`;
        })
        .join('');

    navList.innerHTML = navHtml;
};

const renderHome = async (settings) => {
    const heroImage = document.querySelector('.hero__image');
    const heroEyebrow = document.querySelector('.hero__eyebrow');
    const heroTitle = document.querySelector('.hero h1');
    const heroTagline = document.querySelector('.hero__tagline');

    if (heroImage) {
        const heroUrl = safeUrl(settings?.hero_image_url) || DEFAULTS.heroImage;
        heroImage.style.backgroundImage = `url('${heroUrl}')`;
    }
    if (heroEyebrow) heroEyebrow.textContent = settings?.hero_eyebrow || DEFAULTS.heroEyebrow;
    if (heroTitle) heroTitle.textContent = settings?.hero_title || DEFAULTS.heroTitle;
    if (heroTagline) heroTagline.textContent = settings?.hero_subtitle || DEFAULTS.heroSubtitle;

    const introTitle = document.querySelector('.intro__text h2');
    const introBody = document.querySelector('.intro__text p');
    if (introTitle) introTitle.textContent = settings?.home_intro_title || DEFAULTS.homeIntroTitle;
    if (introBody) introBody.innerHTML = settings?.home_intro_body || DEFAULTS.homeIntroBody;

    const statsContainer = document.querySelector('.intro__stats');
    if (statsContainer) {
        const stats = parseJson(settings?.home_stats, DEFAULTS.homeStats);
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
    if (featuredHeading) featuredHeading.textContent = settings?.home_featured_title || DEFAULTS.homeFeaturedTitle;
    if (featuredDescription) featuredDescription.textContent = settings?.home_featured_description || DEFAULTS.homeFeaturedDescription;

    const grid = document.querySelector('.featured__grid');
    if (!grid) return;

    let query = supabase
        .from('images')
        .select('id, title, caption, url, tags, sort_order, active, source_type')
        .eq('page_slug', 'home')
        .eq('active', true);

    query = orderImagesQuery(query);

    let cards = DEFAULTS.homeCards;
    const { data, error } = await query;
    if (error) {
        console.error('Failed to load home cards', error);
    } else if (Array.isArray(data) && data.length) {
        cards = data.map((item, index) => {
            const fallback = DEFAULTS.homeCards[index] || DEFAULTS.homeCards[0];
            const cta = parseCtaTag(item.tags);
            return {
                title: item.title || fallback.title,
                caption: item.caption || fallback.caption,
                url: safeUrl(item.url) || fallback.url,
                ctaLabel: cta?.label || fallback.ctaLabel,
                ctaHref: cta?.href || fallback.ctaHref,
            };
        });
    }

    grid.innerHTML = cards
        .map(
            (card) => `
            <article class="card">
                <div class="card__image" style="background-image: url('${escapeHtml(card.url)}');"></div>
                <div class="card__body">
                    <h3>${escapeHtml(card.title)}</h3>
                    <p>${escapeHtml(card.caption)}</p>
                    <a href="${escapeHtml(card.ctaHref)}" class="card__link">${escapeHtml(card.ctaLabel)}</a>
                </div>
            </article>
        `,
        )
        .join('');
};

const renderAbout = async (settings) => {
    const heroTitle = document.querySelector('.about-hero__content h1');
    const heroBody = document.querySelector('.about-hero__content p');
    const heroImage = document.querySelector('.about-hero__image img');
    const backgroundEls = document.querySelectorAll('.about-details__column:nth-child(1) p');
    const experienceEls = document.querySelectorAll('.about-details__column:nth-child(2) p');
    const awardsList = document.querySelector('.about-awards ul');

    if (heroTitle) heroTitle.textContent = settings?.about_hero_title || DEFAULTS.aboutHeroTitle;
    if (heroBody) heroBody.innerHTML = settings?.about_hero_body || DEFAULTS.aboutHeroBody;

    let aboutImageUrl = DEFAULTS.aboutImage;
    let query = supabase
        .from('images')
        .select('url, caption, active, sort_order')
        .eq('page_slug', 'about')
        .eq('active', true);
    query = orderImagesQuery(query);
    const { data, error } = await query;
    if (error) {
        console.error('Failed to load about image', error);
    } else if (Array.isArray(data) && data.length) {
        const record = data[0];
        aboutImageUrl = safeUrl(record.url) || DEFAULTS.aboutImage;
        if (heroImage) heroImage.alt = record.caption || 'Portrait of Mehdii El Marouazi';
    }

    if (heroImage) {
        heroImage.src = aboutImageUrl;
    }

    if (backgroundEls.length) {
        if (backgroundEls[0]) backgroundEls[0].textContent = settings?.about_background || DEFAULTS.aboutBackground;
        if (backgroundEls[1]) backgroundEls[1].textContent = settings?.about_background_more || DEFAULTS.aboutBackgroundMore;
    }

    if (experienceEls.length) {
        if (experienceEls[0]) experienceEls[0].textContent = settings?.about_experience || DEFAULTS.aboutExperience;
        if (experienceEls[1]) experienceEls[1].textContent = settings?.about_experience_more || DEFAULTS.aboutExperienceMore;
    }

    if (awardsList) {
        const awards = parseJson(settings?.about_awards, DEFAULTS.aboutAwards);
        awardsList.innerHTML = awards.map((award) => `<li>${escapeHtml(award)}</li>`).join('');
    }
};

const renderPortfolio = async (settings) => {
    const heroParagraph = document.querySelector('.portfolio-hero p');
    if (heroParagraph) heroParagraph.innerHTML = settings?.portfolio_intro || DEFAULTS.portfolioIntro;

    const gallery = document.querySelector('.portfolio-gallery');
    if (!gallery) return;

    let query = supabase
        .from('images')
        .select('id, title, caption, url, tags, sort_order, active')
        .eq('page_slug', 'portfolio')
        .eq('active', true);
    query = orderImagesQuery(query);

    let images = DEFAULTS.portfolioImages;
    const { data, error } = await query;
    if (error) {
        console.error('Failed to load portfolio images', error);
    } else if (Array.isArray(data) && data.length) {
        images = data.map((item, index) => {
            const fallback = DEFAULTS.portfolioImages[index] || DEFAULTS.portfolioImages[0];
            const { categories, tags } = splitTags(item.tags);
            const category = categories[0] || 'portraits';
            return {
                category,
                url: safeUrl(item.url) || fallback.url,
                alt: item.title || fallback.alt,
                caption: item.caption || fallback.caption,
                tags,
            };
        });
    }

    const seenCategories = new Set();
    const tagSet = new Set();

    gallery.innerHTML = images
        .map((image) => {
            const category = image.category || 'portraits';
            const isFirst = !seenCategories.has(category);
            if (isFirst) {
                seenCategories.add(category);
            }
            const tags = Array.isArray(image.tags) ? image.tags.filter(Boolean) : [];
            tags.forEach((tag) => tagSet.add(tag));
            const datasetTags = tags.map((tag) => tag.replace(/,/g, '')).join(',');
            const idAttr = isFirst ? ` id="${escapeHtml(category)}"` : '';
            return `
                <figure class="gallery-item" data-category="${escapeHtml(category)}" data-tags="${escapeHtml(datasetTags)}"${idAttr}>
                    <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" />
                    <figcaption>${escapeHtml(image.caption)}</figcaption>
                </figure>
            `;
        })
        .join('');

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    const event = new CustomEvent('portfolio:rendered', { detail: { tags } });
    document.dispatchEvent(event);
};

const renderContact = async (settings) => {
    const heroParagraph = document.querySelector('.contact-hero p');
    if (heroParagraph) heroParagraph.innerHTML = settings?.contact_intro || DEFAULTS.contactIntro;

    const emailLink = document.querySelector('.contact-details__block:nth-child(1) a[href^="mailto:"]');
    const phoneLink = document.querySelector('.contact-details__block:nth-child(1) a[href^="tel:"]');
    const studioParagraph = document.querySelector('.contact-details__block:nth-child(1) p:last-of-type');

    const email = settings?.contact_email || DEFAULTS.contactEmail;
    const phone = settings?.contact_phone || DEFAULTS.contactPhone;
    const studio = settings?.contact_studio || DEFAULTS.contactStudio;

    if (emailLink) {
        emailLink.href = `mailto:${email}`;
        emailLink.textContent = email;
    }

    if (phoneLink) {
        phoneLink.href = `tel:${phone.replace(/\s+/g, '')}`;
        phoneLink.textContent = phone;
    }

    if (studioParagraph) {
        studioParagraph.textContent = studio;
    }

    const socialList = document.querySelector('.social-links');
    if (socialList) {
        const { data, error } = await supabase
            .from('social_links')
            .select('label, url')
            .order('label', { ascending: true });

        if (error) {
            console.error('Failed to load social links', error);
        }

        const socials = Array.isArray(data) && data.length ? data : SOCIAL_FALLBACKS;
        socialList.innerHTML = socials
            .map((social) => {
                const href = safeUrl(social.url) || '#';
                const label = escapeHtml(social.label || 'Social');
                const icon = label.toLowerCase().includes('instagram')
                    ? `<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm11 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z" /></svg>`
                    : label.toLowerCase().includes('linkedin')
                    ? `<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4.5 3A1.5 1.5 0 1 1 3 4.5 1.5 1.5 0 0 1 4.5 3zM3 8h3v13H3zm6 0h3v1.9h.1a3.3 3.3 0 0 1 3-1.6c3.2 0 3.9 2.1 3.9 4.7V21h-3v-6.3c0-1.5 0-3.4-2.1-3.4s-2.4 1.7-2.4 3.3V21H9z" /></svg>`
                    : `<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h4.4c2.6 0 4.1 1.3 4.1 3.3 0 1.4-.8 2.4-1.9 2.8 1.5.4 2.4 1.6 2.4 3.2 0 2.3-1.6 3.7-4.5 3.7H4zm3 3v2h1.7c1 0 1.6-.4 1.6-1s-.6-1-1.6-1zm0 4v2.3h2c1.1 0 1.8-.5 1.8-1.2s-.6-1.1-1.8-1.1zm10.6-5.5c2.4 0 3.5 1.6 3.6 3.4h-5.6c.1 1.2.9 2 2.3 2 .9 0 1.6-.3 2.2-1l1.7 1.2c-.8 1.2-2.1 2-3.9 2-3 0-4.7-2-4.7-4.5 0-2.6 1.6-4.6 4.4-4.6zm1.7 2.6c-.2-.9-.8-1.4-1.7-1.4-.9 0-1.5.5-1.7 1.4zM14 7h5v1.5h-5z" /></svg>`;
                return `
                    <li>
                        <a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">
                            ${icon}
                            ${label}
                        </a>
                    </li>
                `;
            })
            .join('');
    }
};

const fetchSiteSettings = async () => {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

    if (error) {
        console.error('Failed to load site settings', error);
        return {};
    }

    return data || {};
};

export const initPublicSite = async () => {
    const activeSlug = getActiveSlug();
    await renderNavigation(activeSlug);

    let settings = {};
    try {
        settings = await fetchSiteSettings();
    } catch (error) {
        console.error('Failed to fetch settings', error);
    }

    if (activeSlug === 'home') {
        await renderHome(settings);
    } else if (activeSlug === 'about') {
        await renderAbout(settings);
    } else if (activeSlug === 'portfolio') {
        await renderPortfolio(settings);
    } else if (activeSlug === 'contact') {
        await renderContact(settings);
    }
};
