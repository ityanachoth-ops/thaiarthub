import Link from "next/link";

import { getArticleCategoryLabel, type Article } from "../types";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

interface ArticleCardProps {
  article: Article;
  isSaved?: boolean;
}

export function ArticleCard({ article, isSaved = false }: ArticleCardProps) {
  return (
    <Link
      href={`/culture/${article.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-2xs"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60">
        {article.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            style={{ objectPosition: article.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-display font-medium text-muted-foreground/35">
            {article.title.charAt(0)}
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="article" itemId={article.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs sm:text-sm font-medium text-primary">
          {getArticleCategoryLabel(article.category)}
        </span>
        <h2 className="font-display text-base sm:text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h2>
        {article.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}