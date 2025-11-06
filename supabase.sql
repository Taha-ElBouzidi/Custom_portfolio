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
    add column if not exists active boolean default true;

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
    'Mehdii El Marouazi',
    'Moroccan photographer capturing luminous stories of Marrakech, lifestyle, and culture for the Royal Moroccan Lens community.',
    'https://cdn2.dumpor.io/a/5bf153f7-dc81-4647-b3f4-32ff0c11c773.jpg',
    'Creative Photography',
    'Royal Moroccan Lens',
    'Founder and lead creative behind <span class="highlight">@royalmoroccanlens</span>, Mehdii El Marouazi crafts saturated, cinematic imagery that celebrates Morocco’s architecture, hospitality, and vibrant street life. His feed blends refined styling with candid emotion, inviting audiences into the pulse of Marrakech.',
    '[{"number":"12.7k","label":"Instagram followers engaged"},{"number":"337","label":"Published stories and posts"},{"number":"Marrakech","label":"Home base & booking hub"}]'::jsonb,
    'Featured Focus',
    'Curations inspired by Mehdii’s Instagram storytelling—from intimate Marrakech portraits to the polished brand experiences crafted under the Royal Moroccan Lens studio.',
    'The Vision Behind Royal Moroccan Lens',
    'Mehdii El Marouazi is a Marrakech-based photographer and founder of <span class="highlight">@royalmoroccanlens</span>. His creative photography pairs saturated color palettes with refined styling to document Morocco’s modern culture, luxury spaces, and vibrant street life.',
    'Rooted in Marrakech, Mehdii’s eye is shaped by the city’s interplay of texture, pattern, and warm evening light. He built Royal Moroccan Lens as a platform to showcase Moroccan hospitality, architecture, and lifestyle through cinematic stills.',
    'The Instagram community he leads has grown to over 12.7k followers and 337 published stories, reflecting a sustained dialogue with locals, travelers, and global collaborators who are drawn to Morocco’s spirit.',
    'Mehdii collaborates with boutique hotels, designers, and cultural tastemakers to create polished campaigns that retain the authenticity of Marrakech. Each commission is approached as a story in motion, with bookings coordinated directly via Instagram DM to maintain a personal connection.',
    'The Royal Moroccan Lens workflow leans into natural light, unexpected angles, and saturated chromatic palettes to evoke the mood of each location—from rooftop gatherings to intimate portrait sessions.',
    '["2024 — Founder and lead photographer of the Royal Moroccan Lens studio collective.","2024 — 12.7k+ followers engaging with Marrakech storytelling on Instagram.","2023 — Surpassed 337 published posts chronicling Morocco’s creative culture.","Ongoing — Direct booking pipeline via Instagram DM for bespoke shoots in Marrakech."]'::jsonb,
    'Curated sets echoing the Instagram presence of <span class="highlight">@mehdii_el_marouazi</span>—creative portraits, Royal Moroccan Lens commissions, and cross-genre collaborations shaped in Marrakech.',
    'Share project details below or reach out directly via Instagram DM—the primary booking channel highlighted on <a href="https://www.instagram.com/mehdii_el_marouazi/" target="_blank" rel="noreferrer">@mehdii_el_marouazi</a>.',
    'Marouazi10@gmail.com',
    '+212 600-000000',
    'Studio: Marrakech, Morocco — available for travel upon request.'
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
    ('00000000-0000-0000-0000-000000000101', 'Instagram', 'https://www.instagram.com/mehdii_el_marouazi/'),
    ('00000000-0000-0000-0000-000000000102', 'LinkedIn', '#'),
    ('00000000-0000-0000-0000-000000000103', 'Behance', '#')
on conflict (id) do update set url = excluded.url, label = excluded.label;

insert into public.images (id, page_slug, title, caption, url, sort_order, tags, source_type, storage_path, active)
values
    ('10000000-0000-0000-0000-000000000001', 'home', 'Marrakech Portraits', 'Editorial portraits with bold color contrast, translating the city’s energy into cinematic frames.', 'image/index/1.jpg', 0, ARRAY['featured','cta:Explore portrait stories|portfolio.html#portraits'], 'url', null, true),
    ('10000000-0000-0000-0000-000000000002', 'home', 'Royal Moroccan Lens', 'Signature commissions and hospitality narratives produced for the Royal Moroccan Lens collective.', 'image/index/2.jpg', 1, ARRAY['featured','cta:View studio highlights|portfolio.html#royalmoroccanlens'], 'url', null, true),
    ('10000000-0000-0000-0000-000000000003', 'home', 'Creative Collaborations', 'Cross-genre shoots with local creatives, designers, and cultural tastemakers across Morocco.', 'image/index/3.jpg', 2, ARRAY['featured','cta:See collaborative work|portfolio.html#collaborations'], 'url', null, true),
    ('20000000-0000-0000-0000-000000000001', 'about', 'Portrait of Mehdii El Marouazi', 'Portrait of Mehdii El Marouazi', 'image/about/hero.png', 0, ARRAY['portrait'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000001', 'portfolio', 'Marrakech Portraits — Luminous dusk session', 'Marrakech Portraits — Luminous dusk session', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80', 0, ARRAY['category:portraits','portraits','marrakech','dusk'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000002', 'portfolio', 'Marrakech Portraits — Editorial palette study', 'Marrakech Portraits — Editorial palette study', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80', 1, ARRAY['category:portraits','portraits','editorial','color'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000003', 'portfolio', 'Marrakech Portraits — Medina street light', 'Marrakech Portraits — Medina street light', 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80', 2, ARRAY['category:portraits','portraits','street','medina'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000004', 'portfolio', 'Royal Moroccan Lens — Riad hospitality story', 'Royal Moroccan Lens — Riad hospitality story', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80', 3, ARRAY['category:royalmoroccanlens','royalmoroccanlens','hospitality','riad'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000005', 'portfolio', 'Royal Moroccan Lens — Architectural detail', 'Royal Moroccan Lens — Architectural detail', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', 4, ARRAY['category:royalmoroccanlens','royalmoroccanlens','architecture','detail'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000006', 'portfolio', 'Royal Moroccan Lens — Lifestyle vignette', 'Royal Moroccan Lens — Lifestyle vignette', 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80', 5, ARRAY['category:royalmoroccanlens','royalmoroccanlens','lifestyle'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000007', 'portfolio', 'Creative Collaborations — Designer spotlight', 'Creative Collaborations — Designer spotlight', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', 6, ARRAY['category:collaborations','collaborations','designer'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000008', 'portfolio', 'Creative Collaborations — Editorial story', 'Creative Collaborations — Editorial story', 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80', 7, ARRAY['category:collaborations','collaborations','editorial'], 'url', null, true),
    ('30000000-0000-0000-0000-000000000009', 'portfolio', 'Creative Collaborations — Music & lifestyle', 'Creative Collaborations — Music & lifestyle', 'https://images.unsplash.com/photo-1529338296731-c4280a079ffa?auto=format&fit=crop&w=1200&q=80', 8, ARRAY['category:collaborations','collaborations','music'], 'url', null, true)
on conflict (id) do update set
    page_slug = excluded.page_slug,
    title = excluded.title,
    caption = excluded.caption,
    url = excluded.url,
    sort_order = excluded.sort_order,
    tags = excluded.tags,
    source_type = excluded.source_type,
    storage_path = excluded.storage_path,
    active = excluded.active;

alter table public.pages enable row level security;
alter table public.images enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;
alter table storage.objects enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'Pages select anon' and schemaname = 'public' and tablename = 'pages'
    ) then
        create policy "Pages select anon" on public.pages for select to anon using (true);
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Pages insert authenticated' and schemaname = 'public' and tablename = 'pages'
    ) then
        create policy "Pages insert authenticated" on public.pages for insert to authenticated with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Pages update authenticated' and schemaname = 'public' and tablename = 'pages'
    ) then
        create policy "Pages update authenticated" on public.pages for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Pages delete authenticated' and schemaname = 'public' and tablename = 'pages'
    ) then
        create policy "Pages delete authenticated" on public.pages for delete to authenticated using (auth.role() = 'authenticated');
    end if;
end
$$;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'Images select anon' and schemaname = 'public' and tablename = 'images'
    ) then
        create policy "Images select anon" on public.images for select to anon using (true);
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Images insert authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        create policy "Images insert authenticated" on public.images for insert to authenticated with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Images update authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        create policy "Images update authenticated" on public.images for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Images delete authenticated' and schemaname = 'public' and tablename = 'images'
    ) then
        create policy "Images delete authenticated" on public.images for delete to authenticated using (auth.role() = 'authenticated');
    end if;
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

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'Storage images select anon' and schemaname = 'storage' and tablename = 'objects'
    ) then
        create policy "Storage images select anon" on storage.objects for select to anon using (bucket_id = 'images');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'Storage images write authenticated' and schemaname = 'storage' and tablename = 'objects'
    ) then
        create policy "Storage images write authenticated" on storage.objects for all to authenticated using (bucket_id = 'images') with check (bucket_id = 'images');
    end if;
end
$$;
