import Link from "next/link";
import { ShieldAlert, Home, Compass } from "lucide-react";
import type { CreatorProfile } from "../types";

interface AccessDeniedProps {
  profile: CreatorProfile | null;
}

export function AccessDenied({ profile }: AccessDeniedProps) {
  const displayName = profile?.displayName ?? "ผู้ใช้งาน";
  const username = profile?.username ? `@${profile.username}` : "";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-border/80 bg-card p-8 text-center shadow-xs sm:p-12">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-2xs">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <span className="mb-2 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700">
        ไม่มีสิทธิ์เข้าถึง (Access Denied)
      </span>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        สงวนสิทธิ์เฉพาะครีเอเตอร์
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        สวัสดีคุณ <strong className="text-foreground">{displayName}</strong> {username ? `(${username})` : ""} บัญชีของคุณมีสถานะเป็นผู้ใช้งานทั่วไป (User) พื้นที่แดชบอร์ดนี้เปิดให้เฉพาะครีเอเตอร์ที่ผ่านการรับรองและผู้ดูแลระบบเท่านั้น
      </p>

      <div className="mt-6 w-full rounded-2xl border border-border/60 bg-muted/30 p-4 text-left text-xs">
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground">ชื่อผู้ใช้:</span>
          <span className="font-medium text-foreground">{username || displayName}</span>
        </div>
        <div className="flex items-center justify-between py-1 pt-2">
          <span className="text-muted-foreground">สถานะบัญชีปัจจุบัน:</span>
          <span className="font-medium text-amber-600">ผู้ใช้งานทั่วไป (User)</span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>
        <Link
          href="/artworks"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <Compass className="h-4 w-4" />
          <span>สำรวจผลงานศิลปะ</span>
        </Link>
      </div>
    </div>
  );
}
