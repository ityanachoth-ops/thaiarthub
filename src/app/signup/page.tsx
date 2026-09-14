import type { Metadata } from "next";
import { SignUpForm } from "@/modules/auth/components/signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สมัครเป็นครีเอเตอร์ | ThaiArtHub",
  description: "ร่วมเป็นส่วนหนึ่งของแพลตฟอร์มศิลปินและครีเอเตอร์ไทยบน ThaiArtHub",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-220px)] items-center justify-center py-8">
      <SignUpForm />
    </div>
  );
}
