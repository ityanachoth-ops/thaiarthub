"use client";

import { createClient } from "@/lib/supabase/client";

const EVENTS_BUCKET = "events";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateCoverFile(file: File): string | null {
  if (!(file.type in MIME_EXTENSIONS)) {
    return "อนุญาตเฉพาะไฟล์ JPG, PNG และ WebP";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }
  return null;
}

/** Uploads a cover to {profileId}/{eventId}/cover/{timestamp}.{extension}. */
export async function uploadCoverImage(
  file: File,
  profileId: string,
  eventId: string,
): Promise<{ path: string } | { error: string }> {
  const validationError = validateCoverFile(file);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const path = `${profileId}/${eventId}/cover/${Date.now()}.${MIME_EXTENSIONS[file.type]}`;

  const { error } = await supabase.storage.from(EVENTS_BUCKET).upload(path, file, {
    upsert: false,
  });

  return error ? { error: error.message } : { path };
}

export async function deleteCoverImage(path: string): Promise<void> {
  if (/^https?:\/\//i.test(path)) return;
  const supabase = createClient();
  await supabase.storage.from(EVENTS_BUCKET).remove([path]);
}

export function revokeObjectUrl(url: string | null): void {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
