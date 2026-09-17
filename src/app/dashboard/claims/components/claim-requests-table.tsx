"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { approveClaimAction, rejectClaimAction } from "@/actions/claims";
import type { ClaimRequestWithNames } from "@/modules/claims/types";

interface ClaimRequestsTableProps {
  claims: ClaimRequestWithNames[];
}

export function ClaimRequestsTable({ claims }: ClaimRequestsTableProps) {
  const [actioning, setActioning] = useState<string | null>(null);

  const handleApprove = async (claimId: string) => {
    setActioning(claimId);
    try {
      await approveClaimAction(claimId);
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (claimId: string) => {
    setActioning(claimId);
    try {
      await rejectClaimAction(claimId);
    } finally {
      setActioning(null);
    }
  };

  if (claims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-lg font-semibold font-display text-foreground">ไม่มีคำขอ Claim</p>
        <p className="text-sm text-muted-foreground">ยังไม่มีคำขอ Claim โปรไฟล์ศิลปินในขณะนี้</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">ศิลปิน</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">ผู้ยื่นคำขอ</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">ยืนยัน</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">ข้อความ</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">วันที่</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground">สถานะ</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                <td className="px-5 py-4 text-sm font-medium text-foreground">
                  {claim.artistName ?? "N/A"}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {claim.requesterName ?? "N/A"}
                  {claim.requesterUsername ? ` @${claim.requesterUsername}` : ""}
                </td>
                <td className="px-5 py-4 text-sm">
                  {claim.verificationUrl ? (
                    <a
                      href={claim.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[150px] inline-block"
                    >
                      {claim.verificationUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                  {claim.message ?? "-"}
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(claim.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  {claim.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(claim.id)}
                        disabled={actioning === claim.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-red-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actioning === claim.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        ปฏิเสธ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(claim.id)}
                        disabled={actioning === claim.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {actioning === claim.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        อนุมัติ
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">ดำเนินการแล้ว</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          <Clock className="h-3 w-3" />
          รอตรวจสอบ
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          อนุมัติแล้ว
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
          <XCircle className="h-3 w-3" />
          ถูกปฏิเสธ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          ไม่ทราบ
        </span>
      );
  }
}
