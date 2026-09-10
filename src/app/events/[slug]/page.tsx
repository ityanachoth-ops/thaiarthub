import { RoutePlaceholder } from "@/components/shared/route-placeholder";
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <RoutePlaceholder title={`กิจกรรม: ${slug}`} description="โครงหน้ารายละเอียดกิจกรรม" />; }
