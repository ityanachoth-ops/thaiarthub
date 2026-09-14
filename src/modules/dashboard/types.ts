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

export interface CreatorDashboardData {
  profile: CreatorProfile;
  artist: ArtistProfileSummary | null;
  publishedWorksCount: number;
  publishedEventsCount: number;
}
