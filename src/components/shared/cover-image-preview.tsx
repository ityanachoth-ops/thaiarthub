"use client";

import { useCallback, useRef, useState } from "react";

interface CoverImagePreviewProps {
  src: string;
  alt?: string;
  /** Tailwind class for the container height/aspect. Default: "h-full w-full" */
  className?: string;
}

/**
 * Cover image preview with drag-to-pan support.
 *
 * The image fills the container via object-cover but the user can drag
 * to adjust which part of the image is visible inside the frame.
 * No crop is applied — only the CSS object-position changes.
 * The full original image is always stored and served unchanged.
 */
export function CoverImagePreview({
  src,
  alt = "Cover preview",
  className = "h-full w-full",
}: CoverImagePreviewProps) {
  // object-position as percentages (0–100)
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dragOrigin = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragOrigin.current = { mouseX: clientX, mouseY: clientY, posX: pos.x, posY: pos.y };
  }, [pos]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragOrigin.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = clientX - dragOrigin.current.mouseX;
    const dy = clientY - dragOrigin.current.mouseY;
    // Invert direction: dragging right moves the visible area left (feels natural)
    const newX = Math.max(0, Math.min(100, dragOrigin.current.posX - (dx / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, dragOrigin.current.posY - (dy / rect.height) * 100));
    setPos({ x: newX, y: newY });
  }, []);

  const endDrag = useCallback(() => {
    dragOrigin.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${className} relative overflow-hidden select-none`}
      onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
      onMouseMove={(e) => { if (dragOrigin.current) moveDrag(e.clientX, e.clientY); }}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
      onTouchEnd={endDrag}
      title="ลากเพื่อปรับตำแหน่งภาพ"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full object-cover"
        style={{ objectPosition: `${pos.x}% ${pos.y}%`, cursor: dragOrigin.current ? "grabbing" : "grab" }}
      />
      {/* Pan hint — shown only when image is loaded */}
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80">
        ลากเพื่อปรับตำแหน่ง
      </span>
    </div>
  );
}
