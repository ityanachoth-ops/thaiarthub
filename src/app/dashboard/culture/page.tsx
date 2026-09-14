import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminArticleManager } from "@/modules/culture/components/admin-article-manager";
import { getAdminArticles } from "@/modules/culture/queries";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการเรื่องราว | ThaiArtHub",
  description: "พื้นที่จัดการบทความวัฒนธรรมของ ThaiArtHub",
};

export default async function CultureDashboardPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect("/login?redirect=/dashboard/culture");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const articles = await getAdminArticles();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <span className="text-xs font-medium text-primary">ผู้ดูแลระบบ (Admin)</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">จัดการเรื่องราว</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">เขียน แก้ไข และเผยแพร่เรื่องราววัฒนธรรมบน ThaiArtHub</p>
      </header>
      <AdminArticleManager articles={articles} />
    </div>
  );
}