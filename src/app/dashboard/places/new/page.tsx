import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { PlaceForm } from "@/modules/places/components/place-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "เพิ่ม Creative Place | ThaiArtHub" };

export default async function NewPlacePage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/places/new");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "creator" && profile.role !== "admin") return <AccessDenied profile={profile} />;
  return <PlaceForm userId={user.id} isAdmin={profile.role === "admin"} />;
}
