import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { ClaimRequest, ClaimRequestCreate } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function mapClaim(row: Database["public"]["Tables"]["claim_requests"]["Row"]): ClaimRequest {
  return {
    id: row.id,
    artistId: row.artist_id,
    requesterProfileId: row.requester_profile_id,
    verificationUrl: row.verification_url,
    message: row.message,
    status: row.status as ClaimRequest["status"],
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getClaimRequestsByArtistId(artistId: string): Promise<ClaimRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claim_requests")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดคำขอ Claim ได้: ${error.message}`);
  return (data ?? []).map(mapClaim);
}

export async function getClaimRequestByArtistAndRequester(
  artistId: string,
  profileId: string
): Promise<ClaimRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claim_requests")
    .select("*")
    .eq("artist_id", artistId)
    .eq("requester_profile_id", profileId)
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดคำขอ Claim ได้: ${error.message}`);
  if (!data) return null;
  return mapClaim(data);
}

export async function getApprovedClaimByArtistId(artistId: string): Promise<ClaimRequest | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claim_requests")
    .select("*")
    .eq("artist_id", artistId)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดคำขอ Claim ได้: ${error.message}`);
  if (!data) return null;
  return mapClaim(data);
}

export async function getAllClaimRequests(): Promise<ClaimRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("claim_requests")
    .select("*, artists(name, slug), profiles(display_name, username)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดคำขอ Claim ได้: ${error.message}`);
  return (data ?? []).map((row) => {
    const base = mapClaim(row as Database["public"]["Tables"]["claim_requests"]["Row"]);
    const artist = (row as unknown as { artists: { name: string; slug: string } | null }).artists;
    const requester = (row as unknown as { profiles: { display_name: string; username: string } | null }).profiles;
    return {
      ...base,
      artistName: artist?.name ?? "",
      artistSlug: artist?.slug ?? "",
      requesterName: requester?.display_name ?? "",
      requesterUsername: requester?.username ?? "",
    };
  });
}

export async function createClaimRequest(
  data: ClaimRequestCreate,
  profileId: string
): Promise<ClaimRequest> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("claim_requests")
    .insert({
      artist_id: data.artistId,
      requester_profile_id: profileId,
      verification_url: data.verificationUrl,
      message: data.message,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`ไม่สามารถสร้างคำขอ Claim ได้: ${error.message}`);
  return mapClaim(result);
}

export async function approveClaim(
  claimId: string,
  adminProfileId: string,
  note?: string
): Promise<ClaimRequest> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("claim_requests")
    .update({
      status: "approved",
      reviewed_by: adminProfileId,
      reviewed_at: new Date().toISOString(),
      admin_note: note ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw new Error(`ไม่สามารถอนุมัติคำขอ Claim ได้: ${error.message}`);
  if (!result) throw new Error("ไม่พบคำขอที่จะอนุมัติ");
  return mapClaim(result);
}

export async function rejectClaim(
  claimId: string,
  adminProfileId: string,
  note?: string
): Promise<ClaimRequest> {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from("claim_requests")
    .update({
      status: "rejected",
      reviewed_by: adminProfileId,
      reviewed_at: new Date().toISOString(),
      admin_note: note ?? null,
    })
    .eq("id", claimId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw new Error(`ไม่สามารถปฏิเสธคำขอ Claim ได้: ${error.message}`);
  if (!result) throw new Error("ไม่พบคำขอที่จะปฏิเสธ");
  return mapClaim(result);
}
