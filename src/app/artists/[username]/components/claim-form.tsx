"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

interface ClaimFormProps {
  artistId: string;
  artistName: string;
  onSuccess?: () => void;
}

export function ClaimForm({ artistId, artistName, onSuccess }: ClaimFormProps) {
  const [verificationUrl, setVerificationUrl] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!verificationUrl.trim() || !message.trim()) {
      setErrorMessage("กรุณากรอกช่องทางยืนยันและข้อความ");
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(verificationUrl.trim())) {
      setErrorMessage("กรุณาใส่ URL ที่ถูกต้อง (เริ่มต้นด้วย http:// หรือ https://)");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("กรุณาเข้าสู่ระบบก่อนส่งคำขอ");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        setErrorMessage("ไม่พบโปรไฟล์ของคุณ");
        return;
      }

      const { data: existing } = await supabase
        .from("claim_requests")
        .select("id, status")
        .eq("artist_id", artistId)
        .eq("requester_profile_id", profile.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === "pending") {
          setErrorMessage("คุณได้ส่งคำขอ Claim สำหรับโปรไฟล์นี้แล้ว กำลังอยู่ระหว่างตรวจสอบ");
        } else if (existing.status === "approved") {
          setSuccessMessage("คุณเป็นเจ้าของโปรไฟล์นี้แล้ว");
        } else {
          setErrorMessage("คำขอ Claim ก่อนหน้าถูกปฏิเสธแล้ว คุณสามารถส่งคำขอใหม่ได้");
        }
        return;
      }

      const { error } = await supabase
        .from("claim_requests")
        .insert({
          artist_id: artistId,
          requester_profile_id: profile.id,
          verification_url: verificationUrl.trim(),
          message: message.trim(),
          status: "pending",
        });

      if (error) throw new Error(error.message);

      setSuccessMessage("ส่งคำขอ Claim แล้ว");
      setVerificationUrl("");
      setMessage("");
      onSuccess?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งคำขอ"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">
        ยืนยันว่าโปรไฟล์นี้เป็นของคุณ
      </h3>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-muted-foreground">
          ศิลปิน
        </label>
        <div className="rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-foreground">
          {artistName}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="verification-url" className="block text-sm font-medium text-muted-foreground">
          ช่องทางยืนยันตัวตน
        </label>
        <input
          id="verification-url"
          type="url"
          required
          value={verificationUrl}
          onChange={(event) => setVerificationUrl(event.target.value)}
          placeholder="https://instagram.com/your_username"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">Instagram, Facebook, portfolio, หรือเว็บไซต์ทางการ</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="claim-message" className="block text-sm font-medium text-muted-foreground">
          ทำไมคุณถึงเป็นเจ้าของโปรไฟล์นี้?
        </label>
        <textarea
          id="claim-message"
          rows={4}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="อธิบายว่าทำไมคุณเป็นเจ้าของโปรไฟล์ศิลปินนี้"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-xl bg-emerald-50/80 p-3 text-sm text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังส่งคำขอ...
          </>
        ) : (
          "ส่งคำขอ Claim"
        )}
      </button>
    </form>
  );
}
