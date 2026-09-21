import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import type { ArtistListItem } from "@/modules/artists/queries";
import type { ArtworkListItem } from "@/modules/artworks/queries";

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export const CATEGORY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,99}$/;

export const categorySlugSchema = z
  .string()
  .trim()
  .regex(CATEGORY_SLUG_PATTERN, "รูปแบบ slug ของหมวดหมู่ไม่ถูกต้อง");

const ARTIST_COVERS_BUCKET = "artist-covers";
const WORKS_BUCKET = "works";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const CATEGORY_COLUMNS = "id, name, slug, description";
const ARTIST_COLUMNS = "id, name, slug, cover_image_url, cover_position, location, status";
const WORK_COLUMNS = "id, title, slug, image_url, cover_position, type, artist_id";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CategoryPageData = {
  category: CategoryListItem;
  artists: ArtistListItem[];
  artworks: ArtworkListItem[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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

export async function getAllCategories(): Promise<CategoryListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`ไม่สามารถโหลดรายการหมวดหมู่ได้: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryListItem | null> {
  const parsed = categorySlugSchema.safeParse(slug);
  if (!parsed.success) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("slug", parsed.data)
    .maybeSingle();

  if (error) {
    throw new Error(`ไม่สามารถโหลดข้อมูลหมวดหมู่ได้: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
  };
}

async function getCategorySummariesByArtistIds(
  supabase: SupabaseServerClient,
  artistIds: string[],
): Promise<Map<string, CategorySummary[]>> {
  const result = new Map<string, CategorySummary[]>();
  if (artistIds.length === 0) return result;

  const { data, error } = await supabase
    .from("artist_categories")
    .select("artist_id, categories(id, name, slug)")
    .in("artist_id", artistIds);

  if (error || !data) return result;

  for (const row of data) {
    const category = Array.isArray(row.categories)
      ? row.categories[0]
      : row.categories;
    if (!category) continue;

    const existing = result.get(row.artist_id) ?? [];
    existing.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
    result.set(row.artist_id, existing);
  }

  return result;
}

async function getPublishedArtistsByCategoryId(
  supabase: SupabaseServerClient,
  categoryId: string,
): Promise<ArtistListItem[]> {
  const { data, error } = await supabase
    .from("artist_categories")
    .select(`artists!inner(${ARTIST_COLUMNS})`)
    .eq("category_id", categoryId)
    .eq("artists.status", "published");

  if (error || !data) return [];

  const rows = data.flatMap((row) => {
    const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
    return artist ? [artist] : [];
  });

  const [covers, categoryMap] = await Promise.all([
    signPaths(
      supabase,
      ARTIST_COVERS_BUCKET,
      rows.map((r) => r.cover_image_url).filter(Boolean) as string[],
    ),
    getCategorySummariesByArtistIds(
      supabase,
      rows.map((r) => r.id),
    ),
  ]);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    avatarUrl: null,
    coverUrl: resolveUrl(row.cover_image_url, covers),
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    categories: categoryMap.get(row.id) ?? [],
  }));
}

async function getPublishedWorksByArtists(
  supabase: SupabaseServerClient,
  artists: ArtistListItem[],
): Promise<ArtworkListItem[]> {
  if (artists.length === 0) return [];

  const artistById = new Map(
    artists.map((artist) => [artist.id, { slug: artist.slug, name: artist.name }]),
  );

  const { data, error } = await supabase
    .from("works")
    .select(WORK_COLUMNS)
    .in("artist_id", Array.from(artistById.keys()))
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const images = await signPaths(
    supabase,
    WORKS_BUCKET,
    data.map((row) => row.image_url).filter(Boolean) as string[],
  );

  return data.flatMap((row) => {
    const artist = artistById.get(row.artist_id);
    if (!artist) return [];

    return [
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        imageUrl: resolveUrl(row.image_url, images),
        coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
        artist,
      },
    ];
  });
}

export async function getCategoryPageData(
  slug: string,
): Promise<CategoryPageData | null> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const supabase = await createClient();
  const artists = await getPublishedArtistsByCategoryId(supabase, category.id);
  const artworks = await getPublishedWorksByArtists(supabase, artists);

  return { category, artists, artworks };
}