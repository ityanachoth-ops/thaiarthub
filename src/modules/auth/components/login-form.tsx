"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "../types";
import {
  getSafeInternalPath,
  isArtistClaimRedirect,
  resolvePostAuthPath,
  withRedirectParam,
} from "../redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = getSafeInternalPath(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMessage(
            "อีเมลนี้ยังไม่ได้รับการยืนยัน กรุณาตรวจสอบกล่องข้อความหรืออีเมลขยะของคุณ"
          );
        } else if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!profile) {
          router.push(
            isArtistClaimRedirect(redirectPath) ? redirectPath : "/"
          );
        } else {
          const destination = resolvePostAuthPath({
            role: profile.role,
            next: redirectPath,
          });

          if (
            (profile.role === "creator" || profile.role === "admin") &&
            !isArtistClaimRedirect(destination) &&
            destination !== "/onboarding"
          ) {
            const { data: artist } = await supabase
              .from("artists")
              .select("id")
              .eq("profile_id", data.user.id)
              .maybeSingle();

            router.push(artist ? destination : "/onboarding");
          } else {
            router.push(destination);
          }
        }
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          เข้าสู่ระบบ
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          เข้าสู่ระบบเพื่อใช้งาน ThaiArtHub ในฐานะผู้ใช้ทั่วไปหรือครีเอเตอร์
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-foreground"
            >
              รหัสผ่าน (Password)
            </label>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
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
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link
          href={withRedirectParam("/signup", redirectPath)}
          className="font-medium text-primary hover:underline transition-colors"
        >
          สมัครสมาชิกที่นี่
        </Link>
      </div>
    </div>
  );
}
