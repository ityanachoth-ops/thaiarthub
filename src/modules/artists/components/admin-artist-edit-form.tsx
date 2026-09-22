"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { updateAdminArtistAction } from "@/app/dashboard/artists/actions";
import type { AdminArtistDetail } from "../queries";
import {
  deleteAdminArtistImage,
  revokeObjectUrl,
  uploadAdminArtistImage,
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    let newCoverPath = coverPath;
    let newAvatarPath = avatarPath;
    let uploadedCoverPath: string | null = null;
    let uploadedAvatarPath: string | null = null;

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

      setSuccessMessage("บันทึกข้อมูลแล้ว กำลังนำทางกลับ...");
      setTimeout(() => {
        router.push("/dashboard/artists");
        router.refresh();
      }, 600);
    } catch (error) {
      if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
      if (uploadedAvatarPath) await deleteAdminArtistImage(uploadedAvatarPath, "avatar");
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
