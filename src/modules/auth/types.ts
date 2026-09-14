import { z } from "zod";

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{2,39}$/;

export const loginSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
  displayName: z.string().trim().min(1, "กรุณากรอกชื่อที่แสดง").max(100, "ชื่อยาวเกินไป"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      USERNAME_REGEX,
      "ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข หรือขีด (-) ความยาว 3-40 ตัวอักษร"
    ),
});

export type SignUpFormValues = z.infer<typeof signupSchema>;

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, "กรุณากรอกชื่อที่แสดง").max(100, "ชื่อยาวเกินไป"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      USERNAME_REGEX,
      "ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข หรือขีด (-) ความยาว 3-40 ตัวอักษร"
    ),
  bio: z.string().trim().max(1500, "ประวัติโดยย่อยาวเกิน 1,500 ตัวอักษร").optional(),
  location: z.string().trim().max(100, "ชื่อสถานที่ยาวเกินไป").optional(),
  avatarUrl: z.string().trim().url("รูปแบบ URL ไม่ถูกต้อง").or(z.literal("")).optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export const THAI_PROVINCES = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี",
] as const;
