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

const deleteAdminArtistSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteAdminArtistInput = z.infer<typeof deleteAdminArtistSchema>;

export async function deleteAdminArtistAction(input: DeleteAdminArtistInput) {
  const parsed = deleteAdminArtistSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  }

  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user || !profile || profile.role !== "admin") {
    throw new Error("คุณไม่มีสิทธิ์ลบโปรไฟล์ศิลปิน");
  }

  const artistId = parsed.data.id;

  // Fetch artist data including cover/avatar paths before deletion
  const { data: artist, error: fetchError } = await supabase
    .from("artists")
    .select("id, slug, cover_image_url, avatar_url, profile_id")
    .eq("id", artistId)
    .maybeSingle();

  if (fetchError) throw new Error(`ไม่สามารถโหลดข้อมูลศิลปินได้: ${fetchError.message}`);
  if (!artist) throw new Error("ไม่พบโปรไฟล์ศิลปิน");

  // Fetch works and their gallery image paths for storage cleanup
  const { data: works } = await supabase
    .from("works")
    .select("id, image_url")
    .eq("artist_id", artistId);

  const { data: galleryImages } = await supabase
    .from("work_images")
    .select("image_path")
    .in("work_id", works?.map((w) => w.id) ?? []);

  // Delete artist (cascades to works, work_images, artist_categories, claim_requests)
  const { error: deleteError } = await supabase.from("artists").delete().eq("id", artistId);

  if (deleteError) throw new Error(`ลบโปรไฟล์ศิลปินไม่สำเร็จ: ${deleteError.message}`);

  // Clean up storage files
  const coverPath = artist.cover_image_url;
  const avatarPath = artist.avatar_url;
  const workCoverPaths = (works ?? []).map((w) => w.image_url).filter(Boolean);
  const galleryPaths = (galleryImages ?? []).map((g) => g.image_path).filter(Boolean);

  const allPaths = [coverPath, avatarPath, ...workCoverPaths, ...galleryPaths].filter(
    (p): p is string => Boolean(p) && !/^https?:\/\//i.test(p)
  );

  if (allPaths.length > 0) {
    // Use the artist owner's profile_id for artist-covers/avatars, and work owner's profile_id for works
    // Since we're admin with INSERT policy bypass, we can delete from any path
    await supabase.storage.from("artist-covers").remove([coverPath].filter(Boolean));
    await supabase.storage.from("avatars").remove([avatarPath].filter(Boolean));
    if (workCoverPaths.length > 0) {
      await supabase.storage.from("works").remove(workCoverPaths);
    }
    if (galleryPaths.length > 0) {
      await supabase.storage.from("works").remove(galleryPaths);
    }
  }

  revalidatePath("/dashboard/artists");
  revalidatePath("/artists", "layout");
}
