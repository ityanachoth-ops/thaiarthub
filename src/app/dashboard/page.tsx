import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedProfile,
  getCreatorDashboardData,
} from "@/modules/dashboard/queries";
import { DashboardView } from "@/modules/dashboard/components/dashboard-view";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { AuthRequired } from "@/modules/dashboard/components/auth-required";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แดชบอร์ดครีเอเตอร์ | ThaiArtHub",
  description: "พื้นที่แดชบอร์ดสำหรับครีเอเตอร์และผู้ดูแลระบบ ThaiArtHub",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  // 1. Unauthenticated: user has no active Supabase session
  if (!user) {
    return <AuthRequired />;
  }

  // 2. Unauthorized: authenticated user lacks 'creator' or 'admin' role
  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    return <AccessDenied profile={profile} />;
  }

  // 3. Authorized creator or admin: fetch creator dashboard metrics
  const dashboardData = await getCreatorDashboardData(supabase, profile);

  return <DashboardView data={dashboardData} />;
}
