import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ArtworkForm } from "@/modules/artworks/components/artwork-form";
import {
  getCreatorArtistForWorks,
  getCreatorArtworkById,
} from "@/modules/artworks/creator-queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แก้ไขผลงาน | ThaiArtHub",
  description: "แก้ไขผลงานในแดชบอร์ดครีเอเตอร์ ThaiArtHub",
};

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect(`/login?redirect=/dashboard/artworks/${id}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "creator" && profile.role !== "admin") {
    return <AccessDenied profile={profile} />;
  }

  const artist = await getCreatorArtistForWorks(supabase, user.id);
  if (!artist) redirect("/dashboard");

  const artwork = await getCreatorArtworkById(supabase, artist.id, id);
  if (!artwork) notFound();

  const imagePreviewUrl = artwork.image_url
    ? (await supabase.storage.from("works").createSignedUrl(artwork.image_url, 3600)).data
        ?.signedUrl ?? null
    : null;

  return (
    <ArtworkForm
      userId={user.id}
      artistId={artist.id}
      artwork={artwork}
      imagePreviewUrl={imagePreviewUrl}
    />
  );
}
