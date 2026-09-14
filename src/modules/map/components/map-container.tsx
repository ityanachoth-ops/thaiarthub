"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  MapPin,
  Sparkles,
  X,
  ArrowRight,
  Layers,
} from "lucide-react";
import { MapCanvas } from "./map-canvas";
import type { MapLocationItem, MapItemType } from "../types";

interface MapContainerProps {
  initialLocations: MapLocationItem[];
}

export function MapContainer({ initialLocations }: MapContainerProps) {
  const [selectedType, setSelectedType] = useState<"all" | MapItemType>("all");
  const [selectedLocation, setSelectedLocation] =
    useState<MapLocationItem | null>(null);

  // Filter locations by type
  const filteredLocations = useMemo(() => {
    if (selectedType === "all") return initialLocations;
    return initialLocations.filter((loc) => loc.type === selectedType);
  }, [initialLocations, selectedType]);

  const eventCount = useMemo(
    () => initialLocations.filter((l) => l.type === "event").length,
    [initialLocations]
  );
  const artistCount = useMemo(
    () => initialLocations.filter((l) => l.type === "artist").length,
    [initialLocations]
  );

  const hasNoLocations = initialLocations.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter & Count Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedType("all");
              setSelectedLocation(null);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedType === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            ทั้งหมด ({initialLocations.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("event");
              setSelectedLocation(null);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedType === "event"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            กิจกรรม ({eventCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("artist");
              setSelectedLocation(null);
            }}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedType === "artist"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            ศิลปิน ({artistCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 text-primary/80" />
          <span>
            {filteredLocations.length > 0
              ? `แสดงหมุดพิกัด ${filteredLocations.length} แห่ง`
              : "ยังไม่มีหมุดพิกัด"}
          </span>
        </div>
      </div>

      {/* Main Map & Interactive Preview Layout */}
      {hasNoLocations ? (
        /* Empty State (when no coordinates exist in Supabase) */
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-20 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="font-display text-xl font-semibold text-foreground">
              ยังไม่มีพิกัดกิจกรรมหรือศิลปินที่เผยแพร่ในขณะนี้
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              กิจกรรมและศิลปินที่ระบุพิกัดสถานที่ในระบบจะปรากฏบนแผนที่นี้โดยอัตโนมัติ
              คุณสามารถติดตามกิจกรรมที่น่าสนใจหรือค้นพบผลงานศิลปินได้จากช่องทางหลัก
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
            >
              <span>ดูกิจกรรมทั้งหมด</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <span>ดูศิลปินทั้งหมด</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Spatial Canvas (Col 8/12 on large screens) */}
          <div className="lg:col-span-8">
            <MapCanvas
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
            />
          </div>

          {/* Side Location Inspector / Details Panel (Col 4/12) */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {selectedLocation ? (
              /* Selected Marker Preview Card (Design Language aligned with Phase 2) */
              <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all animate-in fade-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={() => setSelectedLocation(null)}
                  className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="ปิดกล่องข้อมูล"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {selectedLocation.type === "event" ? "กิจกรรม" : "ศิลปิน"}
                  </span>
                  {selectedLocation.province ? (
                    <span className="text-xs text-muted-foreground">
                      {selectedLocation.province}
                    </span>
                  ) : null}
                </div>

                {/* Thumbnail Image */}
                <div className="relative mb-3.5 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted/60">
                  {selectedLocation.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedLocation.coverImageUrl}
                      alt={selectedLocation.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground/50">
                      ไม่มีภาพปก
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-base font-semibold leading-snug text-foreground">
                    {selectedLocation.title}
                  </h3>

                  {selectedLocation.venueName ? (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {selectedLocation.venueName}
                        {selectedLocation.address
                          ? ` · ${selectedLocation.address}`
                          : ""}
                      </span>
                    </p>
                  ) : null}

                  {selectedLocation.startAt ? (
                    <p className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {new Date(selectedLocation.startAt).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </p>
                  ) : null}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex flex-col gap-2 border-t border-border/50 pt-4">
                  <Link
                    href={`/events/${selectedLocation.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
                  >
                    <span>ดูรายละเอียดกิจกรรม</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <span>เปิดใน Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              /* Location List Sidebar / Idle Guide */
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-sm font-semibold text-foreground">
                      สถานที่จัดงานศิลปะ
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    คลิกเลือกหมุดบนแผนที่เพื่อดูข้อมูลสถานที่ นิทรรศการ
                    และรายละเอียดของศิลปิน
                  </p>

                  <div className="mt-3 flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-1">
                    {filteredLocations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLocation(item)}
                        className="flex flex-col items-start rounded-xl border border-border/60 bg-background/60 p-3 text-left transition hover:border-primary/40 hover:bg-muted/40"
                      >
                        <span className="font-display text-xs font-semibold text-foreground line-clamp-1">
                          {item.title}
                        </span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                          {item.venueName || item.province || "ไม่ระบุสถานที่"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border/50 pt-3 text-center text-[11px] text-muted-foreground">
                  หมุดบนแผนที่อ้างอิงตามพิกัดจริงในประเทศไทย
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
