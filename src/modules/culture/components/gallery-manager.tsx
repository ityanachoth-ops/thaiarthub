"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { GalleryImage } from "../types";

type GalleryKind = "article" | "event";

type GalleryManagerProps = {
  kind: GalleryKind;
  parentId: string;
  ownerId: string;
  images: GalleryImage[];
};

export function GalleryManager({ kind, parentId, ownerId, images: initialImages }: GalleryManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const bucket = kind === "article" ? "articles" : "events";
      const uploaded: GalleryImage[] = [];

      for (const [index, file] of files.entries()) {
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) continue;
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = kind === "article"
          ? `${ownerId}/${parentId}/gallery/${Date.now()}-${index}.${extension}`
          : `${parentId}/gallery/${Date.now()}-${index}.${extension}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;

        const sortOrder = images.length + uploaded.length;
        const row = kind === "article"
          ? await supabase.from("article_images").insert({ article_id: parentId, image_url: path, sort_order: sortOrder, caption: caption.trim() || null }).select("id, image_url, sort_order, caption").single()
          : await supabase.from("event_images").insert({ event_id: parentId, image_url: path, sort_order: sortOrder, caption: caption.trim() || null }).select("id, image_url, sort_order, caption").single();
        if (row.error) throw row.error;
        uploaded.push({ id: row.data.id, imagePath: row.data.image_url, imageUrl: URL.createObjectURL(file), sortOrder: row.data.sort_order, caption: row.data.caption });
      }

      setImages((current) => [...current, ...uploaded]);
      setCaption("");
      setNotice(uploaded.length > 0 ? "เพิ่มภาพในแกลเลอรีแล้ว" : "ไม่พบไฟล์ภาพที่ใช้งานได้");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เพิ่มภาพในแกลเลอรีไม่สำเร็จ");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const updateImage = async (image: GalleryImage, changes: Partial<GalleryImage>) => {
    setSavingId(image.id);
    setErrorMessage(null);
    const supabase = createClient();
    const result = kind === "article"
      ? await supabase.from("article_images").update({ caption: changes.caption, sort_order: changes.sortOrder }).eq("id", image.id)
      : await supabase.from("event_images").update({ caption: changes.caption, sort_order: changes.sortOrder }).eq("id", image.id);
    if (result.error) setErrorMessage(result.error.message);
    else setImages((current) => current.map((item) => item.id === image.id ? { ...item, ...changes } : item));
    setSavingId(null);
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setImages(next.map((image, itemIndex) => ({ ...image, sortOrder: itemIndex })));
    const supabase = createClient();
    const result = await Promise.all(next.map((image, itemIndex) => kind === "article"
      ? supabase.from("article_images").update({ sort_order: itemIndex }).eq("id", image.id)
      : supabase.from("event_images").update({ sort_order: itemIndex }).eq("id", image.id)));
    if (result.some((item) => item.error)) setErrorMessage("จัดลำดับภาพไม่สำเร็จ");
  };

  const deleteImage = async (image: GalleryImage) => {
    if (!window.confirm("ลบภาพนี้ออกจากแกลเลอรีใช่หรือไม่?")) return;
    const supabase = createClient();
    const bucket = kind === "article" ? "articles" : "events";
    const result = kind === "article"
      ? await supabase.from("article_images").delete().eq("id", image.id)
      : await supabase.from("event_images").delete().eq("id", image.id);
    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }
    if (image.imagePath) await supabase.storage.from(bucket).remove([image.imagePath]);
    setImages((current) => current.filter((item) => item.id !== image.id));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-background p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">แกลเลอรีภาพ</h2>
        <p className="mt-1 text-xs text-muted-foreground">เพิ่มภาพหลายภาพ จัดลำดับ และใส่คำบรรยายได้</p>
      </div>

      {errorMessage ? <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errorMessage}</p> : null}
      {notice ? <p className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700">{notice}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor={`${kind}-gallery-caption`} className="block text-xs font-medium text-foreground">คำบรรยายภาพใหม่ (ไม่บังคับ)</label>
          <input id={`${kind}-gallery-caption`} value={caption} onChange={(event) => setCaption(event.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
        </div>
        <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadImages} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          เพิ่มภาพหลายภาพ
        </button>
      </div>

      {images.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border px-5 py-10 text-xs text-muted-foreground"><ImagePlus className="mr-2 h-4 w-4" />ยังไม่มีภาพในแกลเลอรี</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {image.imageUrl ? <img src={image.imageUrl} alt={image.caption ?? "ภาพแกลเลอรี"} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-muted" />}
              <div className="space-y-2 p-3">
                <input value={image.caption ?? ""} onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} placeholder="คำบรรยายภาพ" className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs focus:border-primary focus:outline-hidden" />
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-40">ขึ้น</button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-40">ลง</button>
                  <button type="button" onClick={() => updateImage(image, { caption: image.caption })} disabled={savingId === image.id} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"><Save className="h-3 w-3" />บันทึก</button>
                  <button type="button" onClick={() => deleteImage(image)} className="rounded-lg border border-destructive/20 px-2 py-1 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}