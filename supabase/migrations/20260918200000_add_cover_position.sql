-- Add cover_position to all entities that have a cover image.
-- Stored as CSS object-position string, e.g. "50% 50%" or "30% 70%".
-- Default is "50% 50%" (centre) so existing rows get the same appearance as before.

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';

ALTER TABLE public.creative_places
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT '50% 50%';
