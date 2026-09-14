import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Article } from "./types";

const ARTICLES_BUCKET = "articles";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ARTICLE_COLUMNS =
  "id, author_id, title, slug, excerpt, content, cover_image_url, category, status, published_at, created_at, updated_at";

const articleSlugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{2,159}$/);

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

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
): Promise<Article> {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImagePath: row.cover_image_url,
    coverImageUrl: await resolveCoverUrl(supabase, row.cover_image_url),
    category: row.category as Article["category"],
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  return data ? mapArticle(supabase, data) : null;
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
  return data ? mapArticle(supabase, data) : null;
}