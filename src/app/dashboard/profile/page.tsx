import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthenticatedProfile,
  getCreatorProfileEditData,
} from "@/modules/dashboard/queries";
import { ProfileEditForm } from "@/modules/dashboard/components/profile-edit-form";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แก้ไขโปรไฟล์ครีเอเตอร์ | ThaiArtHub",
  description: "จัดการและแก้ไขข้อมูลโปรไฟล์และศิลปินของคุณบน ThaiArtHub",
};

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  // 1. Unauthenticated: redirect to /login
  if (!user) {
    redirect("/login?redirect=/dashboard/profile");
  }

  // 2. Authenticated but profile not onboarded: redirect to /onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  // 3. Unauthorized: authenticated user lacks 'creator' or 'admin' role
  if (profile.role !== "creator" && profile.role !== "admin") {
    return <AccessDenied profile={profile} />;
  }

  // 4. Fetch profile and artist edit data
  const {
    profile: fullProfile,
    artist,
    avatarPreviewUrl,
    coverPreviewUrl,
  } = await getCreatorProfileEditData(
    supabase,
    user.id
  );

  return (
    <ProfileEditForm
      userId={user.id}
      initialDisplayName={fullProfile?.display_name || profile.displayName}
      initialUsername={fullProfile?.username || profile.username}
      initialBio={fullProfile?.bio || profile.bio}
      initialLocation={artist?.location || ""}
      initialAvatarPath={fullProfile?.avatar_url || artist?.avatar_url || ""}
      initialAvatarPreviewUrl={avatarPreviewUrl}
      initialCoverPath={artist?.cover_image_url || ""}
      initialCoverPreviewUrl={coverPreviewUrl}
    />
  );
}
