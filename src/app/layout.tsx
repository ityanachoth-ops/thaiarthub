import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const thaiSans = IBM_Plex_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const thaiDisplay = Prompt({
  variable: "--font-thai-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thaiarthub | พื้นที่ค้นพบศิลปินไทย",
  description: "แพลตฟอร์มค้นพบศิลปินและครีเอเตอร์ไทย",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${thaiSans.variable} ${thaiDisplay.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
