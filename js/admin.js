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

let dashboardReady = false;

const setView = (isAuthenticated) => {
    if (!loginSection || !dashboardSection) return;
    if (isAuthenticated) {
        loginSection.setAttribute('hidden', 'true');
        dashboardSection.hidden = false;
    } else {
        dashboardSection.hidden = true;
        loginSection.removeAttribute('hidden');
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
    if (dashboardReady) return;
    await populatePageOptions();
    dashboardReady = true;
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
        const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;
        const sourceType = formData.get('source_type') === 'url' ? 'url' : 'file';
        const tags = parseTags(formData.get('tags'));

        if (!pageSlug || !CANONICAL_PAGES.find((page) => page.slug === pageSlug)) {
            showError('Please select a valid page.');
            return;
        }

        let url = null;
        let storage_path = null;

        try {
            if (sourceType === 'file') {
                const file = formData.get('file');
                const result = await uploadFile(file);
                url = result.url;
                storage_path = result.storage_path;
            } else {
                const externalUrl = formData.get('external_url');
                const validated = validateUrl(externalUrl);
                if (!validated) {
                    showError('Enter a valid https:// image URL.');
                    return;
                }
                url = validated;
            }
        } catch (error) {
            console.error(error);
            showError(error.message || 'Unable to process the image source.');
            return;
        }

        try {
            const { error } = await supabase.from('images').insert({
                page_slug: pageSlug,
                title,
                caption,
                url,
                sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
                tags,
                source_type: sourceType,
                storage_path,
            });

            if (error) {
                throw error;
            }

            imageForm.reset();
            updateSourceVisibility('file');
            showSuccess('Image submitted successfully. It will appear on the public site after refresh.');
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
    updateSourceVisibility('file');

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
            showError('');
            showSuccess('');
            imageForm?.reset();
            updateSourceVisibility('file');
        }
    });
};

initialise();
