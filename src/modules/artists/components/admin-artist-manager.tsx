"use client";

import Link from "next/link";
import { Plus, User } from "lucide-react";

import type { AdminArtistListItem } from "../queries";

export function AdminArtistManager({ artists }: { artists: AdminArtistListItem[] }) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">โปรไฟล์ศิลปินทั้งหมด</h2>
          <p className="mt-1 text-sm text-muted-foreground">สร้างไว้ให้เคลม หรือมอบให้ Creator เป็นเจ้าของทันที</p>
        </div>
        <Link
          href="/dashboard/artists/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> เพิ่ม Artist
        </Link>
      </div>

      {artists.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <User className="h-7 w-7 text-primary" />
          <p className="mt-3 text-sm font-medium text-foreground">ยังไม่มีโปรไฟล์ศิลปิน</p>
          <p className="mt-1 text-xs text-muted-foreground">เริ่มสร้างโปรไฟล์แรกสำหรับ Claim หรือสำหรับ Creator</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border/60">
          {artists.map((artist) => {
            const isCreatorOwned = artist.ownerRole === "creator";
            return (
              <div key={artist.id} className="flex flex-col gap-3 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold">{artist.name}</h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      {artist.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isCreatorOwned ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                      {isCreatorOwned ? "เป็นของ Creator" : "รอเคลม"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /artists/{artist.slug}
                    {artist.ownerName ? ` · ${artist.ownerName} @${artist.ownerUsername}` : ""}
                  </p>
                </div>
                <Link
                  href={`/artists/${artist.slug}`}
                  className="inline-flex w-fit items-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  ดูโปรไฟล์
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
