import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminEventManager } from "@/modules/events/components/admin-event-manager";
import { getAdminEvents } from "@/modules/events/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "จัดการกิจกรรม | ThaiArtHub", description: "จัดการกิจกรรมบน ThaiArtHub" };

export default async function DashboardEventsPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/events");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;
  return <div className="flex flex-col gap-8"><header><span className="text-xs font-medium text-primary">ผู้ดูแลระบบ (Admin)</span><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">จัดการกิจกรรม</h1><p className="mt-2 text-sm text-muted-foreground">จัดการข้อมูลกิจกรรม แกลเลอรี และกิจกรรมเด่น</p></header><AdminEventManager events={await getAdminEvents()} /></div>;
}