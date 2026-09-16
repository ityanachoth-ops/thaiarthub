import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllClaimRequests } from "@/actions/claims";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { ClaimRequestsTable } from "./components/claim-requests-table";
import type { ClaimRequestWithNames } from "@/modules/claims/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการคำขอ Claim | ThaiArtHub",
  description: "ตรวจสอบและจัดการคำขอ Claim โปรไฟล์ศิลปิน",
};

export default async function DashboardClaimsPage() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);

  if (!user) redirect("/login?redirect=/dashboard/claims");
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;

  const claims = await getAllClaimRequests() as ClaimRequestWithNames[];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <span className="text-xs font-medium text-primary">ผู้ดูแลระบบ (Admin)</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">จัดการคำขอ Claim</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">ตรวจสอบและอนุมัติหรือปฏิเสธคำขอ Claim โปรไฟล์ศิลปิน</p>
      </header>

      <ClaimRequestsTable claims={claims} />
    </div>
  );
}
