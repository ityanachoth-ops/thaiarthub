-- Migration: 20260922080000_add_sort_order_to_creative_places.sql
-- Description: Add sort_order column to creative_places for drag-and-drop ordering

-- Add sort_order column with default 0
alter table public.creative_places
add column if not exists sort_order integer not null default 0;

-- Create index for efficient ordering
create index if not exists creative_places_sort_order_idx on public.creative_places (sort_order);

-- Set sort_order for existing records based on created_at order
-- This preserves the current visual order for existing data
with numbered as (
  select id, row_number() over (order by created_at asc) as rn
  from public.creative_places
)
update public.creative_places cp
set sort_order = n.rn
from numbered n
where cp.id = n.id;