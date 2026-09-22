"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { CreatorArtworkSummary } from "@/modules/dashboard/types";

interface AdminArtistWorksManagerProps {
  artistId: string;
  works: CreatorArtworkSummary[];
}

export function AdminArtistWorksManager({ artistId, works }: AdminArtistWorksManagerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const deleteWork = async (work: CreatorArtworkSummary) => {
    if (!window.confirm(`ลบผลงาน "${work.title}" ใช่หรือไม่? การดำเนินการนี้ย้อนกลับไม่ได้`)) {
      return;
    }

    setDeletingId(work.id);
    setErrorMessage(null);
    setNotice(null);

    try {
      const supabase = createClient();

      // Load gallery image paths before deleting the work row (cascade will drop DB rows)
      const { data: galleryRows } = await supabase
        .from("work_images")
        .select("image_path")
        .eq("work_id", work.id);

      const { error: deleteError } = await supabase
        .from("works")
        .delete()
        .eq("id", work.id)
        .eq("artist_id", artistId);

      if (deleteError) {
        setErrorMessage(`ลบผลงานไม่สำเร็จ: ${deleteError.message}`);
        return;
      }

      // Clean up cover image from storage
      if (work.imagePath) {
        await supabase.storage.from("works").remove([work.imagePath]);
      }

      // Clean up gallery images from storage
      const galleryPaths = (galleryRows ?? []).map((r) => r.image_path).filter(Boolean);
      if (galleryPaths.length > 0) {
        await supabase.storage.from("works").remove(galleryPaths);
      }

      setNotice("ลบผลงานเรียบร้อยแล้ว");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบผลงาน");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">ผลงาน</h2>
          <p className="mt-1 text-xs text-muted-foreground">เพิ่ม แก้ไข หรือลบผลงานของ Artist นี้</p>
        </div>
        <Link
          href={`/dashboard/artists/${artistId}/artworks/new`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> เพิ่มผลงาน
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-5 flex gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      ) : null}
      {notice ? <p className="mt-5 text-xs text-emerald-700">{notice}</p> : null}

      {works.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ImagePlus className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-foreground">ยังไม่มีผลงาน</h3>
          <p className="mt-1 text-xs text-muted-foreground">เพิ่มผลงานชิ้นแรกให้กับ Artist นี้</p>
          <Link
            href={`/dashboard/artists/${artistId}/artworks/new`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> เพิ่มผลงานชิ้นแรก
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => (
            <article key={work.id} className="overflow-hidden rounded-2xl border border-border/80 bg-background">
              <div className="relative aspect-[4/3] bg-muted/50">
                {work.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: work.coverPosition }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-display text-muted-foreground/40">
                    {work.title.charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    work.status === "published"
                      ? "bg-emerald-500/90 text-white"
                      : "bg-background/90 text-muted-foreground"
                  }`}
                >
                  {work.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="truncate font-display text-sm font-semibold text-foreground">
                  {work.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {work.type}
                  {work.year ? ` · ${work.year}` : ""}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/artists/${artistId}/artworks/${work.id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" /> แก้ไข
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteWork(work)}
                    disabled={deletingId === work.id}
                    className="inline-flex items-center justify-center rounded-lg border border-destructive/20 px-3 py-2 text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                    aria-label={`ลบ ${work.title}`}
                  >
                    {deletingId === work.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
