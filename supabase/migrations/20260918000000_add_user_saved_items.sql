-- Migration to add user_saved_items for bookmark/save feature

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'saved_item_type') THEN
        CREATE TYPE saved_item_type AS ENUM ('artist', 'work', 'event', 'place', 'article');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type saved_item_type NOT NULL,
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_user_saved_item UNIQUE (profile_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_items_profile ON public.user_saved_items(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_saved_items_lookup ON public.user_saved_items(profile_id, item_type, item_id);

ALTER TABLE public.user_saved_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_saved_items' AND policyname = 'Users can view their own saved items'
    ) THEN
        CREATE POLICY "Users can view their own saved items"
            ON public.user_saved_items FOR SELECT
            TO authenticated
            USING (auth.uid() = profile_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_saved_items' AND policyname = 'Users can insert their own saved items'
    ) THEN
        CREATE POLICY "Users can insert their own saved items"
            ON public.user_saved_items FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = profile_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_saved_items' AND policyname = 'Users can delete their own saved items'
    ) THEN
        CREATE POLICY "Users can delete their own saved items"
            ON public.user_saved_items FOR DELETE
            TO authenticated
            USING (auth.uid() = profile_id);
    END IF;
END $$;
