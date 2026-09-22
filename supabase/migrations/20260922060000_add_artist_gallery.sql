-- Migration: 20260922060000_add_artist_gallery.sql
-- Description: Add artist gallery table for additional artist images (not artwork images)

create table public.artist_images (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index artist_images_artist_id_idx on public.artist_images (artist_id);
create index artist_images_artist_sort_order_idx on public.artist_images (artist_id, sort_order);

alter table public.artist_images enable row level security;

grant select on public.artist_images to anon, authenticated;
grant insert, update, delete on public.artist_images to authenticated;

-- Published artist gallery images are public
create policy "Published artist gallery images are public"
on public.artist_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_images.artist_id
      and artists.status = 'published'
  )
  or public.owns_artist(artist_id)
  or public.is_admin()
);

-- Creators manage their own artist gallery images
create policy "Creators manage their artist gallery images"
on public.artist_images
for all
to authenticated
using (public.owns_artist(artist_id) or public.is_admin())
with check (public.owns_artist(artist_id) or public.is_admin());

-- Storage policies for artist-covers bucket (gallery images use same bucket)
-- Admins can insert to artist-covers (already added in 20260921100000)
-- Creators can insert gallery images under their own profile_id folder
-- The existing "Creators upload their own work media" policy covers artist-covers
-- but requires is_creator_or_admin(). Gallery images uploaded by creator for their own artist
-- will use their own profile_id as first path segment, which matches the policy.

-- Note: Admin uploads for gallery use the artist owner's profile_id as first segment,
-- which is allowed by the "Admins upload to artist-covers bucket" policy.