import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/shared/route-placeholder";

export const metadata: Metadata = {
  title: "ผู้ดูแลระบบ | ThaiArtHub",
  robots: { index: false, follow: false },
};

export default function AdminPage() { return <RoutePlaceholder title="ผู้ดูแลระบบ" description="โครงหน้าดูแลเนื้อหาและผู้ใช้" detail="ต้องปกป้องด้วย server-side role check ก่อนเปิดใช้งานจริง" />; }
