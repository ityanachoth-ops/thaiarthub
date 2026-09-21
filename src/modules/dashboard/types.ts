import type { ProfileRole, ContentStatus } from "@/types/database.types";

export interface CreatorProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: ProfileRole;
}

export interface ArtistProfileSummary {
  id: string;
  name: string;
  slug: string;
  status: ContentStatus;
  coverImageUrl: string | null;
  avatarUrl: string | null;
}

export interface CreatorArtworkSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  year: number | null;
  imagePath: string | null;
  imageUrl: string | null;
  coverPosition: string;
  externalUrl: string | null;
  status: ContentStatus;
}

export interface CreatorDashboardData {
  profile: CreatorProfile;
  artist: ArtistProfileSummary | null;
  publishedWorksCount: number;
  publishedEventsCount: number;
  artworks: CreatorArtworkSummary[];
}
