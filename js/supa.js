(() => {
    'use strict';

    // --- Supabase configuration -------------------------------------------------
    // Update the URL or anon key when migrating environments. Keep credentials
    // centralized here to make future policy tightening straightforward.
    const SUPABASE_URL = 'https://ghykglfgbbcvctnaeakp.supabase.co';
    const SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWtnbGZnYmJjdmN0bmFlYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjU1OTksImV4cCI6MjA3ODAwMTU5OX0.ZaFY-sdtComkV0dEvO6axkADyNUlNN6-kb0a9fzX75M';
    const BUCKET_NAME = 'portfolio-images';

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.error('Supabase client library missing. Include @supabase/supabase-js before js/supa.js.');
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    let seededOnce = false;

    const BUILTIN_SLUGS = new Set(['home', 'about', 'portfolio']);

    // Example SQL policies for quick tightening once auth is enabled.
    // Uncomment and run in the Supabase SQL editor when you are ready.
    /*
    -- Allow anonymous reads
    create policy "anon_read_pages" on pages for select using (true);
    create policy "anon_read_images" on images for select using (true);

    -- Allow only authenticated users to modify content
    -- replace `authenticated` with your custom role if desired.
    create policy "authenticated_write_pages" on pages for insert with check (auth.role() = 'authenticated');
    alter policy "authenticated_write_pages" on pages for update using (auth.role() = 'authenticated');
    alter policy "authenticated_write_pages" on pages for delete using (auth.role() = 'authenticated');

    create policy "authenticated_write_images" on images for insert with check (auth.role() = 'authenticated');
    alter policy "authenticated_write_images" on images for update using (auth.role() = 'authenticated');
    alter policy "authenticated_write_images" on images for delete using (auth.role() = 'authenticated');
    */

    async function ensureSeedData() {
        if (seededOnce) {
            return;
        }

        try {
            const { count: pageCount, error: pageError } = await supabase
                .from('pages')
                .select('id', { count: 'exact', head: true });

            if (pageError) {
                throw pageError;
            }

            if (!pageCount) {
                await supabase.from('pages').insert([
                    { slug: 'home', title: 'Home', nav_order: 0, is_builtin: true },
                    { slug: 'about', title: 'About', nav_order: 1, is_builtin: true },
                    { slug: 'portfolio', title: 'Portfolio', nav_order: 2, is_builtin: true },
                    { slug: 'contact', title: 'Contact', nav_order: 3, is_builtin: false },
                ]);
            }

            const { count: imageCount, error: imageError } = await supabase
                .from('images')
                .select('id', { count: 'exact', head: true });

            if (imageError) {
                throw imageError;
            }

            if (!imageCount) {
                const placeholderImages = [
                    {
                        page_slug: 'home',
                        title: 'Medina Sunrise',
                        description: 'Signature hero imagery welcoming visitors to the portfolio.',
                        tags: ['featured'],
                        category: 'Highlights',
                        src_type: 'url',
                        external_url: 'image/index/hero.jpeg',
                        is_hero: true,
                        sort_order: 0,
                    },
                    {
                        page_slug: 'home',
                        title: 'Marrakech Portraits',
                        description: 'Editorial portraits with bold color contrasts from dusk sessions.',
                        tags: ['portraits'],
                        category: 'Portraits',
                        src_type: 'url',
                        external_url: 'image/index/1.jpg',
                        sort_order: 1,
                    },
                    {
                        page_slug: 'home',
                        title: 'Royal Moroccan Lens',
                        description: 'Hospitality narratives created for boutique riads across Marrakech.',
                        tags: ['royal-moroccan-lens'],
                        category: 'Commissions',
                        src_type: 'url',
                        external_url: 'image/index/2.jpg',
                        sort_order: 2,
                    },
                    {
                        page_slug: 'home',
                        title: 'Creative Collaborations',
                        description: 'Cross-genre collaborations with Moroccan designers and tastemakers.',
                        tags: ['collaborations'],
                        category: 'Collaborations',
                        src_type: 'url',
                        external_url: 'image/index/3.jpg',
                        sort_order: 3,
                    },
                    {
                        page_slug: 'about',
                        title: 'Studio Portrait',
                        description: 'A portrait of Mehdii El Marouazi in the Marrakech studio.',
                        tags: ['studio'],
                        category: 'Studio',
                        src_type: 'url',
                        external_url: 'image/about/hero.png',
                        is_portrait: true,
                        sort_order: 0,
                    },
                    {
                        page_slug: 'about',
                        title: 'Behind the Lens',
                        description: 'Documenting Marrakech architecture and texture studies.',
                        tags: ['studio-notes'],
                        category: 'Studio',
                        src_type: 'url',
                        external_url: 'image/index/1.jpg',
                        sort_order: 1,
                    },
                    {
                        page_slug: 'portfolio',
                        title: 'Portrait Study',
                        description: 'Highlighting natural light portraiture from the medina.',
                        tags: ['portraits'],
                        category: 'Portraits',
                        src_type: 'url',
                        external_url: 'image/index/1.jpg',
                        is_hero: true,
                        sort_order: 0,
                    },
                    {
                        page_slug: 'portfolio',
                        title: 'Hospitality Narrative',
                        description: 'Storytelling for a boutique riad under Royal Moroccan Lens.',
                        tags: ['royal-moroccan-lens'],
                        category: 'Hospitality',
                        src_type: 'url',
                        external_url: 'image/index/2.jpg',
                        sort_order: 1,
                    },
                    {
                        page_slug: 'portfolio',
                        title: 'Creative Collaboration',
                        description: 'A lifestyle vignette styled with local artists.',
                        tags: ['collaborations'],
                        category: 'Collaborations',
                        src_type: 'url',
                        external_url: 'image/index/3.jpg',
                        sort_order: 2,
                    },
                    {
                        page_slug: 'contact',
                        title: 'Booking Highlight',
                        description: 'Visual cue for the bookings hub in Marrakech.',
                        tags: ['bookings'],
                        category: 'Bookings',
                        src_type: 'url',
                        external_url: 'image/index/2.jpg',
                        is_hero: true,
                        sort_order: 0,
                    },
                    {
                        page_slug: 'contact',
                        title: 'Hospitality Welcome',
                        description: 'Warm interiors highlighting booking destinations.',
                        tags: ['bookings'],
                        category: 'Bookings',
                        src_type: 'url',
                        external_url: 'image/index/3.jpg',
                        sort_order: 1,
                    },
                ];

                await supabase.from('images').insert(placeholderImages);
            }

            seededOnce = true;
        } catch (error) {
            console.error('Seed data check failed:', error);
        }
    }

    async function getPages() {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .order('nav_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async function getPageBySlug(slug) {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        if (error) {
            throw error;
        }
        return data || null;
    }

    async function upsertPage(payload) {
        const record = {
            id: payload.id || undefined,
            slug: payload.slug,
            title: payload.title,
            nav_order: typeof payload.nav_order === 'number' ? payload.nav_order : 0,
            is_builtin: Boolean(payload.is_builtin),
        };
        const { data, error } = await supabase.from('pages').upsert(record).select();
        if (error) {
            throw error;
        }
        return Array.isArray(data) ? data[0] : data;
    }

    async function deletePage(id) {
        const { error } = await supabase.from('pages').delete().eq('id', id);
        if (error) {
            throw error;
        }
    }

    async function getImagesByPage(slug) {
        const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('page_slug', slug)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async function getAllImages() {
        const { data, error } = await supabase
            .from('images')
            .select('*')
            .order('page_slug', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async function upsertImage(payload) {
        const record = {
            id: payload.id || undefined,
            page_slug: payload.page_slug,
            title: payload.title || null,
            description: payload.description || null,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            category: payload.category || null,
            src_type: payload.src_type,
            storage_path: payload.src_type === 'file' ? payload.storage_path || null : null,
            external_url: payload.src_type === 'url' ? payload.external_url || null : null,
            is_hero: Boolean(payload.is_hero),
            is_portrait: Boolean(payload.is_portrait),
            sort_order: typeof payload.sort_order === 'number' ? payload.sort_order : 0,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('images').upsert(record).select();
        if (error) {
            throw error;
        }
        return Array.isArray(data) ? data[0] : data;
    }

    async function deleteImages(ids) {
        if (!Array.isArray(ids) || !ids.length) {
            return;
        }
        const { error } = await supabase.from('images').delete().in('id', ids);
        if (error) {
            throw error;
        }
    }

    async function updateImageSortOrder(pairs) {
        if (!Array.isArray(pairs) || !pairs.length) {
            return;
        }
        const updates = pairs.map((pair) =>
            supabase
                .from('images')
                .update({ sort_order: pair.sort_order, updated_at: new Date().toISOString() })
                .eq('id', pair.id)
        );
        await Promise.all(updates);
    }

    async function uploadFile(file, customPath) {
        const extension = (file.name || 'upload').split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const path = customPath || `${timestamp}-${random}.${extension}`;

        const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

        if (error) {
            throw error;
        }

        return data?.path || path;
    }

    function getPublicUrl(path) {
        if (!path) {
            return '';
        }
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path, {
            transform: {
                width: undefined,
                height: undefined,
                resize: 'contain',
            },
        });
        return data?.publicUrl || '';
    }

    function resolveImageUrl(image) {
        if (!image) {
            return '';
        }
        if (image.src_type === 'file' && image.storage_path) {
            const url = getPublicUrl(image.storage_path);
            return appendCacheBuster(url, image);
        }
        if (image.src_type === 'url' && image.external_url) {
            return appendCacheBuster(image.external_url, image);
        }
        return '';
    }

    function appendCacheBuster(url, image) {
        if (!url) {
            return '';
        }
        const stamp = image?.updated_at ? new Date(image.updated_at).getTime() : Date.now();
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${stamp}`;
    }

    window.Supa = {
        client: supabase,
        BUCKET_NAME,
        ensureSeedData,
        getPages,
        getPageBySlug,
        upsertPage,
        deletePage,
        getImagesByPage,
        getAllImages,
        upsertImage,
        deleteImages,
        updateImageSortOrder,
        uploadFile,
        getPublicUrl,
        resolveImageUrl,
        BUILTIN_SLUGS,
    };
})();
