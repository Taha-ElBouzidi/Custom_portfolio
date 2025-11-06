import { supabase } from './supabase.js';

const CANONICAL_PAGES = [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About' },
    { slug: 'portfolio', title: 'Portfolio' },
    { slug: 'contact', title: 'Contact' },
];

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = 'images';
const PAGE_SIZE = 6;

const refs = {
    loginSection: document.querySelector('[data-view="login"]'),
    dashboardSection: document.querySelector('[data-view="dashboard"]'),
    loginForm: document.querySelector('#login-form'),
    imageForm: document.querySelector('#image-form'),
    pageSelect: document.querySelector('#image-form select[name="page_slug"]'),
    imageError: document.querySelector('[data-image-error]'),
    imageSuccess: document.querySelector('[data-image-success]'),
    logoutButton: document.querySelector('#logout'),
    filterPage: document.querySelector('[data-filter="page"]'),
    filterStatus: document.querySelector('[data-filter="status"]'),
    filterSearch: document.querySelector('[data-filter="search"]'),
    listContainer: document.querySelector('[data-image-list]'),
    listError: document.querySelector('[data-list-error]'),
    listSuccess: document.querySelector('[data-list-success]'),
    listLoading: document.querySelector('[data-list-loading]'),
    pagination: document.querySelector('[data-pagination]'),
    pageStatus: document.querySelector('[data-page-status]'),
};

const state = {
    pages: CANONICAL_PAGES.slice(),
    filters: {
        page: 'all',
        status: 'active',
        search: '',
    },
    page: 1,
    pageSize: PAGE_SIZE,
    images: [],
    loading: false,
};

const debounce = (fn, delay = 250) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

const escapeHtml = (value = '') =>
    value
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const parseTags = (value) => {
    if (!value) return [];
    const seen = new Set();
    const tags = [];
    value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .forEach((tag) => {
            const key = tag.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            tags.push(tag);
        });
    return tags;
};

const formatTags = (tags) => {
    if (!Array.isArray(tags) || !tags.length) return '';
    return tags.join(', ');
};

const validateUrl = (value) => {
    if (!value) return null;
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return null;
        }
        return url.href;
    } catch (error) {
        return null;
    }
};

const updateSourceVisibility = (form, sourceType) => {
    const sources = form?.querySelectorAll('.form__source');
    sources?.forEach((wrapper) => {
        const type = wrapper.getAttribute('data-source');
        if (type === sourceType) {
            wrapper.removeAttribute('hidden');
        } else {
            wrapper.setAttribute('hidden', 'true');
            const fileInput = wrapper.querySelector('input[type="file"]');
            const textInput = wrapper.querySelector('input[type="url"]');
            if (fileInput) fileInput.value = '';
            if (textInput) textInput.value = '';
        }
    });
};

const initialiseSourceControls = (form) => {
    if (!form) return;
    const radios = form.querySelectorAll('input[name="source_type"]');
    const checked = form.querySelector('input[name="source_type"]:checked');
    updateSourceVisibility(form, checked?.value || 'file');
    radios?.forEach((radio) => {
        radio.addEventListener('change', (event) => {
            updateSourceVisibility(form, event.target.value);
        });
    });
};

const showImageError = (message) => {
    if (refs.imageError) refs.imageError.textContent = message || '';
    if (refs.imageSuccess) refs.imageSuccess.textContent = '';
};

const showImageSuccess = (message) => {
    if (refs.imageSuccess) refs.imageSuccess.textContent = message || '';
    if (refs.imageError) refs.imageError.textContent = '';
};

const showListError = (message) => {
    if (refs.listError) refs.listError.textContent = message || '';
};

const showListSuccess = (message) => {
    if (refs.listSuccess) refs.listSuccess.textContent = message || '';
};

const setListLoading = (isLoading, message = 'Loading images…') => {
    state.loading = isLoading;
    if (refs.listLoading) {
        refs.listLoading.hidden = !isLoading;
        if (isLoading) {
            refs.listLoading.textContent = message;
        }
    }
};

const uploadFile = async (file) => {
    if (!file) {
        throw new Error('Please choose an image file to upload.');
    }
    if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed.');
    }
    if (file.size > FILE_SIZE_LIMIT) {
        throw new Error('File size must be under 10MB.');
    }

    const extension = file.name.split('.').pop();
    const safeName = file.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase();
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
    const path = `${uniqueId}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
    });

    if (uploadError) {
        throw new Error(uploadError.message || 'Unable to upload image to storage.');
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return { url: publicUrl, storage_path: path };
};

const removeFile = async (path) => {
    if (!path) return;
    try {
        await supabase.storage.from(BUCKET_NAME).remove([path]);
    } catch (error) {
        console.warn('Unable to remove storage file', error);
    }
};

const populatePageSelectors = async () => {
    const selects = [refs.pageSelect, refs.filterPage].filter(Boolean);
    if (!selects.length) return;

    const { data, error } = await supabase
        .from('pages')
        .select('slug, title, created_at')
        .in('slug', CANONICAL_PAGES.map((page) => page.slug))
        .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length) {
        state.pages = data.map((page) => ({ slug: page.slug, title: page.title || page.slug }));
    }

    selects.forEach((select) => {
        if (select === refs.filterPage) {
            const current = state.filters.page;
            const options = state.pages
                .map((page) => `<option value="${page.slug}">${page.title}</option>`)
                .join('');
            select.innerHTML = `<option value="all">All pages</option>${options}`;
            if (current && select.querySelector(`option[value="${current}"]`)) {
                select.value = current;
            } else {
                state.filters.page = 'all';
                select.value = 'all';
            }
        } else {
            const options = state.pages
                .map((page) => `<option value="${page.slug}">${page.title}</option>`)
                .join('');
            select.innerHTML = `<option value="">Select a page</option>${options}`;
        }
    });
};

const fetchImages = async () => {
    setListLoading(true);
    showListError('');

    const { data, error } = await supabase
        .from('images')
        .select('id, page_slug, title, caption, url, tags, sort_order, source_type, storage_path, active, created_at')
        .in('page_slug', CANONICAL_PAGES.map((page) => page.slug))
        .order('sort_order', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        showListError(error.message || 'Unable to load images.');
        state.images = [];
    } else {
        state.images = Array.isArray(data) ? data : [];
        if (!state.images.length) {
            showListError('No images found yet. Add a new photo to get started.');
        }
    }

    renderImageList();
    setListLoading(false);
};

const applyFilters = () => {
    let results = state.images.slice();

    if (state.filters.page !== 'all') {
        results = results.filter((image) => image.page_slug === state.filters.page);
    }

    if (state.filters.status === 'active') {
        results = results.filter((image) => image.active !== false);
    } else if (state.filters.status === 'inactive') {
        results = results.filter((image) => image.active === false);
    }

    if (state.filters.search) {
        const query = state.filters.search.toLowerCase();
        results = results.filter((image) => {
            const tags = Array.isArray(image.tags) ? image.tags.join(' ') : '';
            return (
                (image.title && image.title.toLowerCase().includes(query)) ||
                (image.caption && image.caption.toLowerCase().includes(query)) ||
                tags.toLowerCase().includes(query)
            );
        });
    }

    return results;
};

const createImageItem = (image) => {
    const item = document.createElement('article');
    item.className = 'image-item';
    item.dataset.id = image.id;

    const tags = Array.isArray(image.tags) ? image.tags.filter((tag) => !tag.startsWith('category:')) : [];
    const tagHtml = tags.length
        ? `<div class="tag-chips">${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';
    const pageTitle = escapeHtml(state.pages.find((page) => page.slug === image.page_slug)?.title || image.page_slug);
    const sortLabel = Number.isFinite(image.sort_order) ? image.sort_order : 0;
    const statusLabel = image.active !== false ? 'Active' : 'Inactive';
    const previewAlt = escapeHtml(image.title || image.caption || 'Gallery image');

    item.innerHTML = `
        <div class="image-item__header">
            <div class="image-item__preview">
                <img src="${escapeHtml(image.url)}" alt="${previewAlt}" />
            </div>
            <div class="image-item__meta">
                <h4>${escapeHtml(image.title || 'Untitled image')}</h4>
                <div class="image-item__status">
                    <span>${pageTitle}</span>
                    <span>Sort: ${sortLabel}</span>
                    <span>${statusLabel}</span>
                </div>
                <p>${escapeHtml(image.caption || '')}</p>
                ${tagHtml}
            </div>
        </div>
        <div class="image-item__actions">
            <button type="button" class="button" data-action="edit">Edit</button>
            <button type="button" class="button button--ghost" data-action="toggle">${
                image.active !== false ? 'Deactivate' : 'Activate'
            }</button>
            <button type="button" class="button button--ghost" data-action="delete">Delete</button>
        </div>
    `;

    const form = document.createElement('form');
    form.className = 'image-item__form';
    form.dataset.id = image.id;
    form.hidden = true;
    form.innerHTML = `
        <label>
            <span>Page</span>
            <select name="page_slug" required>
                ${state.pages
                    .map(
                        (page) =>
                            `<option value="${page.slug}" ${page.slug === image.page_slug ? 'selected' : ''}>${escapeHtml(
                                page.title,
                            )}</option>`,
                    )
                    .join('')}
            </select>
        </label>

        <label>
            <span>Title</span>
            <input type="text" name="title" value="${image.title ? escapeHtml(image.title) : ''}" placeholder="Optional" />
        </label>

        <label>
            <span>Caption / Description</span>
            <textarea name="caption" rows="3" placeholder="Optional">${image.caption ? escapeHtml(image.caption) : ''}</textarea>
        </label>

        <label>
            <span>Tags (comma separated)</span>
            <input type="text" name="tags" value="${escapeHtml(formatTags(tags))}" placeholder="e.g. portraits, Marrakech" />
        </label>

        <fieldset class="form__fieldset">
            <legend>Image Source</legend>
            <label class="form__option">
                <input type="radio" name="source_type" value="file" ${image.source_type !== 'url' ? 'checked' : ''} />
                <span>Upload file</span>
            </label>
            <label class="form__option">
                <input type="radio" name="source_type" value="url" ${image.source_type === 'url' ? 'checked' : ''} />
                <span>External URL</span>
            </label>
        </fieldset>

        <div class="form__source" data-source="file">
            <label>
                <span>Replace image</span>
                <input type="file" name="file" accept="image/*" />
            </label>
            <p class="form__hint">Leave empty to keep the current file.</p>
        </div>

        <div class="form__source" data-source="url" hidden>
            <label>
                <span>Image URL</span>
                <input type="url" name="external_url" value="${
                    image.source_type === 'url' ? escapeHtml(image.url) : ''
                }" placeholder="https://example.com/image.jpg" />
            </label>
        </div>

        <label>
            <span>Sort order</span>
            <input type="number" name="sort_order" min="0" step="1" value="${Number.isFinite(image.sort_order) ? image.sort_order : 0}" />
        </label>

        <label class="form__checkbox">
            <input type="checkbox" name="active" ${image.active !== false ? 'checked' : ''} />
            <span>Active (visible on public site)</span>
        </label>

        <div class="image-item__form-controls">
            <button type="submit" class="button">Save changes</button>
            <button type="button" class="button button--ghost" data-action="cancel-edit">Cancel</button>
        </div>
        <p class="form__error" data-edit-error></p>
        <p class="form__success" data-edit-success></p>
    `;

    initialiseSourceControls(form);
    item.appendChild(form);
    return item;
};

const renderImageList = () => {
    if (!refs.listContainer) return;

    const filtered = applyFilters();
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize) || 1);
    state.page = Math.min(state.page, totalPages);

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;
    const pageItems = filtered.slice(start, end);

    refs.listContainer.innerHTML = '';

    if (!pageItems.length) {
        if (!state.images.length) {
            showListError('No images found yet. Add a new photo to get started.');
        } else {
            showListError('No images match the current filters.');
        }
        if (refs.pageStatus) {
            refs.pageStatus.textContent = `Page ${state.page} of ${totalPages}`;
        }
        return;
    }

    showListError('');

    pageItems.forEach((image) => {
        const item = createImageItem(image);
        refs.listContainer.appendChild(item);
    });

    if (refs.pageStatus) {
        refs.pageStatus.textContent = `Page ${state.page} of ${totalPages}`;
    }
};

const setView = (isAuthenticated) => {
    if (isAuthenticated) {
        refs.loginSection?.setAttribute('hidden', 'true');
        refs.dashboardSection?.removeAttribute('hidden');
    } else {
        refs.dashboardSection?.setAttribute('hidden', 'true');
        refs.loginSection?.removeAttribute('hidden');
    }
};

const handleLogin = () => {
    if (!refs.loginForm) return;
    const loginErrorEl = refs.loginForm.querySelector('[data-login-error]');

    refs.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginErrorEl.textContent = '';

        const formData = new FormData(refs.loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            console.error(error);
            loginErrorEl.textContent = error.message || 'Unable to sign in. Check your credentials.';
        }
    });
};

const handleLogout = () => {
    refs.logoutButton?.addEventListener('click', async () => {
        await supabase.auth.signOut();
    });
};

const handleFilters = () => {
    refs.filterPage?.addEventListener('change', (event) => {
        state.filters.page = event.target.value;
        state.page = 1;
        renderImageList();
    });

    refs.filterStatus?.addEventListener('change', (event) => {
        state.filters.status = event.target.value;
        state.page = 1;
        renderImageList();
    });

    if (refs.filterSearch) {
        const debounced = debounce((value) => {
            state.filters.search = value;
            state.page = 1;
            renderImageList();
        }, 300);
        refs.filterSearch.addEventListener('input', (event) => {
            debounced(event.target.value.trim().toLowerCase());
        });
    }
};

const handlePagination = () => {
    refs.pagination?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-page]');
        if (!button) return;

        const filtered = applyFilters();
        const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize) || 1);

        if (button.dataset.page === 'prev' && state.page > 1) {
            state.page -= 1;
        }
        if (button.dataset.page === 'next' && state.page < totalPages) {
            state.page += 1;
        }
        renderImageList();
    });
};

const handleImageSubmit = () => {
    if (!refs.imageForm) return;
    initialiseSourceControls(refs.imageForm);

    refs.imageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        showImageError('');
        showImageSuccess('');

        const formData = new FormData(refs.imageForm);
        const pageSlug = formData.get('page_slug');
        const title = formData.get('title')?.toString().trim() || null;
        const caption = formData.get('caption')?.toString().trim() || null;
        const tags = parseTags(formData.get('tags'));
        const sortOrderRaw = formData.get('sort_order');
        const sort_order = sortOrderRaw ? Number(sortOrderRaw) : 0;
        const sourceType = formData.get('source_type') === 'url' ? 'url' : 'file';
        const active = formData.get('active') === 'on' || formData.get('active') === 'true';

        if (!pageSlug || !state.pages.find((page) => page.slug === pageSlug)) {
            showImageError('Please select a valid page.');
            return;
        }

        let url = null;
        let storage_path = null;

        try {
            if (sourceType === 'file') {
                const file = formData.get('file');
                const upload = await uploadFile(file);
                url = upload.url;
                storage_path = upload.storage_path;
            } else {
                const externalUrl = formData.get('external_url');
                const validated = validateUrl(externalUrl);
                if (!validated) {
                    showImageError('Enter a valid https:// image URL.');
                    return;
                }
                url = validated;
            }
        } catch (error) {
            console.error(error);
            showImageError(error.message || 'Unable to process the image source.');
            return;
        }

        try {
            const { error } = await supabase.from('images').insert({
                page_slug: pageSlug,
                title,
                caption,
                url,
                sort_order: Number.isFinite(sort_order) ? sort_order : 0,
                tags,
                source_type: sourceType,
                storage_path,
                active,
            });
            if (error) throw error;

            refs.imageForm.reset();
            updateSourceVisibility(refs.imageForm, 'file');
            showImageSuccess('Image saved successfully.');
            await fetchImages();
        } catch (error) {
            console.error(error);
            showImageError(error.message || 'Unable to save the image.');
        }
    });
};

const toggleEditForm = (id, show) => {
    const forms = refs.listContainer?.querySelectorAll('.image-item__form');
    forms?.forEach((form) => {
        if (form.dataset.id === id) {
            form.hidden = show === undefined ? !form.hidden : !show;
        } else {
            form.hidden = true;
        }
    });
};

const handleToggleActive = async (id) => {
    const image = state.images.find((item) => item.id === id);
    if (!image) return;

    try {
        const { error } = await supabase.from('images').update({ active: image.active === false }).eq('id', id);
        if (error) throw error;
        showListSuccess(`Image ${image.active === false ? 'activated' : 'deactivated'} successfully.`);
        await fetchImages();
    } catch (error) {
        console.error(error);
        showListError(error.message || 'Unable to update image status.');
    }
};

const handleDeleteImage = async (id) => {
    const image = state.images.find((item) => item.id === id);
    if (!image) return;

    const confirmed = window.confirm('Delete this image permanently? This cannot be undone.');
    if (!confirmed) return;

    try {
        const { error } = await supabase.from('images').delete().eq('id', id);
        if (error) throw error;
        await removeFile(image.storage_path);
        showListSuccess('Image deleted.');
        await fetchImages();
    } catch (error) {
        console.error(error);
        showListError(error.message || 'Unable to delete the image.');
    }
};

const handleEditSubmit = async (form) => {
    const id = form.dataset.id;
    const image = state.images.find((item) => item.id === id);
    if (!image) return;

    const formData = new FormData(form);
    const pageSlug = formData.get('page_slug');
    const title = formData.get('title')?.toString().trim() || null;
    const caption = formData.get('caption')?.toString().trim() || null;
    const tags = parseTags(formData.get('tags'));
    const sortOrderRaw = formData.get('sort_order');
    const sort_order = sortOrderRaw ? Number(sortOrderRaw) : 0;
    const sourceType = formData.get('source_type') === 'url' ? 'url' : 'file';
    const active = formData.get('active') === 'on' || formData.get('active') === 'true';
    const errorEl = form.querySelector('[data-edit-error]');
    const successEl = form.querySelector('[data-edit-success]');

    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    if (!pageSlug || !state.pages.find((page) => page.slug === pageSlug)) {
        if (errorEl) errorEl.textContent = 'Select a valid page.';
        return;
    }

    let url = image.url;
    let storage_path = image.storage_path;

    try {
        if (sourceType === 'file') {
            const file = formData.get('file');
            if (file && file.size) {
                const upload = await uploadFile(file);
                url = upload.url;
                if (upload.storage_path !== storage_path) {
                    await removeFile(storage_path);
                }
                storage_path = upload.storage_path;
            }
        } else {
            const externalUrl = formData.get('external_url');
            const validated = validateUrl(externalUrl);
            if (!validated) {
                if (errorEl) errorEl.textContent = 'Enter a valid https:// image URL.';
                return;
            }
            url = validated;
            storage_path = null;
        }
    } catch (error) {
        console.error(error);
        if (errorEl) errorEl.textContent = error.message || 'Unable to process the image source.';
        return;
    }

    try {
        const { error } = await supabase
            .from('images')
            .update({
                page_slug: pageSlug,
                title,
                caption,
                tags,
                sort_order: Number.isFinite(sort_order) ? sort_order : 0,
                source_type: sourceType,
                url,
                storage_path,
                active,
            })
            .eq('id', id);
        if (error) throw error;

        if (successEl) successEl.textContent = 'Changes saved.';
        await fetchImages();
    } catch (error) {
        console.error(error);
        if (errorEl) errorEl.textContent = error.message || 'Unable to update the image.';
    }
};

const handleListInteractions = () => {
    refs.listContainer?.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const item = button.closest('.image-item');
        if (!item) return;
        const id = item.dataset.id;
        if (!id) return;

        switch (button.dataset.action) {
            case 'edit':
                toggleEditForm(id, true);
                break;
            case 'cancel-edit':
                toggleEditForm(id, false);
                break;
            case 'toggle':
                handleToggleActive(id);
                break;
            case 'delete':
                handleDeleteImage(id);
                break;
            default:
                break;
        }
    });

    refs.listContainer?.addEventListener('submit', async (event) => {
        const form = event.target.closest('.image-item__form');
        if (!form) return;
        event.preventDefault();
        await handleEditSubmit(form);
    });
};

const ensureDashboard = async () => {
    await populatePageSelectors();
    await fetchImages();
};

const initialise = async () => {
    handleLogin();
    handleLogout();
    handleFilters();
    handlePagination();
    handleImageSubmit();
    handleListInteractions();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    setView(!!session);
    if (session) {
        await ensureDashboard();
    }

    supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        const isAuthenticated = !!currentSession;
        setView(isAuthenticated);
        if (isAuthenticated) {
            await ensureDashboard();
        } else {
            showImageError('');
            showImageSuccess('');
            showListError('');
            showListSuccess('');
            refs.imageForm?.reset();
            updateSourceVisibility(refs.imageForm, 'file');
            state.images = [];
            refs.listContainer.innerHTML = '';
        }
    });
};

initialise();
