"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

const eventIdSchema = z.string().uuid();

export async function deleteEvent(eventId: string): Promise<{
  success: boolean;
  error?: string;
  storageCleanupFailed?: boolean;
}> {
  const parsedEventId = eventIdSchema.safeParse(eventId);
  if (!parsedEventId.success) return { success: false, error: "รหัสกิจกรรมไม่ถูกต้อง" };

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile || profile.role !== "admin") {
    return { success: false, error: "คุณไม่มีสิทธิ์ลบกิจกรรม" };
  }

  const [{ data: event, error: eventError }, { data: gallery, error: galleryError }] = await Promise.all([
    supabase.from("events").select("cover_image_url").eq("id", parsedEventId.data).maybeSingle(),
    supabase.from("event_images").select("image_url").eq("event_id", parsedEventId.data),
  ]);
  if (eventError || galleryError) {
    return { success: false, error: "ไม่สามารถเตรียมลบกิจกรรมได้" };
  }
  if (!event) return { success: false, error: "ไม่พบกิจกรรมที่ต้องการลบ" };

  const storagePaths = [event.cover_image_url, ...(gallery ?? []).map((image) => image.image_url)]
    .filter((path): path is string => Boolean(path) && !/^https?:\/\//i.test(path));

  const { data: deletedEvent, error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", parsedEventId.data)
    .select("id")
    .maybeSingle();
  if (deleteError || !deletedEvent) {
    return { success: false, error: deleteError?.message ?? "ไม่สามารถลบกิจกรรมได้" };
  }

  const uniquePaths = Array.from(new Set(storagePaths));
  const { error: storageError } = uniquePaths.length > 0
    ? await supabase.storage.from("events").remove(uniquePaths)
    : { error: null };

  revalidatePath("/dashboard/events");
  return { success: true, storageCleanupFailed: Boolean(storageError) };
}
