import "server-only";

import type { SupabaseServerClient } from "@/modules/dashboard/queries";
import type { Database } from "@/types/database.types";

const WORKS_BUCKET = "works";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type CreatorArtwork = Pick<
  Database["public"]["Tables"]["works"]["Row"],
  | "id"
  | "title"
  | "slug"
  | "description"
  | "image_url"
  | "cover_position"
  | "external_url"
  | "type"
  | "year"
  | "status"
>;

export type CreatorArtworkGalleryImage = {
  id: string;
  imagePath: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
};

/** Returns only the artist record attached to the current creator profile. */
export async function getCreatorArtistForWorks(
  supabase: SupabaseServerClient,
  profileId: string
) {
  const { data } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  return data;
}

/** RLS and artist_id scope ensure the returned work belongs to this creator. */
export async function getCreatorArtworkById(
  supabase: SupabaseServerClient,
  artistId: string,
  artworkId: string
): Promise<CreatorArtwork | null> {
  const { data } = await supabase
    .from("works")
    .select("id, title, slug, description, image_url, cover_position, external_url, type, year, status")
    .eq("id", artworkId)
    .eq("artist_id", artistId)
    .maybeSingle();

  return data;
}

export async function getCreatorArtworkGallery(
  supabase: SupabaseServerClient,
  workId: string,
): Promise<CreatorArtworkGalleryImage[]> {
  const { data, error } = await supabase
    .from("work_images")
    .select("id, image_path, sort_order, created_at")
    .eq("work_id", workId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`ไม่สามารถโหลดภาพเพิ่มเติมได้: ${error.message}`);

  const rows = data ?? [];
  const paths = Array.from(new Set(rows.map((row) => row.image_path)));
  const signedUrls = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(WORKS_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    for (const item of signedData ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    imagePath: row.image_path,
    imageUrl: signedUrls.get(row.image_path) ?? null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}
