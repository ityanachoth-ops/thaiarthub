import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { EmptyState } from "@/components/shared/empty-state";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getPublishedArtworksByArtistId } from "@/modules/artworks/queries";
import { EventGrid } from "@/modules/events/components/event-grid";
import { getPublishedEventsByArtistId } from "@/modules/events/queries";
import { getPublishedArtistBySlug } from "@/modules/artists/queries";
import { ClaimSection } from "./components/claim-section";

export const dynamic = "force-dynamic";

type ArtistProfilePageProps = {
	params: Promise<{ username: string }>;
};

import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
	params,
}: ArtistProfilePageProps): Promise<Metadata> {
	const { username } = await params;
	const artist = await getPublishedArtistBySlug(username);

	if (!artist) {
		return { title: "ไม่พบศิลปิน | ThaiArtHub" };
	}

	const baseUrl = getSiteUrl().origin;
	const url = `${baseUrl}/artists/${artist.slug}`;
	const description = artist.bio?.slice(0, 160) ?? `โปรไฟล์ศิลปิน ${artist.name} บน ThaiArtHub`;
	const images = artist.coverUrl ? [artist.coverUrl] : artist.avatarUrl ? [artist.avatarUrl] : [];

	return {
		title: `${artist.name} | ThaiArtHub`,
		description,
		alternates: {
			canonical: url,
		},
		openGraph: {
			title: `${artist.name} | ThaiArtHub`,
			description,
			url,
			siteName: "ThaiArtHub",
			type: "profile",
			images: images.map((img) => ({ url: img })),
		},
		twitter: {
			card: "summary_large_image",
			title: `${artist.name} | ThaiArtHub`,
			description,
			images,
		},
	};
}

export default async function ArtistProfilePage({
	params,
}: ArtistProfilePageProps) {
	const { username } = await params;
	const artist = await getPublishedArtistBySlug(username);

	if (!artist) notFound();

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();

	const userProfileId = user?.id ?? null;

	// Fetch the artist row for profile_id alongside artworks and events in parallel.
	// artistRow.profile_id is NOT NULL — it always points to whoever owns the artist
	// row (admin/seed until a claim is approved, then the claimant's profile).
	const [artistRowResult, artworks, events] = await Promise.all([
		supabase
			.from("artists")
			.select("profile_id")
			.eq("id", artist.id)
			.maybeSingle(),
		getPublishedArtworksByArtistId(artist.id),
		getPublishedEventsByArtistId(artist.id),
	]);

	const artistProfileId = artistRowResult.data?.profile_id ?? null;

	// isOwner: current user's profile_id matches the artist's profile_id directly.
	// This is true when the artist row was created by the current user, or after
	// approveClaimAction reassigns artists.profile_id to the claimant's profile.
	const isOwner =
		artistProfileId !== null &&
		userProfileId !== null &&
		artistProfileId === userProfileId;

	// isClaimed: true when the owner profile has role = 'creator'.
	// Admin-owned artists stay claimable. The SECURITY DEFINER helper joins
	// artists → profiles internally and returns only a boolean.
	//
	// isPendingForCurrentUser: query the current user's own claim_requests row.
	// RLS scopes this to only their own rows, so it is safe and correct.
	// Skip the pending query for unauthenticated visitors.
	const [isClaimedResult, pendingClaimResult] = await Promise.all([
		supabase.rpc("is_artist_claimed", { p_artist_id: artist.id }),
		userProfileId
			? supabase
					.from("claim_requests")
					.select("id")
					.eq("artist_id", artist.id)
					.eq("requester_profile_id", userProfileId)
					.eq("status", "pending")
					.maybeSingle()
			: Promise.resolve({ data: null, error: null }),
	]);

	const isClaimed = isClaimedResult.data === true;
	const isPendingForCurrentUser = pendingClaimResult.data !== null;

	const externalLinks = [
		["เว็บไซต์", artist.websiteUrl],
		["Instagram", artist.instagramUrl],
		["Facebook", artist.facebookUrl],
		["TikTok", artist.tiktokUrl],
		["ติดต่อศิลปิน", artist.contactUrl],
	].filter((link): link is [string, string] => Boolean(link[1]));

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Person",
		name: artist.name,
		url: `${getSiteUrl().origin}/artists/${artist.slug}`,
		...(artist.bio ? { description: artist.bio } : {}),
		...(artist.avatarUrl || artist.coverUrl ? { image: artist.avatarUrl || artist.coverUrl } : {}),
		...(artist.location ? { address: { "@type": "PostalAddress", addressLocality: artist.location } } : {}),
		sameAs: [
			artist.websiteUrl,
			artist.instagramUrl,
			artist.facebookUrl,
			artist.tiktokUrl,
		].filter((url): url is string => Boolean(url)),
	};

	return (
		<div className="flex flex-col gap-10">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Link
				href="/artists"
				className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
			>
				<ArrowLeft className="h-4 w-4" />
				ดูศิลปินทั้งหมด
			</Link>

			<header className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
				<div className="relative aspect-[3/1] min-h-44 w-full overflow-hidden bg-muted/60 sm:min-h-56">
					{artist.coverUrl ? (
						// eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL
						<img 
						  src={artist.coverUrl} 
						  alt={`ภาพปกของ ${artist.name}`} 
						  className="h-full w-full object-cover"
						  style={{ objectPosition: artist.coverPosition }}
						/>
					) : (
						<div className="flex h-full items-center justify-center text-5xl font-display font-semibold text-muted-foreground/30">
							{artist.name.charAt(0)}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-5 p-6 sm:p-8">
					<div className="flex items-start gap-4">
						{artist.avatarUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
						  src={artist.avatarUrl}
						  alt=""
						  className="h-16 w-16 shrink-0 rounded-full object-cover border border-border/60 sm:h-20 sm:w-20"
						/>
					) : (
						<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-display font-semibold text-primary sm:h-20 sm:w-20 sm:text-3xl">
							{artist.name.charAt(0)}
						</div>
					)}
					<div className="min-w-0">
							<h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
								{artist.name}
							</h1>
							<p className="mt-1 text-sm text-muted-foreground">@{artist.slug}</p>
							{artist.location ? (
								<p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4 text-primary" />
									{artist.location}
								</p>
							) : null}
						</div>
					</div>

					{artist.categories.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{artist.categories.map((category) => (
								<Link
									key={category.id}
									href={`/categories/${category.slug}`}
									className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/15"
								>
									{category.name}
								</Link>
							))}
						</div>
					) : null}

					{artist.bio ? (
						<p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
							{artist.bio}
						</p>
					) : null}

{externalLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {externalLinks.map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                      >
                        {label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                ) : null}

                <ClaimSection
                  artistId={artist.id}
                  artistName={artist.name}
                  artistSlug={artist.slug}
                  isLoggedIn={userProfileId !== null}
                  isOwner={isOwner}
                  isClaimed={isClaimed}
                  isPendingForCurrentUser={isPendingForCurrentUser}
                />
              </div>
            </header>

          {artist.gallery && artist.gallery.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
                <h2 className="font-display text-2xl font-semibold text-foreground">ภาพเพิ่มเติม</h2>
                <span className="text-xs text-muted-foreground">{artist.gallery.length} รูป</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {artist.gallery.map((image) => (
                  <div key={image.id} className="aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
                    {image.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.imageUrl} alt={`ภาพของ ${artist.name}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">โหลดภาพไม่สำเร็จ</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
				<div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
					<h2 className="font-display text-2xl font-semibold text-foreground">ผลงาน</h2>
					<span className="text-xs text-muted-foreground">{artworks.length} ชิ้น</span>
				</div>
				{artworks.length > 0 ? (
					<ArtworkGrid artworks={artworks} />
				) : (
					<EmptyState title="ยังไม่มีผลงานที่เผยแพร่" description="ศิลปินกำลังทยอยอัปเดตผลงานเข้ามา" />
				)}
			</section>

			<section className="space-y-4">
				<div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
					<h2 className="font-display text-2xl font-semibold text-foreground">กิจกรรมที่เกี่ยวข้อง</h2>
					<span className="text-xs text-muted-foreground">{events.length} กิจกรรม</span>
				</div>
				<EventGrid events={events} />
			</section>
		</div>
	);
}
