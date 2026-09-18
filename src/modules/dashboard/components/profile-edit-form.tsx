"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Upload,
  User,
  MapPin,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { onboardingSchema, THAI_PROVINCES } from "@/modules/auth/types";
import { CoverImagePreview } from "@/components/shared/cover-image-preview";

interface ProfileEditFormProps {
  userId: string;
  initialDisplayName?: string | null;
  initialUsername?: string | null;
  initialBio?: string | null;
  initialLocation?: string | null;
  initialAvatarPath?: string | null;
  initialAvatarPreviewUrl?: string | null;
  initialCoverPath?: string | null;
  initialCoverPreviewUrl?: string | null;
  initialCoverPosition?: string | null;
}

function isExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function ProfileEditForm({
  userId,
  initialDisplayName = "",
  initialUsername = "",
  initialBio = "",
  initialLocation = "",
  initialAvatarPath = "",
  initialAvatarPreviewUrl = "",
  initialCoverPath = "",
  initialCoverPreviewUrl = "",
}: ProfileEditFormProps) {
  const router = useRouter();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const avatarPath = initialAvatarPath ?? "";
  const coverPath = initialCoverPath ?? "";

  const [displayName, setDisplayName] = useState(initialDisplayName || "");
  const [username, setUsername] = useState(initialUsername || "");
  const [bio, setBio] = useState(initialBio || "");
  const [location, setLocation] = useState(initialLocation || "");
  // Bucket-relative paths must never be placed in the URL field: they are
  // persisted as paths and rendered through a server-generated signed URL.
  const [avatarUrl, setAvatarUrl] = useState(
    isExternalUrl(avatarPath) ? avatarPath : ""
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarPreviewUrl || avatarPath || null
  );

  const [coverUrl, setCoverUrl] = useState(
    isExternalUrl(coverPath) ? coverPath : ""
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialCoverPreviewUrl || coverPath || null
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ขนาดรูปโปรไฟล์ต้องไม่เกิน 5 MB");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ขนาดภาพปกต้องไม่เกิน 5 MB");
      return;
    }

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = onboardingSchema.safeParse({
      displayName,
      username,
      bio: bio || undefined,
      location: location || undefined,
      avatarUrl: avatarUrl || undefined,
    });

    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Ensure user is authenticated and matches ownership
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setErrorMessage("ไม่พบสิทธิ์การแก้ไขโปรไฟล์นี้ กรุณาเข้าสู่ระบบใหม่");
        setIsLoading(false);
        return;
      }

      // Check if username is taken by another profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase().trim())
        .neq("id", userId)
        .maybeSingle();

      if (existingProfile) {
        setErrorMessage(`ชื่อผู้ใช้ @${username} ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
        setIsLoading(false);
        return;
      }

      let finalAvatarUrl: string | null = avatarUrl.trim() || (
        isExternalUrl(avatarPath) ? null : avatarPath || null
      );

      // Handle avatar file upload to avatars bucket if a new file was chosen
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop() || "png";
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          setErrorMessage(`อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }

        finalAvatarUrl = filePath;
      }

      // 1. Update public.profiles (Scoped strictly to id = userId)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          username: username.toLowerCase().trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
        })
        .eq("id", userId);

      if (profileError) {
        setErrorMessage(`บันทึกโปรไฟล์ไม่สำเร็จ: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // 2. Fetch existing artist to get exact artist.id or generate new artist.id
      const { data: existingArtist } = await supabase
        .from("artists")
        .select("id")
        .eq("profile_id", userId)
        .limit(1)
        .maybeSingle();

      const artistId = existingArtist?.id ?? crypto.randomUUID();

      let finalCoverUrl: string | null = coverUrl.trim() || (
        isExternalUrl(coverPath) ? null : coverPath || null
      );

      // Handle cover file upload to artist-covers bucket if a new cover file was chosen
      if (coverFile) {
        const fileExt = coverFile.name.split(".").pop() || "png";
        const coverUploadPath = `${userId}/${artistId}/cover/${Date.now()}.${fileExt}`;

        const { error: coverUploadError } = await supabase.storage
          .from("artist-covers")
          .upload(coverUploadPath, coverFile, { upsert: true });

        if (coverUploadError) {
          setErrorMessage(`อัปโหลดภาพปกไม่สำเร็จ: ${coverUploadError.message}`);
          setIsLoading(false);
          return;
        }

        finalCoverUrl = coverUploadPath;
      }

      // 3. Update or insert public.artists (Scoped to profile_id = userId)
      if (existingArtist) {
        const { error: artistError } = await supabase
          .from("artists")
          .update({
            name: displayName.trim(),
            slug: username.toLowerCase().trim(),
            bio: bio.trim() || null,
            location: location.trim() || null,
            avatar_url: finalAvatarUrl,
            cover_image_url: finalCoverUrl,
          })
          .eq("id", existingArtist.id);

        if (artistError) {
          setErrorMessage(`บันทึกข้อมูลศิลปินไม่สำเร็จ: ${artistError.message}`);
          setIsLoading(false);
          return;
        }
      } else {
        const { error: artistInsertError } = await supabase
          .from("artists")
          .insert({
            id: artistId,
            profile_id: userId,
            name: displayName.trim(),
            slug: username.toLowerCase().trim(),
            bio: bio.trim() || null,
            location: location.trim() || null,
            avatar_url: finalAvatarUrl,
            cover_image_url: finalCoverUrl,
            status: "published",
          });

        if (artistInsertError) {
          setErrorMessage(`บันทึกข้อมูลศิลปินไม่สำเร็จ: ${artistInsertError.message}`);
          setIsLoading(false);
          return;
        }
      }

      setSuccessMessage("บันทึกการแก้ไขโปรไฟล์เรียบร้อยแล้ว กำลังนำทางกลับ...");

      // Redirect back to dashboard and refresh data immediately
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Top Breadcrumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>กลับสู่แดชบอร์ด</span>
      </Link>

      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>จัดการบัญชีครีเอเตอร์</span>
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            แก้ไขโปรไฟล์ศิลปิน
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            ปรับปรุงข้อมูลส่วนตัว ข้อมูลสถานที่ และภาพโปรไฟล์ของคุณบน ThaiArtHub
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage ? (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        ) : null}

        {/* Success Alert */}
        {successMessage ? (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 shadow-xs">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>

            <div className="flex flex-col items-center sm:items-start gap-1.5">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>เปลี่ยนรูปโปรไฟล์ (Avatar)</span>
              </button>
              <p className="text-[11px] text-muted-foreground">
                รองรับ PNG, JPG, WebP ขนาดไม่เกิน 5 MB
              </p>
              <div className="mt-1 flex w-full max-w-sm items-center gap-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    if (e.target.value) {
                      setAvatarPreview(e.target.value);
                      setAvatarFile(null);
                    }
                  }}
                  placeholder="หรือระบุ URL รูปภาพ (เช่น https://...)"
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span>ภาพปกโปรไฟล์ศิลปิน (Cover Image)</span>
            </label>
            <div className="relative aspect-[3/1] min-h-36 w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 shadow-xs">
              {coverPreview ? (
                <CoverImagePreview src={coverPreview} alt="Cover preview" className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                  ยังไม่ได้เลือกภาพปก
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleCoverChange}
                />
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{coverPreview ? "เปลี่ยนภาพปก" : "เลือกภาพปก (Cover)"}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                รองรับ PNG, JPG, WebP ขนาดไม่เกิน 5 MB
              </p>
            </div>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                if (e.target.value) {
                  setCoverPreview(e.target.value);
                  setCoverFile(null);
                }
              }}
              placeholder="หรือระบุ URL รูปภาพปก (เช่น https://...)"
              className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span>ชื่อศิลปิน / สตูดิโอ (Display Name) *</span>
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น นาวิน พงศ์ศิริ หรือ Navin Studio"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
            />
          </div>

          {/* Username / Slug */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <span>ชื่อผู้ใช้ / Username (สำหรับ URL) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                thaiarthub.com/artists/
              </span>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="navin-art"
                className="w-full rounded-xl border border-border bg-background pl-44 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
              />
            </div>
          </div>

          {/* Location / Province */}
          <div className="space-y-1.5">
            <label
              htmlFor="location"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>จังหวัด / สถานที่พำนัก (Location)</span>
            </label>
            <div className="relative">
              <input
                id="location"
                type="text"
                list="provinces-list"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="พิมพ์หรือเลือกจังหวัด เช่น เชียงใหม่ หรือ กรุงเทพมหานคร"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition"
              />
              <datalist id="provinces-list">
                {THAI_PROVINCES.map((prov) => (
                  <option key={prov} value={prov} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label
              htmlFor="bio"
              className="flex items-center gap-1.5 text-xs font-medium text-foreground"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>ประวัติย่อ / Artist Statement (Bio)</span>
            </label>
            <textarea
              id="bio"
              rows={4}
              maxLength={1500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เล่าเกี่ยวกับแรงบันดาลใจ เทคนิคที่ใช้ หรือประสบการณ์การทำงานศิลปะของคุณ..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition leading-relaxed"
            />
            <div className="text-right text-[11px] text-muted-foreground">
              {bio.length} / 1,500 ตัวอักษร
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Link
              href="/dashboard"
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <span>บันทึกการเปลี่ยนแปลง</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
