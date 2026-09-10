import { RoutePlaceholder } from "@/components/shared/route-placeholder";
export default async function ArtistProfilePage({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; return <RoutePlaceholder title={`ศิลปิน: ${username}`} description="โครงหน้าโปรไฟล์ศิลปิน" />; }
