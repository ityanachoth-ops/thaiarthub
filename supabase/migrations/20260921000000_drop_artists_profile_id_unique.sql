-- Migration: 20260921000000_drop_artists_profile_id_unique.sql
-- Description: Ensure the unique constraint on artists.profile_id is dropped so that
-- an admin can create multiple claimable artists (each pointing to the admin's profile_id
-- as the temporary owner, until a creator claims it).
--
-- Background: Migration 20260917140000_claim_eligibility_and_admin_artist_insert.sql
-- already contains this DROP, but production may not have applied it if that migration
-- was skipped or partially applied. This migration makes it explicit and idempotent.
--
-- The uniqueness invariant for creator-owned artists is enforced in application code
-- (createAdminArtistAction checks for existing artist before inserting when ownership = "creator").
-- The database-level unique index on profile_id is replaced by a non-unique index for query performance.

alter table public.artists drop constraint if exists artists_profile_id_key;

create index if not exists artists_profile_id_idx on public.artists (profile_id);
