create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.pages (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    created_at timestamptz default now()
);

create table if not exists public.images (
    id uuid primary key default gen_random_uuid(),
    page_slug text references public.pages(slug) on delete cascade,
    title text,
    caption text,
    url text not null,
    sort_order int default 0,
    created_at timestamptz default now()
);

alter table public.images
    add column if not exists tags text[] default '{}'::text[];

alter table public.images
    add column if not exists source_type text check (source_type in ('file', 'url')) default 'file';

alter table public.images
    add column if not exists storage_path text;

alter table public.images
    add column if not exists created_by uuid references auth.users(id);

create table if not exists public.social_links (
    id uuid primary key default gen_random_uuid(),
    label text,
    url text,
    created_at timestamptz default now()
);

create table if not exists public.site_settings (
    id uuid primary key default gen_random_uuid(),
    hero_title text,
    hero_subtitle text,
    hero_image_url text,
    about_bio text,
    created_at timestamptz default now()
);

alter table public.site_settings add column if not exists hero_eyebrow text;
alter table public.site_settings add column if not exists home_intro_title text;
alter table public.site_settings add column if not exists home_intro_body text;
alter table public.site_settings add column if not exists home_stats jsonb;
alter table public.site_settings add column if not exists home_featured_title text;
alter table public.site_settings add column if not exists home_featured_description text;
alter table public.site_settings add column if not exists about_hero_title text;
alter table public.site_settings add column if not exists about_hero_body text;
alter table public.site_settings add column if not exists about_background text;
alter table public.site_settings add column if not exists about_background_more text;
alter table public.site_settings add column if not exists about_experience text;
alter table public.site_settings add column if not exists about_experience_more text;
alter table public.site_settings add column if not exists about_awards jsonb;
alter table public.site_settings add column if not exists portfolio_intro text;
alter table public.site_settings add column if not exists contact_intro text;
alter table public.site_settings add column if not exists contact_email text;
alter table public.site_settings add column if not exists contact_phone text;
alter table public.site_settings add column if not exists contact_studio text;

insert into public.pages (slug, title)
values
    ('home', 'Home'),
    ('about', 'About'),
    ('portfolio', 'Portfolio'),
    ('contact', 'Contact')
on conflict (slug) do update set title = excluded.title;

insert into public.site_settings (
    id,
    hero_title,
    hero_subtitle,
    hero_image_url,
    hero_eyebrow,
    home_intro_title,
    home_intro_body,
    home_stats,
    home_featured_title,
    home_featured_description,
    about_hero_title,
    about_hero_body,
    about_background,
    about_background_more,
    about_experience,
    about_experience_more,
    about_awards,
    portfolio_intro,
    contact_intro,
    contact_email,
    contact_phone,
    contact_studio
)
values (
    '00000000-0000-0000-0000-000000000001',
    'Aria Lumen',
    'Capturing ethereal narratives through light, shadow, and memory.',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1600&q=80',
    'Artistic Photographer',
    'Fragments of Light',
    'Welcome to an immersive exploration of visual storytelling where each frame is crafted to hold a whisper of wonder.',
    '[{"number":"12+","label":"Years creating imagery"},{"number":"80+","label":"Exhibitions & showcases"},{"number":"30","label":"Awards received"}]'::jsonb,
    'Featured Series',
    'A selection of ongoing photographic explorations across portraiture, landscape, and abstract visual poetry.',
    'The Artist Behind the Lens',
    'Aria Lumen is an experiential photographer whose work explores the liminal spaces between reality and dreamscape.',
    'Raised among the northern lights, Aria developed a fascination with light play that transformed into a lifelong photographic journey.',
    'She studied visual arts at the Institute of Modern Imagery and has collaborated with galleries across the globe.',
    'Over the past decade, Aria has worked with cultural institutions, editorial magazines, and independent creatives to craft evocative visual narratives.',
    'Her process blends analog techniques with contemporary experimentation, inviting viewers to dwell in the spaces between emotion and memory.',
    '["2023 — Lumina International Photography Grand Prize","2022 — \"Echoes of Light\" solo exhibition at Prism Gallery, Berlin","2021 — Featured artist, Aurora Contemporary Arts Festival","2020 — \"Silent City\" series, Urban Visions Showcase, New York"]'::jsonb,
    'Curated collections across portrait, landscape, and abstract studies.',
    'For collaborations, commissions, or exhibition inquiries, please reach out via the form below.',
    'hello@arialumen.com',
    '+1 (234) 567-890',
    '123 Aurora Lane, Suite 5, Lumen City, Wonderland 00000'
)
on conflict (id) do update set
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    hero_image_url = excluded.hero_image_url,
    hero_eyebrow = excluded.hero_eyebrow,
    home_intro_title = excluded.home_intro_title,
    home_intro_body = excluded.home_intro_body,
    home_stats = excluded.home_stats,
    home_featured_title = excluded.home_featured_title,
    home_featured_description = excluded.home_featured_description,
    about_hero_title = excluded.about_hero_title,
    about_hero_body = excluded.about_hero_body,
    about_background = excluded.about_background,
    about_background_more = excluded.about_background_more,
    about_experience = excluded.about_experience,
    about_experience_more = excluded.about_experience_more,
    about_awards = excluded.about_awards,
    portfolio_intro = excluded.portfolio_intro,
    contact_intro = excluded.contact_intro,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    contact_studio = excluded.contact_studio;

insert into public.social_links (id, label, url)
values
    ('00000000-0000-0000-0000-000000000101', 'Instagram', 'https://instagram.com/PLACEHOLDER'),
    ('00000000-0000-0000-0000-000000000102', 'LinkedIn', 'https://linkedin.com/in/PLACEHOLDER'),
    ('00000000-0000-0000-0000-000000000103', 'Behance', 'https://behance.net/PLACEHOLDER')
on conflict (id) do update set url = excluded.url, label = excluded.label;

insert into public.images (id, page_slug, title, caption, url, sort_order, tags, source_type, storage_path, created_by)
values
    ('10000000-0000-0000-0000-000000000001', 'home', 'Portrait Reveries', 'Intimate portrait studies celebrating authentic connection and luminous detail.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', 0, ARRAY['featured','cta:Explore portrait work|portfolio.html#portrait'], 'url', null, null),
    ('10000000-0000-0000-0000-000000000002', 'home', 'Echoing Horizons', 'Expansive landscapes that merge atmospheric mood with sculpted light.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 1, ARRAY['featured','cta:Discover landscapes|portfolio.html#landscape'], 'url', null, null),
    ('10000000-0000-0000-0000-000000000003', 'home', 'Chromatic Dreams', 'Abstract compositions crafted from playful experimentation with color and form.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80', 2, ARRAY['featured','cta:View abstract series|portfolio.html#abstract'], 'url', null, null),
    ('20000000-0000-0000-0000-000000000001', 'about', 'Studio Portrait', 'Portrait of Aria Lumen', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', 0, ARRAY['portrait'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000001', 'portfolio', 'Portrait Reveries — Frame 01', 'Portrait Reveries — Frame 01', 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80', 0, ARRAY['portrait','dreamlike','soft-light'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000002', 'portfolio', 'Portrait Reveries — Frame 02', 'Portrait Reveries — Frame 02', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', 1, ARRAY['portrait','intimate','studio'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000003', 'portfolio', 'Portrait Reveries — Frame 03', 'Portrait Reveries — Frame 03', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80', 2, ARRAY['portrait','ethereal','monochrome'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000004', 'portfolio', 'Echoing Horizons — Frame 01', 'Echoing Horizons — Frame 01', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 3, ARRAY['landscape','sunset','vast'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000005', 'portfolio', 'Echoing Horizons — Frame 02', 'Echoing Horizons — Frame 02', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', 4, ARRAY['landscape','mist','serene'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000006', 'portfolio', 'Echoing Horizons — Frame 03', 'Echoing Horizons — Frame 03', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80', 5, ARRAY['landscape','mountain','dawn'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000007', 'portfolio', 'Chromatic Dreams — Frame 01', 'Chromatic Dreams — Frame 01', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80', 6, ARRAY['abstract','color-play','vibrant'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000008', 'portfolio', 'Chromatic Dreams — Frame 02', 'Chromatic Dreams — Frame 02', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80', 7, ARRAY['abstract','geometry','bold'], 'url', null, null),
    ('30000000-0000-0000-0000-000000000009', 'portfolio', 'Chromatic Dreams — Frame 03', 'Chromatic Dreams — Frame 03', 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80', 8, ARRAY['abstract','texture','neon'], 'url', null, null)
on conflict (id) do nothing;

alter table public.pages enable row level security;
alter table public.images enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Pages select anon'
          and schemaname = 'public'
          and tablename = 'pages'
    ) then
        create policy "Pages select anon" on public.pages for select to anon using (true);
    end if;
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Pages insert authenticated'
          and schemaname = 'public'
          and tablename = 'pages'
    ) then
        create policy "Pages insert authenticated" on public.pages for insert to authenticated with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Pages update authenticated'
          and schemaname = 'public'
          and tablename = 'pages'
    ) then
        create policy "Pages update authenticated" on public.pages for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1
        from pg_policies
        where policyname = 'Pages delete authenticated'
          and schemaname = 'public'
          and tablename = 'pages'
    ) then
        create policy "Pages delete authenticated" on public.pages for delete to authenticated using (auth.role() = 'authenticated');
    end if;
end
$$;

do $$
begin
    if exists (
        select 1 from pg_policies where policyname = 'Images select anon' and schemaname = 'public' and tablename = 'images'
    ) then
        drop policy "Images select anon" on public.images;
    end if;
    create policy "Images select anon" on public.images for select to anon using (true);

    if exists (
        select 1 from pg_policies where policyname = 'Images insert authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        drop policy "Images insert authenticated" on public.images;
    end if;
    create policy "Images insert authenticated" on public.images
        for insert
        to authenticated
        with check (created_by = auth.uid());

    if exists (
        select 1 from pg_policies where policyname = 'Images update authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        drop policy "Images update authenticated" on public.images;
    end if;
    create policy "Images update authenticated" on public.images
        for update
        to authenticated
        using (created_by = auth.uid() or created_by is null)
        with check (created_by = auth.uid() or created_by is null);

    if exists (
        select 1 from pg_policies where policyname = 'Images delete authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        drop policy "Images delete authenticated" on public.images;
    end if;
    create policy "Images delete authenticated" on public.images
        for delete
        to authenticated
        using (created_by = auth.uid() or created_by is null);
end
$$;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'Social select anon' and schemaname = 'public' and tablename = 'social_links'
    ) then
        create policy "Social select anon" on public.social_links for select to anon using (true);
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Social insert authenticated' and schemaname = 'public' and tablename = 'social_links'
    ) then
        create policy "Social insert authenticated" on public.social_links for insert to authenticated with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Social update authenticated' and schemaname = 'public' and tablename = 'social_links'
    ) then
        create policy "Social update authenticated" on public.social_links for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Social delete authenticated' and schemaname = 'public' and tablename = 'social_links'
    ) then
        create policy "Social delete authenticated" on public.social_links for delete to authenticated using (auth.role() = 'authenticated');
    end if;
end
$$;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'Settings select anon' and schemaname = 'public' and tablename = 'site_settings'
    ) then
        create policy "Settings select anon" on public.site_settings for select to anon using (true);
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Settings insert authenticated' and schemaname = 'public' and tablename = 'site_settings'
    ) then
        create policy "Settings insert authenticated" on public.site_settings for insert to authenticated with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Settings update authenticated' and schemaname = 'public' and tablename = 'site_settings'
    ) then
        create policy "Settings update authenticated" on public.site_settings for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Settings delete authenticated' and schemaname = 'public' and tablename = 'site_settings'
    ) then
        create policy "Settings delete authenticated" on public.site_settings for delete to authenticated using (auth.role() = 'authenticated');
    end if;
end
$$;
