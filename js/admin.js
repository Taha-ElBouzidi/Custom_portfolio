import { supabase } from "./supabase.js";

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

const views = {
    login: document.querySelector('[data-view="login"]'),
    dashboard: document.querySelector('[data-view="dashboard"]'),
};

const panels = document.querySelectorAll("[data-panel-id]");
const sidebarLinks = document.querySelectorAll("[data-panel]");

const elements = {
    loginForm: document.getElementById("login-form"),
    loginError: document.querySelector("[data-login-error]"),
    logout: document.getElementById("logout"),
    pageCreateForm: document.getElementById("page-create-form"),
    pageCreateError: document.querySelector("[data-page-create-error]"),
    pagesTable: document.getElementById("pages-table"),
    imagePageSelect: document.getElementById("image-page-select"),
    imageUploadForm: document.getElementById("image-upload-form"),
    imageUploadError: document.querySelector("[data-image-upload-error]"),
    imagesList: document.getElementById("images-list"),
    siteSettingsForm: document.getElementById("site-settings-form"),
    settingsError: document.querySelector("[data-settings-error]"),
    settingsSuccess: document.querySelector("[data-settings-success]"),
    socialCreateForm: document.getElementById("social-create-form"),
    socialCreateError: document.querySelector("[data-social-create-error]"),
    socialList: document.getElementById("social-list"),
};

const state = {
    pages: [],
    images: [],
    siteSettingsId: null,
    selectedPageSlug: null,
};

const toggleView = (view) => {
    Object.entries(views).forEach(([key, el]) => {
        if (!el) return;
        if (key === view) {
            el.hidden = false;
        } else {
            el.hidden = true;
        }
    });
};

const attachAuthListener = () => {
    supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
            await enterDashboard();
        } else {
            toggleView("login");
        }
    });
};

const init = async () => {
    attachAuthListener();
    elements.loginForm?.addEventListener("submit", handleLogin);
    elements.logout?.addEventListener("click", handleLogout);
    elements.pageCreateForm?.addEventListener("submit", handleCreatePage);
    elements.imagePageSelect?.addEventListener("change", handleSelectImagePage);
    elements.imageUploadForm?.addEventListener("submit", handleUploadImage);
    elements.siteSettingsForm?.addEventListener("submit", handleSaveSettings);
    elements.socialCreateForm?.addEventListener("submit", handleCreateSocialLink);

    if (elements.pageCreateForm) {
        const titleInput = elements.pageCreateForm.querySelector("input[name='title']");
        const slugInput = elements.pageCreateForm.querySelector("input[name='slug']");
        if (titleInput && slugInput) {
            titleInput.addEventListener("input", () => {
                if (!slugInput.dataset.manual) {
                    slugInput.value = slugify(titleInput.value);
                }
            });
            slugInput.addEventListener("input", () => {
                slugInput.dataset.manual = slugInput.value.trim() ? "true" : "";
            });
        }
    }

    sidebarLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const target = link.dataset.panel;
            panels.forEach((panel) => {
                panel.hidden = panel.dataset.panelId !== target;
            });
            sidebarLinks.forEach((btn) => btn.classList.toggle("is-active", btn === link));
        });
    });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session) {
        await enterDashboard();
    } else {
        toggleView("login");
    }
};

const handleLogin = async (event) => {
    event.preventDefault();
    if (!elements.loginForm) return;
    const formData = new FormData(elements.loginForm);
    const email = formData.get("email");
    const password = formData.get("password");

    elements.loginError.textContent = "";

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        elements.loginError.textContent = error.message;
    }
};

const handleLogout = async () => {
    await supabase.auth.signOut();
};

const enterDashboard = async () => {
    toggleView("dashboard");
    sidebarLinks.forEach((link, index) => link.classList.toggle("is-active", index === 0));
    panels.forEach((panel, index) => (panel.hidden = index !== 0));
    await Promise.all([loadPages(), loadSiteSettings(), loadSocialLinks()]);
    if (state.selectedPageSlug) {
        await loadImages(state.selectedPageSlug);
    } else if (state.pages.length) {
        await loadImages(state.pages[0].slug);
    }
};

const loadPages = async () => {
    const { data, error } = await supabase.from("pages").select("id, slug, title").order("created_at", { ascending: true });
    if (error) {
        elements.pageCreateError.textContent = error.message;
        return;
    }

    state.pages = data || [];
    renderPagesTable();
    renderPageSelect();
};

const renderPagesTable = () => {
    if (!elements.pagesTable) return;
    elements.pagesTable.innerHTML = "";

    if (!state.pages.length) {
        elements.pagesTable.innerHTML = `<div class="table__row"><span>No pages yet.</span></div>`;
        return;
    }

    const corePages = new Set(["home", "about", "portfolio", "contact"]);

    const rows = state.pages
        .map((page) => {
            const disableDelete = corePages.has(page.slug);
            return `
                <div class="table__row" data-page="${page.slug}">
                    <div>
                        <input type="text" value="${escapeHtml(page.title)}" data-page-title />
                    </div>
                    <div class="table__slug">${escapeHtml(page.slug)}</div>
                    <div class="table__actions">
                        <button class="button button--small" data-action="save" data-id="${page.id}">Save</button>
                        <button class="button button--ghost button--small" data-action="delete" data-id="${page.id}" ${
                            disableDelete ? "disabled" : ""
                        }>Delete</button>
                    </div>
                </div>
            `;
        })
        .join("");

    elements.pagesTable.innerHTML = rows;
    elements.pagesTable.querySelectorAll("[data-action='save']").forEach((button) => button.addEventListener("click", handleUpdatePage));
    elements.pagesTable
        .querySelectorAll("[data-action='delete']")
        .forEach((button) => {
            if (button.disabled) return;
            button.addEventListener("click", handleDeletePage);
        });
};

const renderPageSelect = () => {
    if (!elements.imagePageSelect) return;
    const options = state.pages
        .map((page) => `<option value="${page.slug}">${page.title}</option>`)
        .join("");
    elements.imagePageSelect.innerHTML = options;
    if (!state.selectedPageSlug && state.pages.length) {
        state.selectedPageSlug = state.pages[0].slug;
    }
    if (state.selectedPageSlug) {
        elements.imagePageSelect.value = state.selectedPageSlug;
    }
};

const handleCreatePage = async (event) => {
    event.preventDefault();
    if (!elements.pageCreateForm) return;

    const formData = new FormData(elements.pageCreateForm);
    const title = formData.get("title");
    let slug = formData.get("slug");

    slug = slug || slugify(title);

    elements.pageCreateError.textContent = "";

    const { error } = await supabase.from("pages").insert({ title, slug });

    if (error) {
        elements.pageCreateError.textContent = error.message;
        return;
    }

    elements.pageCreateForm.reset();
    const slugInput = elements.pageCreateForm.querySelector("input[name='slug']");
    if (slugInput) slugInput.dataset.manual = "";
    await loadPages();
};

const handleUpdatePage = async (event) => {
    const button = event.currentTarget;
    const id = button.dataset.id;
    const row = button.closest(".table__row");
    const titleInput = row?.querySelector("[data-page-title]");
    const slug = row?.dataset.page;
    if (!id || !titleInput || !slug) return;

    const title = titleInput.value.trim();
    if (!title) {
        alert("Title is required.");
        return;
    }

    const { error } = await supabase.from("pages").update({ title }).eq("id", id);
    if (error) {
        alert(error.message);
        return;
    }

    await loadPages();
};

const handleDeletePage = async (event) => {
    const button = event.currentTarget;
    const id = button.dataset.id;
    const row = button.closest(".table__row");
    const slug = row?.dataset.page;

    if (!id || !slug) return;

    if (!confirm("Delete this page and its images?")) return;

    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) {
        alert(error.message);
        return;
    }

    if (state.selectedPageSlug === slug) {
        state.selectedPageSlug = null;
    }

    await loadPages();
};

const handleSelectImagePage = async (event) => {
    const slug = event.target.value;
    state.selectedPageSlug = slug;
    await loadImages(slug);
};

const loadImages = async (slug) => {
    if (elements.imageUploadError) {
        elements.imageUploadError.textContent = "";
    }
    let query = supabase.from("images").select("id, title, caption, url, sort_order, page_slug").eq("page_slug", slug);
    query = query.order("sort_order", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
    const { data, error } = await query;

    if (error) {
        elements.imageUploadError.textContent = error.message;
        return;
    }

    state.images = data || [];
    renderImages();
};

const renderImages = () => {
    if (!elements.imagesList) return;
    if (!state.images.length) {
        elements.imagesList.innerHTML = `<p class="card-list__empty">No images yet. Upload one above.</p>`;
        return;
    }

    elements.imagesList.innerHTML = state.images
        .map((image) => {
            const previewUrl = safeUrl(image.url) || "";
            return `
                <div class="card" data-image-id="${image.id}">
                    <div class="card__preview" style="background-image:url('${previewUrl}')"></div>
                    <div class="card__fields">
                        <label>
                            <span>Title</span>
                            <input type="text" value="${escapeHtml(image.title || "")}" data-image-field="title" />
                        </label>
                        <label>
                            <span>Caption</span>
                            <textarea rows="2" data-image-field="caption">${escapeHtml(image.caption || "")}</textarea>
                        </label>
                        <label>
                            <span>Sort order</span>
                            <input type="number" value="${image.sort_order ?? 0}" data-image-field="sort_order" />
                        </label>
                    </div>
                    <div class="card__actions">
                        <button class="button button--small" data-image-action="save">Save</button>
                        <button class="button button--ghost button--small" data-image-action="delete">Delete</button>
                    </div>
                </div>
            `;
        })
        .join("");

    elements.imagesList.querySelectorAll("[data-image-action='save']").forEach((button) => button.addEventListener("click", handleSaveImage));
    elements.imagesList
        .querySelectorAll("[data-image-action='delete']")
        .forEach((button) => button.addEventListener("click", handleDeleteImage));
};

const handleUploadImage = async (event) => {
    event.preventDefault();
    if (!elements.imageUploadForm || !state.selectedPageSlug) return;

    elements.imageUploadError.textContent = "";

    const formData = new FormData(elements.imageUploadForm);
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
        elements.imageUploadError.textContent = "Select an image file.";
        return;
    }

    const title = formData.get("title") || null;
    const caption = formData.get("caption") || null;
    const sortOrderValue = formData.get("sort_order");
    const sortOrder = sortOrderValue ? Number(sortOrderValue) : 0;

    const fileExt = file.name.split(".").pop();
    const fileName = `${state.selectedPageSlug}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from("images").upload(fileName, file, {
        upsert: false,
        cacheControl: "3600",
    });

    if (uploadError) {
        elements.imageUploadError.textContent = uploadError.message;
        return;
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(uploadData.path);

    if (!publicUrl) {
        elements.imageUploadError.textContent = "Unable to retrieve the public URL for this image.";
        return;
    }

    const { error } = await supabase.from("images").insert({
        page_slug: state.selectedPageSlug,
        title,
        caption,
        sort_order: sortOrder,
        url: publicUrl,
    });

    if (error) {
        elements.imageUploadError.textContent = error.message;
        return;
    }

    elements.imageUploadForm.reset();
    await loadImages(state.selectedPageSlug);
};

const handleSaveImage = async (event) => {
    const card = event.currentTarget.closest(".card");
    const id = card?.dataset.imageId;
    if (!id) return;

    const title = card.querySelector('[data-image-field="title"]').value;
    const caption = card.querySelector('[data-image-field="caption"]').value;
    const sortOrder = Number(card.querySelector('[data-image-field="sort_order"]').value || 0);

    const { error } = await supabase
        .from("images")
        .update({ title, caption, sort_order: sortOrder })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadImages(state.selectedPageSlug);
};

const handleDeleteImage = async (event) => {
    const card = event.currentTarget.closest(".card");
    const id = card?.dataset.imageId;
    if (!id) return;

    if (!confirm("Delete this image?")) return;

    const { error } = await supabase.from("images").delete().eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadImages(state.selectedPageSlug);
};

const loadSiteSettings = async () => {
    const { data, error } = await supabase.from("site_settings").select("id, hero_title, hero_subtitle, hero_image_url, about_bio").limit(1);

    if (error) {
        elements.settingsError.textContent = error.message;
        return;
    }

    const settings = data && data.length ? data[0] : null;
    state.siteSettingsId = settings?.id || null;

    if (elements.siteSettingsForm) {
        elements.siteSettingsForm.hero_title.value = settings?.hero_title || "";
        elements.siteSettingsForm.hero_subtitle.value = settings?.hero_subtitle || "";
        elements.siteSettingsForm.hero_image_url.value = settings?.hero_image_url || "";
        elements.siteSettingsForm.about_bio.value = settings?.about_bio || "";
    }
};

const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (!elements.siteSettingsForm) return;

    elements.settingsError.textContent = "";
    elements.settingsSuccess.textContent = "";

    const formData = new FormData(elements.siteSettingsForm);
    const payload = {
        hero_title: formData.get("hero_title") || null,
        hero_subtitle: formData.get("hero_subtitle") || null,
        hero_image_url: formData.get("hero_image_url") || null,
        about_bio: formData.get("about_bio") || null,
    };

    let response;
    if (state.siteSettingsId) {
        response = await supabase.from("site_settings").update(payload).eq("id", state.siteSettingsId);
    } else {
        response = await supabase.from("site_settings").insert(payload).select("id");
    }

    if (response.error) {
        elements.settingsError.textContent = response.error.message;
        return;
    }

    if (response.data && response.data.length) {
        state.siteSettingsId = response.data[0].id;
    }

    elements.settingsSuccess.textContent = "Settings saved.";
};

const loadSocialLinks = async () => {
    const { data, error } = await supabase.from("social_links").select("id, label, url").order("created_at", { ascending: true }).order("label", { ascending: true });

    if (error) {
        elements.socialCreateError.textContent = error.message;
        return;
    }

    renderSocialLinks(data || []);
};

const renderSocialLinks = (links) => {
    if (!elements.socialList) return;

    if (!links.length) {
        elements.socialList.innerHTML = `<p class="card-list__empty">No social links yet.</p>`;
        return;
    }

    elements.socialList.innerHTML = links
        .map(
            (link) => `
                <div class="card" data-social-id="${link.id}">
                    <div class="card__fields">
                        <label>
                            <span>Label</span>
                            <input type="text" value="${escapeHtml(link.label || "")}" data-social-field="label" />
                        </label>
                        <label>
                            <span>URL</span>
                            <input type="url" value="${escapeHtml(link.url || "")}" data-social-field="url" />
                        </label>
                    </div>
                    <div class="card__actions">
                        <button class="button button--small" data-social-action="save">Save</button>
                        <button class="button button--ghost button--small" data-social-action="delete">Delete</button>
                    </div>
                </div>
            `
        )
        .join("");

    elements.socialList.querySelectorAll("[data-social-action='save']").forEach((button) => button.addEventListener("click", handleSaveSocialLink));
    elements.socialList
        .querySelectorAll("[data-social-action='delete']")
        .forEach((button) => button.addEventListener("click", handleDeleteSocialLink));
};

const handleCreateSocialLink = async (event) => {
    event.preventDefault();
    if (!elements.socialCreateForm) return;

    elements.socialCreateError.textContent = "";

    const formData = new FormData(elements.socialCreateForm);
    const label = formData.get("label");
    const url = formData.get("url");

    const { error } = await supabase.from("social_links").insert({ label, url });

    if (error) {
        elements.socialCreateError.textContent = error.message;
        return;
    }

    elements.socialCreateForm.reset();
    await loadSocialLinks();
};

const handleSaveSocialLink = async (event) => {
    const card = event.currentTarget.closest(".card");
    const id = card?.dataset.socialId;
    if (!id) return;

    const label = card.querySelector('[data-social-field="label"]').value;
    const url = card.querySelector('[data-social-field="url"]').value;

    const { error } = await supabase.from("social_links").update({ label, url }).eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadSocialLinks();
};

const handleDeleteSocialLink = async (event) => {
    const card = event.currentTarget.closest(".card");
    const id = card?.dataset.socialId;
    if (!id) return;

    if (!confirm("Delete this social link?")) return;

    const { error } = await supabase.from("social_links").delete().eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadSocialLinks();
};

const slugify = (value) =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

document.addEventListener("DOMContentLoaded", init);
