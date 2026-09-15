"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ImagePlus, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ARTICLE_CATEGORIES, type Article } from "../types";

function slugFromTitle(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ArticleForm({ userId, article }: { userId: string; article?: Article }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(article);
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [category, setCategory] = useState<Article["category"]>(article?.category ?? "artist");
  const [status, setStatus] = useState<"draft" | "published">(article?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(article?.coverImageUrl ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ขนาดรูปภาพต้องไม่เกิน 5 MB");
      return;
    }
    setErrorMessage(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !slug.trim() || !content.trim()) {
      setErrorMessage("กรุณากรอกชื่อเรื่อง รหัส URL และเนื้อหา");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug)) {
      setErrorMessage("รหัส URL ต้องใช้ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และขีด (-)");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const articleId = article?.id ?? crypto.randomUUID();
      let coverPath = article?.coverImagePath ?? null;

      if (imageFile) {
        const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const uploadPath = `${userId}/${articleId}/${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("articles")
          .upload(uploadPath, imageFile, { upsert: false });
        if (uploadError) {
          setErrorMessage(`อัปโหลดภาพปกไม่สำเร็จ: ${uploadError.message}`);
          return;
        }
        coverPath = uploadPath;
      }

      const publishedAt = status === "published"
        ? article?.publishedAt ?? new Date().toISOString()
        : null;
      const values = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        cover_image_url: coverPath,
        category,
        status,
        is_featured: isFeatured,
        published_at: publishedAt,
      };

      const result = isEditing
        ? await supabase.from("articles").update(values).eq("id", articleId)
        : await supabase.from("articles").insert({ ...values, id: articleId, author_id: userId });

      if (result.error) {
        setErrorMessage(`บันทึกเรื่องราวไม่สำเร็จ: ${result.error.message}`);
        return;
      }

      router.push(isEditing ? "/dashboard/culture" : `/dashboard/culture/${articleId}/edit`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกเรื่องราว");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={() => router.push("/dashboard/culture")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับสู่การจัดการเรื่องราว
      </button>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isEditing ? "แก้ไขเรื่องราว" : "เขียนเรื่องราวใหม่"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">เผยแพร่เรื่องราวจากวัฒนธรรมสร้างสรรค์ไทย</p>
        </header>

        {errorMessage ? (
          <div className="flex gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="space-y-3">
          <label className="block text-sm font-medium text-foreground">ภาพปก</label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 sm:w-56">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="ตัวอย่างภาพปก" className="h-full w-full object-cover" />
              ) : <ImagePlus className="h-8 w-8 text-muted-foreground/50" />}
            </div>
            <div>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
              <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                {imagePreview ? "เปลี่ยนภาพปก" : "เลือกรูปภาพ"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB</p>
            </div>
          </div>
        </section>

        <div className="space-y-1.5">
          <label htmlFor="article-title" className="block text-sm font-medium text-foreground">ชื่อเรื่อง *</label>
          <input id="article-title" required value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!isEditing && !slug) setSlug(slugFromTitle(value)); }} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="article-slug" className="block text-sm font-medium text-foreground">รหัส URL (Slug) *</label>
          <input id="article-slug" required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="local-art-story" className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="article-category" className="block text-sm font-medium text-foreground">หมวดหมู่ *</label>
            <select id="article-category" value={category} onChange={(event) => setCategory(event.target.value as Article["category"])} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary">
              {ARTICLE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="article-status" className="block text-sm font-medium text-foreground">สถานะ *</label>
            <select id="article-status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary">
              <option value="draft">ฉบับร่าง</option>
              <option value="published">เผยแพร่</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
          แสดงเป็นเรื่องเด่นบนหน้าแรก
        </label>

        <div className="space-y-1.5">
          <label htmlFor="article-excerpt" className="block text-sm font-medium text-foreground">คำโปรย</label>
          <textarea id="article-excerpt" rows={3} maxLength={300} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="article-content" className="block text-sm font-medium text-foreground">เนื้อหา *</label>
          <textarea id="article-content" required rows={16} value={content} onChange={(event) => setContent(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
          <p className="text-xs text-muted-foreground">รองรับข้อความธรรมดาและการขึ้นบรรทัดใหม่</p>
        </div>

        <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
          <Save className="h-4 w-4" />
          {isSaving ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "บันทึกเรื่องราว"}
        </button>
      </form>
    </div>
  );
}