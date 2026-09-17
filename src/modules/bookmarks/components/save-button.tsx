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
          showToast("เข้าสู่ระบบเพื่อบันทึกรายการนี้");
        } else {
          showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } else {
        setIsSaved(res.saved);
      }
    } catch {
      setIsSaved(previousSaved);
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

      {/* Guest or Error Toast Notification */}
      {toastMessage ? (
        <div className="absolute right-0 top-11 z-50 whitespace-nowrap rounded-xl border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in slide-in-from-top-1">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
