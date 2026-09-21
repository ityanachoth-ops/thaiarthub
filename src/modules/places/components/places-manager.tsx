"use client";

import Link from "next/link";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { CreativePlace } from "../types";

const BUCKET = "creative-places";

export function PlacesManager({ places }: { places: CreativePlace[] }) {
  const [items, setItems] = useState(places);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletePlace = async (place: CreativePlace) => {
    if (!window.confirm(`ลบ ${place.name} ใช่หรือไม่?`)) return;
    setDeletingId(place.id);
    setErrorMessage(null);
    const supabase = createClient();
    try {
      if (place.coverImagePath) {
        const { error } = await supabase.storage.from(BUCKET).remove([place.coverImagePath]);
        if (error) throw new Error(`ลบภาพปกไม่สำเร็จ: ${error.message}`);
      }
      const { error } = await supabase.from("creative_places").delete().eq("id", place.id);
      if (error) throw new Error(`ลบ Creative Place ไม่สำเร็จ: ${error.message}`);
      setItems((current) => current.filter((item) => item.id !== place.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ลบ Creative Place ไม่สำเร็จ");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-xl font-bold">Creative Places</h2><p className="mt-1 text-sm text-muted-foreground">จัดการพื้นที่สร้างสรรค์ของคุณ</p></div><Link href="/dashboard/places/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" />เพิ่ม Creative Place</Link></div>
      {errorMessage ? <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p> : null}
      {items.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-2 h-6 w-6 text-primary" />ยังไม่มี Creative Place</div> : <div className="mt-6 divide-y divide-border/60">{items.map((place) => <div key={place.id} className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">{place.coverImageUrl ? <img src={place.coverImageUrl} alt={place.name} className="h-full w-full object-cover" style={{ objectPosition: place.coverPosition }} /> : <div className="flex h-full items-center justify-center"><MapPin className="h-5 w-5 text-muted-foreground/50" /></div>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-display font-semibold">{place.name}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{place.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{place.type} · {place.province || "ไม่ระบุจังหวัด"} · {place.latitude !== null && place.longitude !== null ? "มีพิกัด" : "ไม่มีพิกัด"}</p></div></div><div className="flex items-center gap-2"><Link href={`/dashboard/places/${place.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium"><Pencil className="h-3.5 w-3.5" />แก้ไข</Link><button type="button" onClick={() => deletePlace(place)} disabled={deletingId === place.id} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-xs font-medium text-destructive disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />ลบ</button></div></div>)}</div>}
    </section>
  );
}
