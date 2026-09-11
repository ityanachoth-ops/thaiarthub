"use client";

import { useEffect } from "react";

type EventsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EventsError({ error, reset }: EventsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">ไม่สามารถโหลดกิจกรรมได้</h1>
        <p className="text-sm text-muted-foreground">
          เกิดข้อผิดพลาดระหว่างโหลดรายการกิจกรรม กรุณาลองใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </main>
  );
}