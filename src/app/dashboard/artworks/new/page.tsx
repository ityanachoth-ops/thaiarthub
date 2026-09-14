import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ArtworkForm } from "@/modules/artworks/components/artwork-form";
import { getCreatorArtistForWorks } from "@/modules/artworks/creator-queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เพิ่มผลงาน | ThaiArtHub",
  description: "เพิ่มผลงานใหม่ในแดชบอร์ดครีเอเตอร์ ThaiArtHub",
};

export default async function NewArtworkPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect("/login?redirect=/dashboard/artworks/new");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "creator" && profile.role !== "admin") {
    return <AccessDenied profile={profile} />;
  }

  const artist = await getCreatorArtistForWorks(supabase, user.id);
  if (!artist) redirect("/dashboard");

  return <ArtworkForm userId={user.id} artistId={artist.id} />;
}
