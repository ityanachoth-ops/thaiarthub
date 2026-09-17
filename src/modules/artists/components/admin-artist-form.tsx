"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { createAdminArtistAction } from "@/app/dashboard/artists/actions";
import type { CreatorOwnerOption } from "../queries";
import { deleteAdminArtistImage, revokeObjectUrl, uploadAdminArtistImage, validateArtistImageFile } from "../media";

export function AdminArtistForm({
  adminProfileId,
  creators,
}: {
  adminProfileId: string;
  creators: CreatorOwnerOption[];
}) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [contactUrl, setContactUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [ownership, setOwnership] = useState<"claim" | "creator">("claim");
  const [creatorProfileId, setCreatorProfileId] = useState(creators[0]?.id ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => () => revokeObjectUrl(coverPreview), [coverPreview]);
  useEffect(() => () => revokeObjectUrl(avatarPreview), [avatarPreview]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  };

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
    } else {
      setAvatarFile(file);
      setAvatarPreview(preview);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (ownership === "creator" && !creatorProfileId) {
      setErrorMessage("กรุณาเลือก Creator ที่จะเป็นเจ้าของโปรไฟล์");
      return;
    }

    setIsSaving(true);
    const artistId = crypto.randomUUID();
    let uploadedCoverPath: string | null = null;
    let uploadedAvatarPath: string | null = null;

    try {
      if (coverFile) {
        const upload = await uploadAdminArtistImage(coverFile, adminProfileId, artistId, "cover");
        if ("error" in upload) {
          setErrorMessage(`อัปโหลดภาพปกไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedCoverPath = upload.path;
      }
      if (avatarFile) {
        const upload = await uploadAdminArtistImage(avatarFile, adminProfileId, artistId, "avatar");
        if ("error" in upload) {
          if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
          setErrorMessage(`อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedAvatarPath = upload.path;
      }

      await createAdminArtistAction({
        id: artistId,
        name,
        slug,
        bio,
        location,
        websiteUrl,
        instagramUrl,
        facebookUrl,
        tiktokUrl,
        contactUrl,
        avatarUrl: uploadedAvatarPath ?? undefined,
        coverImageUrl: uploadedCoverPath ?? undefined,
        status,
        ownership,
        creatorProfileId: ownership === "creator" ? creatorProfileId : undefined,
      });

      router.push("/dashboard/artists");
      router.refresh();
    } catch (error) {
      if (uploadedCoverPath) await deleteAdminArtistImage(uploadedCoverPath, "cover");
      if (uploadedAvatarPath) await deleteAdminArtistImage(uploadedAvatarPath, "avatar");
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกศิลปิน");
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
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">เพิ่ม Artist</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            สร้างโปรไฟล์ไว้ให้เคลม หรือมอบให้ Creator เป็นเจ้าของทันที
          </p>
        </header>

        {errorMessage ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}

        <fieldset className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <legend className="px-1 text-sm font-medium">เจ้าของโปรไฟล์</legend>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="ownership"
              value="claim"
              checked={ownership === "claim"}
              onChange={() => setOwnership("claim")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-foreground">สร้างไว้ให้เคลม</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                โปรไฟล์จะผูกกับบัญชี Admin และผู้ใช้ทั่วไปสามารถส่งคำขอ Claim ได้
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="ownership"
              value="creator"
              checked={ownership === "creator"}
              onChange={() => setOwnership("creator")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-foreground">สร้างให้ Creator</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                โปรไฟล์เป็นของ Creator ทันที ไม่ต้องผ่าน Claim
              </span>
            </span>
          </label>
          {ownership === "creator" ? (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="creator-owner" className="block text-sm font-medium">เลือก Creator *</label>
              {creators.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-background px-3.5 py-3 text-sm text-muted-foreground">
                  ยังไม่มี Creator ที่ว่างสำหรับรับโปรไฟล์ศิลปิน
                </p>
              ) : (
                <select
                  id="creator-owner"
                  required
                  value={creatorProfileId}
                  onChange={(event) => setCreatorProfileId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"
                >
                  {creators.map((creator) => (
                    <option key={creator.id} value={creator.id}>
                      {creator.displayName} @{creator.username}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
        </fieldset>

        <Field label="ชื่อศิลปิน *" id="artist-name" value={name} onChange={handleNameChange} required />
        <Field label="รหัส URL *" id="artist-slug" value={slug} onChange={(value) => setSlug(value.toLowerCase())} required />
        <Field label="สถานที่" id="artist-location" value={location} onChange={setLocation} />

        <div className="space-y-1.5">
          <label htmlFor="artist-bio" className="block text-sm font-medium">ประวัติโดยย่อ</label>
          <textarea
            id="artist-bio"
            rows={5}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            label="สถานะ"
            id="artist-status"
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              { value: "draft", label: "ฉบับร่าง" },
              { value: "published", label: "เผยแพร่" },
            ]}
          />
        </div>

        <section className="grid gap-5 sm:grid-cols-2">
          <ImagePicker
            label="รูปโปรไฟล์"
            inputRef={avatarInputRef}
            preview={avatarPreview}
            onChange={(event) => handleImageChange(event, "avatar")}
          />
          <ImagePicker
            label="ภาพปก"
            inputRef={coverInputRef}
            preview={coverPreview}
            onChange={(event) => handleImageChange(event, "cover")}
          />
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="เว็บไซต์" id="artist-website" value={websiteUrl} onChange={setWebsiteUrl} type="url" />
          <Field label="Instagram" id="artist-instagram" value={instagramUrl} onChange={setInstagramUrl} type="url" />
          <Field label="Facebook" id="artist-facebook" value={facebookUrl} onChange={setFacebookUrl} type="url" />
          <Field label="TikTok" id="artist-tiktok" value={tiktokUrl} onChange={setTiktokUrl} type="url" />
          <Field label="ช่องทางติดต่อ" id="artist-contact" value={contactUrl} onChange={setContactUrl} type="url" />
        </div>

        <button
          type="submit"
          disabled={isSaving || (ownership === "creator" && creators.length === 0)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "กำลังบันทึก..." : "บันทึก Artist"}
        </button>
      </form>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
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
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function ImagePicker({
  label,
  inputRef,
  preview,
  onChange,
}: {
  label: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  preview: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section className="space-y-3">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`ตัวอย่าง${label}`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">ยังไม่ได้เลือกภาพ</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        {preview ? `เปลี่ยน${label}` : `เลือก${label}`}
      </button>
    </section>
  );
}
