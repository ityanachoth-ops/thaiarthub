import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/modules/auth/components/signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | ThaiArtHub",
  description: "ร่วมเป็นส่วนหนึ่งของแพลตฟอร์มศิลปินและครีเอเตอร์ไทยบน ThaiArtHub",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center py-8">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-muted/40" />}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}
