-- Migration: 20260914113000_fix_profile_insert_rls.sql
-- Description: Allow authenticated users to create their own profile as creator or user during onboarding,
-- and allow role transition between user and creator while strictly preventing non-admin escalation to admin.

-- 1. Drop existing restrictive insert policy that only permitted role = 'user'
drop policy if exists "Users create their own default profile" on public.profiles;

-- 2. Create updated insert policy allowing authenticated users to create their own profile
-- Strictly verifies ownership with id = auth.uid() and restricts roles to 'user' or 'creator' (no self-assigned 'admin')
create policy "Users create their own profile" on public.profiles
for insert to authenticated
with check (
  id = auth.uid()
  and role in ('user', 'creator')
);

-- 3. Update prevent_profile_role_escalation trigger function to allow creator transition
-- while ensuring ONLY admins can grant, modify, or revoke the 'admin' role
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role = 'admin' or old.role = 'admin' then
      raise exception 'Only an admin can grant or revoke admin role';
    end if;
  end if;
  return new;
end;
$$;
