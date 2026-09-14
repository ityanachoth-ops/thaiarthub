import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile, CreatorDashboardData } from "./types";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Validates the current session and retrieves the authenticated user's profile.
 * Returns null for user or profile if unauthenticated or profile not found.
 */
export async function getAuthenticatedProfile(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, bio, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileRow) {
    return { user, profile: null };
  }

  const profile: CreatorProfile = {
    id: profileRow.id,
    displayName: profileRow.display_name,
    username: profileRow.username,
    avatarUrl: profileRow.avatar_url,
    bio: profileRow.bio,
    role: profileRow.role,
  };

  return { user, profile };
}

/**
 * Loads dashboard metrics and associated artist profile for the authenticated creator.
 * Data is strictly scoped to the creator's profile ID and honors Supabase RLS.
 */
export async function getCreatorDashboardData(
  supabase: SupabaseServerClient,
  profile: CreatorProfile
): Promise<CreatorDashboardData> {
  // Query the creator-owned artist record (profile_id is unique on artists)
  const { data: artistRow } = await supabase
    .from("artists")
    .select("id, name, slug, status, cover_image_url, avatar_url")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!artistRow) {
    return {
      profile,
      artist: null,
      publishedWorksCount: 0,
      publishedEventsCount: 0,
    };
  }

  // Count published works associated with this creator's artist
  const { count: worksCount } = await supabase
    .from("works")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", artistRow.id)
    .eq("status", "published");

  // Query events associated with this artist through event_artists
  const { data: eventLinks } = await supabase
    .from("event_artists")
    .select("event_id")
    .eq("artist_id", artistRow.id);

  let eventsCount = 0;
  if (eventLinks && eventLinks.length > 0) {
    const eventIds = Array.from(new Set(eventLinks.map((l) => l.event_id)));
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .in("id", eventIds)
      .eq("status", "published");
    eventsCount = count ?? 0;
  }

  return {
    profile,
    artist: {
      id: artistRow.id,
      name: artistRow.name,
      slug: artistRow.slug,
      status: artistRow.status,
      coverImageUrl: artistRow.cover_image_url,
      avatarUrl: artistRow.avatar_url,
    },
    publishedWorksCount: worksCount ?? 0,
    publishedEventsCount: eventsCount,
  };
}
