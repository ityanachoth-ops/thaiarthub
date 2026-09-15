import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { GalleryManager } from "@/modules/culture/components/gallery-manager";
import { AccessDenied } from "@/modules/dashboard/components/access-denied";
import { getAuthenticatedProfile } from "@/modules/dashboard/queries";
import { EventForm } from "@/modules/events/components/event-form";
import { getAdminEventById } from "@/modules/events/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "แก้ไขกิจกรรม | ThaiArtHub" };

export default async function EditDashboardEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, profile } = await getAuthenticatedProfile(supabase);
  if (!user) redirect(`/login?redirect=/dashboard/events/${id}/edit`);
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") return <AccessDenied profile={profile} />;
  const event = await getAdminEventById(id);
  if (!event) notFound();
  return <div className="flex flex-col gap-6"><EventForm event={event} /><div className="mx-auto w-full max-w-3xl"><GalleryManager kind="event" parentId={event.id} ownerId={user.id} images={event.gallery} /></div></div>;
}