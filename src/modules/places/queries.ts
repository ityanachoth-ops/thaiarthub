import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/modules/dashboard/queries";
import type { CreativePlace, CreativePlaceRow, PublicPlace, PublicPlaceRow } from "./types";

const BUCKET = "creative-places";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const PLACE_COLUMNS = "id, name, slug, description, cover_image_url, type, address, province, latitude, longitude, external_url, status, created_by, created_at, updated_at";

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function signPaths(supabase: SupabaseServerClient, paths: string[]) {
  const resolved = new Map<string, string>();
  const uniquePaths = Array.from(new Set(paths.filter((path) => path && !isAbsoluteUrl(path))));
  if (uniquePaths.length === 0) return resolved;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);
  for (const item of data ?? []) if (item.path && item.signedUrl) resolved.set(item.path, item.signedUrl);
  return resolved;
}

function mapPlace(row: CreativePlaceRow, signed: Map<string, string>, includePath = false): CreativePlace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    ...(includePath ? { coverImagePath: row.cover_image_url } : {}),
    coverImageUrl: row.cover_image_url
      ? isAbsoluteUrl(row.cover_image_url) ? row.cover_image_url : signed.get(row.cover_image_url) ?? null
      : null,
    type: row.type as CreativePlace["type"],
    address: row.address,
    province: row.province,
    latitude: row.latitude,
    longitude: row.longitude,
    externalUrl: row.external_url,
    status: row.status as CreativePlace["status"],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicPlace(row: PublicPlaceRow, signed: Map<string, string>): PublicPlace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    coverImageUrl: row.cover_image_url
      ? isAbsoluteUrl(row.cover_image_url) ? row.cover_image_url : signed.get(row.cover_image_url) ?? null
      : null,
    type: row.type as CreativePlace["type"],
    address: row.address,
    province: row.province,
  };
}

async function getPlaces(
  supabase: SupabaseServerClient,
  data: CreativePlaceRow[] | null,
  error: { message: string } | null,
  includePath = false,
) {
  if (error) throw new Error(`ไม่สามารถโหลด Creative Places ได้: ${error.message}`);
  const rows = (data ?? []) as CreativePlaceRow[];
  const signed = await signPaths(supabase, rows.map((row) => row.cover_image_url).filter((path): path is string => Boolean(path)));
  return rows.map((row) => mapPlace(row, signed, includePath));
}

export async function getCreativePlaces(userId: string, isAdmin: boolean) {
  const supabase = await createClient();
  let query = supabase.from("creative_places").select(PLACE_COLUMNS).order("updated_at", { ascending: false });
  if (!isAdmin) query = query.eq("created_by", userId);
  const { data, error } = await query;
  return getPlaces(supabase, data, error, true);
}

export async function getCreativePlaceById(id: string, userId: string, isAdmin: boolean): Promise<CreativePlace | null> {
  const supabase = await createClient();
  let query = supabase.from("creative_places").select(PLACE_COLUMNS).eq("id", id);
  if (!isAdmin) query = query.eq("created_by", userId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`ไม่สามารถโหลด Creative Place ได้: ${error.message}`);
  if (!data) return null;
  const signed = await signPaths(supabase, data.cover_image_url ? [data.cover_image_url] : []);
  return mapPlace(data, signed, true);
}

const PLACE_LIST_COLUMNS =
  "id, name, slug, description, cover_image_url, type, address, province";

export async function getPublishedPlaces(limit = 3): Promise<PublicPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creative_places")
    .select(PLACE_LIST_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`ไม่สามารถโหลดพื้นที่สร้างสรรค์ได้: ${error.message}`);

  const rows = (data ?? []) as PublicPlaceRow[];
  const signed = await signPaths(supabase, rows.map((row) => row.cover_image_url).filter((path): path is string => Boolean(path)));
  return rows.map((row) => mapPublicPlace(row, signed));
}

export async function getPublishedPlaceBySlug(slug: string): Promise<CreativePlace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creative_places")
    .select(PLACE_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลด Creative Place ได้: ${error.message}`);
  if (!data) return null;
  const signed = await signPaths(supabase, data.cover_image_url ? [data.cover_image_url] : []);
  return mapPlace(data, signed, true);
}
