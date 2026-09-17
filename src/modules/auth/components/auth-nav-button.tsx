"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthNavButton() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check current active session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-xl bg-muted/60" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/dashboard/saved"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          aria-label="รายการที่บันทึก"
          title="รายการที่บันทึก"
        >
          <Bookmark className="h-3.5 w-3.5 text-primary fill-primary/20" />
          <span className="hidden sm:inline">รายการที่บันทึก</span>
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/15"
          aria-label="แดชบอร์ดครีเอเตอร์"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">แดชบอร์ด</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="ออกจากระบบ"
          aria-label="ออกจากระบบ"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">ออกจากระบบ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <User className="h-3.5 w-3.5" />
        <span>เข้าสู่ระบบ</span>
      </Link>
      <Link
        href="/signup"
        className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
      >
        <span>สมัครสมาชิก</span>
      </Link>
    </div>
  );
}
