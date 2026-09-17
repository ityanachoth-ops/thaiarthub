import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/modules/auth/components/onboarding-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สร้างโปรไฟล์ศิลปิน | ThaiArtHub",
  description: "เริ่มต้นสร้างโปรไฟล์ครีเอเตอร์และศิลปินบน ThaiArtHub",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, bio, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    redirect("/");
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("location, avatar_url")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  const userMeta = (user.user_metadata || {}) as {
    display_name?: string;
    username?: string;
  };

  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center py-8">
      <OnboardingForm
        initialUserId={user.id}
        initialRole={profile.role}
        initialDisplayName={profile.display_name || userMeta.display_name || ""}
        initialUsername={profile.username || userMeta.username || ""}
        initialBio={profile.bio || ""}
        initialLocation={artist?.location || ""}
        initialAvatarUrl={profile.avatar_url || artist?.avatar_url || ""}
      />
    </div>
  );
}
