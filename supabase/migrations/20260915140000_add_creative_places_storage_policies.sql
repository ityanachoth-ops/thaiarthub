-- Private cover media storage for creative places.
-- Database table and row policies are defined in 20260915130000_add_creative_places.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-places',
  'creative-places',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Creative place owners and admins read cover media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'creative-places'
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()::text
      and exists (
        select 1
        from public.creative_places
        where creative_places.id::text = (storage.foldername(storage.objects.name))[2]
          and creative_places.created_by = auth.uid()
          and (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      )
    )
  )
);

create policy "Creative place owners and admins upload cover media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'creative-places'
  and owner_id = auth.uid()::text
  and (public.is_admin() or (storage.foldername(storage.objects.name))[1] = auth.uid()::text)
  and (storage.foldername(storage.objects.name))[1] = auth.uid()::text
);

create policy "Creative place owners and admins update cover media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'creative-places'
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()::text
      and (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      and exists (
        select 1
        from public.creative_places
        where creative_places.id::text = (storage.foldername(storage.objects.name))[2]
          and creative_places.created_by = auth.uid()
      )
    )
  )
)
with check (
  bucket_id = 'creative-places'
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()::text
      and (storage.foldername(storage.objects.name))[1] = auth.uid()::text
      and exists (
        select 1
        from public.creative_places
        where creative_places.id::text = (storage.foldername(storage.objects.name))[2]
          and creative_places.created_by = auth.uid()
      )
    )
  )
);

create policy "Creative place owners and admins delete cover media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'creative-places'
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()::text
      and (storage.foldername(storage.objects.name))[1] = auth.uid()::text
    )
  )
);
