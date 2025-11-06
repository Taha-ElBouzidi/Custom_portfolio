import { supabase } from './supabase.js';

const CANONICAL_PAGES = [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About' },
    { slug: 'portfolio', title: 'Portfolio' },
    { slug: 'contact', title: 'Contact' },
];

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = 'images';

const loginSection = document.querySelector('[data-view="login"]');
const dashboardSection = document.querySelector('[data-view="dashboard"]');
const loginForm = document.querySelector('#login-form');
const imageForm = document.querySelector('#image-form');
const pageSelect = imageForm?.querySelector('select[name="page_slug"]');
const errorEl = imageForm?.querySelector('[data-image-error]');
const successEl = imageForm?.querySelector('[data-image-success]');
const logoutButton = document.querySelector('#logout');
const formTitleEl = document.querySelector('[data-form-title]');
const formDescriptionEl = document.querySelector('[data-form-description]');
const submitButton = imageForm?.querySelector('[data-submit-button]');
const cancelEditButton = imageForm?.querySelector('[data-cancel-edit]');
const imageListContainer = document.querySelector('[data-image-list]');
const PAGE_LOOKUP = new Map(CANONICAL_PAGES.map((page, index) => [page.slug, { ...page, order: index } ]));

let dashboardReady = false;
let currentUser = null;
let editingImage = null;
let isLoadingImages = false;
let reloadImagesAfterCurrent = false;

const getPageTitle = (slug) => PAGE_LOOKUP.get(slug)?.title || slug || 'Unassigned';
const getPageOrder = (slug) => PAGE_LOOKUP.get(slug)?.order ?? CANONICAL_PAGES.length;
const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const setImageListMessage = (message) => {
    if (!imageListContainer) return;
    imageListContainer.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'image-list__placeholder';
    placeholder.textContent = message;
    imageListContainer.appendChild(placeholder);
};

const resetFormState = () => {
    editingImage = null;
    if (imageForm) {
        imageForm.reset();
    }
    updateSourceVisibility('file');
    if (formTitleEl) formTitleEl.textContent = 'Submit Image';
    if (formDescriptionEl)
        formDescriptionEl.textContent = 'Upload new imagery for the public pages. Existing content remains unchanged.';
    if (submitButton) submitButton.textContent = 'Submit Image';
    if (cancelEditButton) cancelEditButton.hidden = true;
};

const cancelEdit = (clearMessages = false) => {
    resetFormState();
    if (clearMessages) {
        showError('');
        showSuccess('');
    }
};

const setView = (isAuthenticated) => {
    if (!loginSection || !dashboardSection) return;
    if (isAuthenticated) {
        loginSection.setAttribute('hidden', 'true');
        dashboardSection.hidden = false;
        setImageListMessage('Loading images…');
    } else {
        dashboardSection.hidden = true;
        loginSection.removeAttribute('hidden');
        resetFormState();
        setImageListMessage('Sign in to load images.');
    }
};

const showError = (message) => {
    if (errorEl) errorEl.textContent = message || '';
    if (successEl) successEl.textContent = '';
};

const showSuccess = (message) => {
    if (successEl) successEl.textContent = message || '';
    if (errorEl) errorEl.textContent = '';
};

const populatePageOptions = async () => {
    if (!pageSelect) return;

    const { data, error } = await supabase
        .from('pages')
        .select('slug, title, created_at')
        .in('slug', CANONICAL_PAGES.map((page) => page.slug))
        .order('created_at', { ascending: true });

    const pages = error || !data || !data.length ? CANONICAL_PAGES : data;

    pageSelect.innerHTML = '<option value="">Select a page</option>';
    pages.forEach((page) => {
        const option = document.createElement('option');
        option.value = page.slug;
        option.textContent = page.title || CANONICAL_PAGES.find((item) => item.slug === page.slug)?.title || page.slug;
        pageSelect.appendChild(option);
    });
};

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

const updateSourceVisibility = (sourceType) => {
    const sources = imageForm?.querySelectorAll('.form__source');
    sources?.forEach((wrapper) => {
        const type = wrapper.getAttribute('data-source');
        if (type === sourceType) {
            wrapper.removeAttribute('hidden');
        } else {
            wrapper.setAttribute('hidden', 'true');
            const input = wrapper.querySelector('input');
            if (input) input.value = '';
            const fileInput = wrapper.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
        }
    });
};

const ensureDashboard = async () => {
    if (!dashboardReady) {
        await populatePageOptions();
        dashboardReady = true;
    }
    await loadImages();
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
    });

    if (uploadError) {
        throw new Error(uploadError.message || 'Unable to upload image to storage.');
    }

    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

    return { url: publicUrl, storage_path: path };
};

const removeFileFromStorage = async (path) => {
    if (!path) return;
    try {
        const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
        if (error) {
            console.warn('Unable to remove previous file from storage.', error);
        }
    } catch (storageError) {
        console.warn('Unexpected error while removing file from storage.', storageError);
    }
};

const renderImageList = (images) => {
    if (!imageListContainer) return;
    imageListContainer.innerHTML = '';

    if (!images || !images.length) {
        setImageListMessage('No images have been added yet.');
        return;
    }

    const grouped = images.reduce((accumulator, image) => {
        const slug = image.page_slug || 'uncategorized';
        if (!accumulator.has(slug)) {
            accumulator.set(slug, []);
        }
        accumulator.get(slug).push(image);
        return accumulator;
    }, new Map());

    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
        const [slugA] = a;
        const [slugB] = b;
        const orderDelta = getPageOrder(slugA) - getPageOrder(slugB);
        if (orderDelta !== 0) return orderDelta;
        return slugA.localeCompare(slugB);
    });

    sortedGroups.forEach(([slug, items]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'image-group';

        const header = document.createElement('div');
        header.className = 'image-group__header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'image-group__title';
        titleEl.textContent = getPageTitle(slug);

        const countEl = document.createElement('span');
        countEl.className = 'image-group__count';
        countEl.textContent = `${items.length} ${items.length === 1 ? 'image' : 'images'}`;

        header.appendChild(titleEl);
        header.appendChild(countEl);
        groupEl.appendChild(header);

        items
            .slice()
            .sort((first, second) => {
                const sortDelta = (first.sort_order ?? 0) - (second.sort_order ?? 0);
                if (sortDelta !== 0) return sortDelta;
                const firstDate = first.created_at ? new Date(first.created_at).getTime() : 0;
                const secondDate = second.created_at ? new Date(second.created_at).getTime() : 0;
                return firstDate - secondDate;
            })
            .forEach((image) => {
                const item = document.createElement('article');
                item.className = 'image-item';

                const title = document.createElement('div');
                title.className = 'image-item__title';
                title.textContent = image.title || 'Untitled image';
                item.appendChild(title);

                if (image.caption) {
                    const caption = document.createElement('p');
                    caption.className = 'image-item__caption';
                    caption.textContent = image.caption;
                    item.appendChild(caption);
                }

                const meta = document.createElement('div');
                meta.className = 'image-item__meta';

                const sortOrderMeta = document.createElement('span');
                sortOrderMeta.textContent = `Sort order: ${Number.isFinite(image.sort_order) ? image.sort_order : 0}`;
                meta.appendChild(sortOrderMeta);

                const sourceMeta = document.createElement('span');
                sourceMeta.textContent = image.source_type === 'url' ? 'Source: External URL' : 'Source: Uploaded file';
                meta.appendChild(sourceMeta);

                const createdAt = formatDateTime(image.created_at);
                if (createdAt) {
                    const createdMeta = document.createElement('span');
                    createdMeta.textContent = `Added ${createdAt}`;
                    meta.appendChild(createdMeta);
                }

                item.appendChild(meta);

                if (Array.isArray(image.tags) && image.tags.length) {
                    const tagsWrapper = document.createElement('div');
                    tagsWrapper.className = 'image-item__tags';
                    image.tags.forEach((tag) => {
                        const tagEl = document.createElement('span');
                        tagEl.className = 'image-item__tag';
                        tagEl.textContent = tag;
                        tagsWrapper.appendChild(tagEl);
                    });
                    item.appendChild(tagsWrapper);
                }

                const actions = document.createElement('div');
                actions.className = 'image-item__actions';

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'button button--ghost';
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => beginEditImage(image));
                actions.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'button button--danger';
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => handleDeleteImage(image));
                actions.appendChild(deleteButton);

                item.appendChild(actions);

                groupEl.appendChild(item);
            });

        imageListContainer.appendChild(groupEl);
    });
};

const loadImages = async () => {
    if (!imageListContainer) return;
    if (isLoadingImages) {
        reloadImagesAfterCurrent = true;
        return;
    }

    isLoadingImages = true;
    setImageListMessage('Loading images…');

    try {
        const { data, error } = await supabase
            .from('images')
            .select('id, page_slug, title, caption, url, sort_order, tags, source_type, storage_path, created_at, created_by')
            .order('page_slug', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        renderImageList(data || []);
    } catch (error) {
        console.error(error);
        setImageListMessage('Unable to load images. Please refresh and try again.');
    } finally {
        isLoadingImages = false;
        if (reloadImagesAfterCurrent) {
            reloadImagesAfterCurrent = false;
            await loadImages();
        }
    }
};

const beginEditImage = (image) => {
    if (!imageForm) return;
    editingImage = image;
    showError('');
    showSuccess('');

    const imageIdInput = imageForm.querySelector('input[name="image_id"]');
    const titleInput = imageForm.querySelector('input[name="title"]');
    const captionInput = imageForm.querySelector('textarea[name="caption"]');
    const tagsInput = imageForm.querySelector('input[name="tags"]');
    const sortOrderInput = imageForm.querySelector('input[name="sort_order"]');
    const urlInput = imageForm.querySelector('input[name="external_url"]');
    const fileInput = imageForm.querySelector('input[name="file"]');
    const sourceType = image.source_type === 'url' ? 'url' : 'file';

    if (imageIdInput) imageIdInput.value = image.id;
    if (pageSelect) pageSelect.value = image.page_slug || '';
    if (titleInput) titleInput.value = image.title || '';
    if (captionInput) captionInput.value = image.caption || '';
    if (tagsInput) tagsInput.value = Array.isArray(image.tags) ? image.tags.join(', ') : '';
    if (sortOrderInput) sortOrderInput.value = Number.isFinite(image.sort_order) ? image.sort_order : '';

    const radio = imageForm.querySelector(`input[name="source_type"][value="${sourceType}"]`);
    if (radio) {
        radio.checked = true;
        updateSourceVisibility(sourceType);
    }

    if (fileInput) fileInput.value = '';
    if (urlInput) {
        urlInput.value = sourceType === 'url' ? image.url : '';
    }

    if (formTitleEl) formTitleEl.textContent = 'Edit Image';
    if (formDescriptionEl)
        formDescriptionEl.textContent = 'Update metadata or replace the asset, then save your changes.';
    if (submitButton) submitButton.textContent = 'Save changes';
    if (cancelEditButton) cancelEditButton.hidden = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleDeleteImage = async (image) => {
    if (!image || !image.id) return;
    const confirmed = window.confirm('Delete this image? This cannot be undone.');
    if (!confirmed) return;

    try {
        const { error } = await supabase.from('images').delete().eq('id', image.id);
        if (error) {
            throw error;
        }

        if (editingImage && editingImage.id === image.id) {
            cancelEdit();
        }

        if (image.storage_path) {
            await removeFileFromStorage(image.storage_path);
        }

        await loadImages();
        showSuccess('Image deleted successfully.');
    } catch (error) {
        console.error(error);
        showError(error.message || 'Unable to delete the image.');
    }
};

const handleLogin = () => {
    if (!loginForm) return;
    const loginErrorEl = loginForm.querySelector('[data-login-error]');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginErrorEl.textContent = '';

        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error(error);
            loginErrorEl.textContent = error.message || 'Unable to sign in. Check your credentials.';
        }
    });
};

const handleLogout = () => {
    logoutButton?.addEventListener('click', async () => {
        await supabase.auth.signOut();
    });
};

const handleSourceToggle = () => {
    const radios = imageForm?.querySelectorAll('input[name="source_type"]');
    radios?.forEach((radio) => {
        radio.addEventListener('change', (event) => {
            updateSourceVisibility(event.target.value);
        });
    });
};

const handleImageSubmit = () => {
    if (!imageForm) return;

    imageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        showError('');
        showSuccess('');

        const formData = new FormData(imageForm);
        const pageSlug = formData.get('page_slug');
        const title = formData.get('title')?.toString().trim() || null;
        const caption = formData.get('caption')?.toString().trim() || null;
        const sortOrderRaw = formData.get('sort_order');
        const sortOrder = sortOrderRaw !== null && sortOrderRaw !== '' ? Number(sortOrderRaw) : 0;
        const sourceType = formData.get('source_type') === 'url' ? 'url' : 'file';
        const tags = parseTags(formData.get('tags'));
        const imageId = formData.get('image_id')?.toString().trim();
        const isEditing = Boolean(imageId);

        if (!pageSlug || !CANONICAL_PAGES.find((page) => page.slug === pageSlug)) {
            showError('Please select a valid page.');
            return;
        }

        if (isEditing && (!editingImage || editingImage.id !== imageId)) {
            showError('The selected image is no longer available. Please reload and try again.');
            return;
        }

        if (!Number.isFinite(sortOrder)) {
            showError('Sort order must be a valid number.');
            return;
        }

        if (!currentUser) {
            showError('You must be signed in to manage images.');
            return;
        }

        let url = null;
        let storagePath = null;
        let shouldDeletePreviousFile = false;

        try {
            if (sourceType === 'file') {
                const file = formData.get('file');
                const hasNewFile = file && typeof file === 'object' && 'size' in file && file.size > 0;
                if (hasNewFile) {
                    const result = await uploadFile(file);
                    url = result.url;
                    storagePath = result.storage_path;
                    if (isEditing && editingImage?.storage_path && editingImage.storage_path !== storagePath) {
                        shouldDeletePreviousFile = true;
                    }
                } else if (isEditing && editingImage?.source_type === 'file' && editingImage?.url) {
                    url = editingImage.url;
                    storagePath = editingImage.storage_path || null;
                } else {
                    showError('Please choose an image file to upload.');
                    return;
                }
            } else {
                const externalUrl = formData.get('external_url');
                let validated = validateUrl(externalUrl);
                if (!validated && isEditing && editingImage?.source_type === 'url') {
                    validated = editingImage.url;
                }
                if (!validated) {
                    showError('Enter a valid https:// image URL.');
                    return;
                }
                url = validated;
                if (isEditing && editingImage?.storage_path) {
                    shouldDeletePreviousFile = true;
                }
            }
        } catch (error) {
            console.error(error);
            showError(error.message || 'Unable to process the image source.');
            return;
        }

        const payload = {
            page_slug: pageSlug,
            title,
            caption,
            url,
            sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
            tags,
            source_type: sourceType,
            storage_path: sourceType === 'url' ? null : storagePath,
        };

        try {
            if (isEditing) {
                const { error } = await supabase.from('images').update(payload).eq('id', imageId);
                if (error) {
                    throw error;
                }

                if (shouldDeletePreviousFile && editingImage?.storage_path) {
                    await removeFileFromStorage(editingImage.storage_path);
                }

                showSuccess('Image updated successfully.');
            } else {
                const { error } = await supabase
                    .from('images')
                    .insert({ ...payload, created_by: currentUser.id });
                if (error) {
                    throw error;
                }

                showSuccess('Image submitted successfully. It will appear on the public site after refresh.');
            }

            await loadImages();
            cancelEdit();
        } catch (error) {
            console.error(error);
            showError(error.message || 'Unable to save the image.');
        }
    });
};

const initialise = async () => {
    handleLogin();
    handleLogout();
    handleSourceToggle();
    handleImageSubmit();
    cancelEditButton?.addEventListener('click', () => cancelEdit(true));
    updateSourceVisibility('file');

    const {
        data: { session },
    } = await supabase.auth.getSession();

    currentUser = session?.user || null;
    setView(!!session);
    if (session) {
        await ensureDashboard();
    }

    supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        const isAuthenticated = !!currentSession;
        currentUser = currentSession?.user || null;
        setView(isAuthenticated);
        if (isAuthenticated) {
            await ensureDashboard();
        } else {
            cancelEdit(true);
        }
    });
};

initialise();
