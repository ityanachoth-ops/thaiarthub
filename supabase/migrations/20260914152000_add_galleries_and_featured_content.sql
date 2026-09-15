-- ThaiArtHub multi-image galleries and featured content.
-- Reuses existing tables, enums, functions, buckets, and cover-image policies.

alter table public.articles
add column is_featured boolean not null default false;

alter table public.events
add column is_featured boolean not null default false;

create table public.article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  caption text,
  created_at timestamptz not null default now()
);

create index article_images_article_id_idx on public.article_images (article_id);
create index article_images_article_sort_order_idx on public.article_images (article_id, sort_order);

create table public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  caption text,
  created_at timestamptz not null default now()
);

create index event_images_event_id_idx on public.event_images (event_id);
create index event_images_event_sort_order_idx on public.event_images (event_id, sort_order);

alter table public.article_images enable row level security;
alter table public.event_images enable row level security;

create policy "Published article gallery images are public"
on public.article_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles
    where articles.id = article_images.article_id
      and articles.status = 'published'
  )
  or public.is_admin()
);

create policy "Admins create article gallery images"
on public.article_images
for insert
to authenticated
with check (public.is_admin());

create policy "Admins update article gallery images"
on public.article_images
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete article gallery images"
on public.article_images
for delete
to authenticated
using (public.is_admin());

create policy "Published event gallery images are public"
on public.event_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_images.event_id
      and events.status = 'published'
  )
  or public.is_admin()
);

create policy "Admins create event gallery images"
on public.event_images
for insert
to authenticated
with check (public.is_admin());

create policy "Admins update event gallery images"
on public.event_images
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete event gallery images"
on public.event_images
for delete
to authenticated
using (public.is_admin());

grant select on public.article_images, public.event_images to anon, authenticated;
grant insert, update, delete on public.article_images, public.event_images to authenticated;

create policy "Anon read published article gallery media by exact path"
on storage.objects
for select
to anon
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

create policy "Anon read published event gallery media by exact path"
on storage.objects
for select
to anon
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