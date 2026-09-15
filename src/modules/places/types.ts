import type { Database } from "@/types/database.types";

export const CREATIVE_PLACE_TYPES = [
  "gallery",
  "art-space",
  "studio",
  "livehouse",
  "creative-cafe",
  "local-brand",
  "skate",
  "craft",
  "vintage",
  "zine",
  "other",
] as const;

export type CreativePlaceType = (typeof CREATIVE_PLACE_TYPES)[number];
export type CreativePlaceStatus = "draft" | "published" | "archived";
export type CreativePlaceRow = Database["public"]["Tables"]["creative_places"]["Row"];

export type CreativePlace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  coverImagePath?: string | null;
  type: CreativePlaceType;
  address: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  externalUrl: string | null;
  status: CreativePlaceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
