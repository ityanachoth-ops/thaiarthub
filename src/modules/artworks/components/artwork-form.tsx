"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import { artworkSchema } from "@/lib/validations/artwork";
import { createClient } from "@/lib/supabase/client";
import type {
  CreatorArtwork,
  CreatorArtworkGalleryImage,
} from "@/modules/artworks/creator-queries";
import { CoverImagePreview } from "@/components/shared/cover-image-preview";

const CATEGORIES = [
  ["visual-art", "ทัศนศิลป์"],
  ["illustration", "ภาพประกอบ"],
  ["photography", "ภาพถ่าย"],
  ["design", "ออกแบบ"],
  ["music", "ดนตรี"],
  ["performance", "การแสดง"],
  ["craft", "งานคราฟต์"],
] as const;

interface ArtworkFormProps {
  userId: string;
  artistId: string;
  artwork?: CreatorArtwork;
  imagePreviewUrl?: string | null;
  gallery: CreatorArtworkGalleryImage[];
  /** Where to navigate back/after-save. Defaults to "/dashboard". */
  backHref?: string;
}

const MAX_GALLERY_IMAGES = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function removeUploadedGalleryPaths(
  supabase: ReturnType<typeof createClient>,
  workId: string,
  paths: string[],
  rowIds: string[],
) {
  if (paths.length === 0 && rowIds.length === 0) return null;
  const storageResult = paths.length > 0
    ? await supabase.storage.from("works").remove(paths)
    : { error: null };
  if (storageResult.error) return storageResult.error;

  if (rowIds.length > 0) {
    const { error } = await supabase
      .from("work_images")
      .delete()
      .eq("work_id", workId)
      .in("id", rowIds);
    if (error) return error;
  }

  return null;
}

export function ArtworkForm({
  userId,
  artistId,
  artwork,
  imagePreviewUrl = null,
  gallery: initialGallery,
  backHref = "/dashboard",
}: ArtworkFormProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(artwork);

  const [title, setTitle] = useState(artwork?.title ?? "");
  const [slug, setSlug] = useState(artwork?.slug ?? "");
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [type, setType] = useState(artwork?.type ?? "visual-art");
  const [year, setYear] = useState(artwork?.year?.toString() ?? "");
  const [externalUrl, setExternalUrl] = useState(artwork?.external_url ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    artwork?.status ?? "draft"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(imagePreviewUrl);
  const [coverPosition, setCoverPosition] = useState<string>(artwork?.cover_position ?? "50% 50%");
  const [gallery, setGallery] = useState(initialGallery);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [removedGallery, setRemovedGallery] = useState<CreatorArtworkGalleryImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("ขนาดรูปภาพต้องไม่เกิน 5 MB");
      return;
    }

    setErrorMessage(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setCoverPosition("50% 50%"); // reset position for new image
  };

  const handleGalleryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const availableSlots = MAX_GALLERY_IMAGES - gallery.length - newGalleryFiles.length;
    if (files.length > availableSlots) {
      setErrorMessage(`เพิ่มภาพเพิ่มเติมได้อีกไม่เกิน ${Math.max(availableSlots, 0)} รูป`);
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    );
    if (invalidFile) {
      setErrorMessage("ภาพเพิ่มเติมต้องเป็นไฟล์ PNG, JPG หรือ WebP");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (oversizedFile) {
      setErrorMessage("ภาพเพิ่มเติมแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB");
      event.target.value = "";
      return;
    }

    setErrorMessage(null);
    setNewGalleryFiles((current) => [...current, ...files]);
    setNewGalleryPreviews((current) => [
      ...current,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const removeNewGalleryFile = (index: number) => {
    URL.revokeObjectURL(newGalleryPreviews[index]);
    setNewGalleryFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setNewGalleryPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const removeGalleryImage = (image: CreatorArtworkGalleryImage) => {
    setGallery((current) => current.filter((item) => item.id !== image.id));
    setRemovedGallery((current) => [...current, image]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedYear = year.trim() ? Number(year) : null;
    const validation = artworkSchema.safeParse({
      title,
      slug,
      description: description || undefined,
      type,
      year: parsedYear,
      externalUrl,
      status,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    if (gallery.length + newGalleryFiles.length > MAX_GALLERY_IMAGES) {
      setErrorMessage(`ภาพเพิ่มเติมรวมกันต้องไม่เกิน ${MAX_GALLERY_IMAGES} รูป`);
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const uploadedGalleryPaths: string[] = [];
      const uploadedGalleryRowIds: string[] = [];
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setErrorMessage("ไม่พบสิทธิ์จัดการผลงาน กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const workId = artwork?.id ?? crypto.randomUUID();
      let imagePath = artwork?.image_url ?? null;

      if (imageFile) {
        const fileExtension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const uploadPath = `${userId}/${workId}/${Date.now()}.${fileExtension}`;
        const { error: uploadError } = await supabase.storage
          .from("works")
          .upload(uploadPath, imageFile, { upsert: false });

        if (uploadError) {
          setErrorMessage(`อัปโหลดรูปผลงานไม่สำเร็จ: ${uploadError.message}`);
          return;
        }

        imagePath = uploadPath;
      }

      const values = validation.data;
      const record = {
        title: values.title,
        slug: values.slug,
        description: values.description || null,
        type: values.type,
        year: values.year ?? null,
        external_url: values.externalUrl || null,
        image_url: imagePath,
        cover_position: coverPosition,
        status: values.status,
      };

      const { error } = isEditing
        ? await supabase
            .from("works")
            .update(record)
            .eq("id", workId)
            .eq("artist_id", artistId)
        : await supabase.from("works").insert({
            ...record,
            id: workId,
            artist_id: artistId,
          });

      if (error) {
        setErrorMessage(`บันทึกผลงานไม่สำเร็จ: ${error.message}`);
        return;
      }

      for (const image of removedGallery) {
        const { error: storageError } = await supabase.storage
          .from("works")
          .remove([image.imagePath]);
        if (storageError) {
          setErrorMessage(`ลบไฟล์ภาพเพิ่มเติมไม่สำเร็จ: ${storageError.message}`);
          return;
        }
        const { error: deleteError } = await supabase
          .from("work_images")
          .delete()
          .eq("id", image.id)
          .eq("work_id", workId);
        if (deleteError) {
          setErrorMessage(`ลบรายการภาพเพิ่มเติมไม่สำเร็จ: ${deleteError.message}`);
          return;
        }
      }

      const galleryStartOrder = gallery.length;
      for (const [index, file] of newGalleryFiles.entries()) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const galleryPath = `${userId}/${workId}/gallery/${Date.now()}-${index}.${fileExtension}`;
        const { error: uploadError } = await supabase.storage
          .from("works")
          .upload(galleryPath, file, { upsert: false });
        if (uploadError) {
          const cleanupError = await removeUploadedGalleryPaths(supabase, workId, uploadedGalleryPaths, uploadedGalleryRowIds);
          setErrorMessage(`อัปโหลดภาพเพิ่มเติมไม่สำเร็จ: ${uploadError.message}`);
          if (cleanupError) setErrorMessage(`อัปโหลดภาพเพิ่มเติมไม่สำเร็จ และล้างไฟล์ค้างไม่สำเร็จ: ${cleanupError.message}`);
          return;
        }
        uploadedGalleryPaths.push(galleryPath);

        const { data: insertedImage, error: insertError } = await supabase
          .from("work_images")
          .insert({
            work_id: workId,
            image_path: galleryPath,
            sort_order: galleryStartOrder + index,
          })
          .select("id")
          .single();
        if (insertError) {
          const cleanupError = await removeUploadedGalleryPaths(supabase, workId, uploadedGalleryPaths, uploadedGalleryRowIds);
          setErrorMessage(`บันทึกภาพเพิ่มเติมไม่สำเร็จ: ${insertError.message}`);
          if (cleanupError) setErrorMessage(`บันทึกภาพเพิ่มเติมไม่สำเร็จ และล้างไฟล์ค้างไม่สำเร็จ: ${cleanupError.message}`);
          return;
        }
        uploadedGalleryRowIds.push(insertedImage.id);
      }

      setSuccessMessage(isEditing ? "บันทึกการแก้ไขแล้ว" : "เพิ่มผลงานแล้ว");
      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกผลงาน"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับสู่แดชบอร์ด
      </Link>

      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isEditing ? "แก้ไขผลงาน" : "เพิ่มผลงานใหม่"}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            จัดการรายละเอียด ภาพ และสถานะการเผยแพร่ผลงานของคุณ
          </p>
        </header>

        {errorMessage ? (
          <div className="mb-6 flex gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
        {successMessage ? (
          <div className="mb-6 flex gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <label className="block text-xs font-medium text-foreground">ภาพปกผลงาน</label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 sm:w-48">
                {imagePreview ? (
                  <CoverImagePreview
                    src={imagePreview}
                    alt="ตัวอย่างภาพผลงาน"
                    className="h-full w-full"
                    initialPosition={coverPosition}
                    onPositionChange={setCoverPosition}
                  />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {imagePreview ? "เปลี่ยนภาพปก" : "เลือกรูปภาพ"}
                </button>
                <p className="mt-2 text-[11px] text-muted-foreground">PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-border/60 pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <label className="block text-xs font-medium text-foreground">ภาพเพิ่มเติม</label>
              <span className="text-[11px] text-muted-foreground">{gallery.length + newGalleryFiles.length} / {MAX_GALLERY_IMAGES}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {gallery.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
                  {image.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.imageUrl} alt="ภาพเพิ่มเติมของผลงาน" className="h-full w-full object-contain" />
                  ) : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">โหลดภาพไม่สำเร็จ</div>}
                  <button type="button" onClick={() => removeGalleryImage(image)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-destructive" aria-label="ลบภาพเพิ่มเติม">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {newGalleryPreviews.map((preview, index) => (
                <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-primary/40 bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="ตัวอย่างภาพเพิ่มเติม" className="h-full w-full object-contain" />
                  <button type="button" onClick={() => removeNewGalleryFile(index)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-destructive" aria-label="นำภาพเพิ่มเติมออก">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {gallery.length + newGalleryFiles.length < MAX_GALLERY_IMAGES ? (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                  <ImagePlus className="h-5 w-5" />
                  <span>เพิ่มรูป</span>
                  <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleGalleryChange} />
                </label>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">PNG, JPG หรือ WebP ไม่เกิน 5 MB ต่อไฟล์ และรวมไม่เกิน 8 รูป</p>
          </section>

          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-xs font-medium text-foreground">ชื่อผลงาน *</label>
            <input id="title" required value={title} onChange={(event) => { const nextTitle = event.target.value; setTitle(nextTitle); if (!isEditing && !slug) setSlug(slugFromTitle(nextTitle)); }} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="block text-xs font-medium text-foreground">รหัส URL (Slug) ของผลงาน *</label>
            <input id="slug" required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="my-artwork" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
            <p className="text-[11px] text-muted-foreground">ใช้ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และขีด (-)</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="type" className="block text-xs font-medium text-foreground">หมวดหมู่ *</label>
              <select id="type" value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary">
                {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="year" className="block text-xs font-medium text-foreground">ปีที่สร้าง</label>
              <input id="year" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} placeholder="เช่น 2026" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-medium text-foreground">รายละเอียดผลงาน</label>
            <textarea id="description" rows={5} maxLength={3000} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
            <p className="text-right text-[11px] text-muted-foreground">{description.length} / 3,000</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="externalUrl" className="block text-xs font-medium text-foreground">URL เพิ่มเติม (ไม่บังคับ)</label>
            <input id="externalUrl" type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="Instagram, portfolio หรือเว็บไซต์ผลงาน" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-foreground">สถานะการเผยแพร่</legend>
            <div className="flex gap-3">
              {(["draft", "published"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="radio" name="status" checked={status === value} onChange={() => setStatus(value)} />
                  {value === "draft" ? "ฉบับร่าง" : "เผยแพร่"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 pt-5">
            <Link href={backHref} className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted">ยกเลิก</Link>
            <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "กำลังบันทึก..." : "บันทึกผลงาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
