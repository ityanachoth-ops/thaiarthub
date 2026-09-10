import { z } from "zod";
export const creativeDisciplineSchema = z.enum(["visual-art", "illustration", "photography", "design", "music", "performance", "craft"]);
export const artistProfileSchema = z.object({ username: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/), displayName: z.string().min(1).max(120), bio: z.string().max(1500).nullable().optional(), disciplines: z.array(creativeDisciplineSchema).min(1), contactUrl: z.url().nullable().optional() });
export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;
