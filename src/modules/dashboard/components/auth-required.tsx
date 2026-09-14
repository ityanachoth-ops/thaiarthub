import Link from "next/link";
import { Lock, ArrowLeft, Home } from "lucide-react";

export function AuthRequired() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-3xl border border-border/80 bg-card p-8 text-center shadow-xs sm:p-12">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
        <Lock className="h-8 w-8" />
      </div>

      <span className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        จำเป็นต้องยืนยันตัวตน
      </span>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        เข้าสู่ระบบเพื่อใช้งานแดชบอร์ด
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        พื้นที่แดชบอร์ดสงวนสิทธิ์เฉพาะสมาชิกครีเอเตอร์และผู้ดูแลระบบของ ThaiArtHub
        เพื่อความปลอดภัย กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>
        <Link
          href="/artists"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>สำรวจศิลปิน</span>
        </Link>
      </div>

      <div className="mt-8 border-t border-border/50 pt-4 text-xs text-muted-foreground">
        ยังไม่ได้เป็นครีเอเตอร์? ติดตามผลงานและศิลปินไทยได้ในหน้าหลัก
      </div>
    </div>
  );
}
