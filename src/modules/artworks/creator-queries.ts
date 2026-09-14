import "server-only";

import type { SupabaseServerClient } from "@/modules/dashboard/queries";
import type { Database } from "@/types/database.types";

export type CreatorArtwork = Pick<
  Database["public"]["Tables"]["works"]["Row"],
  | "id"
  | "title"
  | "slug"
  | "description"
  | "image_url"
  | "external_url"
  | "type"
  | "year"
  | "status"
>;

/** Returns only the artist record attached to the current creator profile. */
export async function getCreatorArtistForWorks(
  supabase: SupabaseServerClient,
  profileId: string
) {
  const { data } = await supabase
    .from("artists")
    .select("id")
    .eq("profile_id", profileId)
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
    .select("id, title, slug, description, image_url, external_url, type, year, status")
    .eq("id", artworkId)
    .eq("artist_id", artistId)
    .maybeSingle();

  return data;
}
