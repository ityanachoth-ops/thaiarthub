-- Add an optional creation year for creator-managed artworks.
-- Nullable so existing works remain valid until a creator supplies the value.
alter table public.works
add column year integer check (year is null or year between 1000 and 9999);
