-- Fix public read access for published Article covers
drop policy if exists "Anon read published article covers by exact path"
on storage.objects;

create policy "Public can view published article covers"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'articles'
  and exists (
    select 1
    from articles
    where articles.cover_image_url = storage.objects.name
      and articles.status = 'published'
  )
);


-- Fix public read access for published Creative Place covers
create policy "Public can view published creative place covers"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'creative-places'
  and exists (
    select 1
    from creative_places
    where creative_places.id::text = (storage.foldername(objects.name))[2]
      and creative_places.status = 'published'
  )
);