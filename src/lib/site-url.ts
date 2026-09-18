export function getSiteUrl(): URL {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://thaiarthub.com";
  return new URL(url.startsWith("http") ? url : `https://${url}`);
}
