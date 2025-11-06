-- -----------------------------------------------------------------------------
-- Supabase schema setup for the portfolio project
-- Run this script in the Supabase SQL editor (or via the CLI) to provision the
-- required database tables, helper triggers, storage bucket, and baseline RLS
-- policies. All objects live in the public schema for compatibility with the
-- existing client-side code.
-- -----------------------------------------------------------------------------

-- Ensure UUID generation helpers exist.
create extension if not exists "uuid-ossp";

-- Helper function to keep updated_at in sync with the latest modification.
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := timezone('utc', now());
    return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Pages table
-- -----------------------------------------------------------------------------
create table if not exists public.pages (
    id uuid primary key default uuid_generate_v4(),
    slug text unique not null,
    title text not null,
    nav_order int default 0,
    is_builtin boolean default false,
    created_at timestamp with time zone default timezone('utc', now()),
    updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists pages_nav_order_idx on public.pages (nav_order, slug);

create trigger pages_updated_at
before update on public.pages
for each row
execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Images table
-- -----------------------------------------------------------------------------
create table if not exists public.images (
    id uuid primary key default uuid_generate_v4(),
    page_slug text not null references public.pages(slug) on delete cascade,
    title text,
    description text,
    tags text[],
    category text,
    src_type text check (src_type in ('file', 'url')) not null,
    storage_path text,
    external_url text,
    is_hero boolean default false,
    is_portrait boolean default false,
    sort_order int default 0,
    created_at timestamp with time zone default timezone('utc', now()),
    updated_at timestamp with time zone default timezone('utc', now()),
    constraint images_storage_consistency check (
        (src_type = 'file' and storage_path is not null and external_url is null)
        or (src_type = 'url' and external_url is not null and storage_path is null)
    )
);

create index if not exists images_page_sort_idx on public.images (page_slug, sort_order, title);
create index if not exists images_category_idx on public.images (category);
create index if not exists images_tags_idx on public.images using gin (tags);

create trigger images_updated_at
before update on public.images
for each row
execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Storage bucket (public so the site can fetch assets directly)
-- -----------------------------------------------------------------------------
do $$
begin
    if not exists (select 1 from storage.buckets where name = 'portfolio-images') then
        perform storage.create_bucket('portfolio-images', true);
    end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security policies
-- -----------------------------------------------------------------------------
-- By default, allow anonymous reads for the public site and anonymous writes so
-- the lightweight admin dashboard continues to function with the anon key.
-- Once Supabase Auth is enabled, flip the policies to require the
-- `authenticated` role instead (see the commented snippets below).

alter table public.pages enable row level security;
alter table public.images enable row level security;

create policy if not exists "anon_select_pages"
    on public.pages
    for select
    using (true);

create policy if not exists "anon_insert_pages"
    on public.pages
    for insert
    with check (auth.role() = 'anon');

create policy if not exists "anon_update_pages"
    on public.pages
    for update
    using (auth.role() = 'anon')
    with check (auth.role() = 'anon');

create policy if not exists "anon_delete_pages"
    on public.pages
    for delete
    using (auth.role() = 'anon');

create policy if not exists "anon_select_images"
    on public.images
    for select
    using (true);

create policy if not exists "anon_insert_images"
    on public.images
    for insert
    with check (auth.role() = 'anon');

create policy if not exists "anon_update_images"
    on public.images
    for update
    using (auth.role() = 'anon')
    with check (auth.role() = 'anon');

create policy if not exists "anon_delete_images"
    on public.images
    for delete
    using (auth.role() = 'anon');

-- -----------------------------------------------------------------------------
-- Optional hardening snippets
-- -----------------------------------------------------------------------------
-- 1) To disable anonymous writes once Supabase Auth is configured, run:
-- alter policy "anon_insert_pages" on public.pages with check (auth.role() = 'authenticated');
-- alter policy "anon_update_pages" on public.pages using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- alter policy "anon_delete_pages" on public.pages using (auth.role() = 'authenticated');
-- alter policy "anon_insert_images" on public.images with check (auth.role() = 'authenticated');
-- alter policy "anon_update_images" on public.images using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- alter policy "anon_delete_images" on public.images using (auth.role() = 'authenticated');
--
-- 2) Or, to rely on service role / admin API access only, drop the anon
--    policies for writes entirely:
-- drop policy if exists "anon_insert_pages" on public.pages;
-- drop policy if exists "anon_update_pages" on public.pages;
-- drop policy if exists "anon_delete_pages" on public.pages;
-- drop policy if exists "anon_insert_images" on public.images;
-- drop policy if exists "anon_update_images" on public.images;
-- drop policy if exists "anon_delete_images" on public.images;
--
-- 3) Reinstate read-only anonymous access by keeping the select policies above
--    and adding stricter conditions (e.g., ownership checks, tagging rules, etc.).

-- End of schema.sql
