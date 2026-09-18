import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * `works.image_url` is resolved as a path within the `works` bucket, using
 * the documented convention `{profile_id}/{work_id}/{filename}` (see
 * docs/IMPLEMENTATION_PLAN.md). Unlike `artists.avatar_url`, this is not an
 * open assumption -- the storage RLS policy
 * ("Public can view published work media") requires exactly this two-segment
 * path shape to match a published work row, so upload code and this reader
 * must already agree on it.
 *
 * The `works` bucket is private (`public: false`). Signed URLs are
 * generated here, per request, only for rows already filtered to
 * `status = 'published'`.
 */
const WORKS_BUCKET = "works";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour; regenerated on every render

const workSlugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{2,159}$/);

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ArtistJoinRow = Pick<Database["public"]["Tables"]["artists"]["Row"], "slug" | "name"> | null;

type WorkQueryRow = Pick<
  Database["public"]["Tables"]["works"]["Row"],
  "id" | "slug" | "title" | "description" | "image_url" | "cover_position" | "external_url" | "type"
> & {
  artist: ArtistJoinRow;
};

export interface ArtworkArtistSummary {
  slug: string;
  name: string;
}

export interface ArtworkListItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  imageUrl: string | null;
  coverPosition: string;
  artist: ArtworkArtistSummary | null;
}

export interface ArtworkGalleryImage {
  id: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ArtworkDetail extends ArtworkListItem {
  description: string | null;
  externalUrl: string | null;
  gallery: ArtworkGalleryImage[];
}

const ARTWORK_SELECT = `
  id, slug, title, description, image_url, cover_position, external_url, type,
  artist:artists ( slug, name )
`;

async function resolveWorkImageUrl(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(WORKS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

async function getPublishedWorkGallery(
  supabase: SupabaseServerClient,
  workId: string,
): Promise<ArtworkGalleryImage[]> {
  const { data, error } = await supabase
    .from("work_images")
    .select("id, image_path, sort_order, created_at")
    .eq("work_id", workId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load artwork gallery: ${error.message}`);

  const rows = data ?? [];
  const paths = rows
    .map((row) => row.image_path)
    .filter((path) => !/^https?:\/\//i.test(path));
  const signedUrls = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(WORKS_BUCKET)
      .createSignedUrls(Array.from(new Set(paths)), SIGNED_URL_TTL_SECONDS);
    for (const item of signedData ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    imageUrl: /^https?:\/\//i.test(row.image_path)
      ? row.image_path
      : signedUrls.get(row.image_path) ?? null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

async function toListItem(
  supabase: SupabaseServerClient,
  row: WorkQueryRow,
): Promise<ArtworkListItem> {
  const imageUrl = await resolveWorkImageUrl(supabase, row.image_url);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    imageUrl,
    coverPosition: row.cover_position ?? "50% 50%",
    artist: row.artist ? { slug: row.artist.slug, name: row.artist.name } : null,
  };
}

/**
 * Published works for the public discovery grid. Filters on
 * `status = 'published'` explicitly rather than relying on RLS alone
 * (defense in depth -- RLS still enforces this independently).
 */
export async function getPublishedArtworks(): Promise<ArtworkListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select(ARTWORK_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load published works: ${error.message}`);
  }
  if (!data) return [];

  return Promise.all((data as unknown as WorkQueryRow[]).map((row) => toListItem(supabase, row)));
}

/** Published works belonging to one published artist profile. */
export async function getPublishedArtworksByArtistId(
  artistId: string,
): Promise<ArtworkListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select(ARTWORK_SELECT)
    .eq("artist_id", artistId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load published works for artist: ${error.message}`);
  }
  if (!data) return [];

  return Promise.all((data as unknown as WorkQueryRow[]).map((row) => toListItem(supabase, row)));
}

/**
 * A single published work by public slug. Returns null (not an error) for
 * both "no such slug" and "exists but not published" -- callers should
 * treat null as a 404, never distinguish the two cases to the visitor.
 */
export async function getPublishedArtworkBySlug(slug: string): Promise<ArtworkDetail | null> {
  const parsedSlug = workSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select(ARTWORK_SELECT)
    .eq("slug", parsedSlug.data)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load work "${slug}": ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as WorkQueryRow;
  const listItem = await toListItem(supabase, row);

  return {
    ...listItem,
    description: row.description,
    externalUrl: row.external_url,
    gallery: await getPublishedWorkGallery(supabase, row.id),
  };
}
