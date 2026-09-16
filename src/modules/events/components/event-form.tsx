"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { deleteCoverImage, revokeObjectUrl, uploadCoverImage, validateCoverFile } from "../cover";
import type { AdminEventDetail } from "../queries";

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function EventForm({ profileId, event }: { profileId: string; event?: AdminEventDetail }) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(event);
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venueName, setVenueName] = useState(event?.venueName ?? "");
  const [address, setAddress] = useState(event?.address ?? "");
  const [province, setProvince] = useState(event?.province ?? "");
  const [startAt, setStartAt] = useState(toLocalDateTime(event?.startAt ?? null));
  const [endAt, setEndAt] = useState(toLocalDateTime(event?.endAt ?? null));
  const [latitude, setLatitude] = useState(event?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(event?.longitude?.toString() ?? "");
  const [externalUrl, setExternalUrl] = useState(event?.externalUrl ?? "");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(event?.coverImageUrl ?? null);
  const [status, setStatus] = useState<"draft" | "published" | "cancelled">(event?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(event?.isFeatured ?? false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => () => revokeObjectUrl(coverImagePreview), [coverImagePreview]);

  const handleCoverChange = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0];
    if (!file) return;
    const validationError = validateCoverFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      changeEvent.target.value = "";
      return;
    }
    setErrorMessage(null);
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setErrorMessage(null);
    if (!title.trim() || !slug.trim() || !startAt) {
      setErrorMessage("กรุณากรอกชื่อกิจกรรม รหัส URL และวันเวลาเริ่มต้น");
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug)) {
      setErrorMessage("รหัส URL ไม่ถูกต้อง");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const eventId = event?.id ?? crypto.randomUUID();
      const oldCoverPath = event?.coverImagePath ?? null;
      let coverImagePath = oldCoverPath;
      let uploadedCoverPath: string | null = null;

      if (coverImageFile) {
        const upload = await uploadCoverImage(coverImageFile, profileId, eventId);
        if ("error" in upload) {
          setErrorMessage(`อัปโหลดภาพปกไม่สำเร็จ: ${upload.error}`);
          return;
        }
        uploadedCoverPath = upload.path;
        coverImagePath = upload.path;
      }

      const values = {
        title: title.trim(), slug: slug.trim(), description: description.trim() || null,
        cover_image_url: coverImagePath, venue_name: venueName.trim() || null,
        address: address.trim() || null, province: province.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        start_at: new Date(startAt).toISOString(), end_at: endAt ? new Date(endAt).toISOString() : null,
        external_url: externalUrl.trim() || null, status, is_featured: isFeatured,
      };
      const result = isEditing
        ? await supabase.from("events").update(values).eq("id", eventId)
        : await supabase.from("events").insert({ ...values, id: eventId });
      if (result.error) {
        if (uploadedCoverPath) await deleteCoverImage(uploadedCoverPath);
        setErrorMessage(`บันทึกกิจกรรมไม่สำเร็จ: ${result.error.message}`);
        return;
      }
      if (uploadedCoverPath && oldCoverPath && oldCoverPath !== uploadedCoverPath) {
        await deleteCoverImage(oldCoverPath);
      }
      router.push(isEditing ? "/dashboard/events" : `/dashboard/events/${eventId}/edit`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกกิจกรรม");
    } finally {
      setIsSaving(false);
    }
  };

  return <div className="mx-auto w-full max-w-3xl">
    <button type="button" onClick={() => router.push("/dashboard/events")} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> กลับสู่การจัดการกิจกรรม</button>
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
      <header><h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{isEditing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}</h1><p className="mt-1.5 text-sm text-muted-foreground">จัดการข้อมูลกิจกรรมและภาพแกลเลอรี</p></header>
      {errorMessage ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}
      <Field label="ชื่อกิจกรรม *" id="event-title" value={title} onChange={setTitle} required />
      <Field label="รหัส URL *" id="event-slug" value={slug} onChange={(value) => setSlug(value.toLowerCase())} required />
      <section className="space-y-3"><label className="block text-sm font-medium">ภาพปก</label><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 sm:w-56">{coverImagePreview ? <img src={coverImagePreview} alt="ตัวอย่างภาพปก" className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">ยังไม่ได้เลือกภาพ</span>}</div><div><input ref={coverInputRef} id="event-cover" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverChange} /><button type="button" onClick={() => coverInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">{coverImagePreview ? "เปลี่ยนภาพปก" : "เลือกรูปภาพ"}</button><p className="mt-2 text-xs text-muted-foreground">PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB</p></div></div></section>
      <div className="grid gap-5 sm:grid-cols-2"><Select label="สถานะ" id="event-status" value={status} onChange={(value) => setStatus(value as typeof status)} options={[{ value: "draft", label: "ฉบับร่าง" }, { value: "published", label: "เผยแพร่" }, { value: "cancelled", label: "ยกเลิก" }]} /><Field label="จังหวัด" id="event-province" value={province} onChange={setProvince} /></div>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="เริ่มต้น *" id="event-start" value={startAt} onChange={setStartAt} type="datetime-local" required /><Field label="สิ้นสุด" id="event-end" value={endAt} onChange={setEndAt} type="datetime-local" /></div>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="สถานที่" id="event-venue" value={venueName} onChange={setVenueName} /><Field label="ที่อยู่" id="event-address" value={address} onChange={setAddress} /></div>
      <div className="grid gap-5 sm:grid-cols-2"><Field label="ละติจูด" id="event-latitude" value={latitude} onChange={setLatitude} /><Field label="ลองจิจูด" id="event-longitude" value={longitude} onChange={setLongitude} /></div>
      <div className="space-y-1.5"><label htmlFor="event-description" className="block text-sm font-medium">รายละเอียด</label><textarea id="event-description" rows={6} value={description} onChange={(changeEvent) => setDescription(changeEvent.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed" /></div>
      <Field label="URL เพิ่มเติม" id="event-url" value={externalUrl} onChange={setExternalUrl} type="url" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(changeEvent) => setIsFeatured(changeEvent.target.checked)} />แสดงเป็นกิจกรรมเด่นบนหน้าแรก</label>
      <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}</button>
    </form>
  </div>;
}

function Field({ label, id, value, onChange, type = "text", required = false }: { label: string; id: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium">{label}</label><input id={id} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-hidden" /></div>;
}

function Select({ label, id, value, onChange, options }: { label: string; id: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium">{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
