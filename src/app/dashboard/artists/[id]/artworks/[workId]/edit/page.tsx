import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArtworkForm } from "@/modules/artworks/components/artwork-form";
import { getAdminArtistById } from "@/modules/artists/queries";
import {
  getCreatorArtworkById,
  getCreatorArtworkGallery,
} from "@/modules/artworks/creator-queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขผลงาน | ThaiArtHub" };

export default async function AdminEditArtworkPage({
  params,
}: {
  params: Promise<{ id: string; workId: string }>;
}) {
  const { id, workId } = await params;

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect(`/login?redirect=/dashboard/artists/${id}/artworks/${workId}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const artist = await getAdminArtistById(id);
  if (!artist) notFound();

  // getCreatorArtworkById filters by artist_id — admin RLS allows access regardless of profile_id
  const artwork = await getCreatorArtworkById(supabase, artist.id, workId);
  if (!artwork) notFound();

  const gallery = await getCreatorArtworkGallery(supabase, artwork.id);

  const imagePreviewUrl = artwork.image_url
    ? (await supabase.storage.from("works").createSignedUrl(artwork.image_url, 3600)).data
        ?.signedUrl ?? null
    : null;

  return (
    <ArtworkForm
      userId={artist.ownerProfileId}
      artistId={artist.id}
      artwork={artwork}
      imagePreviewUrl={imagePreviewUrl}
      gallery={gallery}
      backHref={`/dashboard/artists/${artist.id}/edit`}
    />
  );
}
