import "server-only";

import { z } from "zod";

// ⚠️ ASSUMPTION — align this import with src/modules/artworks/queries.ts.
// Expected: a cookie-scoped anon-key server client. Never service-role.
import { createClient } from "@/lib/supabase/server";
import type { GalleryImage } from "@/modules/culture/types";
import type { Database, EventStatus } from "@/types/database.types";

/** Mirrors the DB CHECK constraint in *_thaiarthub_v1.sql */
export const EVENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,159}$/;

export const eventSlugSchema = z
  .string()
  .trim()
  .regex(EVENT_SLUG_PATTERN, "รูปแบบ slug ของกิจกรรมไม่ถูกต้อง");

const EVENTS_BUCKET = "events";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const EVENT_LIST_COLUMNS =
  "id, title, slug, cover_image_url, cover_position, venue_name, province, start_at, end_at, is_featured";

const EVENT_DETAIL_COLUMNS =
  "id, title, slug, description, cover_image_url, cover_position, venue_name, address, province, latitude, longitude, start_at, end_at, external_url, status, is_featured";

export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  coverPosition: string;
  venueName: string | null;
  province: string | null;
  startAt: string;
  endAt: string | null;
  isFeatured: boolean;
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
  status: EventStatus;
  artists: EventRelatedArtist[];
  gallery: GalleryImage[];
};

/** Storage paths are intentionally available only to authenticated admin views. */
export type AdminEventDetail = EventDetail & {
  coverImagePath: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type EventGalleryRow = Database["public"]["Tables"]["event_images"]["Row"];

async function getEventGalleries(
  supabase: SupabaseServerClient,
  eventIds: string[],
  includeStoragePaths = false,
): Promise<Map<string, GalleryImage[]>> {
  const galleries = new Map<string, GalleryImage[]>();
  if (eventIds.length === 0) return galleries;

  const { data, error } = await supabase
    .from("event_images")
    .select("id, event_id, image_url, sort_order, caption")
    .in("event_id", eventIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`ไม่สามารถโหลดแกลเลอรีกิจกรรมได้: ${error.message}`);

  const rows = (data ?? []) as EventGalleryRow[];
  const paths = rows.map((row) => row.image_url).filter((path) => !isAbsoluteUrl(path));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(EVENTS_BUCKET)
      .createSignedUrls(Array.from(new Set(paths)), SIGNED_URL_TTL_SECONDS);
    for (const item of signedData ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  for (const row of rows) {
    const gallery = galleries.get(row.event_id) ?? [];
    gallery.push({
      id: row.id,
      ...(includeStoragePaths ? { imagePath: row.image_url } : {}),
      imageUrl: isAbsoluteUrl(row.image_url) ? row.image_url : signed.get(row.image_url) ?? null,
      sortOrder: row.sort_order,
      caption: row.caption,
    });
    galleries.set(row.event_id, gallery);
  }

  return galleries;
}

async function getEventGallery(
  supabase: SupabaseServerClient,
  eventId: string,
  includeStoragePaths = false,
): Promise<GalleryImage[]> {
  const galleries = await getEventGalleries(supabase, [eventId], includeStoragePaths);
  return galleries.get(eventId) ?? [];
}

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
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: row.venue_name,
    province: row.province,
    startAt: row.start_at,
    endAt: row.end_at,
    isFeatured: row.is_featured,
  }));
}

export async function getFeaturedEvents(limit = 3): Promise<EventListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`ไม่สามารถโหลดกิจกรรมเด่นได้: ${error.message}`);

  const rows = data ?? [];
  const signedUrls = await signCoverUrls(
    supabase,
    rows.map((row) => row.cover_image_url).filter((value): value is string => Boolean(value)),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImageUrl: row.cover_image_url
      ? isAbsoluteUrl(row.cover_image_url)
        ? row.cover_image_url
        : signedUrls.get(row.cover_image_url) ?? null
      : null,
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: row.venue_name,
    province: row.province,
    startAt: row.start_at,
    endAt: row.end_at,
    isFeatured: row.is_featured,
  }));
}

/** Published events linked to one artist through the public junction table. */
export async function getPublishedEventsByArtistId(
  artistId: string,
): Promise<EventListItem[]> {
  const supabase = await createClient();
  const { data: links, error: linkError } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistId);

  if (linkError) {
    throw new Error(`ไม่สามารถโหลดกิจกรรมของศิลปินได้: ${linkError.message}`);
  }

  const eventIds = Array.from(new Set((links ?? []).map((link) => link.event_id)));
  if (eventIds.length === 0) return [];

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_COLUMNS)
    .in("id", eventIds)
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`ไม่สามารถโหลดกิจกรรมของศิลปินได้: ${error.message}`);
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
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: row.venue_name,
    province: row.province,
    startAt: row.start_at,
    endAt: row.end_at,
    isFeatured: row.is_featured,
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

  const [coverImageUrl, artists, gallery] = await Promise.all([
    signCoverUrl(supabase, data.cover_image_url),
    getPublishedEventArtists(supabase, data.id),
    getEventGallery(supabase, data.id),
  ]);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    coverImageUrl,
    coverPosition: (data as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: data.venue_name,
    address: data.address,
    province: data.province,
    latitude: data.latitude,
    longitude: data.longitude,
    startAt: data.start_at,
    endAt: data.end_at,
    externalUrl: data.external_url,
    status: data.status,
    isFeatured: data.is_featured,
    artists,
    gallery,
  };
}

export async function getAdminEvents(): Promise<AdminEventDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .order("start_at", { ascending: true });

  if (error) throw new Error(`ไม่สามารถโหลดรายการกิจกรรมจัดการได้: ${error.message}`);

  const rows = data ?? [];
  const signedUrls = await signCoverUrls(
    supabase,
    rows.map((row) => row.cover_image_url).filter((value): value is string => Boolean(value)),
  );
  const galleries = await getEventGalleries(supabase, rows.map((row) => row.id), true);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImagePath: row.cover_image_url,
    coverImageUrl: row.cover_image_url
      ? isAbsoluteUrl(row.cover_image_url)
        ? row.cover_image_url
        : signedUrls.get(row.cover_image_url) ?? null
      : null,
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: row.venue_name,
    province: row.province,
    startAt: row.start_at,
    endAt: row.end_at,
    description: row.description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    externalUrl: row.external_url,
    status: row.status,
    isFeatured: row.is_featured,
    artists: [],
    gallery: galleries.get(row.id) ?? [],
  }));
}

export async function getAdminEventById(id: string): Promise<AdminEventDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดกิจกรรมได้: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    coverImagePath: data.cover_image_url,
    coverImageUrl: await signCoverUrl(supabase, data.cover_image_url),
    coverPosition: (data as { cover_position?: string }).cover_position ?? "50% 50%",
    venueName: data.venue_name,
    province: data.province,
    startAt: data.start_at,
    endAt: data.end_at,
    description: data.description,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    externalUrl: data.external_url,
    status: data.status,
    isFeatured: data.is_featured,
    artists: [],
    gallery: await getEventGallery(supabase, data.id),
  };
}
