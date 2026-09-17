"use me";
"use server";

import { createClient } from "@/lib/supabase/server";
import type { SavedItemType } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export type ToggleSaveResult =
  | { success: true; saved: boolean }
  | { success: false; error: "unauthenticated" | "db_error"; message?: string };

export async function toggleSaveItemAction(
  itemType: SavedItemType,
  itemId: string
): Promise<ToggleSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "unauthenticated" };
  }

  // Check if item is already saved by user
  const { data: existing } = await supabase
    .from("user_saved_items")
    .select("id")
    .eq("profile_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    // Delete record (Unsave)
    const { error: deleteError } = await supabase
      .from("user_saved_items")
      .delete()
      .eq("id", existing.id)
      .eq("profile_id", user.id);

    if (deleteError) {
      return { success: false, error: "db_error", message: deleteError.message };
    }

    revalidatePath("/dashboard/saved");
    return { success: true, saved: false };
  } else {
    // Insert record (Save)
    const { error: insertError } = await supabase.from("user_saved_items").insert({
      profile_id: user.id,
      item_type: itemType,
      item_id: itemId,
    });

    if (insertError) {
      return { success: false, error: "db_error", message: insertError.message };
    }

    revalidatePath("/dashboard/saved");
    return { success: true, saved: true };
  }
}
