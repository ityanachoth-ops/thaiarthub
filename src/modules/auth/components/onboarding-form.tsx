"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  AlertCircle,
  Upload,
  User,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRole } from "@/types/database.types";
import { onboardingSchema, THAI_PROVINCES } from "../types";

interface OnboardingFormProps {
  initialUserId: string;
  initialRole: ProfileRole;
  initialDisplayName?: string | null;
  initialUsername?: string | null;
  initialBio?: string | null;
  initialLocation?: string | null;
  initialAvatarUrl?: string | null;
}

export function OnboardingForm({
  initialUserId,
  initialRole,
  initialDisplayName = "",
  initialUsername = "",
  initialBio = "",
  initialLocation = "",
  initialAvatarUrl = "",
}: OnboardingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initialDisplayName || "");
  const [username, setUsername] = useState(initialUsername || "");
  const [bio, setBio] = useState(initialBio || "");
  const [location, setLocation] = useState(initialLocation || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarUrl || null
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ขนาดรูปภาพต้องไม่เกิน 5 MB");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

    if (initialRole !== "creator" && initialRole !== "admin") {
      setErrorMessage("บัญชีผู้ใช้ทั่วไปไม่สามารถสร้างโปรไฟล์ศิลปินผ่านหน้านี้ได้");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();

      // Check if username is taken by another profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("id", initialUserId)
        .maybeSingle();

      if (existingProfile) {
        setErrorMessage(`ชื่อผู้ใช้ @${username} ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
        setIsLoading(false);
        return;
      }

      let finalAvatarUrl: string | null = avatarUrl.trim() || null;

      // Handle avatar file upload if a file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop() || "png";
        const filePath = `${initialUserId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadError) {
          // Store relative storage path or signed URL
          finalAvatarUrl = filePath;
        } else {
          console.warn("Avatar upload notice:", uploadError.message);
        }
      }

      // Keep creator (or admin) — never demote back to user during onboarding.
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: initialUserId,
        display_name: displayName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
        role: initialRole === "admin" ? "admin" : "creator",
      });

      if (profileError) {
        setErrorMessage(`บันทึกโปรไฟล์ไม่สำเร็จ: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // 2. Create or update public.artists
      const { data: existingArtist } = await supabase
        .from("artists")
        .select("id")
        .eq("profile_id", initialUserId)
        .maybeSingle();

      if (existingArtist) {
        const { error: updateArtistError } = await supabase
          .from("artists")
          .update({
            name: displayName.trim(),
            slug: username.toLowerCase().trim(),
            bio: bio.trim() || null,
            location: location.trim() || null,
            avatar_url: finalAvatarUrl,
            status: "published",
          })
          .eq("id", existingArtist.id);

        if (updateArtistError) {
          setErrorMessage(`บันทึกข้อมูลศิลปินไม่สำเร็จ: ${updateArtistError.message}`);
          setIsLoading(false);
          return;
        }
      } else {
        const { error: insertArtistError } = await supabase.from("artists").insert({
          profile_id: initialUserId,
          name: displayName.trim(),
          slug: username.toLowerCase().trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_url: finalAvatarUrl,
          status: "published",
        });

        if (insertArtistError) {
          setErrorMessage(`บันทึกข้อมูลศิลปินไม่สำเร็จ: ${insertArtistError.message}`);
          setIsLoading(false);
          return;
        }
      }

      // 3. Redirect to creator dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>เริ่มต้นใช้งานครีเอเตอร์</span>
          </span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          สร้างโปรไฟล์ศิลปินของคุณ
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          กรอกข้อมูลพื้นฐานเพื่อให้ผู้เข้าชม นิทรรศการ และผู้ร่วมงานสามารถค้นพบคุณบน ThaiArtHub
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage ? (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
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
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>เลือกรูปโปรไฟล์ (Avatar)</span>
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

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังบันทึกโปรไฟล์...</span>
            </>
          ) : (
            <>
              <span>บันทึกและเข้าสู่แดชบอร์ด</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
