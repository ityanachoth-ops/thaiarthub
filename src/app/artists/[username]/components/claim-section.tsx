"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import { ClaimForm } from "./claim-form";

interface ClaimSectionProps {
  artistId: string;
  artistName: string;
  artistProfileId: string | null;
  userProfileId: string | null;
}

type ClaimRow = Pick<
  Database["public"]["Tables"]["claim_requests"]["Row"],
  "id" | "status" | "verification_url" | "message"
>;

function mapClaim(row: ClaimRow) {
  return {
    id: row.id,
    status: row.status,
    verificationUrl: row.verification_url,
    message: row.message,
  };
}

export function ClaimSection({
  artistId,
  artistName,
  artistProfileId,
  userProfileId,
}: ClaimSectionProps) {
  const [activeClaim, setActiveClaim] = useState<ReturnType<typeof mapClaim> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        if (userProfileId) {
          const { data: existing } = await supabase
            .from("claim_requests")
            .select("id, status, verification_url, message")
            .eq("artist_id", artistId)
            .eq("requester_profile_id", userProfileId)
            .maybeSingle();

          if (existing) {
            setActiveClaim(mapClaim(existing));
            return;
          }
        }

        const { data: approved } = await supabase
          .from("claim_requests")
          .select("id, status, verification_url, message")
          .eq("artist_id", artistId)
          .eq("status", "approved")
          .maybeSingle();

        if (approved) {
          setActiveClaim(mapClaim(approved));
        }
      } catch {
        // No claim data available
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, [artistId, userProfileId]);

  if (isLoading) return null;

  const isOwner = artistProfileId !== null && userProfileId !== null && artistProfileId === userProfileId;
  const isClaimedByOther = artistProfileId !== null && !isOwner;

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800">You own this profile</p>
            <p className="text-sm text-emerald-600">คุณเป็นเจ้าของโปรไฟล์ศิลปินนี้</p>
          </div>
        </div>
      </div>
    );
  }

  if (isClaimedByOther) {
    return null;
  }

  if (activeClaim && activeClaim.status === "approved" && !isOwner) {
    return null;
  }

  if (activeClaim && activeClaim.status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-amber-800">Claim pending</p>
            <p className="text-sm text-amber-600">คำขออยู่ระหว่างตรวจสอบ</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showForm ? "ซ่อน" : "ดูรายละเอียด"}
          </button>
        </div>
        {showForm && activeClaim && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ชื่อศิลปิน</span>
              <span>{artistName}</span>
            </div>
            {activeClaim.verificationUrl && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ยืนยัน</span>
                <a
                  href={activeClaim.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate max-w-[200px]"
                >
                  {activeClaim.verificationUrl}
                </a>
              </div>
            )}
            {activeClaim.message && (
              <div>
                <span className="text-muted-foreground">ข้อความ:</span>
                <p className="mt-1 text-muted-foreground">{activeClaim.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <h3 className="font-display text-base font-semibold text-foreground mb-4">
        Claim this Artist
      </h3>
      <ClaimForm
        artistId={artistId}
        artistName={artistName}
        onSuccess={() => setShowForm(false)}
      />
    </div>
  );
}
