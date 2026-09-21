import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminArtistForm } from "@/modules/artists/components/admin-artist-form";
import { getCreatorOwnerOptions } from "@/modules/artists/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "เพิ่ม Artist | ThaiArtHub" };

export default async function NewDashboardArtistPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect("/login?redirect=/dashboard/artists/new");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  return <AdminArtistForm adminProfileId={profile.id} creators={await getCreatorOwnerOptions(supabase)} />;
}
