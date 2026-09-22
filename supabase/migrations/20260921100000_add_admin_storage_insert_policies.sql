-- Migration: 20260921100000_add_admin_storage_insert_policies.sql
-- Description: Allow admins to upload files to the 'works' and 'artist-covers'
-- buckets under any folder prefix.
--
-- Background: The existing "Creators upload their own work media" policy restricts
-- INSERT to rows where (storage.foldername(name))[1] = auth.uid(), meaning the
-- first path segment must equal the uploader's own profile ID.
--
-- When an admin manages works or cover images on behalf of an artist (e.g. via
-- /dashboard/artists/[id]/artworks/new or /dashboard/artists/[id]/edit), the upload
-- path uses the artist owner's profile_id as the first segment so that the creator
-- can access/delete those files after a claim. Because the admin's auth.uid() differs
-- from the artist owner's profile_id, the existing policy blocks the upload.
--
-- These two policies give admins an unconditional INSERT bypass for those two buckets,
-- mirroring the unconditional SELECT and UPDATE/DELETE bypass they already have via
-- the "Users read their own media and admins read all media" and
-- "Users update or delete their own media" policies in the V1 migration.
--
-- The 'avatars' bucket is intentionally excluded: admin-uploaded avatar paths for
-- artists already use the admin's own profile_id as the first segment (via
-- uploadAdminArtistImage), so the existing policy covers that case.

create policy "Admins upload to works bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'works'
  and public.is_admin()
);

create policy "Admins upload to artist-covers bucket"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artist-covers'
  and public.is_admin()
);
