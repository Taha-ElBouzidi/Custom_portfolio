import { supabase } from "./supabase.js";

const pageSlugMap = {
    home: "index.html",
    about: "about.html",
    portfolio: "portfolio.html",
    contact: "contact.html",
};

let cachedPages = [];

const escapeHtml = (value = "") =>
    value
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const safeUrl = (value) => {
    if (!value) return null;
    try {
        const base = window.location.origin === "null" ? window.location.href : window.location.origin;
        const url = new URL(value, base);
        if (["http:", "https:", "data:"].includes(url.protocol)) {
            return url.href;
        }
    } catch (error) {
        console.warn("Invalid URL", value, error);
    }
    return null;
};

const orderImagesQuery = (query) =>
    query
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

const renderNavigation = async (activeSlug) => {
    const navContainer = document.querySelector("[data-nav]");
    if (!navContainer) return;
    navContainer.innerHTML = `<li class="nav__status">Loading...</li>`;

    const { data, error } = await supabase.from("pages").select("slug, title").order("created_at", { ascending: true });

    if (error) {
        navContainer.innerHTML = `<li class="nav__status nav__status--error">Unable to load navigation.</li>`;
        console.error(error);
        return;
    }

    const pages = (data || []).filter((page) => page.slug !== "admin");
    cachedPages = pages;

    if (!pages.length) {
        navContainer.innerHTML = `<li class="nav__status">No pages found.</li>`;
        return;
    }

    navContainer.innerHTML = pages
        .map((page) => {
            const href = pageSlugMap[page.slug] || `page.html?slug=${encodeURIComponent(page.slug)}`;
            const isActive = page.slug === activeSlug;
            return `<li><a href="${href}" class="${isActive ? "is-active" : ""}">${escapeHtml(page.title)}</a></li>`;
        })
        .join("");
};

const setHero = (title, subtitle, imageUrl) => {
    const titleEl = document.querySelector("[data-hero-title]");
    const subtitleEl = document.querySelector("[data-hero-subtitle]");
    const heroImageEl = document.querySelector("[data-hero-image]");

    if (titleEl) titleEl.textContent = title || "Add hero title in Site Settings";
    if (subtitleEl) subtitleEl.textContent = subtitle || "Update the hero subtitle from the dashboard.";
    if (heroImageEl) {
        if (imageUrl) {
            heroImageEl.style.backgroundImage = `url('${imageUrl}')`;
            heroImageEl.classList.remove("hero__image--empty");
        } else {
            heroImageEl.style.backgroundImage = "none";
            heroImageEl.classList.add("hero__image--empty");
        }
    }
};

const renderHome = async () => {
    const { data: siteSettings, error } = await supabase.from("site_settings").select("hero_title, hero_subtitle, hero_image_url").limit(1).maybeSingle();
    if (error) console.error(error);

    const heroImageUrl = safeUrl(siteSettings?.hero_image_url);
    setHero(siteSettings?.hero_title, siteSettings?.hero_subtitle, heroImageUrl);

    const headingEl = document.querySelector("[data-home-heading]");
    if (headingEl) {
        const homePage = cachedPages.find((page) => page.slug === "home");
        headingEl.textContent = homePage ? `${homePage.title} Highlights` : "Highlights";
    }

    const descriptionEl = document.querySelector("[data-home-description]");
    if (descriptionEl) {
        descriptionEl.textContent =
            siteSettings?.hero_subtitle || "Curate imagery for the home gallery from the dashboard.";
    }

    const gallery = document.querySelector("[data-gallery]");
    if (!gallery) return;
    gallery.innerHTML = `<p class="gallery__status">Loading images...</p>`;

    let query = supabase.from("images").select("id, title, caption, url").eq("page_slug", "home");
    query = orderImagesQuery(query);
    const { data: images, error: imagesError } = await query;

    if (imagesError) {
        gallery.innerHTML = `<p class="gallery__status gallery__status--error">Unable to load images.</p>`;
        console.error(imagesError);
        return;
    }

    if (!images || !images.length) {
        gallery.innerHTML = `<p class="gallery__status">Add featured images to the Home page in the dashboard.</p>`;
        return;
    }

    const validImages = images.filter((image) => safeUrl(image.url));

    if (!validImages.length) {
        gallery.innerHTML = `<p class="gallery__status">Add featured images to the Home page in the dashboard.</p>`;
        return;
    }

    gallery.innerHTML = validImages
        .map((image) => {
            const imageUrl = safeUrl(image.url);
            const title = escapeHtml(image.title || "Untitled");
            const caption = escapeHtml(image.caption || "Add a caption from the dashboard.");
            return `
                <article class="card">
                    <div class="card__image" style="background-image:url('${imageUrl}')" role="img" aria-label="${title}"></div>
                    <div class="card__body">
                        <h3>${title}</h3>
                        <p>${caption}</p>
                    </div>
                </article>
            `;
        })
        .join("");
};

const renderAbout = async () => {
    const bioEl = document.querySelector("[data-about-bio]");
    const portraitEl = document.querySelector("[data-about-portrait]");
    const headingEl = document.querySelector("[data-about-heading]");

    if (bioEl) bioEl.textContent = "Loading biography...";
    if (portraitEl) portraitEl.innerHTML = "";

    if (headingEl) {
        const aboutPage = cachedPages.find((page) => page.slug === "about");
        headingEl.textContent = aboutPage ? aboutPage.title : "About";
    }

    const { data: settings, error } = await supabase
        .from("site_settings")
        .select("about_bio")
        .limit(1)
        .maybeSingle();
    if (error) console.error(error);

    if (bioEl) {
        bioEl.textContent = settings?.about_bio || "Use the Site Settings panel to add your biography.";
    }

    let query = supabase.from("images").select("url, title").eq("page_slug", "about").limit(1);
    query = orderImagesQuery(query);
    const { data: images, error: imageError } = await query;

    if (imageError) console.error(imageError);
    if (portraitEl) {
        if (images && images.length) {
            const image = images.find((item) => safeUrl(item.url));
            if (!image) {
                portraitEl.style.backgroundImage = "none";
                portraitEl.classList.add("about-portrait--empty");
                portraitEl.setAttribute("aria-label", "Add a portrait image in the dashboard.");
                return;
            }
            const imageUrl = safeUrl(image.url);
            portraitEl.style.backgroundImage = `url('${imageUrl}')`;
            portraitEl.classList.remove("about-portrait--empty");
            portraitEl.setAttribute("aria-label", escapeHtml(image.title || "Portrait"));
        } else {
            portraitEl.style.backgroundImage = "none";
            portraitEl.classList.add("about-portrait--empty");
            portraitEl.setAttribute("aria-label", "Add a portrait image in the dashboard.");
        }
    }
};

const renderPortfolio = async () => {
    const grid = document.querySelector("[data-portfolio-grid]");
    const lightbox = document.querySelector("[data-lightbox]");
    const lightboxImage = document.querySelector("[data-lightbox-image]");
    const lightboxCaption = document.querySelector("[data-lightbox-caption]");
    const headingEl = document.querySelector("[data-portfolio-heading]");
    const descriptionEl = document.querySelector("[data-portfolio-description]");

    if (!grid) return;
    grid.innerHTML = `<p class="gallery__status">Loading portfolio...</p>`;

    if (headingEl) {
        const page = cachedPages.find((item) => item.slug === "portfolio");
        headingEl.textContent = page ? page.title : "Portfolio";
    }

    if (descriptionEl) {
        descriptionEl.textContent = "Images are sourced from the Portfolio gallery in Supabase.";
    }

    let query = supabase.from("images").select("id, title, caption, url").eq("page_slug", "portfolio");
    query = orderImagesQuery(query);
    const { data: images, error } = await query;

    if (error) {
        grid.innerHTML = `<p class="gallery__status gallery__status--error">Unable to load portfolio.</p>`;
        console.error(error);
        return;
    }

    if (!images || !images.length) {
        grid.innerHTML = `<p class="gallery__status">Upload portfolio images from the dashboard.</p>`;
        return;
    }

    const validImages = images.filter((image) => safeUrl(image.url));

    if (!validImages.length) {
        grid.innerHTML = `<p class="gallery__status">Upload portfolio images from the dashboard.</p>`;
        return;
    }

    grid.innerHTML = validImages
        .map((image) => {
            const imageUrl = safeUrl(image.url);
            const title = escapeHtml(image.title || "Untitled");
            const caption = escapeHtml(image.caption || "Add a caption from the dashboard.");
            return `
                <figure class="portfolio__item">
                    <button type="button" class="portfolio__thumb" data-lightbox-trigger data-image-url="${imageUrl}" data-image-title="${title}" data-image-caption="${caption}">
                        <span class="sr-only">View ${title}</span>
                        <div style="background-image:url('${imageUrl}')"></div>
                    </button>
                    <figcaption>
                        <h3>${title}</h3>
                        <p>${caption}</p>
                    </figcaption>
                </figure>
            `;
        })
        .join("");

    grid.querySelectorAll("[data-lightbox-trigger]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
            if (lightbox && lightboxImage && lightboxCaption) {
                lightboxImage.src = trigger.dataset.imageUrl;
                lightboxImage.alt = trigger.dataset.imageTitle;
                lightboxCaption.textContent = trigger.dataset.imageCaption || "";
                lightbox.classList.add("is-open");
            }
        });
    });

    if (lightbox) {
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox || event.target.hasAttribute("data-lightbox-close")) {
                lightbox.classList.remove("is-open");
            }
        });
    }
};

const renderContact = async () => {
    const list = document.querySelector("[data-social-links]");
    const headingEl = document.querySelector("[data-contact-heading]");
    if (!list) return;

    list.innerHTML = `<li class="contact__status">Loading links...</li>`;

    if (headingEl) {
        const page = cachedPages.find((item) => item.slug === "contact");
        headingEl.textContent = page ? page.title : "Contact";
    }

    const { data, error } = await supabase.from("social_links").select("id, label, url").order("label", { ascending: true });

    if (error) {
        list.innerHTML = `<li class="contact__status contact__status--error">Unable to load social links.</li>`;
        console.error(error);
        return;
    }

    if (!data || !data.length) {
        list.innerHTML = `<li class="contact__status">Add social links from the dashboard.</li>`;
        return;
    }

    list.innerHTML = data
        .map((link) => {
            const label = escapeHtml(link.label || link.url || "Social link");
            const href = safeUrl(link.url) || "#";
            return `<li><a href="${href}" target="_blank" rel="noopener">${label}</a></li>`;
        })
        .join("");
};

const renderDynamicPage = async () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const titleEl = document.querySelector("[data-page-title]");
    const gallery = document.querySelector("[data-page-gallery]");

    if (!slug) {
        if (titleEl) titleEl.textContent = "Page not found";
        if (gallery) gallery.innerHTML = `<p class="gallery__status">Specify a page slug in the URL.</p>`;
        return;
    }

    const { data: page, error: pageError } = await supabase
        .from("pages")
        .select("title")
        .eq("slug", slug)
        .maybeSingle();

    if (pageError) {
        if (titleEl) titleEl.textContent = "Error loading page";
        if (gallery) gallery.innerHTML = `<p class="gallery__status gallery__status--error">Unable to load page.</p>`;
        console.error(pageError);
        return;
    }

    if (!page) {
        if (titleEl) titleEl.textContent = "Page not found";
        if (gallery) gallery.innerHTML = `<p class="gallery__status">This page does not exist.</p>`;
        return;
    }

    if (titleEl) titleEl.textContent = page.title;

    if (!gallery) return;
    gallery.innerHTML = `<p class="gallery__status">Loading images...</p>`;

    let query = supabase.from("images").select("id, title, caption, url").eq("page_slug", slug);
    query = orderImagesQuery(query);
    const { data: images, error } = await query;

    if (error) {
        gallery.innerHTML = `<p class="gallery__status gallery__status--error">Unable to load images.</p>`;
        console.error(error);
        return;
    }

    if (!images || !images.length) {
        gallery.innerHTML = `<p class="gallery__status">Upload images for this page from the dashboard.</p>`;
        return;
    }

    const validImages = images.filter((image) => safeUrl(image.url));

    if (!validImages.length) {
        gallery.innerHTML = `<p class="gallery__status">Upload images for this page from the dashboard.</p>`;
        return;
    }

    gallery.innerHTML = validImages
        .map((image) => {
            const imageUrl = safeUrl(image.url);
            const title = escapeHtml(image.title || "Untitled");
            const caption = escapeHtml(image.caption || "Add details from the dashboard.");
            return `
                <article class="card">
                    <div class="card__image" style="background-image:url('${imageUrl}')" role="img" aria-label="${title}"></div>
                    <div class="card__body">
                        <h3>${title}</h3>
                        <p>${caption}</p>
                    </div>
                </article>
            `;
        })
        .join("");
};

const initNavToggle = () => {
    const toggle = document.querySelector(".nav__toggle");
    const nav = document.querySelector(".nav__links");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
        nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open");
    });
};

const setYear = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const init = async () => {
    setYear();
    initNavToggle();
    const activeSlug = document.body.dataset.page;
    let navSlug = activeSlug;
    if (activeSlug === "dynamic") {
        const params = new URLSearchParams(window.location.search);
        navSlug = params.get("slug");
    }
    await renderNavigation(navSlug);

    switch (activeSlug) {
        case "home":
            await renderHome();
            break;
        case "about":
            await renderAbout();
            break;
        case "portfolio":
            await renderPortfolio();
            break;
        case "contact":
            await renderContact();
            break;
        case "dynamic":
            await renderDynamicPage();
            break;
        default:
            break;
    }
};

document.addEventListener("DOMContentLoaded", init);
