-- Allow anonymous visitors to create signed URLs only for published public media.
-- Buckets remain private; access is constrained by exact database path matches.

drop policy if exists "Anon read published work media by exact path" on storage.objects;
create policy "Anon read published work media by exact path"
on storage.objects
for select
to anon
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

drop policy if exists "Anon read published artist covers by exact path" on storage.objects;
create policy "Anon read published artist covers by exact path"
on storage.objects
for select
to anon
using (
  bucket_id = 'artist-covers'
  and exists (
    select 1
    from public.artists
    where artists.cover_image_url = storage.objects.name
      and artists.status = 'published'
  )
);

drop policy if exists "Anon read published event covers by exact path" on storage.objects;
create policy "Anon read published event covers by exact path"
on storage.objects
for select
to anon
using (
  bucket_id = 'events'
  and exists (
    select 1
    from public.events
    where events.cover_image_url = storage.objects.name
      and events.status = 'published'
  )
);