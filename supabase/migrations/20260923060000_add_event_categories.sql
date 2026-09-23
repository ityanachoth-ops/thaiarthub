-- Migration: 20260923060000_add_event_categories.sql
-- Description: Add event_categories junction table for event-category relationships

create table public.event_categories (
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (event_id, category_id)
);

create index event_categories_event_id_idx on public.event_categories (event_id);
create index event_categories_category_id_idx on public.event_categories (category_id);

alter table public.event_categories enable row level security;

grant select on public.event_categories to anon, authenticated;
grant insert, update, delete on public.event_categories to authenticated;

-- Published event categories are public (via event status)
create policy "Published event categories are public"
on public.event_categories
for select
using (
  exists (
    select 1
    from public.events
    where events.id = event_categories.event_id
      and events.status = 'published'
  )
  or public.is_admin()
);

-- Creators/Admins manage their own event categories
create policy "Creators manage their event categories"
on public.event_categories
for all
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_categories.event_id
      and events.status = 'published'
  )
  or public.is_admin()
  or (
    select created_by from public.events where id = event_categories.event_id
  ) = auth.uid()
)
with check (
  public.is_admin()
  or (
    select created_by from public.events where id = event_categories.event_id
  ) = auth.uid()
);