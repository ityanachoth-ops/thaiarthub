import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { getUserSavedItemsDetail } from "@/modules/bookmarks/queries";
import { SavedItemsView } from "@/modules/dashboard/components/saved-items-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายการที่บันทึก | ThaiArtHub",
  description: "รายการศิลปิน ผลงาน กิจกรรม พื้นที่สร้างสรรค์ และเรื่องราวที่คุณบันทึกไว้",
};

export default async function DashboardSavedPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  // 1. Unauthenticated: redirect to login
  if (!user) {
    redirect("/login?redirect=/dashboard/saved");
  }

  // 2. Authenticated but profile not onboarded: redirect to onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  // 3. Accessible by ALL logged in users (user, creator, admin)
  const savedItems = await getUserSavedItemsDetail();

  return <SavedItemsView items={savedItems} userRole={profile.role} />;
}
