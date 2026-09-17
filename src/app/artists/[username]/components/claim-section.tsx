"use client";

import { useState } from "react";
import { BadgeCheck, Clock, LogIn } from "lucide-react";
import Link from "next/link";
import { ClaimForm } from "./claim-form";

interface ClaimSectionProps {
  artistId: string;
  artistName: string;
  /** The artist's slug — used to build the login redirect URL. */
  artistSlug: string;
  /** Whether the current visitor has an active session. */
  isLoggedIn: boolean;
  /** True when the current user's profile_id matches the artist's profile_id. */
  isOwner: boolean;
  /**
   * True when the artist's owner profile has role = 'creator'.
   * Admin-owned artists remain claimable. Derived via is_artist_claimed().
   */
  isClaimed: boolean;
  /** True when the current user has a pending claim_requests row for this artist. */
  isPendingForCurrentUser: boolean;
}

export function ClaimSection({
  artistId,
  artistName,
  artistSlug,
  isLoggedIn,
  isOwner,
  isClaimed,
  isPendingForCurrentUser,
}: ClaimSectionProps) {
  const [showForm, setShowForm] = useState(false);

  // ── Owner ────────────────────────────────────────────────────────────────
  if (isOwner) {
    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">คุณเป็นเจ้าของโปรไฟล์นี้</p>
            <p className="text-xs text-emerald-600">You own this artist profile</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Claimed by someone else ───────────────────────────────────────────────
  if (isClaimed) {
    return null;
  }

  // ── Current user has a pending claim ─────────────────────────────────────
  if (isPendingForCurrentUser) {
    return (
      <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Claim pending</p>
            <p className="text-xs text-amber-600">คำขออยู่ระหว่างการตรวจสอบโดยทีมงาน</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    const loginHref = `/login?redirect=/artists/${artistSlug}`;
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Claim Artist</p>
            <p className="text-xs text-muted-foreground">
              เข้าสู่ระบบเพื่อยืนยันว่าโปรไฟล์นี้เป็นของคุณ
            </p>
          </div>
          <Link
            href={loginHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5" />
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  // ── Logged in, no claim yet ───────────────────────────────────────────────
  if (!showForm) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Claim Artist</p>
            <p className="text-xs text-muted-foreground">
              ยืนยันว่าโปรไฟล์ศิลปินนี้เป็นของคุณ
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
          >
            Claim Artist
          </button>
        </div>
      </div>
    );
  }

  // ── Claim form ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <ClaimForm
        artistId={artistId}
        artistName={artistName}
        onSuccess={() => setShowForm(false)}
      />
    </div>
  );
}
