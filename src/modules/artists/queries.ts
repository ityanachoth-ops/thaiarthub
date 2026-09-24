import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * `artists.cover_image_url` is resolved as a path within the `artist-covers`
 * bucket -- justified by the direct name correspondence between the column
 * and the bucket, and matching the "artist-covers: public read when artist
 * published" convention documented in docs/IMPLEMENTATION_PLAN.md.
 *
 * `artists.avatar_url` is a plain `text` column with no bucket-reference
 * column anywhere in the V1 schema, and there is no equivalent naming
 * correspondence to lean on: it could equally plausibly live in the
 * `avatars` bucket (name match, but that bucket is private with no
 * published-read policy) or in `artist-covers` alongside the cover image.
 * Nothing in the repository resolves this either way, so it is
 * intentionally NOT resolved to a signed URL here -- `avatarUrl` is always
 * `null` until this is confirmed. See docs/IMPLEMENTATION_PLAN.md for the
 * open decision; do not guess a bucket for it without confirming first.
 *
 * The `artist-covers` bucket is private (`public: false`), so
 * `getPublicUrl()` will not serve files from it -- Supabase only serves the
 * public-URL endpoint when a bucket is flagged public, and that endpoint
 * bypasses RLS entirely rather than honoring it. Signed URLs are generated
 * here, per request, only for rows already filtered to `status = 'published'`.
 */
const ARTIST_COVERS_BUCKET = "artist-covers";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour; regenerated on every render

const artistSlugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{2,159}$/);

export interface ArtistGalleryImage {
  id: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type CategoryRow = Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "name" | "slug">;

type ArtistCategoryJoinRow = {
  category: CategoryRow | null;
};

type ArtistQueryRow = Pick<
  Database["public"]["Tables"]["artists"]["Row"],
  | "id"
  | "slug"
  | "name"
  | "bio"
  | "location"
  | "avatar_url"
  | "cover_image_url"
  | "cover_position"
  | "website_url"
  | "instagram_url"
  | "facebook_url"
  | "tiktok_url"
  | "contact_url"
> & {
  artist_categories: ArtistCategoryJoinRow[];
};

export interface ArtistCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ArtistListItem {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverPosition: string;
  categories: ArtistCategorySummary[];
}

export interface ArtistDetail extends ArtistListItem {
  bio: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  contactUrl: string | null;
  gallery: ArtistGalleryImage[];
}

const ARTIST_SELECT = `
  id, slug, name, bio, location, avatar_url, cover_image_url, cover_position,
  website_url, instagram_url, facebook_url, tiktok_url, contact_url,
  artist_categories ( category:categories ( id, name, slug ) )
`;

async function resolveCoverUrl(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(ARTIST_COVERS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;
  return data.signedUrl;
}

async function getArtistGallery(
  supabase: SupabaseServerClient,
  artistId: string,
): Promise<ArtistGalleryImage[]> {
  const { data, error } = await supabase
    .from("artist_images")
    .select("id, image_path, sort_order, created_at")
    .eq("artist_id", artistId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load artist gallery: ${error.message}`);

  const rows = data ?? [];
  const paths = rows
    .map((row) => row.image_path)
    .filter((path) => !/^https?:\/\//i.test(path));
  const signedUrls = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(ARTIST_COVERS_BUCKET)
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

const AVATARS_BUCKET = "avatars";

async function resolveAvatarUrl(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

function mapCategories(rows: ArtistCategoryJoinRow[]): ArtistCategorySummary[] {
  return rows
    .map((row) => row.category)
    .filter((category): category is CategoryRow => category !== null)
    .map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
}

async function toListItem(
  supabase: SupabaseServerClient,
  row: ArtistQueryRow,
): Promise<ArtistListItem> {
  const avatarUrl = await resolveAvatarUrl(supabase, row.avatar_url);
  const coverUrl = await resolveCoverUrl(supabase, row.cover_image_url);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    avatarUrl,
    coverUrl,
    coverPosition: row.cover_position ?? "50% 50%",
    categories: mapCategories(row.artist_categories),
  };
}

/**
 * Published artists for the public discovery grid. Filters on
 * `status = 'published'` explicitly rather than relying on RLS alone
 * (defense in depth -- RLS still enforces this independently).
 */
export async function getPublishedArtists(): Promise<ArtistListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(ARTIST_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load published artists: ${error.message}`);
  }
  if (!data) return [];

  return Promise.all((data as unknown as ArtistQueryRow[]).map((row) => toListItem(supabase, row)));
}

export async function getPublishedArtistsByCategorySlug(categorySlug: string): Promise<ArtistListItem[]> {
  const supabase = await createClient();
  
  // First get the category ID from slug
  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (catError || !category) {
    // Category not found - return empty array
    return [];
  }

  // Query artists through the junction table (similar to getPublishedArtistsByCategoryId)
  const { data, error } = await supabase
    .from("artist_categories")
    .select(`artists!inner(${ARTIST_SELECT})`)
    .eq("category_id", category.id)
    .eq("artists.status", "published");

  if (error) {
    throw new Error(`Failed to load published artists by category: ${error.message}`);
  }
  if (!data) return [];

  // Extract artists from the junction table rows
  const rows = data.flatMap((row) => {
    const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
    return artist ? [artist] : [];
  });

  return Promise.all((rows as unknown as ArtistQueryRow[]).map((row) => toListItem(supabase, row)));
}

export async function getCategoriesWithPublishedArtists(): Promise<ArtistCategorySummary[]> {
  const supabase = await createClient();
  
  // Get unique categories that have at least one published artist
  const { data, error } = await supabase
    .from("artist_categories")
    .select("categories!inner(id, name, slug)")
    .eq("artists.status", "published");

  if (error) {
    throw new Error(`Failed to load categories with artists: ${error.message}`);
  }

  if (!data) return [];

  // Deduplicate categories
  const seen = new Set<string>();
  return data
    .map((row) => {
      const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      return category;
    })
    .filter((category): category is { id: string; name: string; slug: string } => {
      if (!category || seen.has(category.id)) return false;
      seen.add(category.id);
      return true;
    })
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));
}

/**
 * A single published artist by public slug. Returns null (not an error) for
 * both "no such slug" and "exists but not published" -- callers should
 * treat null as a 404, never distinguish the two cases to the visitor.
 */
export async function getPublishedArtistBySlug(slug: string): Promise<ArtistDetail | null> {
  const parsedSlug = artistSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(ARTIST_SELECT)
    .eq("slug", parsedSlug.data)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load artist "${slug}": ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as ArtistQueryRow;
  const [listItem, gallery] = await Promise.all([
    toListItem(supabase, row),
    getArtistGallery(supabase, row.id),
  ]);

  return {
    ...listItem,
    bio: row.bio,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    contactUrl: row.contact_url,
    gallery,
  };
}

export interface AdminArtistListItem {
  id: string;
  name: string;
  slug: string;
  status: Database["public"]["Enums"]["content_status"];
  ownerRole: Database["public"]["Enums"]["profile_role"] | null;
  ownerName: string;
  ownerUsername: string;
}

export interface CreatorOwnerOption {
  id: string;
  displayName: string;
  username: string;
}

type AdminArtistQueryRow = {
  id: string;
  name: string;
  slug: string;
  status: Database["public"]["Enums"]["content_status"];
  profiles: {
    role: Database["public"]["Enums"]["profile_role"];
    display_name: string;
    username: string;
  } | null;
};

export async function getAdminArtists(): Promise<AdminArtistListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, slug, status, profiles(role, display_name, username)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดรายการศิลปินได้: ${error.message}`);

  return ((data ?? []) as unknown as AdminArtistQueryRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    ownerRole: row.profiles?.role ?? null,
    ownerName: row.profiles?.display_name ?? "",
    ownerUsername: row.profiles?.username ?? "",
  }));
}

export async function getCreatorOwnerOptions(supabase?: Awaited<ReturnType<typeof createClient>>): Promise<CreatorOwnerOption[]> {
  // Use provided Supabase client or create a new one
  const client = supabase ?? await createClient();
  
  const [{ data: creators, error: creatorError }, { data: owned, error: ownedError }] = await Promise.all([
    client
      .from("profiles")
      .select("id, display_name, username")
      .eq("role", "creator")
      .order("display_name", { ascending: true }),
    client.from("artists").select("profile_id"),
  ]);

  if (creatorError) throw new Error(`ไม่สามารถโหลดรายชื่อ Creator ได้: ${creatorError.message}`);
  if (ownedError) throw new Error(`ไม่สามารถโหลดเจ้าของศิลปินได้: ${ownedError.message}`);

  const ownedIds = new Set((owned ?? []).map((row) => row.profile_id));
  return (creators ?? [])
    .filter((creator) => !ownedIds.has(creator.id))
    .map((creator) => ({
      id: creator.id,
      displayName: creator.display_name,
      username: creator.username,
    }));
}


export interface AdminArtistDetail {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  status: "draft" | "published";
  coverImagePath: string | null;
  coverImageUrl: string | null;
  coverPosition: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  contactUrl: string | null;
  ownerProfileId: string;
  categories: ArtistCategorySummary[];
  gallery: ArtistGalleryImage[];
}

type AdminArtistDetailRow = Pick<
  Database["public"]["Tables"]["artists"]["Row"],
  | "id" | "name" | "slug" | "bio" | "location" | "status"
  | "cover_image_url" | "cover_position" | "avatar_url"
  | "website_url" | "instagram_url" | "facebook_url" | "tiktok_url" | "contact_url"
  | "profile_id"
> & { artist_categories: ArtistCategoryJoinRow[] };

export async function getAdminArtistById(id: string): Promise<AdminArtistDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(`
      id, name, slug, bio, location, status,
      cover_image_url, cover_position, avatar_url,
      website_url, instagram_url, facebook_url, tiktok_url, contact_url,
      profile_id,
      artist_categories ( category:categories ( id, name, slug ) )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดข้อมูลศิลปินได้: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as AdminArtistDetailRow;
  const [coverImageUrl, avatarUrl, gallery] = await Promise.all([
    resolveCoverUrl(supabase, row.cover_image_url),
    resolveAvatarUrl(supabase, row.avatar_url),
    getArtistGallery(supabase, row.id),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio,
    location: row.location,
    status: row.status as "draft" | "published",
    coverImagePath: row.cover_image_url,
    coverImageUrl,
    coverPosition: row.cover_position ?? "50% 50%",
    avatarPath: row.avatar_url,
    avatarUrl,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    tiktokUrl: row.tiktok_url,
    contactUrl: row.contact_url,
    ownerProfileId: row.profile_id,
    categories: mapCategories(row.artist_categories),
    gallery,
  };
}
