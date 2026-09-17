import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database.types";
import {
  getSafeInternalPath,
  isArtistClaimRedirect,
  resolvePostAuthPath,
} from "@/modules/auth/redirect";

function roleFromMetadata(
  intendedRole: unknown,
  claimFlow: boolean
): Exclude<ProfileRole, "admin"> {
  if (claimFlow) return "user";
  return intendedRole === "creator" ? "creator" : "user";
}

function usernameFromMetadata(username: unknown, email: string | undefined): string {
  if (typeof username === "string" && /^[a-z0-9][a-z0-9-]{2,39}$/.test(username)) {
    return username;
  }

  const local = (email?.split("@")[0] ?? "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = (local.length >= 3 ? local : `user-${local || "account"}`).slice(0, 32);
  return base;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeInternalPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const claimFlow = isArtistClaimRedirect(next);
      const metadata = (data.user.user_metadata ?? {}) as {
        display_name?: string;
        username?: string;
        intended_role?: string;
      };

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", data.user.id)
        .maybeSingle();

      let role: ProfileRole = profile?.role ?? roleFromMetadata(metadata.intended_role, claimFlow);

      if (!profile) {
        const displayName =
          (typeof metadata.display_name === "string" && metadata.display_name.trim()) ||
          data.user.email?.split("@")[0] ||
          "ผู้ใช้ ThaiArtHub";
        const username = usernameFromMetadata(metadata.username, data.user.email);

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName,
          username,
          role,
        });

        if (profileError) {
          console.error("Failed to create profile after auth callback:", profileError.message);
          role = "user";
        }
      }

      const destination = resolvePostAuthPath({ role, next });
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
