"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { SavedItemType } from "@/types/database.types";
import { toggleSaveItemAction } from "../actions";

interface SaveButtonProps {
  itemType: SavedItemType;
  itemId: string;
  initialSaved?: boolean;
  className?: string;
}

export function SaveButton({
  itemType,
  itemId,
  initialSaved = false,
  className = "",
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    // Optimistic UI update
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);
    setIsSubmitting(true);

    try {
      const res = await toggleSaveItemAction(itemType, itemId);

      if (!res.success) {
        // Revert optimistic state
        setIsSaved(previousSaved);

        if (res.error === "unauthenticated") {
          showToast(res.message ? `UNAUTH: ${res.message}` : "เข้าสู่ระบบเพื่อบันทึกรายการนี้");
        } else {
          showToast(res.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } else {
        setIsSaved(res.saved);
      }
    } catch (err: unknown) {
      setIsSaved(previousSaved);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ACTION EXCEPTION: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 15000);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        aria-label={isSaved ? "ยกเลิกการบันทึก" : "บันทึก"}
        title={isSaved ? "ยกเลิกการบันทึก" : "บันทึกรายการนี้"}
        className={`group flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background/90 backdrop-blur-sm shadow-2xs transition hover:scale-105 hover:bg-background active:scale-95 disabled:opacity-50 ${className}`}
      >
        <Bookmark
          className={`h-4 w-4 transition-colors ${
            isSaved
              ? "fill-primary text-primary"
              : "text-muted-foreground group-hover:text-primary"
          }`}
        />
      </button>

      {/* Detailed Toast Notification */}
      {toastMessage ? (
        <div className="absolute right-0 top-11 z-50 min-w-[280px] max-w-sm rounded-xl border border-destructive/50 bg-background/95 p-3 text-xs font-mono text-destructive shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-1 break-words">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
