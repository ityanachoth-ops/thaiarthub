import { z } from "zod";
import { creativeDisciplineSchema } from "./artist";

export const artworkSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่อผลงาน").max(160, "ชื่อผลงานยาวเกินไป"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{2,159}$/, "URL ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข หรือขีด (-)"),
  description: z.string().trim().max(3000, "รายละเอียดผลงานยาวเกิน 3,000 ตัวอักษร").optional(),
  type: creativeDisciplineSchema,
  year: z.number().int().min(1000).max(9999).nullable().optional(),
  externalUrl: z.union([z.string().trim().url("รูปแบบลิงก์ไม่ถูกต้อง"), z.literal("")]).optional(),
  cover_position: z.string().default("50% 50%"),
  status: z.enum(["draft", "published"]),
});
export type ArtworkInput = z.infer<typeof artworkSchema>;
