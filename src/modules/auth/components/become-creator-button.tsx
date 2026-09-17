"use client";

import { useState } from "react";
import { becomeCreatorAction } from "@/actions/creator";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";

interface BecomeCreatorButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function BecomeCreatorButton({
  className,
  children,
}: BecomeCreatorButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBecomeCreator = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await becomeCreatorAction();
    } catch (err) {
      // Next.js server side redirect throws NEXT_REDIRECT exception internally
      if (err instanceof Error && (err.message.includes("NEXT_REDIRECT") || err.message === "NEXT_REDIRECT")) {
        throw err;
      }
      setErrorMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleBecomeCreator}
        disabled={isLoading}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90 disabled:opacity-50"
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>กำลังนำคุณไปสร้างโปรไฟล์...</span>
          </>
        ) : (
          children || (
            <>
              <Sparkles className="h-4 w-4" />
              <span>สร้างโปรไฟล์ Creator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )
        )}
      </button>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
