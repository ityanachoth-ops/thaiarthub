"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, AlertCircle, CheckCircle2, Mail, Loader2, User, Palette } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "../types";
import {
  getSafeInternalPath,
  isArtistClaimRedirect,
  withRedirectParam,
} from "../redirect";

type SignupIntent = "user" | "creator";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getSafeInternalPath(searchParams.get("redirect"));
  const isClaimFlow = isArtistClaimRedirect(redirectPath);

  const [intent, setIntent] = useState<SignupIntent>("user");
  const effectiveIntent: SignupIntent = isClaimFlow ? "user" : intent;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessConfirmation, setIsSuccessConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const afterAuthPath =
    isClaimFlow ? redirectPath : effectiveIntent === "creator" ? "/onboarding" : redirectPath;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = signupSchema.safeParse({
      email,
      password,
      displayName,
      username,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        setErrorMessage(`ชื่อผู้ใช้ @${username} ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
        setIsLoading(false);
        return;
      }

      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(afterAuthPath)}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            display_name: displayName,
            username: username.toLowerCase(),
            intended_role: effectiveIntent,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session && data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName,
          username: username.toLowerCase(),
          role: effectiveIntent,
        });

        router.push(afterAuthPath);
        router.refresh();
      } else {
        setIsSuccessConfirmation(true);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลงทะเบียน"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccessConfirmation) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 text-center shadow-xs sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-2xs">
          <Mail className="h-7 w-7" />
        </div>

        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>สมัครสมาชิกสำเร็จ</span>
        </span>

        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          ตรวจสอบกล่องข้อความของคุณ
        </h2>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          ระบบได้ส่งอีเมลยืนยันตัวตนไปยัง{" "}
          <strong className="text-foreground font-medium">{email}</strong>{" "}
          เรียบร้อยแล้ว กรุณาเปิดอีเมลและคลิกลิงก์ยืนยัน เพื่อเปิดใช้งานบัญชีของคุณ
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={withRedirectParam("/login", afterAuthPath)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
          >
            <span>ไปที่หน้าเข้าสู่ระบบ</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          สมัครสมาชิก
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {isClaimFlow
            ? "สร้างบัญชีผู้ใช้ทั่วไปเพื่อส่งคำขอ Claim โปรไฟล์ศิลปิน"
            : "เลือกประเภทบัญชี แล้วสร้างโปรไฟล์บน ThaiArtHub"}
        </p>
      </div>

      {isClaimFlow ? (
        <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-800">
          คุณกำลังยืนยันโปรไฟล์ศิลปินที่มีอยู่แล้ว บัญชีจะถูกสร้างเป็นผู้ใช้ทั่วไป
          และต้องรอการอนุมัติจากผู้ดูแลระบบ
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIntent("user")}
            className={`flex flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition ${
              effectiveIntent === "user"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <User className="h-4 w-4" />
            <span className="text-xs font-semibold">ผู้ใช้ทั่วไป</span>
            <span className="text-[11px] leading-relaxed">ชมศิลปิน ผลงาน และข่าววัฒนธรรม</span>
          </button>
          <button
            type="button"
            onClick={() => setIntent("creator")}
            className={`flex flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition ${
              effectiveIntent === "creator"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Palette className="h-4 w-4" />
            <span className="text-xs font-semibold">Creator</span>
            <span className="text-[11px] leading-relaxed">สร้างโปรไฟล์ศิลปินและจัดการผลงาน</span>
          </button>
        </div>
      )}

      {errorMessage ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="displayName"
            className="block text-xs font-medium text-foreground"
          >
            {effectiveIntent === "creator" ? "ชื่อศิลปิน / ครีเอเตอร์" : "ชื่อที่แสดง"}
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={effectiveIntent === "creator" ? "เช่น นาวิน พงศ์ศิริ" : "เช่น สมชาย"}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-xs font-medium text-foreground"
          >
            ชื่อผู้ใช้ / Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              @
            </span>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="navin-art"
              className="w-full rounded-xl border border-border bg-background pl-8 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และขีดกลาง (-) เช่น navin-studio
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-foreground"
          >
            อีเมล (Email)
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-foreground"
          >
            รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังสร้างบัญชี...</span>
            </>
          ) : (
            <>
              <span>สมัครสมาชิก</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href={withRedirectParam("/login", redirectPath)}
          className="font-medium text-primary hover:underline transition-colors"
        >
          เข้าสู่ระบบที่นี่
        </Link>
      </div>
    </div>
  );
}
