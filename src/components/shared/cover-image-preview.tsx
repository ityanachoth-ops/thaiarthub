"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Parse a stored "X% Y%" string into { x, y } numbers (0–100). */
function parsePosition(pos: string): { x: number; y: number } {
  const [xStr, yStr] = pos.trim().split(/\s+/);
  const x = parseFloat(xStr ?? "50");
  const y = parseFloat(yStr ?? "50");
  return {
    x: Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : 50,
    y: Number.isFinite(y) ? Math.max(0, Math.min(100, y)) : 50,
  };
}

/** Serialise { x, y } back to a CSS / DB string. */
function formatPosition(pos: { x: number; y: number }): string {
  return `${Math.round(pos.x)}% ${Math.round(pos.y)}%`;
}

interface CoverImagePreviewProps {
  src: string;
  alt?: string;
  /** Tailwind classes for the container. Default: "h-full w-full" */
  className?: string;
  /**
   * Initial object-position value loaded from the database.
   * Format: "50% 50%". Defaults to center when omitted or null.
   */
  initialPosition?: string | null;
  /**
   * Called whenever the user stops dragging (mouseup / touchend).
   * Receives the serialised CSS string, e.g. "30% 70%".
   */
  onPositionChange?: (position: string) => void;
}

/**
 * Cover image preview with drag-to-pan support.
 *
 * - The image fills the container via object-cover (frame/aspect ratio unchanged).
 * - Dragging adjusts object-position so the user can choose the focal area.
 * - No crop is applied — the full original image is always stored unchanged.
 * - `initialPosition` loads a persisted position from the database.
 * - `onPositionChange` bubbles the new position string back to the parent form.
 */
export function CoverImagePreview({
  src,
  alt = "Cover preview",
  className = "h-full w-full",
  initialPosition,
  onPositionChange,
}: CoverImagePreviewProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() =>
    parsePosition(initialPosition ?? "50% 50%"),
  );

  // Reset position when the initialPosition prop changes (e.g. user picks a new image)
  useEffect(() => {
    setPos(parsePosition(initialPosition ?? "50% 50%"));
  }, [initialPosition]);

  const dragOrigin = useRef<{
    mouseX: number;
    mouseY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      isDragging.current = false;
      dragOrigin.current = {
        mouseX: clientX,
        mouseY: clientY,
        posX: pos.x,
        posY: pos.y,
      };
    },
    [pos],
  );

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragOrigin.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = clientX - dragOrigin.current.mouseX;
    const dy = clientY - dragOrigin.current.mouseY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;
    // Inverted: dragging right shifts the focal point left (natural panning feel)
    const newX = Math.max(
      0,
      Math.min(100, dragOrigin.current.posX - (dx / rect.width) * 100),
    );
    const newY = Math.max(
      0,
      Math.min(100, dragOrigin.current.posY - (dy / rect.height) * 100),
    );
    setPos({ x: newX, y: newY });
  }, []);

  const endDrag = useCallback(
    (finalX: number, finalY: number) => {
      if (!dragOrigin.current) return;
      dragOrigin.current = null;
      if (isDragging.current && onPositionChange) {
        // Compute the final position from wherever the pointer ended
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const dx = finalX - (containerRef.current ? 0 : 0); // pos already updated via moveDrag
          void dx; // pos is already correct via moveDrag; just serialise current pos
        }
        onPositionChange(formatPosition(pos));
      }
      isDragging.current = false;
    },
    [onPositionChange, pos],
  );

  return (
    <div
      ref={containerRef}
      className={`${className} relative overflow-hidden select-none`}
      onMouseDown={(e) => {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (dragOrigin.current) moveDrag(e.clientX, e.clientY);
      }}
      onMouseUp={(e) => endDrag(e.clientX, e.clientY)}
      onMouseLeave={(e) => endDrag(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        moveDrag(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        endDrag(t.clientX, t.clientY);
      }}
      title="ลากเพื่อปรับตำแหน่งภาพ"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover"
        style={{
          objectPosition: formatPosition(pos),
          cursor: dragOrigin.current ? "grabbing" : "grab",
        }}
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80">
        ลากเพื่อปรับตำแหน่ง
      </span>
    </div>
  );
}
