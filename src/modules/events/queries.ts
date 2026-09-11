import "server-only";

import { z } from "zod";

// ⚠️ ASSUMPTION — align this import with src/modules/artworks/queries.ts.
// Expected: a cookie-scoped anon-key server client. Never service-role.
import { createClient } from "@/lib/supabase/server";

/** Mirrors the DB CHECK constraint in *_thaiarthub_v1.sql */
export const EVENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,159}$/;

export const eventSlugSchema = z
  .string()
  .trim()
  .regex(EVENT_SLUG_PATTERN, "รูปแบบ slug ของกิจกรรมไม่ถูกต้อง");

const EVENTS_BUCKET = "events";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const EVENT_LIST_COLUMNS =
  "id, title, slug, cover_image_url, venue_name, province, start_at, end_at";

const EVENT_DETAIL_COLUMNS =
  "id, title, slug, description, cover_image_url, venue_name, address, province, latitude, longitude, start_at, end_at, external_url";

export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  venueName: string | null;
  province: string | null;
  startAt: string;
  endAt: string | null;
};

export type EventRelatedArtist = {
  id: string;
  name: string;
  slug: string;
};

export type EventDetail = EventListItem & {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  externalUrl: string | null;
  artists: EventRelatedArtist[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Buckets are private. cover_image_url is expected to hold an object path
 * ({event_id}/{filename}). Absolute URLs are passed through unchanged so
 * legacy/external rows do not break the page.
 */
async function signCoverUrl(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  if (isAbsoluteUrl(path)) return path;

  const { data, error } = await supabase.storage
    .from(EVENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Batch variant — one storage round-trip for the whole grid. */
async function signCoverUrls(
  supabase: SupabaseServerClient,
  paths: string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const storagePaths = Array.from(
    new Set(paths.filter((path) => !isAbsoluteUrl(path))),
  );

  if (storagePaths.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(EVENTS_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return resolved;

  for (const item of data) {
    if (item.path && item.signedUrl) {
      resolved.set(item.path, item.signedUrl);
    }
  }

  return resolved;
}

/**
 * Published events, soonest first.
 * status = 'published' excludes both 'draft' and 'cancelled' (event_status enum).
 * Explicit filter is defense-in-depth on top of RLS.
 */
export async function getPublishedEvents(): Promise<EventListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_COLUMNS)
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`ไม่สามารถโหลดรายการกิจกรรมได้: ${error.message}`);
  }

  const rows = data ?? [];

  const signedUrls = await signCoverUrls(
    supabase,
    rows
      .map((row) => row.cover_image_url)
      .filter((value): value is string => Boolean(value)),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImageUrl: row.cover_image_url
      ? isAbsoluteUrl(row.cover_image_url)
        ? row.cover_image_url
        : (signedUrls.get(row.cover_image_url) ?? null)
      : null,
    venueName: row.venue_name,
    province: row.province,
    startAt: row.start_at,
    endAt: row.end_at,
  }));
}

/**
 * Related artists via the event_artists junction (many-to-many).
 *
 * Queried separately from the event itself on purpose: RLS on event_artists
 * already requires BOTH event and artist to be published, and using !inner
 * from the events query would drop events that have no linked artists.
 * Zero related artists is a valid, expected result.
 */
async function getPublishedEventArtists(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<EventRelatedArtist[]> {
  const { data, error } = await supabase
    .from("event_artists")
    .select("artists!inner(id, name, slug, status)")
    .eq("event_id", eventId)
    .eq("artists.status", "published");

  if (error || !data) return [];

  return data.flatMap((row) => {
    // PostgREST returns an object for a to-one embed; normalised defensively.
    const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
    if (!artist) return [];
    return [{ id: artist.id, name: artist.name, slug: artist.slug }];
  });
}

/** Returns null for invalid slug, missing event, or non-published event. */
export async function getPublishedEventBySlug(
  slug: string,
): Promise<EventDetail | null> {
  const parsed = eventSlugSchema.safeParse(slug);
  if (!parsed.success) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .eq("slug", parsed.data)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`ไม่สามารถโหลดข้อมูลกิจกรรมได้: ${error.message}`);
  }

  if (!data) return null;

  const [coverImageUrl, artists] = await Promise.all([
    signCoverUrl(supabase, data.cover_image_url),
    getPublishedEventArtists(supabase, data.id),
  ]);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    coverImageUrl,
    venueName: data.venue_name,
    address: data.address,
    province: data.province,
    latitude: data.latitude,
    longitude: data.longitude,
    startAt: data.start_at,
    endAt: data.end_at,
    externalUrl: data.external_url,
    artists,
  };
}