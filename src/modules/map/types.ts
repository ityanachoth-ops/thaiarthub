export type MapItemType = "event" | "place";

export interface MapLocationItem {
  id: string;
  title: string;
  slug: string;
  type: MapItemType;
  latitude: number;
  longitude: number;
  coverImageUrl: string | null;
  venueName: string | null;
  province: string | null;
  address?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  artistName?: string | null;
  description?: string | null;
}
