"use client";

import Link from "next/link";
import { Calendar, Pencil, Plus } from "lucide-react";
import type { EventDetail } from "../queries";

export function AdminEventManager({ events }: { events: EventDetail[] }) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-xl font-bold">กิจกรรมทั้งหมด</h2><p className="mt-1 text-sm text-muted-foreground">จัดการข้อมูลกิจกรรม แกลเลอรี และกิจกรรมเด่น</p></div><Link href="/dashboard/events/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />เพิ่มกิจกรรม</Link></div>
      {events.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground"><Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />ยังไม่มีกิจกรรม</div> : <div className="mt-6 divide-y divide-border/60">{events.map((event) => <div key={event.id} className="flex flex-col gap-3 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display font-semibold">{event.title}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{event.status === "published" ? "เผยแพร่" : event.status === "cancelled" ? "ยกเลิก" : "ฉบับร่าง"}</span>{event.isFeatured ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">เด่น</span> : null}</div><p className="mt-1 text-xs text-muted-foreground">{event.venueName ?? "ไม่ระบุสถานที่"} · /events/{event.slug}</p></div><Link href={`/dashboard/events/${event.id}/edit`} className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium"><Pencil className="h-3.5 w-3.5" />แก้ไขและจัดการแกลเลอรี</Link></div>)}</div>}
    </section>
  );
}