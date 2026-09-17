import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminArtistManager } from "@/modules/artists/components/admin-artist-manager";
import { getAdminArtists } from "@/modules/artists/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการศิลปิน | ThaiArtHub",
  description: "สร้างโปรไฟล์ศิลปินสำหรับ Claim หรือมอบให้ Creator",
};

export default async function DashboardArtistsPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/artists");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <span className="text-xs font-medium text-primary">ผู้ดูแลระบบ (Admin)</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">จัดการศิลปิน</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          สร้างไว้ให้เคลม หรือสร้างให้ Creator เป็นเจ้าของทันที
        </p>
      </header>
      <AdminArtistManager artists={await getAdminArtists()} />
    </div>
  );
}
