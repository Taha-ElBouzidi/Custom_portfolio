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

insert into public.pages (slug, title)
values
    ('home', 'Home'),
    ('about', 'About'),
    ('portfolio', 'Portfolio'),
    ('contact', 'Contact')
on conflict (slug) do nothing;

insert into public.site_settings (id, hero_title, hero_subtitle, hero_image_url, about_bio)
select gen_random_uuid(), null, null, null, null
where not exists (select 1 from public.site_settings);

alter table public.pages enable row level security;
alter table public.images enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;

create policy "Pages select anon" on public.pages for select to anon using (true);
create policy "Pages insert authenticated" on public.pages for insert to authenticated with check (auth.role() = 'authenticated');
create policy "Pages update authenticated" on public.pages for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Pages delete authenticated" on public.pages for delete to authenticated using (auth.role() = 'authenticated');

create policy "Images select anon" on public.images for select to anon using (true);
create policy "Images insert authenticated" on public.images for insert to authenticated with check (auth.role() = 'authenticated');
create policy "Images update authenticated" on public.images for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Images delete authenticated" on public.images for delete to authenticated using (auth.role() = 'authenticated');

create policy "Social select anon" on public.social_links for select to anon using (true);
create policy "Social insert authenticated" on public.social_links for insert to authenticated with check (auth.role() = 'authenticated');
create policy "Social update authenticated" on public.social_links for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Social delete authenticated" on public.social_links for delete to authenticated using (auth.role() = 'authenticated');

create policy "Settings select anon" on public.site_settings for select to anon using (true);
create policy "Settings insert authenticated" on public.site_settings for insert to authenticated with check (auth.role() = 'authenticated');
create policy "Settings update authenticated" on public.site_settings for update to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Settings delete authenticated" on public.site_settings for delete to authenticated using (auth.role() = 'authenticated');
