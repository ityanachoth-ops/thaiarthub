"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getArticleCategoryLabel, type Article } from "../types";

export function AdminArticleManager({ articles }: { articles: Article[] }) {
  const [items, setItems] = useState(articles);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deleteArticle = async (article: Article) => {
    if (!window.confirm(`ลบเรื่องราว “${article.title}” ใช่หรือไม่?`)) return;
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("articles").delete().eq("id", article.id);
    if (error) {
      setErrorMessage(`ลบเรื่องราวไม่สำเร็จ: ${error.message}`);
      return;
    }
    if (article.coverImagePath) await supabase.storage.from("articles").remove([article.coverImagePath]);
    setItems((current) => current.filter((item) => item.id !== article.id));
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">บทความทั้งหมด</h2>
          <p className="mt-1 text-sm text-muted-foreground">จัดการฉบับร่างและเรื่องราวที่เผยแพร่แล้ว</p>
        </div>
        <Link href="/dashboard/culture/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
          <Plus className="h-4 w-4" /> เขียนเรื่องราว
        </Link>
      </div>

      {errorMessage ? <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <FileText className="h-7 w-7 text-primary" />
          <p className="mt-3 text-sm font-medium text-foreground">ยังไม่มีเรื่องราว</p>
          <p className="mt-1 text-xs text-muted-foreground">เริ่มเขียนเรื่องราวแรกของ ThaiArtHub</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border/60">
          {items.map((article) => (
            <div key={article.id} className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-display text-base font-semibold text-foreground">{article.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${article.status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {article.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{getArticleCategoryLabel(article.category)} · /culture/{article.slug}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/dashboard/culture/${article.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"><Pencil className="h-3.5 w-3.5" />แก้ไข</Link>
                <button type="button" onClick={() => deleteArticle(article)} className="inline-flex items-center justify-center rounded-lg border border-destructive/20 px-3 py-2 text-destructive transition hover:bg-destructive/10" aria-label={`ลบ ${article.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}