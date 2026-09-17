import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CreatorProfile,
  CreatorDashboardData,
  CreatorArtworkSummary,
} from "./types";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveAvatarUrl(
  supabase: SupabaseServerClient,
  avatarPath: string | null
): Promise<string | null> {
  if (!avatarPath || avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  const { data: signed } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 3600);

  return signed?.signedUrl ?? null;
}

async function resolveWorkImageUrl(
  supabase: SupabaseServerClient,
  imagePath: string | null
): Promise<string | null> {
  if (!imagePath) return null;

  const { data: signed } = await supabase.storage
    .from("works")
    .createSignedUrl(imagePath, 3600);

  return signed?.signedUrl ?? null;
}

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
    avatarUrl: await resolveAvatarUrl(supabase, profileRow.avatar_url),
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
  const { data: artistRow } = await supabase
    .from("artists")
    .select("id, name, slug, status, cover_image_url, avatar_url")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!artistRow) {
    return {
      profile,
      artist: null,
      publishedWorksCount: 0,
      publishedEventsCount: 0,
      artworks: [],
    };
  }

  // Load all creator-owned works so drafts can be managed from the dashboard.
  const { data: workRows } = await supabase
    .from("works")
    .select("id, title, slug, description, image_url, external_url, type, year, status")
    .eq("artist_id", artistRow.id)
    .order("created_at", { ascending: false });

  const artworks: CreatorArtworkSummary[] = await Promise.all(
    (workRows ?? []).map(async (work) => ({
      id: work.id,
      title: work.title,
      slug: work.slug,
      description: work.description,
      type: work.type,
      year: work.year,
      imagePath: work.image_url,
      imageUrl: await resolveWorkImageUrl(supabase, work.image_url),
      externalUrl: work.external_url,
      status: work.status,
    }))
  );

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
    publishedWorksCount: artworks.filter((work) => work.status === "published").length,
    publishedEventsCount: eventsCount,
    artworks,
  };
}

/**
 * Loads profile and artist records for the profile edit page.
 * Scoped to the authenticated user's ID.
 */
export async function getCreatorProfileEditData(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, bio, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();

  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, slug, bio, location, avatar_url, status")
    .eq("profile_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Storage paths are persisted in the database, while the client receives a
  // time-limited signed URL only for previewing a private avatar.
  const avatarPath = profile?.avatar_url ?? artist?.avatar_url ?? null;
  const avatarPreviewUrl = await resolveAvatarUrl(supabase, avatarPath);

  return { profile, artist, avatarPreviewUrl };
}
