import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/modules/events/components/event-form";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "เพิ่มกิจกรรม | ThaiArtHub" };

export default async function NewDashboardEventPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/events/new");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;
  return <EventForm />;
}