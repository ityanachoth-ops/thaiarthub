-- Creative place multi-image gallery support.
-- Reuses existing 'creative-places' bucket and cover image policies.

create table public.creative_place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.creative_places(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  caption text,
  created_at timestamptz not null default now()
);

create index creative_place_images_place_id_idx on public.creative_place_images (place_id);
create index creative_place_images_place_sort_order_idx on public.creative_place_images (place_id, sort_order);

alter table public.creative_place_images enable row level security;

create policy "Published creative place gallery images are public"
on public.creative_place_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.creative_places
    where creative_places.id = creative_place_images.place_id
      and (creative_places.status = 'published' or creative_places.created_by = auth.uid())
  )
  or public.is_admin()
);

create policy "Place creators and admins create creative place gallery images"
on public.creative_place_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creative_places
    where creative_places.id = creative_place_images.place_id
      and (creative_places.created_by = auth.uid() or public.is_admin())
  )
);

create policy "Place creators and admins update creative place gallery images"
on public.creative_place_images
for update
to authenticated
using (
  exists (
    select 1
    from public.creative_places
    where creative_places.id = creative_place_images.place_id
      and (creative_places.created_by = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.creative_places
    where creative_places.id = creative_place_images.place_id
      and (creative_places.created_by = auth.uid() or public.is_admin())
  )
);

create policy "Place creators and admins delete creative place gallery images"
on public.creative_place_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.creative_places
    where creative_places.id = creative_place_images.place_id
      and (creative_places.created_by = auth.uid() or public.is_admin())
  )
);

grant select on public.creative_place_images to anon, authenticated;
grant insert, update, delete on public.creative_place_images to authenticated;

create policy "Public read published creative place gallery media by exact path"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'creative-places'
  and exists (
    select 1
    from public.creative_place_images
    join public.creative_places on creative_places.id = creative_place_images.place_id
    where creative_place_images.image_url = storage.objects.name
      and creative_places.status = 'published'
  )
);
