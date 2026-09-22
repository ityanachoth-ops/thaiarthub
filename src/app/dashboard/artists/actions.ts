"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .pipe(z.url().nullable());
  
const createAdminArtistSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อศิลปิน"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{2,159}$/, "รหัส URL ไม่ถูกต้อง"),
  bio: z.string().trim().optional(),
  location: z.string().trim().optional(),
  websiteUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  contactUrl: optionalUrl,
  avatarUrl: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  status: z.enum(["draft", "published"]).default("published"),
  ownership: z.enum(["claim", "creator"]),
  creatorProfileId: z.string().uuid().optional(),
});

export type CreateAdminArtistInput = z.infer<typeof createAdminArtistSchema>;

export async function createAdminArtistAction(input: CreateAdminArtistInput) {
  const parsed = createAdminArtistSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลศิลปินไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile || profile.role !== "admin") {
    throw new Error("คุณไม่มีสิทธิ์สร้างโปรไฟล์ศิลปิน");
  }

  const values = parsed.data;
  let ownerProfileId = profile.id;

  if (values.ownership === "creator") {
    if (!values.creatorProfileId) {
      throw new Error("กรุณาเลือก Creator ที่จะเป็นเจ้าของโปรไฟล์");
    }

    const { data: creator, error: creatorError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", values.creatorProfileId)
      .maybeSingle();

    if (creatorError) throw new Error(`ไม่สามารถตรวจสอบ Creator ได้: ${creatorError.message}`);
    if (!creator || creator.role !== "creator") {
      throw new Error("เจ้าของต้องเป็นโปรไฟล์ที่มี role = creator เท่านั้น");
    }

    const { data: existingArtist, error: existingError } = await supabase
      .from("artists")
      .select("id")
      .eq("profile_id", creator.id)
      .limit(1)
      .maybeSingle();

    if (existingError) throw new Error(`ไม่สามารถตรวจสอบโปรไฟล์ศิลปินเดิมได้: ${existingError.message}`);
    if (existingArtist) {
      throw new Error("Creator คนนี้มีโปรไฟล์ศิลปินอยู่แล้ว");
    }

    ownerProfileId = creator.id;
  }

  const { data, error } = await supabase
    .from("artists")
    .insert({
      id: values.id,
      profile_id: ownerProfileId,
      name: values.name,
      slug: values.slug,
      bio: values.bio || null,
      location: values.location || null,
      website_url: values.websiteUrl ?? null,
      instagram_url: values.instagramUrl ?? null,
      facebook_url: values.facebookUrl ?? null,
      tiktok_url: values.tiktokUrl ?? null,
      contact_url: values.contactUrl ?? null,
      avatar_url: values.avatarUrl || null,
      cover_image_url: values.coverImageUrl || null,
      status: values.status,
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(`สร้างโปรไฟล์ศิลปินไม่สำเร็จ: ${error.message}`);

  revalidatePath("/dashboard/artists");
  revalidatePath("/artists", "layout");
  return data;
}

const updateAdminArtistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อศิลปิน"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{2,159}$/, "รหัส URL ไม่ถูกต้อง"),
  bio: z.string().trim().optional(),
  location: z.string().trim().optional(),
  websiteUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  contactUrl: optionalUrl,
  avatarUrl: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  coverPosition: z.string().default("50% 50%"),
  status: z.enum(["draft", "published"]).default("published"),
  categoryIds: z.array(z.string().uuid()).default([]),
});

export type UpdateAdminArtistInput = z.infer<typeof updateAdminArtistSchema>;

export async function updateAdminArtistAction(input: UpdateAdminArtistInput) {
  const parsed = updateAdminArtistSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลศิลปินไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile || profile.role !== "admin") {
    throw new Error("คุณไม่มีสิทธิ์แก้ไขโปรไฟล์ศิลปิน");
  }

  const values = parsed.data;

  // Verify artist exists
  const { data: existing, error: fetchError } = await supabase
    .from("artists")
    .select("id, slug")
    .eq("id", values.id)
    .maybeSingle();

  if (fetchError) throw new Error(`ไม่สามารถตรวจสอบโปรไฟล์ศิลปินได้: ${fetchError.message}`);
  if (!existing) throw new Error("ไม่พบโปรไฟล์ศิลปิน");

  // Update artist row
  const { error: updateError } = await supabase
    .from("artists")
    .update({
      name: values.name,
      slug: values.slug,
      bio: values.bio || null,
      location: values.location || null,
      website_url: values.websiteUrl ?? null,
      instagram_url: values.instagramUrl ?? null,
      facebook_url: values.facebookUrl ?? null,
      tiktok_url: values.tiktokUrl ?? null,
      contact_url: values.contactUrl ?? null,
      avatar_url: values.avatarUrl || null,
      cover_image_url: values.coverImageUrl || null,
      cover_position: values.coverPosition,
      status: values.status,
    })
    .eq("id", values.id);

  if (updateError) throw new Error(`บันทึกข้อมูลศิลปินไม่สำเร็จ: ${updateError.message}`);

  // Replace artist_categories
  const { error: deleteError } = await supabase
    .from("artist_categories")
    .delete()
    .eq("artist_id", values.id);

  if (deleteError) throw new Error(`อัปเดตหมวดหมู่ไม่สำเร็จ: ${deleteError.message}`);

  if (values.categoryIds.length > 0) {
    const { error: insertError } = await supabase
      .from("artist_categories")
      .insert(values.categoryIds.map((categoryId) => ({ artist_id: values.id, category_id: categoryId })));

    if (insertError) throw new Error(`บันทึกหมวดหมู่ไม่สำเร็จ: ${insertError.message}`);
  }

  revalidatePath("/dashboard/artists");
  revalidatePath(`/artists/${values.slug}`, "page");
  if (existing.slug !== values.slug) {
    revalidatePath(`/artists/${existing.slug}`, "page");
  }
}
