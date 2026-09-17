-- Enforce claim eligibility: an Artist is claimed (not claimable) whenever its owner
-- profile has a role other than 'admin' (e.g. 'creator' or 'user'). Only Admin-owned
-- Artists remain claimable.

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
      and p.role <> 'admin'
  );
$$;

grant execute on function public.is_artist_claimed(uuid) to anon, authenticated;
