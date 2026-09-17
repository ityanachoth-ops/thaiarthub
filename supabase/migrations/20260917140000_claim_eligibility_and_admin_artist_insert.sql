-- Claim eligibility: an Artist is claimed (not claimable) only when its current
-- owner profile has role = 'creator'. Admin-owned Artists remain claimable.
--
-- Also allow an admin to INSERT an Artist assigned to a creator profile, and
-- drop the 1:1 unique constraint on artists.profile_id so an admin can own
-- multiple unclaimed Artists. Creator-owned uniqueness is still enforced in
-- the admin create action. This is not a new ownership model.

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
      and p.role = 'creator'
  );
$$;

grant execute on function public.is_artist_claimed(uuid) to anon, authenticated;

alter table public.artists drop constraint if exists artists_profile_id_key;

create index if not exists artists_profile_id_idx on public.artists (profile_id);

drop policy if exists "Users can create their own claims" on public.claim_requests;

create policy "Users can create their own claims"
on public.claim_requests
for insert
to authenticated
with check (
  requester_profile_id = auth.uid()
  and status = 'pending'
  and not public.is_artist_claimed(artist_id)
);

drop policy if exists "Creators create their own artist" on public.artists;

create policy "Creators create their own artist"
on public.artists
for insert
to authenticated
with check (
  (
    profile_id = auth.uid()
    and public.is_creator_or_admin()
  )
  or (
    public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and p.role in ('admin', 'creator')
    )
  )
);
