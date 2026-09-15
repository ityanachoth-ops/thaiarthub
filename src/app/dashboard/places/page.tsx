import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";
import { getCreativePlaces } from "@/modules/places/queries";
import { PlacesManager } from "@/modules/places/components/places-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creative Places | ThaiArtHub" };

export default async function PlacesDashboardPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/places");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "creator" && profile.role !== "admin") return <AccessDenied profile={profile} />;
  const places = await getCreativePlaces(user.id, profile.role === "admin");
  return <div className="flex flex-col gap-8"><header><span className="text-xs font-medium text-primary">แดชบอร์ด</span><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Creative Places</h1><p className="mt-2 text-sm text-muted-foreground">จัดการพื้นที่สร้างสรรค์สำหรับ ThaiArtHub</p></header><PlacesManager places={places} /></div>;
}
