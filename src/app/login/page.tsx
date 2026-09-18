import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth/components/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | ThaiArtHub",
  description: "เข้าสู่ระบบ ThaiArtHub สำหรับผู้ใช้ทั่วไปและครีเอเตอร์",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center py-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-muted/40" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
