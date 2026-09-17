export const DEFAULT_POST_AUTH_PATH = "/";

/**
 * Allow only relative internal paths. Reject protocol-relative and absolute URLs
 * so `redirect` / `next` cannot be used as an open redirect.
 */
export function getSafeInternalPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_POST_AUTH_PATH
): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (trimmed.includes("://")) return fallback;

  const pathname = trimmed.split("?")[0].split("#")[0];
  if (pathname.toLowerCase().startsWith("/http")) return fallback;

  return trimmed;
}

/** True when the path is an artist profile URL used by Claim Artist. */
export function isArtistClaimRedirect(path: string): boolean {
  const pathname = path.split("?")[0].split("#")[0];
  return /^\/artists\/[a-z0-9][a-z0-9-]{2,159}$/i.test(pathname);
}

export function withRedirectParam(href: string, redirectPath: string): string {
  const safe = getSafeInternalPath(redirectPath, DEFAULT_POST_AUTH_PATH);
  if (safe === DEFAULT_POST_AUTH_PATH) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}redirect=${encodeURIComponent(safe)}`;
}

export function resolvePostAuthPath(options: {
  role: "user" | "creator" | "admin";
  next: string | null | undefined;
}): string {
  const nextPath = getSafeInternalPath(options.next, DEFAULT_POST_AUTH_PATH);

  if (isArtistClaimRedirect(nextPath)) {
    return nextPath;
  }

  if (options.role === "user") {
    return nextPath === "/onboarding" ? DEFAULT_POST_AUTH_PATH : nextPath;
  }

  return nextPath;
}
