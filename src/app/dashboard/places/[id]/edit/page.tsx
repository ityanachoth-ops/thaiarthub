import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { getCreativePlaceById } from "@/modules/places/queries";
import { PlaceForm } from "@/modules/places/components/place-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "แก้ไข Creative Place | ThaiArtHub" };

export default async function EditPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect(`/login?redirect=/dashboard/places/${id}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "creator" && profile.role !== "admin") return <AccessDenied profile={profile} />;
  const place = await getCreativePlaceById(id, user.id, profile.role === "admin");
  if (!place) notFound();
  return <PlaceForm userId={user.id} isAdmin={profile.role === "admin"} place={place} />;
}
