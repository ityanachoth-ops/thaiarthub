"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  User,
  Palette,
  Calendar,
  Sparkles,
  FileText,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import type { SavedItemSummary } from "@/modules/bookmarks/queries";
import type { SavedItemType, ProfileRole } from "@/types/database.types";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

interface SavedItemsViewProps {
  items: SavedItemSummary[];
  userRole: ProfileRole;
}

const TYPE_LABELS: Record<SavedItemType, string> = {
  artist: "ศิลปิน",
  work: "ผลงานศิลปะ",
  event: "กิจกรรม",
  place: "พื้นที่สร้างสรรค์",
  article: "เรื่องราว",
};

export function SavedItemsView({ items, userRole }: SavedItemsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | SavedItemType>("all");

  const filteredItems =
    activeTab === "all" ? items : items.filter((item) => item.itemType === activeTab);

  const getIcon = (type: SavedItemType) => {
    switch (type) {
      case "artist":
        return <User className="h-4 w-4" />;
      case "work":
        return <Palette className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "place":
        return <Sparkles className="h-4 w-4" />;
      case "article":
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Bookmark className="h-3.5 w-3.5 fill-primary" />
              <span>รายการส่วนตัว</span>
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            รายการที่บันทึกไว้
          </h1>
          <p className="text-sm text-muted-foreground">
            จัดการและเข้าถึงศิลปิน ผลงาน กิจกรรม พื้นที่สร้างสรรค์ และเรื่องราวที่คุณบันทึกเก็บไว้
          </p>
        </div>

        {userRole === "creator" || userRole === "admin" ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground shadow-2xs transition hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>กลับไปแดชบอร์ดครีเอเตอร์</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground shadow-2xs transition hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          ทั้งหมด ({items.length})
        </button>
        {(["artist", "work", "event", "place", "article"] as SavedItemType[]).map((type) => {
          const count = items.filter((i) => i.itemType === type).length;
          if (count === 0 && activeTab !== type) return null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === type
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {getIcon(type)}
              <span>
                {TYPE_LABELS[type]} ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Saved Items */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/60">
            <Bookmark className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold text-foreground">
            ยังไม่มีรายการที่บันทึกไว้
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            คุณสามารถกดปุ่มบุ๊กมาร์กบนการ์ดศิลปิน ผลงาน กิจกรรม และเรื่องราว เพื่อบันทึกเก็บไว้ดูในภายหลังได้
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition hover:border-primary/40 hover:shadow-xs"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    {getIcon(item.itemType)}
                  </div>
                )}
                <div className="absolute right-3 top-3 z-10">
                  <SaveButton
                    itemType={item.itemType}
                    itemId={item.itemId}
                    initialSaved={true}
                  />
                </div>
                <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-xs shadow-2xs">
                  {getIcon(item.itemType)}
                  <span>{TYPE_LABELS[item.itemType]}</span>
                </span>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  {item.subtitle ? (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                  >
                    <span>ดูรายละเอียด</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <span className="text-[11px] text-muted-foreground">
                    บันทึกเมื่อ {new Date(item.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
