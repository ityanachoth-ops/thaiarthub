export type CreativeDiscipline = "visual-art" | "illustration" | "photography" | "design" | "music" | "performance" | "craft";
export interface ArtistProfile { id: string; username: string; displayName: string; bio: string | null; disciplines: CreativeDiscipline[]; avatarUrl: string | null; contactUrl: string | null; isPublished: boolean; }
export interface Artwork { id: string; artistId: string; slug: string; title: string; description: string | null; imageUrl: string | null; discipline: CreativeDiscipline; isPublished: boolean; }
export interface CreativeEvent { id: string; slug: string; title: string; description: string | null; startsAt: string; endsAt: string | null; venueName: string | null; isPublished: boolean; }
