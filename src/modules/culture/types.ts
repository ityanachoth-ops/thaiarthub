import type { ContentStatus } from "@/types/database.types";

export const ARTICLE_CATEGORIES = [
  { value: "artist", label: "ศิลปิน" },
  { value: "local-brand", label: "แบรนด์ท้องถิ่น" },
  { value: "music", label: "ดนตรี" },
  { value: "event-report", label: "รายงานกิจกรรม" },
  { value: "local-story", label: "เรื่องเล่าท้องถิ่น" },
  { value: "guide", label: "คู่มือ" },
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]["value"];

export type Article = {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImagePath?: string | null;
  coverImageUrl: string | null;
  category: ArticleCategory;
  status: ContentStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  gallery: GalleryImage[];
};

export type GalleryImage = {
  id: string;
  imagePath?: string;
  imageUrl: string | null;
  sortOrder: number;
  caption: string | null;
};

export function getArticleCategoryLabel(category: ArticleCategory) {
  return ARTICLE_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}