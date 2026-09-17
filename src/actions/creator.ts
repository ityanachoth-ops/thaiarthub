"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

/**
 * Server action to upgrade a user with role 'user' to 'creator'.
 * Authenticates the user, checks current role, updates role to 'creator' if necessary,
 * revalidates dashboard paths, and redirects to /onboarding.
 */
export async function becomeCreatorAction() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user || !profile) {
    throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
  }

  if (profile.role === "user") {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "creator" })
      .eq("id", user.id);

    if (error) {
      throw new Error(`ไม่สามารถอัปเดตบทบาทบัญชีได้: ${error.message}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  redirect("/onboarding");
}
