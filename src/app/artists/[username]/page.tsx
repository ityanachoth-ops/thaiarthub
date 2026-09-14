import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getPublishedArtworksByArtistId } from "@/modules/artworks/queries";
import { EventGrid } from "@/modules/events/components/event-grid";
import { getPublishedEventsByArtistId } from "@/modules/events/queries";
import { getPublishedArtistBySlug } from "@/modules/artists/queries";

export const dynamic = "force-dynamic";

type ArtistProfilePageProps = {
	params: Promise<{ username: string }>;
};

export async function generateMetadata({
	params,
}: ArtistProfilePageProps): Promise<Metadata> {
	const { username } = await params;
	const artist = await getPublishedArtistBySlug(username);

	if (!artist) {
		return { title: "ไม่พบศิลปิน | ThaiArtHub" };
	}

	return {
		title: `${artist.name} | ThaiArtHub`,
		description: artist.bio?.slice(0, 160) ?? `โปรไฟล์ศิลปิน ${artist.name} บน ThaiArtHub`,
	};
}

export default async function ArtistProfilePage({
	params,
}: ArtistProfilePageProps) {
	const { username } = await params;
	const artist = await getPublishedArtistBySlug(username);

	if (!artist) notFound();

	const [artworks, events] = await Promise.all([
		getPublishedArtworksByArtistId(artist.id),
		getPublishedEventsByArtistId(artist.id),
	]);

	const externalLinks = [
		["เว็บไซต์", artist.websiteUrl],
		["Instagram", artist.instagramUrl],
		["Facebook", artist.facebookUrl],
		["TikTok", artist.tiktokUrl],
		["ติดต่อศิลปิน", artist.contactUrl],
	].filter((link): link is [string, string] => Boolean(link[1]));

	return (
		<div className="flex flex-col gap-10">
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
						<img src={artist.coverUrl} alt={`ภาพปกของ ${artist.name}`} className="h-full w-full object-cover" />
					) : (
						<div className="flex h-full items-center justify-center text-5xl font-display font-semibold text-muted-foreground/30">
							{artist.name.charAt(0)}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-5 p-6 sm:p-8">
					<div className="flex items-start gap-4">
						<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-display font-semibold text-primary sm:h-20 sm:w-20 sm:text-3xl">
							{artist.name.charAt(0)}
						</div>
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
				</div>
			</header>

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
