import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Article } from "./types";

const ARTICLES_BUCKET = "articles";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ARTICLE_COLUMNS =
  "id, author_id, title, slug, excerpt, content, cover_image_url, cover_position, category, status, is_featured, published_at, created_at, updated_at";

const articleSlugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{2,159}$/);

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

async function getArticleGallery(
  supabase: SupabaseServerClient,
  articleId: string,
  includeStoragePaths = false,
) {
  const { data, error } = await supabase
    .from("article_images")
    .select("id, image_url, sort_order, caption")
    .eq("article_id", articleId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`ไม่สามารถโหลดแกลเลอรีเรื่องราวได้: ${error.message}`);

  const rows = data ?? [];
  const paths = rows.map((row) => row.image_url).filter((path) => !/^https?:\/\//i.test(path));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedData } = await supabase.storage
      .from(ARTICLES_BUCKET)
      .createSignedUrls(Array.from(new Set(paths)), SIGNED_URL_TTL_SECONDS);
    for (const item of signedData ?? []) {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    ...(includeStoragePaths ? { imagePath: row.image_url } : {}),
    imageUrl: /^https?:\/\//i.test(row.image_url) ? row.image_url : signed.get(row.image_url) ?? null,
    sortOrder: row.sort_order,
    caption: row.caption,
  }));
}

async function resolveCoverUrl(
  supabase: SupabaseServerClient,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const { data, error } = await supabase.storage
    .from(ARTICLES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return error ? null : data?.signedUrl ?? null;
}

async function mapArticle(
  supabase: SupabaseServerClient,
  row: ArticleRow,
  includeGallery = false,
  includeStoragePaths = false,
): Promise<Article> {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    ...(includeStoragePaths ? { coverImagePath: row.cover_image_url } : {}),
    coverImageUrl: await resolveCoverUrl(supabase, row.cover_image_url),
    coverPosition: (row as { cover_position?: string }).cover_position ?? "50% 50%",
    category: row.category as Article["category"],
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    gallery: includeGallery ? await getArticleGallery(supabase, row.id, includeStoragePaths) : [],
  };
}

export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดเรื่องราวได้: ${error.message}`);

  return Promise.all((data ?? []).map((row) => mapArticle(supabase, row)));
}

export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
  const parsedSlug = articleSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("slug", parsedSlug.data)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดเรื่องราวได้: ${error.message}`);
  return data ? mapArticle(supabase, data, true) : null;
}

export async function getAdminArticles(): Promise<Article[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`ไม่สามารถโหลดรายการจัดการเรื่องราวได้: ${error.message}`);

  return Promise.all((data ?? []).map((row) => mapArticle(supabase, row)));
}

export async function getAdminArticleById(id: string): Promise<Article | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`ไม่สามารถโหลดเรื่องราวได้: ${error.message}`);
  return data ? mapArticle(supabase, data, true, true) : null;
}

export async function getFeaturedArticles(limit = 3): Promise<Article[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`ไม่สามารถโหลดเรื่องเด่นได้: ${error.message}`);
  return Promise.all((data ?? []).map((row) => mapArticle(supabase, row)));
}