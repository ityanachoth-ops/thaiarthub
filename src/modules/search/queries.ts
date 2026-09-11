import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ArtistListItem } from "@/modules/artists/queries";
import type { ArtworkListItem } from "@/modules/artworks/queries";
import type { EventListItem } from "@/modules/events/queries";

export type SearchResults = {
  artists: ArtistListItem[];
  artworks: ArtworkListItem[];
  events: EventListItem[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function signPaths(
  supabase: SupabaseServerClient,
  bucket: string,
  paths: string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const storagePaths = Array.from(
    new Set(paths.filter((path) => path && !isAbsoluteUrl(path))),
  );

  if (storagePaths.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return resolved;

  for (const item of data) {
    if (item.path && item.signedUrl) resolved.set(item.path, item.signedUrl);
  }

  return resolved;
}

function resolveUrl(
  raw: string | null,
  signed: Map<string, string>,
): string | null {
  if (!raw) return null;
  if (isAbsoluteUrl(raw)) return raw;
  return signed.get(raw) ?? null;
}

function sanitizeSearchQuery(q: string) {
  return q.replace(/[%_]/g, "\\$&");
}

export async function performSearch(params: {
  q: string;
  category: string | null;
  type: "artist" | "artwork" | "event" | "all";
}): Promise<SearchResults> {
  const supabase = await createClient();
  const { q, category, type } = params;
  const searchPattern = `%${sanitizeSearchQuery(q)}%`;

  const results: SearchResults = { artists: [], artworks: [], events: [] };

  // 1. Search Artists
  if (type === "all" || type === "artist") {
    let fetchArtists = true;
    let artistIds: string[] | null = null;

    if (category) {
      const { data: artistCategories } = await supabase
        .from("artist_categories")
        .select("artist_id")
        .eq("category_id", category);

      artistIds = artistCategories?.map((r) => r.artist_id) || [];

      if (artistIds.length === 0) {
        // ไม่มี artist ใน category นี้
        fetchArtists = false;
        results.artists = [];
      }
    }

    if (fetchArtists) {
      let query = supabase
        .from("artists")
        .select("id, slug, name, location, cover_image_url, status")
        .eq("status", "published");

      if (category && artistIds && artistIds.length > 0) {
        query = query.in("id", artistIds);
      }

      if (q) {
        query = query.or(`name.ilike.${searchPattern},location.ilike.${searchPattern}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        const covers = await signPaths(supabase, "artist-covers", data.map(a => a.cover_image_url).filter(Boolean) as string[]);
        results.artists = data.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          location: a.location,
          avatarUrl: null,
          coverUrl: resolveUrl(a.cover_image_url, covers),
          categories: [],
        }));
      }
    }
  }

  // 2. Search Artworks
  if (type === "all" || type === "artwork") {
    let fetchArtworks = true;
    let artistIds: string[] | null = null;

    if (category) {
      const { data: artistCategories } = await supabase
        .from("artist_categories")
        .select("artist_id")
        .eq("category_id", category);

      artistIds = artistCategories?.map((r) => r.artist_id) || [];

      if (artistIds.length === 0) {
        // ไม่มี artist ใน category นี้
        fetchArtworks = false;
        results.artworks = [];
      }
    }

    if (fetchArtworks) {
      let query = supabase
        .from("works")
        .select("id, slug, title, type, image_url, artist_id, artists(slug, name)")
        .eq("status", "published");

      if (category && artistIds && artistIds.length > 0) {
        query = query.in("artist_id", artistIds);
      }

      if (q) {
        query = query.or(`title.ilike.${searchPattern},type.ilike.${searchPattern}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        const images = await signPaths(supabase, "works", data.map(w => w.image_url).filter(Boolean) as string[]);
        
        type ArtworkRow = Omit<(typeof data)[number], "artists"> & {
  artists: {
    slug: string;
    name: string;
  }[];
};

results.artworks = data.map((w: ArtworkRow) => ({
  id: w.id,
  slug: w.slug,
  title: w.title,
  type: w.type,
  imageUrl: resolveUrl(w.image_url, images),
  artist: w.artists.length > 0
  ? {
      slug: w.artists[0].slug,
      name: w.artists[0].name,
    }
  : null,
        }));
      }
    }
  }

  // 3. Search Events
  if (type === "all" || type === "event") {
    let fetchEvents = true;
    let eventIds: string[] | null = null;

    if (category) {
      const { data: artistCategories } = await supabase
        .from("artist_categories")
        .select("artist_id")
        .eq("category_id", category);

      const artistIds = artistCategories?.map((r) => r.artist_id) || [];

      if (artistIds.length === 0) {
        // ไม่มี artist ใน category นี้
        fetchEvents = false;
        results.events = [];
      } else {
        const { data: eventArtists } = await supabase
          .from("event_artists")
          .select("event_id")
          .in("artist_id", artistIds);

        eventIds = eventArtists?.map((r) => r.event_id) || [];

        if (eventIds.length === 0) {
          // ไม่มี event ที่เกี่ยวข้อง
          fetchEvents = false;
          results.events = [];
        }
      }
    }

    if (fetchEvents) {
      let query = supabase
        .from("events")
        .select("id, title, slug, cover_image_url, venue_name, province, start_at, end_at")
        .eq("status", "published");

      if (category && eventIds && eventIds.length > 0) {
        query = query.in("id", eventIds);
      }

      if (q) {
        query = query.or(`title.ilike.${searchPattern},venue_name.ilike.${searchPattern},province.ilike.${searchPattern}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        const covers = await signPaths(supabase, "events", data.map(e => e.cover_image_url).filter(Boolean) as string[]);
        results.events = data.map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          coverImageUrl: resolveUrl(e.cover_image_url, covers),
          venueName: e.venue_name,
          province: e.province,
          startAt: e.start_at,
          endAt: e.end_at,
        }));
      }
    }
  }

  return results;
}