import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminArtistEditForm } from "@/modules/artists/components/admin-artist-edit-form";
import { getAdminArtistById } from "@/modules/artists/queries";
import { getAdminArtistWorksById } from "@/modules/artworks/creator-queries";
import { getAllCategories } from "@/modules/categories/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { AdminArtistWorksManager } from "@/modules/artworks/components/admin-artist-works-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไข Artist | ThaiArtHub" };

export default async function EditDashboardArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect(`/login?redirect=/dashboard/artists/${id}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const [artist, allCategories, works] = await Promise.all([
    getAdminArtistById(id),
    getAllCategories(),
    getAdminArtistWorksById(supabase, id),
  ]);

  if (!artist) notFound();

  return (
    <div className="flex flex-col gap-8">
      <AdminArtistEditForm artist={artist} allCategories={allCategories} />
      <AdminArtistWorksManager artistId={artist.id} works={works} />
    </div>
  );
}
