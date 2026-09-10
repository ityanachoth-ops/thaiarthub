import { RoutePlaceholder } from "@/components/shared/route-placeholder";
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <RoutePlaceholder title={`หมวดหมู่: ${slug}`} description="โครงหน้าสำหรับสำรวจตามสาขาสร้างสรรค์" />; }
