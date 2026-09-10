-- Thaiarthub V1: discovery data, authentication ownership, and private media storage.

create type public.profile_role as enum ('user', 'creator', 'admin');
create type public.content_status as enum ('draft', 'published');
create type public.event_status as enum ('draft', 'published', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) > 0),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 1500),
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,159}$'),
  bio text,
  cover_image_url text,
  avatar_url text,
  location text,
  website_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  contact_url text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artist_categories (
  artist_id uuid not null references public.artists(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (artist_id, category_id)
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,159}$'),
  description text,
  image_url text,
  external_url text,
  type text not null check (char_length(trim(type)) > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,159}$'),
  description text,
  cover_image_url text,
  venue_name text,
  address text,
  province text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  start_at timestamptz not null,
  end_at timestamptz,
  external_url text,
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_at is null or end_at >= start_at)
);

create table public.event_artists (
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  primary key (event_id, artist_id)
);

create index artists_status_created_at_idx on public.artists (status, created_at desc);
create index works_artist_id_idx on public.works (artist_id);
create index works_status_created_at_idx on public.works (status, created_at desc);
create index events_status_start_at_idx on public.events (status, start_at);
create index artist_categories_category_id_idx on public.artist_categories (category_id);
create index event_artists_artist_id_idx on public.event_artists (artist_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger artists_set_updated_at before update on public.artists
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger works_set_updated_at before update on public.works
for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_creator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('creator', 'admin')
  );
$$;

create function public.owns_artist(target_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artists where id = target_artist_id and profile_id = auth.uid()
  );
$$;

create function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.role is distinct from old.role then
    raise exception 'Only an admin can change a profile role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.categories enable row level security;
alter table public.artist_categories enable row level security;
alter table public.works enable row level security;
alter table public.events enable row level security;
alter table public.event_artists enable row level security;

create policy "Profiles are visible to their owner or admins" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Users create their own default profile" on public.profiles
for insert to authenticated with check (id = auth.uid() and role = 'user');
create policy "Owners update their profile and admins manage profiles" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "Admins delete profiles" on public.profiles
for delete to authenticated using (public.is_admin());

create policy "Published artists are public" on public.artists
for select using (status = 'published' or public.owns_artist(id) or public.is_admin());
create policy "Creators create their own artist" on public.artists
for insert to authenticated with check (profile_id = auth.uid() and public.is_creator_or_admin());
create policy "Creators update their own artist" on public.artists
for update to authenticated using (public.owns_artist(id) or public.is_admin()) with check ((profile_id = auth.uid() and public.is_creator_or_admin()) or public.is_admin());
create policy "Admins delete artists" on public.artists
for delete to authenticated using (public.is_admin());

create policy "Categories are public" on public.categories
for select using (true);
create policy "Admins manage categories" on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Published artist categories are public" on public.artist_categories
for select using (
  exists (select 1 from public.artists where artists.id = artist_id and artists.status = 'published')
  or public.owns_artist(artist_id) or public.is_admin()
);
create policy "Creators manage their artist categories" on public.artist_categories
for all to authenticated using (public.owns_artist(artist_id) or public.is_admin()) with check (public.owns_artist(artist_id) or public.is_admin());

create policy "Published works are public" on public.works
for select using (status = 'published' or public.owns_artist(artist_id) or public.is_admin());
create policy "Creators create works for their artist" on public.works
for insert to authenticated with check (public.owns_artist(artist_id) and public.is_creator_or_admin());
create policy "Creators update their works" on public.works
for update to authenticated using (public.owns_artist(artist_id) or public.is_admin()) with check ((public.owns_artist(artist_id) and public.is_creator_or_admin()) or public.is_admin());
create policy "Creators delete their works" on public.works
for delete to authenticated using (public.owns_artist(artist_id) or public.is_admin());

create policy "Published events are public" on public.events
for select using (status = 'published' or public.is_admin());
create policy "Admins manage events" on public.events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Published event artists are public" on public.event_artists
for select using (
  (exists (select 1 from public.events where events.id = event_id and events.status = 'published')
   and exists (select 1 from public.artists where artists.id = artist_id and artists.status = 'published'))
  or public.is_admin()
);
create policy "Admins manage event artists" on public.event_artists
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.artists, public.categories, public.artist_categories, public.works, public.events, public.event_artists to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.artists, public.categories, public.artist_categories, public.works, public.events, public.event_artists to authenticated;

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('artist-covers', 'artist-covers', false),
  ('works', 'works', false),
  ('events', 'events', false)
on conflict (id) do nothing;

create policy "Users read their own media and admins read all media" on storage.objects
for select to authenticated using (
  (bucket_id in ('avatars', 'artist-covers', 'works') and owner_id = auth.uid())
  or public.is_admin()
);
create policy "Users upload their own avatar" on storage.objects
for insert to authenticated with check (
  bucket_id = 'avatars' and owner_id = auth.uid() and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Creators upload their own work media" on storage.objects
for insert to authenticated with check (
  bucket_id in ('artist-covers', 'works') and owner_id = auth.uid()
  and public.is_creator_or_admin() and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users update or delete their own media" on storage.objects
for all to authenticated using (
  ((bucket_id in ('avatars', 'artist-covers', 'works') and owner_id = auth.uid()) or public.is_admin())
) with check (
  ((bucket_id = 'avatars' and owner_id = auth.uid() and (storage.foldername(name))[1] = auth.uid()::text)
   or (bucket_id in ('artist-covers', 'works') and owner_id = auth.uid() and public.is_creator_or_admin() and (storage.foldername(name))[1] = auth.uid()::text)
   or public.is_admin())
);
create policy "Admins manage event media" on storage.objects
for all to authenticated using (bucket_id = 'events' and public.is_admin()) with check (bucket_id = 'events' and public.is_admin());
