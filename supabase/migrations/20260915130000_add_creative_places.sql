-- Creative places foundation for future map integration.
-- This migration intentionally adds database/RLS only; no UI or query changes.

create table public.creative_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  type text not null,
  address text,
  province text,
  latitude double precision,
  longitude double precision,
  external_url text,
  status text not null default 'draft',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creative_places_latitude_check
    check (latitude is null or latitude between -90 and 90),
  constraint creative_places_longitude_check
    check (longitude is null or longitude between -180 and 180),
  constraint creative_places_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint creative_places_type_check
    check (type in (
      'gallery',
      'art-space',
      'studio',
      'livehouse',
      'creative-cafe',
      'local-brand',
      'skate',
      'craft',
      'vintage',
      'zine',
      'other'
    ))
);

create index creative_places_status_idx on public.creative_places (status);
create index creative_places_province_idx on public.creative_places (province);
create index creative_places_type_idx on public.creative_places (type);
create index creative_places_coordinates_idx
  on public.creative_places (latitude, longitude);

create trigger creative_places_set_updated_at
before update on public.creative_places
for each row execute function public.set_updated_at();

alter table public.creative_places enable row level security;

grant select on public.creative_places to anon, authenticated;
grant insert, update, delete on public.creative_places to authenticated;

create policy "Published creative places are public"
on public.creative_places
for select
to anon, authenticated
using (status = 'published' or created_by = auth.uid() or public.is_admin());

create policy "Users create their own creative places"
on public.creative_places
for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin());

create policy "Users update their own creative places"
on public.creative_places
for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy "Users delete their own creative places"
on public.creative_places
for delete
to authenticated
using (created_by = auth.uid() or public.is_admin());
