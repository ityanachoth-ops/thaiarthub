import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/modules/culture/components/article-form";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เขียนเรื่องราว | ThaiArtHub",
  description: "เขียนเรื่องราวใหม่สำหรับ ThaiArtHub",
};

export default async function NewCultureArticlePage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect("/login?redirect=/dashboard/culture/new");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  return <ArticleForm userId={user.id} />;
}