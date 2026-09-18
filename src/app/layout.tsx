import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";

import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl } from "@/lib/site-url";

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

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "ThaiArtHub | พื้นที่ค้นพบศิลปิน งานศิลปะ และพื้นที่สร้างสรรค์ไทย",
    template: "%s | ThaiArtHub",
  },
  description: "แพลตฟอร์มศูนย์รวมและค้นพบศิลปินไทย ผลงานศิลปะ กิจกรรม และพื้นที่สร้างสรรค์ทั่วประเทศไทย",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "ThaiArtHub | พื้นที่ค้นพบศิลปิน งานศิลปะ และพื้นที่สร้างสรรค์ไทย",
    description: "แพลตฟอร์มศูนย์รวมและค้นพบศิลปินไทย ผลงานศิลปะ กิจกรรม และพื้นที่สร้างสรรค์ทั่วประเทศไทย",
    url: siteUrl.origin,
    siteName: "ThaiArtHub",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThaiArtHub | พื้นที่ค้นพบศิลปิน งานศิลปะ และพื้นที่สร้างสรรค์ไทย",
    description: "แพลตฟอร์มศูนย์รวมและค้นพบศิลปินไทย ผลงานศิลปะ กิจกรรม และพื้นที่สร้างสรรค์ทั่วประเทศไทย",
  },
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
