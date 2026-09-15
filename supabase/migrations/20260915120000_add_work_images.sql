-- Additional private gallery media for artworks.
-- Cover media remains in works.image_url and is unchanged.

create table public.work_images (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index work_images_work_id_idx on public.work_images (work_id);
create index work_images_work_sort_order_idx on public.work_images (work_id, sort_order);

alter table public.work_images enable row level security;

grant select on public.work_images to anon, authenticated;
grant insert, update, delete on public.work_images to authenticated;

create policy "Published work gallery images are public"
on public.work_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and works.status = 'published'
      and artists.status = 'published'
  )
  or exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and artists.profile_id = auth.uid()
      and split_part(work_images.image_path, '/', 1) = artists.profile_id::text
  )
  or public.is_admin()
);

create policy "Creators insert their own work gallery images"
on public.work_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and artists.profile_id = auth.uid()
      and split_part(work_images.image_path, '/', 1) = artists.profile_id::text
  )
  or public.is_admin()
);

create policy "Creators update their own work gallery images"
on public.work_images
for update
to authenticated
using (
  exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and artists.profile_id = auth.uid()
      and split_part(work_images.image_path, '/', 1) = artists.profile_id::text
  )
  or public.is_admin()
)
with check (
  exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and artists.profile_id = auth.uid()
      and split_part(work_images.image_path, '/', 1) = artists.profile_id::text
  )
  or public.is_admin()
);

create policy "Creators delete their own work gallery images"
on public.work_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.works
    join public.artists on artists.id = works.artist_id
    where works.id = work_images.work_id
      and artists.profile_id = auth.uid()
  )
  or public.is_admin()
);

create policy "Anon read published work gallery media by exact path"
on storage.objects
for select
to anon
using (
  bucket_id = 'works'
  and storage.allow_only_operation('storage.object.get_signed')
  and exists (
    select 1
    from public.work_images
    join public.works on works.id = work_images.work_id
    join public.artists on artists.id = works.artist_id
    where work_images.image_path = storage.objects.name
      and works.status = 'published'
      and artists.status = 'published'
  )
);

create policy "Authenticated read published work gallery media by exact path"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'works'
  and storage.allow_only_operation('storage.object.get_signed')
  and exists (
    select 1
    from public.work_images
    join public.works on works.id = work_images.work_id
    join public.artists on artists.id = works.artist_id
    where work_images.image_path = storage.objects.name
      and works.status = 'published'
      and artists.status = 'published'
  )
);
