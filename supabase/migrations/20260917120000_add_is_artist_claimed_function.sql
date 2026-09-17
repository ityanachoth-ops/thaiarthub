-- Add a SECURITY DEFINER helper that returns whether an artist profile has been
-- claimed by a non-admin user.
--
-- Rationale: artists.profile_id is NOT NULL and always points to a real profile.
-- Seeded/admin-created artists have profile_id pointing to an admin profile.
-- After a claim is approved (approveClaimAction), profile_id is reassigned to the
-- claimant's profile (role 'creator' or 'user').
--
-- The RLS policy on profiles only permits a user to read their own row (or admins
-- to read all rows), so application code cannot read another user's profile.role
-- directly. This function runs with elevated privileges (SECURITY DEFINER) to
-- perform the join internally and return only a boolean — no profile or claim data
-- is exposed to the caller.
--
-- Usage from application:
--   select public.is_artist_claimed('<artist_uuid>');
--
-- Returns:
--   true  — the artist's profile_id points to a profile with role 'user' or 'creator'
--           (i.e. a real creator owns the profile)
--   false — the artist's profile_id points to an admin profile (seeded, unclaimed)
--           or the artist row does not exist

create or replace function public.is_artist_claimed(p_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.artists a
    join public.profiles p on p.id = a.profile_id
    where a.id = p_artist_id
      and p.role in ('user', 'creator')
  );
$$;

-- Allow both anonymous visitors and authenticated users to call this function.
-- It returns only a boolean and cannot be used to read profile or claim data.
grant execute on function public.is_artist_claimed(uuid) to anon, authenticated;
