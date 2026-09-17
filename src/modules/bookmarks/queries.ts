import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SavedItemType } from "@/types/database.types";
import { getPublishedPlaces } from "@/modules/places/queries";
import { getPublishedEvents } from "@/modules/events/queries";

export type SavedItemSummary = {
  id: string; // user_saved_items id
  itemId: string;
  itemType: SavedItemType;
  title: string;
  slug: string;
  imageUrl: string | null;
  categoryOrType?: string | null;
  subtitle?: string | null;
  createdAt: string;
  href: string;
};

/**
 * Fetch all saved item IDs for the current user in a single batch query.
 * Returns a Set<string> of saved item IDs.
 * Used by page components to pass saved status to Card components, preventing N+1 queries.
 */
export async function getUserSavedItemIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data } = await supabase
    .from("user_saved_items")
    .select("item_id")
    .eq("profile_id", user.id);

  if (!data) return new Set();
  return new Set(data.map((row) => row.item_id));
}

/**
 * Fetch detailed saved items for the Dashboard Saved Page.
 * Validates content status to only include items that are still published and accessible (Requirement 3).
 */
export async function getUserSavedItemsDetail(): Promise<SavedItemSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: savedRows, error } = await supabase
    .from("user_saved_items")
    .select("id, item_id, item_type, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !savedRows || savedRows.length === 0) return [];

  const result: SavedItemSummary[] = [];

  // Group item IDs by type for bulk fetching
  const artistIds = savedRows.filter((r) => r.item_type === "artist").map((r) => r.item_id);
  const workIds = savedRows.filter((r) => r.item_type === "work").map((r) => r.item_id);
  const eventIds = savedRows.filter((r) => r.item_type === "event").map((r) => r.item_id);
  const placeIds = savedRows.filter((r) => r.item_type === "place").map((r) => r.item_id);
  const articleIds = savedRows.filter((r) => r.item_type === "article").map((r) => r.item_id);

  // 1. Fetch published Artists
  if (artistIds.length > 0) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, slug, avatar_url, cover_image_url, location, status")
      .in("id", artistIds)
      .eq("status", "published");

    if (artists) {
      // Resolve avatar/cover signed URLs using storage helper if needed
      const pathsToSign = artists
        .map((a) => a.cover_image_url || a.avatar_url)
        .filter((p): p is string => Boolean(p && !p.startsWith("http")));

      const signedMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrls(pathsToSign, 3600);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }

      for (const artist of artists) {
        const row = savedRows.find((r) => r.item_type === "artist" && r.item_id === artist.id);
        if (!row) continue;
        const imgPath = artist.cover_image_url || artist.avatar_url;
        const resolvedImg = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : signedMap.get(imgPath) ?? null
          : null;

        result.push({
          id: row.id,
          itemId: artist.id,
          itemType: "artist",
          title: artist.name,
          slug: artist.slug,
          imageUrl: resolvedImg,
          subtitle: artist.location || "ศิลปิน",
          createdAt: row.created_at,
          href: `/artists/${artist.slug}`,
        });
      }
    }
  }

  // 2. Fetch published Works (also requiring associated artist to be published)
  if (workIds.length > 0) {
    const { data: works } = await supabase
      .from("works")
      .select("id, title, slug, image_url, type, status, artist:artists!inner(name, status)")
      .in("id", workIds)
      .eq("status", "published")
      .eq("artist.status", "published");

    if (works) {
      const pathsToSign = works
        .map((w) => w.image_url)
        .filter((p): p is string => Boolean(p && !p.startsWith("http")));

      const signedMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage
          .from("works")
          .createSignedUrls(pathsToSign, 3600);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }

      for (const work of works) {
        const row = savedRows.find((r) => r.item_type === "work" && r.item_id === work.id);
        if (!row) continue;
        const imgPath = work.image_url;
        const resolvedImg = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : signedMap.get(imgPath) ?? null
          : null;

        const artistObj = Array.isArray(work.artist) ? work.artist[0] : work.artist;

        result.push({
          id: row.id,
          itemId: work.id,
          itemType: "work",
          title: work.title,
          slug: work.slug,
          imageUrl: resolvedImg,
          categoryOrType: work.type,
          subtitle: artistObj?.name ?? undefined,
          createdAt: row.created_at,
          href: `/artworks/${work.slug}`,
        });
      }
    }
  }

  // 3. Fetch published Events
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title, slug, cover_image_url, venue_name, province, status")
      .in("id", eventIds)
      .eq("status", "published");

    if (events) {
      const pathsToSign = events
        .map((e) => e.cover_image_url)
        .filter((p): p is string => Boolean(p && !p.startsWith("http")));

      const signedMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage
          .from("events")
          .createSignedUrls(pathsToSign, 3600);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }

      for (const event of events) {
        const row = savedRows.find((r) => r.item_type === "event" && r.item_id === event.id);
        if (!row) continue;
        const imgPath = event.cover_image_url;
        const resolvedImg = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : signedMap.get(imgPath) ?? null
          : null;

        const loc = [event.venue_name, event.province].filter(Boolean).join(" · ");

        result.push({
          id: row.id,
          itemId: event.id,
          itemType: "event",
          title: event.title,
          slug: event.slug,
          imageUrl: resolvedImg,
          subtitle: loc || "กิจกรรม",
          createdAt: row.created_at,
          href: `/events/${event.slug}`,
        });
      }
    }
  }

  // 4. Fetch published Creative Places
  if (placeIds.length > 0) {
    const { data: places } = await supabase
      .from("creative_places")
      .select("id, name, slug, cover_image_url, type, province, status")
      .in("id", placeIds)
      .eq("status", "published");

    if (places) {
      const pathsToSign = places
        .map((p) => p.cover_image_url)
        .filter((p): p is string => Boolean(p && !p.startsWith("http")));

      const signedMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage
          .from("creative-places")
          .createSignedUrls(pathsToSign, 3600);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }

      for (const place of places) {
        const row = savedRows.find((r) => r.item_type === "place" && r.item_id === place.id);
        if (!row) continue;
        const imgPath = place.cover_image_url;
        const resolvedImg = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : signedMap.get(imgPath) ?? null
          : null;

        result.push({
          id: row.id,
          itemId: place.id,
          itemType: "place",
          title: place.name,
          slug: place.slug,
          imageUrl: resolvedImg,
          categoryOrType: place.type,
          subtitle: place.province || "พื้นที่สร้างสรรค์",
          createdAt: row.created_at,
          href: `/places/${place.slug}`,
        });
      }
    }
  }

  // 5. Fetch published Articles
  if (articleIds.length > 0) {
    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, slug, cover_image_url, category, status")
      .in("id", articleIds)
      .eq("status", "published");

    if (articles) {
      const pathsToSign = articles
        .map((a) => a.cover_image_url)
        .filter((p): p is string => Boolean(p && !p.startsWith("http")));

      const signedMap = new Map<string, string>();
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage
          .from("culture")
          .createSignedUrls(pathsToSign, 3600);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
        }
      }

      for (const article of articles) {
        const row = savedRows.find((r) => r.item_type === "article" && r.item_id === article.id);
        if (!row) continue;
        const imgPath = article.cover_image_url;
        const resolvedImg = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : signedMap.get(imgPath) ?? null
          : null;

        result.push({
          id: row.id,
          itemId: article.id,
          itemType: "article",
          title: article.title,
          slug: article.slug,
          imageUrl: resolvedImg,
          categoryOrType: article.category,
          subtitle: "บทความเรื่องราว",
          createdAt: row.created_at,
          href: `/culture/${article.slug}`,
        });
      }
    }
  }

  // Sort by saved_at date descending
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
