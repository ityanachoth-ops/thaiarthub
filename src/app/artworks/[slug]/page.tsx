import { RoutePlaceholder } from "@/components/shared/route-placeholder";
export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <RoutePlaceholder title={`ผลงาน: ${slug}`} description="โครงหน้ารายละเอียดผลงาน" />; }
