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
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return {
        success: false,
        error: "db_error",
        message: `AUTH ERROR: [${authError.name}] ${authError.message}`,
      };
    }

    if (!user) {
      return { success: false, error: "unauthenticated", message: "User session not found" };
    }

    // Check if item is already saved by user
    const { data: existing, error: selectError } = await supabase
      .from("user_saved_items")
      .select("id")
      .eq("profile_id", user.id)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle();

    if (selectError) {
      return {
        success: false,
        error: "db_error",
        message: `SELECT ERROR: ${selectError.code ?? "NO_CODE"} | ${selectError.message} | details: ${selectError.details ?? "none"} | hint: ${selectError.hint ?? "none"}`,
      };
    }

    if (existing) {
      // Delete record (Unsave)
      const { error: deleteError } = await supabase
        .from("user_saved_items")
        .delete()
        .eq("id", existing.id)
        .eq("profile_id", user.id);

      if (deleteError) {
        return {
          success: false,
          error: "db_error",
          message: `DELETE ERROR: ${deleteError.code ?? "NO_CODE"} | ${deleteError.message} | details: ${deleteError.details ?? "none"} | hint: ${deleteError.hint ?? "none"}`,
        };
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
        return {
          success: false,
          error: "db_error",
          message: `INSERT ERROR: ${insertError.code ?? "NO_CODE"} | ${insertError.message} | details: ${insertError.details ?? "none"} | hint: ${insertError.hint ?? "none"}`,
        };
      }

      revalidatePath("/dashboard/saved");
      return { success: true, saved: true };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: "db_error",
      message: `UNHANDLED EXCEPTION: ${msg}`,
    };
  }
}
