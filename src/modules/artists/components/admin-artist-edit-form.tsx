"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Save, Trash2 } from "lucide-react";

import { updateAdminArtistAction } from "@/app/dashboard/artists/actions";
import type { AdminArtistDetail, ArtistGalleryImage } from "../queries";
import { createClient } from "@/lib/supabase/client";
import {
  deleteAdminArtistImage,
  deleteAdminArtistGalleryImage,
  revokeObjectUrl,
  uploadAdminArtistImage,
  uploadAdminArtistGalleryImage,
  validateArtistImageFile,
} from "../media";
import { CoverImagePreview } from "@/components/shared/cover-image-preview";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface AdminArtistEditFormProps {
  artist: AdminArtistDetail;
  allCategories: CategoryOption[];
}

export function AdminArtistEditForm({ artist, allCategories }: AdminArtistEditFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(artist.name);
  const [slug, setSlug] = useState(artist.slug);
  const [bio, setBio] = useState(artist.bio ?? "");
  const [location, setLocation] = useState(artist.location ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(artist.websiteUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(artist.instagramUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(artist.facebookUrl ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(artist.tiktokUrl ?? "");
  const [contactUrl, setContactUrl] = useState(artist.contactUrl ?? "");
  const [status, setStatus] = useState<"draft" | "published">(artist.status);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(artist.categories.map((c) => c.id)),
  );

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(artist.coverImageUrl);
  const [coverPosition, setCoverPosition] = useState<string>(artist.coverPosition);
  // Track the stored path: updated path when new file uploaded, original path otherwise
  const [coverPath, setCoverPath] = useState<string | null>(artist.coverImagePath);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(artist.avatarUrl);
  const [avatarPath, setAvatarPath] = useState<string | null>(artist.avatarPath);

  const [galleryImages, setGalleryImages] = useState<ArtistGalleryImage[]>(artist.gallery ?? []);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Revoke blob: URLs on unmount / change
  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) revokeObjectUrl(coverPreview);
    };
  }, [coverPreview]);
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) revokeObjectUrl(avatarPreview);
    };
  }, [avatarPreview]);
  useEffect(() => {
    return () => {
      newGalleryPreviews.forEach((p) => p.startsWith("blob:") && revokeObjectUrl(p));
    };
  }, [newGalleryPreviews]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "cover" | "avatar",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateArtistImageFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      event.target.value = "";
      return;
    }
    setErrorMessage(null);
    const preview = URL.createObjectURL(file);
    if (kind === "cover") {
      setCoverFile(file);
      setCoverPreview(preview);
      setCoverPosition("50% 50%");
    } else {
      setAvatarFile(file);
      setAvatarPreview(preview);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGalleryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const MAX_GALLERY_IMAGES = 10;
    const availableSlots = MAX_GALLERY_IMAGES - galleryImages.length - newGalleryFiles.length;
    if (files.length > availableSlots) {
      setErrorMessage(`เพิ่มรูปเพิ่มเติมได้อีกไม่เกิน ${Math.max(availableSlots, 0)} รูป`);
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    );
    if (invalidFile) {
      setErrorMessage("รูปเพิ่มเติมต้องเป็นไฟล์ PNG, JPG หรือ WebP");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      setErrorMessage("รูปเพิ่มเติมแต่ละไฟล์ต้องมีขนาดไม่เกิน 5 MB");
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

  const removeGalleryImage = (image: ArtistGalleryImage) => {
    setGalleryImages((current) => current.filter((item) => item.id !== image.id));
    setRemovedGalleryIds((current) => [...current, image.id]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    let newCoverPath = coverPath;
    let newAvatarPath = avatarPath;
    let uploadedCoverPath: string | null = null;
    let uploadedAvatarPath: string | null = null;
    const uploadedGalleryPaths: string[] = [];

    try {
      if (coverFile) {
        const upload = await uploadAdminArtistImage(
          coverFile,
          artist.ownerProfileId,
          artist.id,
          "cover",
        );
        if ("error" in upload) {
          setErrorMessage(`อัปโหลดภาพปกไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedCoverPath = upload.path;
        newCoverPath = upload.path;
      }

      if (avatarFile) {
        const upload = await uploadAdminArtistImage(
          avatarFile,
          artist.ownerProfileId,
          artist.id,
          "avatar",
        );
        if ("error" in upload) {
          if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
          setErrorMessage(`อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedAvatarPath = upload.path;
        newAvatarPath = upload.path;
      }

      // Upload new gallery images
      for (const file of newGalleryFiles) {
        const upload = await uploadAdminArtistGalleryImage(file, artist.ownerProfileId, artist.id);
        if ("error" in upload) {
          // Cleanup uploaded gallery images
          for (const p of uploadedGalleryPaths) {
            await deleteAdminArtistGalleryImage(p);
          }
          if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
          if (uploadedAvatarPath) await deleteAdminArtistImage(uploadedAvatarPath, "avatar");
          setErrorMessage(`อัปโหลดรูปเพิ่มเติมไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedGalleryPaths.push(upload.path);
      }

      await updateAdminArtistAction({
        id: artist.id,
        name,
        slug,
        bio,
        location,
        websiteUrl,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        contactUrl,
        avatarUrl: newAvatarPath ?? undefined,
        coverImageUrl: newCoverPath ?? undefined,
        coverPosition,
        status,
        categoryIds: Array.from(selectedCategoryIds),
      });

      // Delete removed gallery images from storage and database
      if (removedGalleryIds.length > 0) {
        const supabase = createClient();
        // Get paths of removed images
        const removedImages = artist.gallery?.filter((img) => removedGalleryIds.includes(img.id)) ?? [];
        for (const img of removedImages) {
          if (img.imageUrl && !img.imageUrl.startsWith("http")) {
            await deleteAdminArtistGalleryImage(img.imageUrl);
          }
        }
        // Delete from database
        const { error: deleteError } = await supabase
          .from("artist_images")
          .delete()
          .eq("artist_id", artist.id)
          .in("id", removedGalleryIds);
        if (deleteError) {
          setErrorMessage(`ลบรูปเพิ่มเติมจากฐานข้อมูลไม่สำเร็จ: ${deleteError.message}`);
          return;
        }
      }

      // Insert new gallery images into database
      if (uploadedGalleryPaths.length > 0) {
        const supabase = createClient();
        const galleryStartOrder = galleryImages.length;
        for (const [index, path] of uploadedGalleryPaths.entries()) {
          const { error: insertError } = await supabase
            .from("artist_images")
            .insert({
              artist_id: artist.id,
              image_path: path,
              sort_order: galleryStartOrder + index,
            });
          if (insertError) {
            setErrorMessage(`บันทึกรูปเพิ่มเติมไม่สำเร็จ: ${insertError.message}`);
            return;
          }
        }
      }

      // Delete old cover/avatar from storage only after successful save
      if (coverFile && artist.coverImagePath && artist.coverImagePath !== newCoverPath) {
        await deleteAdminArtistImage(artist.coverImagePath, "cover");
      }
      if (avatarFile && artist.avatarPath && artist.avatarPath !== newAvatarPath) {
        await deleteAdminArtistImage(artist.avatarPath, "avatar");
      }

      // Update local path state so a second save doesn't re-delete
      setCoverPath(newCoverPath);
      setAvatarPath(newAvatarPath);
      setCoverFile(null);
      setAvatarFile(null);
      setNewGalleryFiles([]);
      setNewGalleryPreviews([]);
      setRemovedGalleryIds([]);
      setGalleryImages((current) => [
        ...current.filter((img) => !removedGalleryIds.includes(img.id)),
        ...uploadedGalleryPaths.map((path, index) => ({
          id: crypto.randomUUID(),
          imageUrl: path,
          sortOrder: galleryImages.length + index,
          createdAt: new Date().toISOString(),
        })),
      ]);

      setSuccessMessage("บันทึกข้อมูลแล้ว กำลังนำทางกลับ...");
      setTimeout(() => {
        router.push("/dashboard/artists");
        router.refresh();
      }, 600);
    } catch (error) {
      if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
      if (uploadedAvatarPath) await deleteAdminArtistImage(uploadedAvatarPath, "avatar");
      for (const p of uploadedGalleryPaths) {
        await deleteAdminArtistGalleryImage(p);
      }
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={() => router.push("/dashboard/artists")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> กลับสู่การจัดการศิลปิน
      </button>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10"
      >
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            แก้ไข Artist
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            แก้ไขข้อมูลโปรไฟล์ รูปภาพ หมวดหมู่ และสถานะการเผยแพร่
          </p>
        </header>

        {errorMessage ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">{successMessage}</p>
        ) : null}

        {/* Images */}
        <section className="grid gap-5 sm:grid-cols-2">
          {/* Avatar */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">รูปโปรไฟล์</label>
            <div className="flex aspect-square max-w-[160px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">ยังไม่ได้เลือก</span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleImageChange(e, "avatar")}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {avatarPreview ? "เปลี่ยนรูปโปรไฟล์" : "เลือกรูปโปรไฟล์"}
            </button>
          </div>

          {/* Cover */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">ภาพปก</label>
            <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
              {coverPreview ? (
                <CoverImagePreview
                  src={coverPreview}
                  alt="ตัวอย่างภาพปก"
                  className="h-full w-full"
                  initialPosition={coverPosition}
                  onPositionChange={setCoverPosition}
                />
              ) : (
                <span className="text-xs text-muted-foreground">ยังไม่ได้เลือก</span>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleImageChange(e, "cover")}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {coverPreview ? "เปลี่ยนภาพปก" : "เลือกภาพปก"}
            </button>
          </div>
        </section>

        {/* Gallery */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <label className="block text-sm font-medium">รูปเพิ่มเติม</label>
            <span className="text-xs text-muted-foreground">{galleryImages.length + newGalleryFiles.length} / 10</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryImages.map((image) => (
              <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30">
                {image.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.imageUrl} alt="รูปเพิ่มเติมของศิลปิน" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">โหลดภาพไม่สำเร็จ</div>
                )}
                <button
                  type="button"
                  onClick={() => removeGalleryImage(image)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-destructive"
                  aria-label="ลบรูปเพิ่มเติม"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {newGalleryPreviews.map((preview, index) => (
              <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-primary/40 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="ตัวอย่างรูปเพิ่มเติม" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewGalleryFile(index)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-destructive"
                  aria-label="นำรูปเพิ่มเติมออก"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {galleryImages.length + newGalleryFiles.length < 10 ? (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                <ImagePlus className="h-5 w-5" />
                <span>เพิ่มรูป</span>
                <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleGalleryChange} />
              </label>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">PNG, JPG หรือ WebP ไม่เกิน 5 MB ต่อไฟล์ และรวมไม่เกิน 10 รูป</p>
        </section>

        <Field label="ชื่อศิลปิน *" id="artist-name" value={name} onChange={setName} required />
        <Field
          label="รหัส URL *"
          id="artist-slug"
          value={slug}
          onChange={(v) => setSlug(v.toLowerCase())}
          required
        />
        <Field label="สถานที่" id="artist-location" value={location} onChange={setLocation} />

        <div className="space-y-1.5">
          <label htmlFor="artist-bio" className="block text-sm font-medium">
            ประวัติโดยย่อ
          </label>
          <textarea
            id="artist-bio"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed focus:border-primary focus:outline-hidden"
          />
        </div>

        {/* Social links */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="เว็บไซต์" id="website" value={websiteUrl} onChange={setWebsiteUrl} type="url" />
          <Field label="Instagram" id="instagram" value={instagramUrl} onChange={setInstagramUrl} type="url" />
          <Field label="Facebook" id="facebook" value={facebookUrl} onChange={setFacebookUrl} type="url" />
          <Field label="TikTok" id="tiktok" value={tiktokUrl} onChange={setTiktokUrl} type="url" />
          <Field
            label="ช่องทางติดต่อ"
            id="contact"
            value={contactUrl}
            onChange={setContactUrl}
            type="url"
          />
        </div>

        {/* Status */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="สถานะ"
            id="artist-status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "draft", label: "ฉบับร่าง" },
              { value: "published", label: "เผยแพร่" },
            ]}
          />
        </div>

        {/* Categories */}
        {allCategories.length > 0 ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">หมวดหมู่</legend>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const checked = selectedCategoryIds.has(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    {cat.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-hidden"
      />
    </div>
  );
}

function Select({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
