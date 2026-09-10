import { z } from "zod";
import { creativeDisciplineSchema } from "./artist";
export const artworkSchema = z.object({ title: z.string().min(1).max(160), slug: z.string().min(3).max(160).regex(/^[a-z0-9-]+$/), description: z.string().max(3000).nullable().optional(), discipline: creativeDisciplineSchema });
export type ArtworkInput = z.infer<typeof artworkSchema>;
