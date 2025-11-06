(() => {
    'use strict';

    const GUARD = {
        enabled: false,
        promptMessage: 'Enter admin passphrase',
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.Supa) {
            console.error('Supabase helpers missing. Include js/supa.js before js/admin.js.');
            return;
        }

        if (GUARD.enabled) {
            const expected = window.__ADMIN_PASSPHRASE__ || '';
            const provided = window.prompt(GUARD.promptMessage || 'Admin passphrase');
            if (provided !== expected) {
                window.alert('Access denied');
                window.location.href = 'index.html';
                return;
            }
        }

        const app = new AdminDashboard();
        app.init().catch((error) => console.error('Admin dashboard failed to initialise:', error));
    });

    class AdminDashboard {
        constructor() {
            this.state = {
                pages: [],
                images: [],
                selectedImages: new Set(),
                draggingId: null,
            };
            this.elements = {};
            this.currentImage = null;
        }

        async init() {
            this.cacheDom();
            this.bindEvents();
            await window.Supa.ensureSeedData();
            await this.reload();
        }

        cacheDom() {
            this.elements.pageForm = document.querySelector('#page-form');
            this.elements.pageId = document.querySelector('#page-id');
            this.elements.pageTitle = document.querySelector('#page-title');
            this.elements.pageSlug = document.querySelector('#page-slug');
            this.elements.pageOrder = document.querySelector('#page-order');
            this.elements.pageBuiltin = document.querySelector('#page-builtin');
            this.elements.pageList = document.querySelector('[data-page-list]');
            this.elements.pageResetButtons = document.querySelectorAll('[data-reset-page-form]');

            this.elements.imageForm = document.querySelector('#image-form');
            this.elements.imageId = document.querySelector('#image-id');
            this.elements.imagePage = document.querySelector('#image-page');
            this.elements.imageTitle = document.querySelector('#image-title');
            this.elements.imageDescription = document.querySelector('#image-description');
            this.elements.imageTags = document.querySelector('#image-tags');
            this.elements.imageCategory = document.querySelector('#image-category');
            this.elements.imageSort = document.querySelector('#image-sort');
            this.elements.imageHero = document.querySelector('#image-hero');
            this.elements.imagePortrait = document.querySelector('#image-portrait');
            this.elements.imageSourceRadios = document.querySelectorAll('input[name="image-source"]');
            this.elements.imageFileField = document.querySelector('[data-file-field]');
            this.elements.imageFile = document.querySelector('#image-file');
            this.elements.imageUrlField = document.querySelector('[data-url-field]');
            this.elements.imageUrl = document.querySelector('#image-url');
            this.elements.imagePreview = document.querySelector('[data-image-preview]');
            this.elements.imageResetButtons = document.querySelectorAll('[data-reset-image-form]');

            this.elements.imageList = document.querySelector('[data-image-list]');
            this.elements.selectAllCheckbox = document.querySelector('[data-select-all]');
            this.elements.deleteSelectedButton = document.querySelector('[data-delete-selected]');

            this.elements.toastContainer = document.querySelector('[data-toasts]');
            this.elements.loadingOverlay = document.querySelector('[data-loading-overlay]');
        }

        bindEvents() {
            this.elements.pageForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                this.savePage().catch((error) => this.handleError(error, 'Unable to save page'));
            });

            this.elements.pageResetButtons?.forEach((button) => {
                button.addEventListener('click', () => {
                    this.resetPageForm();
                });
            });

            this.elements.imageForm?.addEventListener('submit', (event) => {
                event.preventDefault();
                this.saveImage().catch((error) => this.handleError(error, 'Unable to save image'));
            });

            this.elements.imageResetButtons?.forEach((button) => {
                button.addEventListener('click', () => {
                    this.resetImageForm();
                });
            });

            this.elements.imageSourceRadios?.forEach((radio) => {
                radio.addEventListener('change', () => {
                    this.toggleSourceFields();
                });
            });

            this.elements.imageFile?.addEventListener('change', () => {
                this.previewSelectedFile();
            });

            this.elements.imageUrl?.addEventListener('input', () => {
                this.previewUrl();
            });

            this.elements.selectAllCheckbox?.addEventListener('change', (event) => {
                if (!this.state.images.length) {
                    event.target.checked = false;
                    return;
                }
                if (event.target.checked) {
                    this.state.images.forEach((image) => this.state.selectedImages.add(image.id));
                } else {
                    this.state.selectedImages.clear();
                }
                this.renderImages();
            });

            this.elements.deleteSelectedButton?.addEventListener('click', () => {
                const ids = Array.from(this.state.selectedImages);
                if (!ids.length) {
                    return;
                }
                const confirmed = window.confirm(`Delete ${ids.length} image${ids.length > 1 ? 's' : ''}?`);
                if (!confirmed) {
                    return;
                }
                this.deleteImages(ids).catch((error) => this.handleError(error, 'Unable to delete images'));
            });
        }

        async reload() {
            this.setLoading(true);
            await Promise.all([this.refreshPages(), this.refreshImages()]);
            this.setLoading(false);
        }

        async refreshPages() {
            const pages = await window.Supa.getPages();
            this.state.pages = pages;
            this.populatePageSelect();
            this.renderPageList();
        }

        async refreshImages() {
            const images = await window.Supa.getAllImages();
            this.state.images = images;
            this.renderImages();
        }

        populatePageSelect() {
            if (!this.elements.imagePage) {
                return;
            }
            const select = this.elements.imagePage;
            select.innerHTML = '';
            this.state.pages
                .slice()
                .sort((a, b) => {
                    const orderA = typeof a.nav_order === 'number' ? a.nav_order : 0;
                    const orderB = typeof b.nav_order === 'number' ? b.nav_order : 0;
                    return orderA - orderB;
                })
                .forEach((page) => {
                    const option = document.createElement('option');
                    option.value = page.slug;
                    option.textContent = `${page.title} (${page.slug})`;
                    select.append(option);
                });
        }

        renderPageList() {
            const container = this.elements.pageList;
            if (!container) {
                return;
            }
            container.innerHTML = '';

            if (!this.state.pages.length) {
                container.append(this.createEmptyState('No pages yet. Add one above.'));
                return;
            }

            this.state.pages
                .slice()
                .sort((a, b) => {
                    const orderA = typeof a.nav_order === 'number' ? a.nav_order : 0;
                    const orderB = typeof b.nav_order === 'number' ? b.nav_order : 0;
                    return orderA - orderB;
                })
                .forEach((page) => {
                    const row = document.createElement('div');
                    row.className = 'table-row';

                    const title = document.createElement('div');
                    title.innerHTML = `<strong>${escapeHtml(page.title)}</strong><br /><small>/${escapeHtml(page.slug)}</small>`;

                    const order = document.createElement('div');
                    order.innerHTML = `<small>Nav order</small><br /><strong>${Number(page.nav_order ?? 0)}</strong>`;

                    const actions = document.createElement('div');
                    actions.className = 'row-actions';

                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', () => this.editPage(page));

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.textContent = 'Delete';
                    const isLocked = window.Supa.BUILTIN_SLUGS.has(page.slug);
                    if (isLocked) {
                        deleteButton.disabled = true;
                        deleteButton.title = 'Built-in pages cannot be deleted.';
                    } else {
                        deleteButton.addEventListener('click', () => {
                            const confirmed = window.confirm(
                                `Delete page “${page.title}”? Images assigned to this page will also be removed.`
                            );
                            if (!confirmed) {
                                return;
                            }
                            this.deletePage(page).catch((error) => this.handleError(error, 'Unable to delete page'));
                        });
                    }

                    actions.append(editButton, deleteButton);
                    row.append(title, order, actions);
                    container.append(row);
                });
        }

        editPage(page) {
            this.elements.pageId.value = page.id;
            this.elements.pageTitle.value = page.title;
            this.elements.pageSlug.value = page.slug;
            this.elements.pageOrder.value = page.nav_order ?? 0;
            this.elements.pageBuiltin.checked = Boolean(page.is_builtin);
            this.elements.pageSlug.disabled = window.Supa.BUILTIN_SLUGS.has(page.slug);
            this.elements.pageOrder.focus();
        }

        resetPageForm() {
            this.elements.pageId.value = '';
            this.elements.pageTitle.value = '';
            this.elements.pageSlug.value = '';
            this.elements.pageOrder.value = '0';
            this.elements.pageBuiltin.checked = false;
            this.elements.pageSlug.disabled = false;
        }

        async savePage() {
            const payload = {
                id: this.elements.pageId.value || undefined,
                title: this.elements.pageTitle.value.trim(),
                slug: this.elements.pageSlug.value.trim(),
                nav_order: Number(this.elements.pageOrder.value || 0),
                is_builtin: this.elements.pageBuiltin.checked,
            };

            if (!payload.title || !payload.slug) {
                this.showToast('Provide a title and slug.', 'error');
                return;
            }

            const button = this.elements.pageForm.querySelector('button[type="submit"]');
            button.disabled = true;
            await window.Supa.upsertPage(payload);
            button.disabled = false;
            this.showToast(`Saved page “${payload.title}”`, 'success');
            this.resetPageForm();
            await this.refreshPages();
        }

        async deletePage(page) {
            await window.Supa.deletePage(page.id);
            this.showToast(`Deleted page “${page.title}”`, 'success');
            await this.refreshPages();
        }

        renderImages() {
            const container = this.elements.imageList;
            if (!container) {
                return;
            }

            container.innerHTML = '';

            const validSelections = new Set();
            this.state.images.forEach((image) => {
                if (this.state.selectedImages.has(image.id)) {
                    validSelections.add(image.id);
                }
            });
            this.state.selectedImages = validSelections;

            if (!this.state.images.length) {
                container.append(this.createEmptyState('No images yet. Upload one above.'));
                this.updateBulkActions();
                return;
            }

            this.state.images.forEach((image) => {
                const row = document.createElement('div');
                row.className = 'image-row';
                row.draggable = true;
                row.dataset.id = image.id;

                row.addEventListener('dragstart', (event) => {
                    this.state.draggingId = image.id;
                    row.dataset.dragging = 'true';
                    event.dataTransfer.effectAllowed = 'move';
                });

                row.addEventListener('dragend', () => {
                    this.state.draggingId = null;
                    delete row.dataset.dragging;
                });

                row.addEventListener('dragover', (event) => {
                    event.preventDefault();
                });

                row.addEventListener('drop', (event) => {
                    event.preventDefault();
                    const draggingId = this.state.draggingId;
                    if (!draggingId || draggingId === image.id) {
                        return;
                    }
                    this.reorderImages(draggingId, image.id).catch((error) =>
                        this.handleError(error, 'Unable to update order')
                    );
                });

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = this.state.selectedImages.has(image.id);
                checkbox.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        this.state.selectedImages.add(image.id);
                    } else {
                        this.state.selectedImages.delete(image.id);
                    }
                    this.updateBulkActions();
                });

                const preview = document.createElement('div');
                preview.className = 'image-row__preview';
                const img = document.createElement('img');
                const url = window.Supa.resolveImageUrl(image);
                if (url) {
                    img.src = url;
                    img.alt = image.title || 'Preview image';
                    preview.append(img);
                } else {
                    preview.textContent = 'No image';
                }

                const meta = document.createElement('div');
                meta.className = 'image-row__meta';
                const title = document.createElement('strong');
                title.textContent = image.title || 'Untitled capture';
                const details = document.createElement('span');
                details.textContent = `${image.page_slug} • ${image.category || 'No category'} • Sort ${Number(
                    image.sort_order ?? 0
                )}`;
                const flags = document.createElement('span');
                const tags = Array.isArray(image.tags) ? image.tags : [];
                flags.innerHTML =
                    `${image.is_hero ? '<span class="tag-chip">Hero</span>' : ''}` +
                    `${image.is_portrait ? '<span class="tag-chip">Portrait</span>' : ''}` +
                    `${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}`;
                meta.append(title, details);
                if (flags.innerHTML.trim()) {
                    meta.append(flags);
                }

                const actions = document.createElement('div');
                actions.className = 'row-actions';

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => this.editImage(image));

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => {
                    const confirmed = window.confirm('Delete this image?');
                    if (!confirmed) {
                        return;
                    }
                    this.deleteImages([image.id]).catch((error) => this.handleError(error, 'Unable to delete image'));
                });

                actions.append(editButton, deleteButton);
                row.append(checkbox, preview, meta, actions);
                container.append(row);
            });

            this.updateBulkActions();
        }

        async reorderImages(sourceId, targetId) {
            const sourceIndex = this.state.images.findIndex((image) => image.id === sourceId);
            const targetIndex = this.state.images.findIndex((image) => image.id === targetId);
            if (sourceIndex === -1 || targetIndex === -1) {
                return;
            }
            const updated = this.state.images.slice();
            const [moved] = updated.splice(sourceIndex, 1);
            updated.splice(targetIndex, 0, moved);
            this.state.images = updated;
            this.renderImages();

            const orderPairs = this.state.images.map((image, index) => ({ id: image.id, sort_order: index }));
            await window.Supa.updateImageSortOrder(orderPairs);
            this.showToast('Updated sort order', 'success');
            await this.refreshImages();
        }

        editImage(image) {
            this.currentImage = image;
            this.elements.imageId.value = image.id;
            this.elements.imagePage.value = image.page_slug;
            this.elements.imageTitle.value = image.title || '';
            this.elements.imageDescription.value = image.description || '';
            this.elements.imageTags.value = Array.isArray(image.tags) ? image.tags.join(', ') : '';
            this.elements.imageCategory.value = image.category || '';
            this.elements.imageSort.value = Number(image.sort_order ?? 0);
            this.elements.imageHero.checked = Boolean(image.is_hero);
            this.elements.imagePortrait.checked = Boolean(image.is_portrait);

            const source = image.src_type === 'url' ? 'url' : 'file';
            this.elements.imageSourceRadios.forEach((radio) => {
                radio.checked = radio.value === source;
            });
            this.toggleSourceFields();

            if (source === 'url') {
                this.elements.imageUrl.value = image.external_url || '';
                this.previewUrl();
            } else {
                this.elements.imageUrl.value = '';
                this.previewExisting(image);
            }
        }

        resetImageForm() {
            this.currentImage = null;
            this.elements.imageForm.reset();
            this.elements.imageId.value = '';
            this.elements.imagePage.selectedIndex = 0;
            this.elements.imageSort.value = '0';
            this.elements.imageHero.checked = false;
            this.elements.imagePortrait.checked = false;
            this.elements.imageSourceRadios.forEach((radio, index) => {
                radio.checked = index === 0;
            });
            this.elements.imageUrl.value = '';
            this.elements.imageFile.value = '';
            this.elements.imagePreview.textContent = 'Image preview appears here.';
            this.elements.imagePreview.innerHTML = 'Image preview appears here.';
            this.toggleSourceFields();
        }

        toggleSourceFields() {
            const source = this.getSelectedSource();
            if (source === 'url') {
                this.elements.imageUrlField.hidden = false;
                this.elements.imageFileField.hidden = true;
            } else {
                this.elements.imageUrlField.hidden = true;
                this.elements.imageFileField.hidden = false;
            }
        }

        getSelectedSource() {
            const checked = Array.from(this.elements.imageSourceRadios || []).find((radio) => radio.checked);
            return checked ? checked.value : 'file';
        }

        previewSelectedFile() {
            const file = this.elements.imageFile.files[0];
            if (!file) {
                this.elements.imagePreview.textContent = 'Image preview appears here.';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                this.elements.imagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = event.target.result;
                img.alt = 'Selected preview';
                this.elements.imagePreview.append(img);
            };
            reader.readAsDataURL(file);
        }

        previewExisting(image) {
            const url = window.Supa.resolveImageUrl(image);
            if (!url) {
                this.elements.imagePreview.textContent = 'Stored file will display after upload.';
                return;
            }
            this.elements.imagePreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = url;
            img.alt = image.title || 'Stored preview';
            this.elements.imagePreview.append(img);
        }

        previewUrl() {
            const value = this.elements.imageUrl.value.trim();
            if (!value) {
                this.elements.imagePreview.textContent = 'Image preview appears here.';
                return;
            }
            if (!isValidUrl(value)) {
                this.elements.imagePreview.textContent = 'Enter a valid https:// URL to preview.';
                return;
            }
            this.elements.imagePreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = value;
            img.alt = 'URL preview';
            this.elements.imagePreview.append(img);
        }

        async saveImage() {
            const source = this.getSelectedSource();
            const pageSlug = this.elements.imagePage.value;
            const sortOrder = Number(this.elements.imageSort.value || 0);
            const tags = this.elements.imageTags.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            const payload = {
                id: this.elements.imageId.value || undefined,
                page_slug: pageSlug,
                title: this.elements.imageTitle.value.trim() || null,
                description: this.elements.imageDescription.value.trim() || null,
                tags,
                category: this.elements.imageCategory.value.trim() || null,
                sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
                is_hero: this.elements.imageHero.checked,
                is_portrait: this.elements.imagePortrait.checked,
                src_type: source,
            };

            if (source === 'file') {
                const file = this.elements.imageFile.files[0];
                if (file) {
                    const path = await window.Supa.uploadFile(file);
                    payload.storage_path = path;
                } else if (this.currentImage && this.currentImage.src_type === 'file') {
                    payload.storage_path = this.currentImage.storage_path;
                } else {
                    this.showToast('Upload a file or switch to URL mode.', 'error');
                    return;
                }
            } else {
                const url = this.elements.imageUrl.value.trim();
                if (!isValidUrl(url)) {
                    this.showToast('Provide a valid https:// image URL.', 'error');
                    return;
                }
                payload.external_url = url;
            }

            const button = this.elements.imageForm.querySelector('button[type="submit"]');
            button.disabled = true;
            await window.Supa.upsertImage(payload);
            button.disabled = false;
            this.showToast('Image saved', 'success');
            this.resetImageForm();
            await this.refreshImages();
        }

        async deleteImages(ids) {
            await window.Supa.deleteImages(ids);
            ids.forEach((id) => this.state.selectedImages.delete(id));
            this.showToast(`Deleted ${ids.length} image${ids.length > 1 ? 's' : ''}`, 'success');
            await this.refreshImages();
        }

        updateBulkActions() {
            const hasSelection = this.state.selectedImages.size > 0;
            if (this.elements.deleteSelectedButton) {
                this.elements.deleteSelectedButton.disabled = !hasSelection;
            }
            if (this.elements.selectAllCheckbox) {
                this.elements.selectAllCheckbox.checked =
                    hasSelection && this.state.selectedImages.size === this.state.images.length;
            }
        }

        createEmptyState(message) {
            const div = document.createElement('div');
            div.className = 'empty-state';
            div.textContent = message;
            return div;
        }

        setLoading(isLoading) {
            if (!this.elements.loadingOverlay) {
                return;
            }
            this.elements.loadingOverlay.dataset.visible = isLoading ? 'true' : 'false';
        }

        showToast(message, type = 'success') {
            if (!this.elements.toastContainer) {
                console.log(type === 'error' ? 'Error:' : 'Info:', message);
                return;
            }
            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;
            toast.textContent = message;
            this.elements.toastContainer.append(toast);
            window.setTimeout(() => {
                toast.classList.add('is-exiting');
                toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                toast.remove();
            }, 3200);
        }

        handleError(error, message) {
            console.error(message, error);
            const detail = error?.message || '';
            this.showToast(`${message}${detail ? `: ${detail}` : ''}`, 'error');
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function isValidUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' || url.protocol === 'http:';
        } catch (error) {
            return false;
        }
    }
})();
