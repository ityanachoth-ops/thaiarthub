-- Event cover media lives alongside gallery media in the private events bucket.
-- The existing "Admins manage event media" policy keeps gallery management intact.
-- These cover-specific policies document and enforce the expected upload shape.

drop policy if exists "Admins upload event cover images" on storage.objects;
drop policy if exists "Admins update event cover images" on storage.objects;
drop policy if exists "Admins delete event cover images" on storage.objects;

create policy "Admins upload event cover images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'events'
  and public.is_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[3] = 'cover'
  and array_length(storage.foldername(name), 1) = 4
);

create policy "Admins update event cover images"
on storage.objects for update to authenticated
using (
  bucket_id = 'events'
  and public.is_admin()
  and (storage.foldername(name))[3] = 'cover'
  and array_length(storage.foldername(name), 1) = 4
)
with check (
  bucket_id = 'events'
  and public.is_admin()
  and (storage.foldername(name))[3] = 'cover'
  and array_length(storage.foldername(name), 1) = 4
);

create policy "Admins delete event cover images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'events'
  and public.is_admin()
  and (storage.foldername(name))[3] = 'cover'
  and array_length(storage.foldername(name), 1) = 4
);
