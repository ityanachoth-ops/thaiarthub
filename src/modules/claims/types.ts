export type ClaimStatus = "pending" | "approved" | "rejected";

export interface ClaimRequest {
  id: string;
  artistId: string;
  requesterProfileId: string;
  verificationUrl: string | null;
  message: string | null;
  status: ClaimStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  artistName?: string;
  artistSlug?: string;
  requesterName?: string;
  requesterUsername?: string;
}

export type ClaimRequestWithNames = ClaimRequest & {
  artistName: string;
  artistSlug: string;
  requesterName: string;
  requesterUsername: string;
};

export interface ClaimRequestCreate {
  artistId: string;
  verificationUrl: string;
  message: string;
}
