-- Apply after 20260914152000_add_galleries_and_featured_content.sql.
-- This is a manual repair script for databases where that migration is already applied.

drop policy if exists "Authenticated read published article gallery media by exact path" on storage.objects;
create policy "Authenticated read published article gallery media by exact path"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'articles'
  and storage.allow_only_operation('storage.object.get_signed')
  and exists (
    select 1
    from public.article_images
    join public.articles on articles.id = article_images.article_id
    where article_images.image_url = storage.objects.name
      and articles.status = 'published'
  )
);

drop policy if exists "Authenticated read published event gallery media by exact path" on storage.objects;
create policy "Authenticated read published event gallery media by exact path"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'events'
  and storage.allow_only_operation('storage.object.get_signed')
  and exists (
    select 1
    from public.event_images
    join public.events on events.id = event_images.event_id
    where event_images.image_url = storage.objects.name
      and events.status = 'published'
  )
);