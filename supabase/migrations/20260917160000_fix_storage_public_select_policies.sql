-- Fix public read access on storage.objects for published content.
-- Permits both anonymous visitors and authenticated users (to anon, authenticated)
-- to read objects and generate signed URLs for:
--   1. Published artist covers (artist-covers bucket)
--   2. Published artist avatars (avatars bucket)
--   3. Published work cover images (works bucket)
--   4. Published event cover images (events bucket)
--
-- Draft content and non-artist user avatars remain strictly protected.

-- 1. Artist Covers
drop policy if exists "Anon read published artist covers by exact path" on storage.objects;
drop policy if exists "Public read published artist covers by exact path" on storage.objects;

create policy "Public read published artist covers by exact path"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'artist-covers'
  and exists (
    select 1
    from public.artists
    where artists.cover_image_url = storage.objects.name
      and artists.status = 'published'
  )
);

-- 2. Artist Avatars
-- Restricted strictly to avatars referenced by published artists or profiles linked to published artists.
drop policy if exists "Public read published artist avatars by exact path" on storage.objects;

create policy "Public read published artist avatars by exact path"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'avatars'
  and (
    exists (
      select 1
      from public.artists
      where artists.avatar_url = storage.objects.name
        and artists.status = 'published'
    )
    or exists (
      select 1
      from public.artists
      join public.profiles on profiles.id = artists.profile_id
      where profiles.avatar_url = storage.objects.name
        and artists.status = 'published'
    )
  )
);

-- 3. Work Covers
drop policy if exists "Anon read published work media by exact path" on storage.objects;
drop policy if exists "Public read published work cover by exact path" on storage.objects;

create policy "Public read published work cover by exact path"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'works'
  and exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.image_url = storage.objects.name
      and works.status = 'published'
      and artists.status = 'published'
  )
);

-- 4. Event Covers
drop policy if exists "Anon read published event covers by exact path" on storage.objects;
drop policy if exists "Public read published event covers by exact path" on storage.objects;

create policy "Public read published event covers by exact path"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'events'
  and exists (
    select 1
    from public.events
    where events.cover_image_url = storage.objects.name
      and events.status = 'published'
  )
);
