import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ArticleForm } from "@/modules/culture/components/article-form";
import { getAdminArticleById } from "@/modules/culture/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แก้ไขเรื่องราว | ThaiArtHub",
  description: "แก้ไขเรื่องราวในพื้นที่ผู้ดูแลระบบ ThaiArtHub",
};

export default async function EditCultureArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect(`/login?redirect=/dashboard/culture/${id}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const article = await getAdminArticleById(id);
  if (!article) notFound();

  return <ArticleForm userId={user.id} article={article} />;
}