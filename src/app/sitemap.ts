import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";
import { getPublishedArtists } from "@/modules/artists/queries";
import { getPublishedArtworks } from "@/modules/artworks/queries";
import { getAllCategories } from "@/modules/categories/queries";
import { getPublishedArticles } from "@/modules/culture/queries";
import { getPublishedEvents } from "@/modules/events/queries";
import { getPublishedPlaces } from "@/modules/places/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl().origin;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/artworks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/places`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/culture`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    const [artists, artworks, events, places, articles, categories] = await Promise.all([
      getPublishedArtists().catch(() => []),
      getPublishedArtworks().catch(() => []),
      getPublishedEvents().catch(() => []),
      getPublishedPlaces(1000).catch(() => []),
      getPublishedArticles().catch(() => []),
      getAllCategories().catch(() => []),
    ]);

    const artistEntries: MetadataRoute.Sitemap = artists.map((artist) => ({
      url: `${baseUrl}/artists/${artist.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const artworkEntries: MetadataRoute.Sitemap = artworks.map((artwork) => ({
      url: `${baseUrl}/artworks/${artwork.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const placeEntries: MetadataRoute.Sitemap = places.map((place) => ({
      url: `${baseUrl}/places/${place.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${baseUrl}/culture/${article.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [
      ...staticRoutes,
      ...artistEntries,
      ...artworkEntries,
      ...eventEntries,
      ...placeEntries,
      ...articleEntries,
      ...categoryEntries,
    ];
  } catch {
    return staticRoutes;
  }
}
