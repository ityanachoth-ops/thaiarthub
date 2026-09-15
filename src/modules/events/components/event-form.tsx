"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { EventDetail } from "../queries";

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: EventDetail }) {
  const router = useRouter();
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
  const [coverImageUrl, setCoverImageUrl] = useState(event?.coverImagePath ?? "");
  const [status, setStatus] = useState<"draft" | "published" | "cancelled">(event?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(event?.isFeatured ?? false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      const values = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        venue_name: venueName.trim() || null,
        address: address.trim() || null,
        province: province.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        external_url: externalUrl.trim() || null,
        status,
        is_featured: isFeatured,
      };
      const result = isEditing
        ? await supabase.from("events").update(values).eq("id", eventId)
        : await supabase.from("events").insert({ ...values, id: eventId });
      if (result.error) {
        setErrorMessage(`บันทึกกิจกรรมไม่สำเร็จ: ${result.error.message}`);
        return;
      }
      router.push(isEditing ? "/dashboard/events" : `/dashboard/events/${eventId}/edit`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกกิจกรรม");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button type="button" onClick={() => router.push("/dashboard/events")} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> กลับสู่การจัดการกิจกรรม
      </button>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{isEditing ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">จัดการข้อมูลกิจกรรมและภาพแกลเลอรี</p>
        </header>
        {errorMessage ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}
        <div className="space-y-1.5"><label htmlFor="event-title" className="block text-sm font-medium">ชื่อกิจกรรม *</label><input id="event-title" required value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-hidden" /></div>
        <div className="space-y-1.5"><label htmlFor="event-slug" className="block text-sm font-medium">รหัส URL *</label><input id="event-slug" required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-hidden" /></div>
        <div className="space-y-1.5"><label htmlFor="event-cover" className="block text-sm font-medium">เส้นทางภาพปกเดิม</label><input id="event-cover" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="events/path หรือ URL ภายนอก" className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm focus:border-primary focus:outline-hidden" /><p className="text-xs text-muted-foreground">คงพฤติกรรมภาพปกกิจกรรมเดิมไว้</p></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="event-status" className="block text-sm font-medium">สถานะ</label><select id="event-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm"><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="cancelled">ยกเลิก</option></select></div><div className="space-y-1.5"><label htmlFor="event-province" className="block text-sm font-medium">จังหวัด</label><input id="event-province" value={province} onChange={(event) => setProvince(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="event-start" className="block text-sm font-medium">เริ่มต้น *</label><input id="event-start" required type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="event-end" className="block text-sm font-medium">สิ้นสุด</label><input id="event-end" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="event-venue" className="block text-sm font-medium">สถานที่</label><input id="event-venue" value={venueName} onChange={(event) => setVenueName(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="event-address" className="block text-sm font-medium">ที่อยู่</label><input id="event-address" value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><label htmlFor="event-latitude" className="block text-sm font-medium">ละติจูด</label><input id="event-latitude" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div><div className="space-y-1.5"><label htmlFor="event-longitude" className="block text-sm font-medium">ลองจิจูด</label><input id="event-longitude" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div></div>
        <div className="space-y-1.5"><label htmlFor="event-description" className="block text-sm font-medium">รายละเอียด</label><textarea id="event-description" rows={6} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed" /></div>
        <div className="space-y-1.5"><label htmlFor="event-url" className="block text-sm font-medium">URL เพิ่มเติม</label><input id="event-url" type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />แสดงเป็นกิจกรรมเด่นบนหน้าแรก</label>
        <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}</button>
      </form>
    </div>
  );
}