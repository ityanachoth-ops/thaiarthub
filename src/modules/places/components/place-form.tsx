"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, Save } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { GalleryManager } from "@/modules/culture/components/gallery-manager";
import type { CreativePlace, CreativePlaceStatus, CreativePlaceType } from "../types";
import { CREATIVE_PLACE_TYPES } from "../types";
import { CoverImagePreview } from "@/components/shared/cover-image-preview";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const BUCKET = "creative-places";

const typeLabels: Record<CreativePlaceType, string> = {
  gallery: "Gallery",
  "art-space": "Art Space",
  studio: "Studio",
  livehouse: "Livehouse",
  "creative-cafe": "Creative Cafe",
  "local-brand": "Local Brand",
  skate: "Skate",
  craft: "Craft",
  vintage: "Vintage",
  zine: "Zine",
  other: "Other",
};

type PlaceFormProps = { userId: string; isAdmin: boolean; place?: CreativePlace };

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function PlaceForm({ userId, isAdmin, place }: PlaceFormProps) {
  const router = useRouter();
  const isEditing = Boolean(place);
  const [name, setName] = useState(place?.name ?? "");
  const [slug, setSlug] = useState(place?.slug ?? "");
  const [description, setDescription] = useState(place?.description ?? "");
  const [type, setType] = useState<CreativePlaceType>(place?.type ?? "other");
  const [address, setAddress] = useState(place?.address ?? "");
  const [province, setProvince] = useState(place?.province ?? "");
  const [latitude, setLatitude] = useState(place?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(place?.longitude?.toString() ?? "");
  const [externalUrl, setExternalUrl] = useState(place?.externalUrl ?? "");
  const [status, setStatus] = useState<CreativePlaceStatus>(place?.status ?? "draft");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(place?.coverImageUrl ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrorMessage("กรุณาเลือกไฟล์ PNG, JPG หรือ WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("ไฟล์ภาพต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    setErrorMessage(null);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !slug.trim()) {
      setErrorMessage("กรุณากรอกชื่อและ slug");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,99}$/.test(slug.trim())) {
      setErrorMessage("Slug ต้องใช้ภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และขีดกลาง ความยาว 2-100 ตัวอักษร");
      return;
    }
    const parsedLatitude = latitude.trim() ? Number(latitude) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude) : null;
    if (parsedLatitude !== null && (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      setErrorMessage("ละติจูดต้องเป็นตัวเลขระหว่าง -90 ถึง 90");
      return;
    }
    if (parsedLongitude !== null && (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      setErrorMessage("ลองจิจูดต้องเป็นตัวเลขระหว่าง -180 ถึง 180");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const placeId = place?.id ?? crypto.randomUUID();
    let uploadedPath: string | null = null;
    try {
      const values = {
        name: name.trim(), slug: slug.trim(), description: description.trim() || null,
        type, address: address.trim() || null, province: province.trim() || null,
        latitude: parsedLatitude, longitude: parsedLongitude, external_url: externalUrl.trim() || null,
        status, created_by: userId,
      };

      if (coverFile) {
        const extension = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedPath = `${userId}/${placeId}/${Date.now()}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, coverFile, { upsert: false, contentType: coverFile.type });
        if (error) throw new Error(`อัปโหลดภาพปกไม่สำเร็จ: ${error.message}`);
      }

      const record = { ...values, ...(uploadedPath ? { cover_image_url: uploadedPath } : {}) };
      const result = isEditing
        ? isAdmin
          ? await supabase.from("creative_places").update(record).eq("id", placeId)
          : await supabase.from("creative_places").update(record).eq("id", placeId).eq("created_by", userId)
        : await supabase.from("creative_places").insert({ ...record, id: placeId });
      if (result.error) {
        if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
        setErrorMessage(result.error.code === "23505" ? "Slug นี้ถูกใช้แล้ว กรุณาเลือก slug ใหม่" : `บันทึก Creative Place ไม่สำเร็จ: ${result.error.message}`);
        return;
      }

      if (uploadedPath && place?.coverImagePath && place.coverImagePath !== uploadedPath) {
        const { error } = await supabase.storage.from(BUCKET).remove([place.coverImagePath]);
        if (error) console.warn("Creative place old cover cleanup failed", error.message);
      }
      router.push("/dashboard/places");
      router.refresh();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก Creative Place");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <Link href="/dashboard/places" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />กลับสู่ Creative Places</Link>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        <header><h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{isEditing ? "แก้ไข Creative Place" : "เพิ่ม Creative Place"}</h1><p className="mt-1.5 text-sm text-muted-foreground">เพิ่มพื้นที่สร้างสรรค์สำหรับการจัดการในอนาคต</p></header>
        {errorMessage ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}
        <section className="space-y-3"><label className="block text-sm font-medium">ภาพปก</label><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 sm:w-64">{coverPreview ? <CoverImagePreview src={coverPreview} alt="ตัวอย่างภาพปก" className="h-full w-full" /> : <ImagePlus className="h-8 w-8 text-muted-foreground/50" />}</div><div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium hover:bg-muted"><ImagePlus className="h-3.5 w-3.5" />{coverPreview ? "เปลี่ยนภาพปก" : "เลือกรูปภาพ"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} /></label><p className="mt-2 text-[11px] text-muted-foreground">PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB</p></div></div></section>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="place-name" className="block text-sm font-medium">ชื่อ *</label><input id="place-name" required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="place-slug" className="block text-sm font-medium">Slug *</label><input id="place-slug" required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="place-type" className="block text-sm font-medium">ประเภท *</label><select id="place-type" value={type} onChange={(event) => setType(event.target.value as CreativePlaceType)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm">{CREATIVE_PLACE_TYPES.map((item) => <option key={item} value={item}>{typeLabels[item]}</option>)}</select></div><div className="space-y-1.5"><label htmlFor="place-status" className="block text-sm font-medium">สถานะ</label><select id="place-status" value={status} onChange={(event) => setStatus(event.target.value as CreativePlaceStatus)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select></div></div>
        <div className="space-y-1.5"><label htmlFor="place-description" className="block text-sm font-medium">รายละเอียด</label><textarea id="place-description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed" /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="place-address" className="block text-sm font-medium">ที่อยู่</label><input id="place-address" value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="place-province" className="block text-sm font-medium">จังหวัด</label><input id="place-province" value={province} onChange={(event) => setProvince(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="place-latitude" className="block text-sm font-medium">ละติจูด</label><input id="place-latitude" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="place-longitude" className="block text-sm font-medium">ลองจิจูด</label><input id="place-longitude" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="space-y-1.5"><label htmlFor="place-url" className="block text-sm font-medium">URL เพิ่มเติม</label><input id="place-url" type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div>
        <div className="flex justify-end gap-3 border-t border-border/60 pt-5"><Link href="/dashboard/places" className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground">ยกเลิก</Link><button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving ? "กำลังบันทึก..." : "บันทึก Creative Place"}</button></div>
      </form>

      {isEditing && place ? (
        <GalleryManager kind="place" parentId={place.id} ownerId={userId} images={place.gallery ?? []} />
      ) : null}
    </div>
  );
}
