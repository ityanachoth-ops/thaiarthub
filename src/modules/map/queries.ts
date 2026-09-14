import { createClient } from "@/lib/supabase/server";
import type { MapLocationItem } from "./types";

const EVENTS_BUCKET = "events";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Fetch published events and artists with geographic coordinates for the /map view.
 * Excludes drafts, cancelled items, or records without valid latitude/longitude.
 */
export async function getMapLocations(): Promise<MapLocationItem[]> {
  try {
    const supabase = await createClient();

    // Query published events that have geographic coordinates
    const { data: eventRows, error: eventError } = await supabase
      .from("events")
      .select(
        "id, title, slug, cover_image_url, venue_name, address, province, latitude, longitude, start_at, end_at"
      )
      .eq("status", "published")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("start_at", { ascending: true });

    if (eventError) {
      console.error("Error fetching map events:", eventError.message);
      return [];
    }

    const validEventRows = (eventRows ?? []).filter(
      (row): row is typeof row & { latitude: number; longitude: number } =>
        typeof row.latitude === "number" && typeof row.longitude === "number"
    );

    // Batch resolve signed cover image URLs
    const storagePaths = Array.from(
      new Set(
        validEventRows
          .map((row) => row.cover_image_url)
          .filter((url): url is string => Boolean(url && !isAbsoluteUrl(url)))
      )
    );

    const signedUrls = new Map<string, string>();
    if (storagePaths.length > 0) {
      const { data: signedData } = await supabase.storage
        .from(EVENTS_BUCKET)
        .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

      if (signedData) {
        for (const item of signedData) {
          if (item.path && item.signedUrl) {
            signedUrls.set(item.path, item.signedUrl);
          }
        }
      }
    }

    const eventLocations: MapLocationItem[] = validEventRows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: "event",
      latitude: row.latitude,
      longitude: row.longitude,
      coverImageUrl: row.cover_image_url
        ? isAbsoluteUrl(row.cover_image_url)
          ? row.cover_image_url
          : (signedUrls.get(row.cover_image_url) ?? null)
        : null,
      venueName: row.venue_name,
      address: row.address,
      province: row.province,
      startAt: row.start_at,
      endAt: row.end_at,
    }));

    return eventLocations;
  } catch (error) {
    console.error("Failed to load map locations:", error);
    return [];
  }
}
