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

async function assertArtistIsClaimable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  artistId: string,
  requesterProfileId: string
) {
  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("id, profile_id")
    .eq("id", artistId)
    .maybeSingle();

  if (artistError) throw new Error(`ไม่สามารถตรวจสอบสถานะศิลปินได้: ${artistError.message}`);
  if (!artist) throw new Error("ไม่พบโปรไฟล์ศิลปิน");
  if (artist.profile_id === requesterProfileId) {
    throw new Error("คุณเป็นเจ้าของโปรไฟล์นี้แล้ว");
  }

  const { data: isClaimed, error: claimedError } = await supabase.rpc("is_artist_claimed", {
    p_artist_id: artistId,
  });

  if (claimedError) throw new Error(`ไม่สามารถตรวจสอบสิทธิ์ Claim ได้: ${claimedError.message}`);
  if (isClaimed === true) {
    throw new Error("โปรไฟล์นี้มี Creator เป็นเจ้าของแล้ว ไม่สามารถส่งคำขอ Claim ได้");
  }
}

export async function submitClaimAction(input: {
  artistId: string;
  verificationUrl: string;
  message: string;
}) {
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile) throw new Error("กรุณาเข้าสู่ระบบก่อนส่งคำขอ");

  const artistId = input.artistId.trim();
  const verificationUrl = input.verificationUrl.trim();
  const message = input.message.trim();

  if (!artistId) throw new Error("ไม่พบโปรไฟล์ศิลปิน");
  if (!verificationUrl || !message) throw new Error("กรุณากรอกช่องทางยืนยันและข้อความ");
  if (!/^https?:\/\/.+/i.test(verificationUrl)) {
    throw new Error("กรุณาใส่ URL ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)");
  }

  await assertArtistIsClaimable(supabase, artistId, user.id);

  const { data: existing, error: existingError } = await supabase
    .from("claim_requests")
    .select("id, status")
    .eq("artist_id", artistId)
    .eq("requester_profile_id", user.id)
    .maybeSingle();

  if (existingError) throw new Error(`ไม่สามารถตรวจสอบคำขอเดิมได้: ${existingError.message}`);
  if (existing) {
    if (existing.status === "pending") {
      throw new Error("คุณได้ส่งคำขอ Claim สำหรับโปรไฟล์นี้แล้ว กำลังอยู่ระหว่างตรวจสอบ");
    }
    if (existing.status === "approved") {
      throw new Error("คุณเป็นเจ้าของโปรไฟล์นี้แล้ว");
    }
    throw new Error("คำขอ Claim ก่อนหน้าถูกปฏิเสธแล้ว กรุณาติดต่อทีมงานเพื่อส่งคำขอใหม่");
  }

  const { error } = await supabase.from("claim_requests").insert({
    artist_id: artistId,
    requester_profile_id: user.id,
    verification_url: verificationUrl,
    message,
    status: "pending",
  });

  if (error) throw new Error(`ไม่สามารถสร้างคำขอ Claim ได้: ${error.message}`);

  revalidatePath("/artists", "layout");
  revalidatePath("/dashboard/claims");
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
