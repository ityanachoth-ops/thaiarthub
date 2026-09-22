import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkForm } from "@/modules/artworks/components/artwork-form";
import { getAdminArtistById } from "@/modules/artists/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "เพิ่มผลงาน | ThaiArtHub" };

export default async function AdminNewArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect(`/login?redirect=/dashboard/artists/${id}/artworks/new`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const artist = await getAdminArtistById(id);
  if (!artist) notFound();

  return (
    <ArtworkForm
      userId={artist.ownerProfileId}
      artistId={artist.id}
      gallery={[]}
      backHref={`/dashboard/artists/${artist.id}/edit`}
    />
  );
}
