"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Search, Sparkles } from "lucide-react";

import { AuthNavButton } from "@/modules/auth/components/auth-nav-button";

// Desktop: split evenly left/right of center logo
const navLeft = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/artists", label: "ศิลปิน" },
  { href: "/artworks", label: "ผลงาน" },
];

const navRight = [
  { href: "/events", label: "กิจกรรม" },
  { href: "/culture", label: "เรื่องราว" },
  { href: "/map", label: "แผนที่" },
  { href: "/places", label: "Creative Places" },
];

// All items merged for footer and mobile nav
const navigation = [...navLeft, ...navRight];

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-caption font-medium transition whitespace-nowrap ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/15 selection:text-primary">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        {/* ── Desktop bar (md+): 3-column grid so logo is always viewport-centered ── */}
        <div className="mx-auto hidden min-h-16 max-w-7xl items-center px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
          {/* Left nav */}
          <nav aria-label="เมนูหลักซ้าย" className="flex items-center gap-1">
            {navLeft.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
            ))}
          </nav>

          {/* Center logo */}
          <Link
            href="/"
            className="group mx-6 flex items-center gap-2.5 justify-center shrink-0"
            aria-label="หน้าหลัก ThaiArtHub"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight font-display leading-tight text-foreground group-hover:text-primary transition-colors">
                ThaiArtHub
              </span>
              <span className="text-mini text-muted-foreground leading-none">
                พื้นที่ค้นพบศิลปินไทย
              </span>
            </div>
          </Link>

          {/* Right nav + utilities */}
          <div className="flex items-center justify-end gap-1">
            <nav aria-label="เมนูหลักขวา" className="flex items-center gap-1">
              {navRight.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
              ))}
            </nav>
            <div className="mx-2 h-4 w-px bg-border/60" />
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-micro font-medium text-muted-foreground shadow-2xs transition hover:border-primary/40 hover:text-primary"
              aria-label="ค้นหาศิลปินและผลงาน"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>ค้นหา</span>
            </Link>
            <div className="h-4 w-px bg-border/60" />
            <AuthNavButton />
          </div>
        </div>

        {/* ── Mobile bar (< md): logo left, utilities right ── */}
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 md:hidden">
          <Link
            href="/"
            className="group flex items-center gap-2 shrink-0"
            aria-label="หน้าหลัก ThaiArtHub"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition group-hover:scale-105">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold tracking-tight font-display text-foreground group-hover:text-primary transition-colors">
              ThaiArtHub
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-micro font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              aria-label="ค้นหา"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>ค้นหา</span>
            </Link>
            <AuthNavButton />
          </div>
        </div>

        {/* ── Mobile nav strip: scroll horizontally ── */}
        <div className="border-t border-border/40 md:hidden">
          <nav
            aria-label="เมนูหลัก"
            className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-caption"
          >
            {navigation.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-t border-border bg-card/60 px-4 py-10 text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-sm font-semibold font-display text-foreground">ThaiArtHub</span>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              แพลตฟอร์มค้นพบศิลปิน ครีเอเตอร์ ผลงาน และกิจกรรมศิลปะไทย
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
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

        <div className="mx-auto mt-6 max-w-7xl border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ThaiArtHub. มุ่งมั่นเชื่อมโยงและสนับสนุนวงการศิลปะไทยร่วมสมัย
        </div>
      </footer>
    </div>
  );
}