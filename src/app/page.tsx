import { HomeEditorial } from "./home-editorial";
import { getFeaturedArticles } from "@/modules/culture/queries";
import { getFeaturedEvents } from "@/modules/events/queries";
import { getPublishedArtists } from "@/modules/artists/queries";
import { getPublishedArtworks } from "@/modules/artworks/queries";
import { getMapLocations } from "@/modules/map/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredArticles, featuredEvents, artists, artworks, mapLocations] = await Promise.all([
    getFeaturedArticles(3),
    getFeaturedEvents(3),
    getPublishedArtists(),
    getPublishedArtworks(),
    getMapLocations(),
  ]);

  return <HomeEditorial featuredArticles={featuredArticles} featuredEvents={featuredEvents} artists={artists} artworks={artworks} mapLocations={mapLocations} />;
}
