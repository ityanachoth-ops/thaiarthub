"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

const reorderCreativePlacesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});

export type ReorderCreativePlacesInput = z.infer<typeof reorderCreativePlacesSchema>;

export async function reorderCreativePlacesAction(input: ReorderCreativePlacesInput) {
  const parsed = reorderCreativePlacesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลลำดับไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile || profile.role !== "admin") {
    throw new Error("คุณไม่มีสิทธิ์จัดลำดับ Creative Places");
  }

  const ids = parsed.data.ids;

  // Verify all IDs exist and belong to creative_places
  const { data: existingPlaces, error: verifyError } = await supabase
    .from("creative_places")
    .select("id")
    .in("id", ids);

  if (verifyError) {
    throw new Error(`ตรวจสอบ Creative Places ไม่สำเร็จ: ${verifyError.message}`);
  }

  if (!existingPlaces || existingPlaces.length !== ids.length) {
    throw new Error("บางรายการไม่พบในระบบ");
  }

  // Batch update using individual updates (Supabase doesn't have CASE WHEN in JS client)
  // Using Promise.all for concurrent updates - acceptable for typical admin list sizes
  const updates = ids.map((id, index) =>
    supabase.from("creative_places").update({ sort_order: index }).eq("id", id)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) {
    throw new Error(`บันทึกลำดับไม่สำเร็จ: ${firstError.error.message}`);
  }

  revalidatePath("/dashboard/places");
  revalidatePath("/places");
  revalidatePath("/places", "layout");
}