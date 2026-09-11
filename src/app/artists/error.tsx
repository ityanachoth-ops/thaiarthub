"use client";

import { useEffect } from "react";

interface ArtistsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ArtistsError({ error, reset }: ArtistsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-stone-700">โหลดข้อมูลศิลปินไม่สำเร็จ</p>
      <p className="max-w-md text-sm text-stone-500">
        เกิดข้อผิดพลาดระหว่างดึงข้อมูล ลองใหม่อีกครั้ง
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:border-orange-400 hover:text-orange-700"
      >
        ลองอีกครั้ง
      </button>
    </div>
  );
}
