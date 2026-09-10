import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thaiarthub | พื้นที่ค้นพบศิลปินไทย",
  description: "แพลตฟอร์มค้นพบศิลปินและครีเอเตอร์ไทย",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans"><AppShell>{children}</AppShell></body>
    </html>
  );
}
