-- Claim requests for artist profile ownership claims
-- V1: users can request ownership of an existing Artist profile.
-- Admin can review, approve, or reject claims.

create table public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  verification_url text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index claim_requests_artist_status_idx on public.claim_requests (artist_id, status);
create index claim_requests_requester_status_idx on public.claim_requests (requester_profile_id, status);

create unique index claim_requests_unique_pending
on public.claim_requests (artist_id, requester_profile_id)
where status = 'pending';

create trigger claim_requests_set_updated_at
before update on public.claim_requests
for each row execute function public.set_updated_at();

alter table public.claim_requests enable row level security;

-- Users can read their own claim requests
create policy "Users can read their own claims"
on public.claim_requests
for select
to authenticated
using (requester_profile_id = auth.uid() or public.is_admin());

-- Authenticated users can create claims for themselves
create policy "Users can create their own claims"
on public.claim_requests
for insert
to authenticated
with check (
  requester_profile_id = auth.uid()
  and status = 'pending'
);

-- Users can update their own claims (cancel pending, or respond to rejection)
create policy "Users can update their own claims"
on public.claim_requests
for update
to authenticated
using (requester_profile_id = auth.uid() or public.is_admin())
with check (requester_profile_id = auth.uid() or public.is_admin());

-- Only admins can review, approve, or reject
create policy "Admins can manage claims"
on public.claim_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.claim_requests to authenticated;
grant insert, update, delete on public.claim_requests to authenticated;
