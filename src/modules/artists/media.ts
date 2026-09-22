"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateArtistImageFile(file: File): string | null {
  if (!(file.type in MIME_EXTENSIONS)) {
    return "อนุญาตเฉพาะไฟล์ JPG, PNG และ WebP";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }
  return null;
}

export async function uploadAdminArtistImage(
  file: File,
  adminProfileId: string,
  artistId: string,
  kind: "cover" | "avatar",
): Promise<{ path: string } | { error: string }> {
  const validationError = validateArtistImageFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const bucket = kind === "cover" ? "artist-covers" : "avatars";
  const path = `${adminProfileId}/${artistId}/${kind}/${Date.now()}.${MIME_EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  return error ? { error: error.message } : { path };
}

export async function uploadAdminArtistGalleryImage(
  file: File,
  ownerProfileId: string,
  artistId: string,
): Promise<{ path: string } | { error: string }> {
  const validationError = validateArtistImageFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const path = `${ownerProfileId}/${artistId}/gallery/${Date.now()}.${MIME_EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage.from("artist-covers").upload(path, file, { upsert: false });
  return error ? { error: error.message } : { path };
}

export async function deleteAdminArtistImage(path: string, kind: "cover" | "avatar"): Promise<void> {
  if (/^https?:\/\//i.test(path)) return;
  const supabase = createClient();
  await supabase.storage.from(kind === "cover" ? "artist-covers" : "avatars").remove([path]);
}

export async function deleteAdminArtistGalleryImage(path: string): Promise<void> {
  if (/^https?:\/\//i.test(path)) return;
  const supabase = createClient();
  await supabase.storage.from("artist-covers").remove([path]);
}

export function revokeObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
