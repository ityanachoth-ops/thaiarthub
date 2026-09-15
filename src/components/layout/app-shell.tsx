import Link from "next/link";
import type { ReactNode } from "react";
import { Search, Sparkles } from "lucide-react";

import { AuthNavButton } from "@/modules/auth/components/auth-nav-button";

const navigation = [
  { href: "/artists", label: "ศิลปิน" },
  { href: "/artworks", label: "ผลงาน" },
  { href: "/events", label: "กิจกรรม" },
  { href: "/culture", label: "เรื่องราว" },
  { href: "/map", label: "แผนที่" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/15 selection:text-primary">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
        <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-2.5 shrink-0"
              aria-label="หน้าหลัก ThaiArtHub"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition group-hover:scale-105">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight font-display leading-tight text-foreground group-hover:text-primary transition-colors">
                  ThaiArtHub
                </span>
                <span className="hidden text-[11px] text-muted-foreground md:inline leading-none">
                  พื้นที่ค้นพบศิลปินไทย
                </span>
              </div>
            </Link>

            <nav
              aria-label="เมนูหลัก"
              className="flex items-center gap-1 overflow-x-auto text-sm sm:gap-1.5"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-[11px] font-medium tracking-wide text-stone-600 transition hover:text-primary whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 border-b border-border bg-background px-1 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
              aria-label="ค้นหาศิลปินและผลงาน"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">ค้นหาศิลปิน ผลงาน กิจกรรม...</span>
              <span className="sm:hidden">ค้นหา</span>
            </Link>

            <div className="h-4 w-px bg-border/60 hidden sm:block" />

            <AuthNavButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-card/60 px-4 py-10 text-stone-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-base font-semibold font-display text-foreground">ThaiArtHub</span>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              แพลตฟอร์มค้นพบศิลปิน ครีเอเตอร์ ผลงาน และกิจกรรมศิลปะไทย
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-stone-600">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
            <Link href="/search" className="hover:text-primary transition-colors">
              ค้นหา
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-6xl border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ThaiArtHub. มุ่งมั่นเชื่อมโยงและสนับสนุนวงการศิลปะไทยร่วมสมัย
        </div>
      </footer>
    </div>
  );
}

