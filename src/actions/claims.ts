"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";

function mapClaim(row: Database["public"]["Tables"]["claim_requests"]["Row"]) {
  return {
    id: row.id,
    artistId: row.artist_id,
    requesterProfileId: row.requester_profile_id,
    verificationUrl: row.verification_url,
    message: row.message,
    status: row.status as "pending" | "approved" | "rejected",
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllClaimRequests() {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) throw new Error("Unauthorized");
  if (profile?.role !== "admin") throw new Error("Forbidden");

  const { data, error } = await supabase
    .from("claim_requests")
    .select(`
      *,
      artists(name, slug),
      requester:profiles!claim_requests_requester_profile_id_fkey(display_name, username)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดคำขอ Claim ได้: ${error.message}`);

  return (data ?? []).map((row) => {
    const base = mapClaim(row as Database["public"]["Tables"]["claim_requests"]["Row"]);
    const artist = (row as unknown as { artists: { name: string; slug: string } | null }).artists;
    const requester = (row as unknown as { requester: { display_name: string; username: string } | null }).requester;
    return {
      ...base,
      artistName: artist?.name ?? "",
      artistSlug: artist?.slug ?? "",
      requesterName: requester?.display_name ?? "",
      requesterUsername: requester?.username ?? "",
    };
  });
}

export async function approveClaimAction(
  claimId: string,
  adminNote?: string
) {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) throw new Error("Unauthorized");
  if (profile?.role !== "admin") throw new Error("Forbidden");

  const { data, error } = await supabase
    .from("claim_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw new Error(`ไม่สามารถอนุมัติคำขอ Claim ได้: ${error.message}`);
  if (!data) throw new Error("ไม่พบคำขอที่จะอนุมัติ");

  const { error: updateError } = await supabase
    .from("artists")
    .update({ profile_id: data.requester_profile_id })
    .eq("id", data.artist_id);

  if (updateError) {
    console.error("Failed to update artist ownership:", updateError.message);
  }

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", data.requester_profile_id);

  if (roleError) {
    console.error("Failed to elevate claimant role to creator:", roleError.message);
  }

  revalidatePath("/dashboard/claims");
  revalidatePath("/dashboard", "layout");
  return mapClaim(data);
}

export async function rejectClaimAction(
  claimId: string,
  adminNote?: string
) {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) throw new Error("Unauthorized");
  if (profile?.role !== "admin") throw new Error("Forbidden");

  const { data, error } = await supabase
    .from("claim_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw new Error(`ไม่สามารถปฏิเสธคำขอ Claim ได้: ${error.message}`);
  if (!data) throw new Error("ไม่พบคำขอที่จะปฏิเสธ");

  revalidatePath("/dashboard/claims");
  revalidatePath("/dashboard", "layout");
  return mapClaim(data);
}
