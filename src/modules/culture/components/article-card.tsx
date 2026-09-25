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
      className="card-base group"
    >
      <div className="card-image" style={{ aspectRatio: "16/9" }}>
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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

      <div className="card-content gap-2">
        <span className="badge">
          {getArticleCategoryLabel(article.category)}
        </span>
        <h3 className="card-title group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="card-desc">
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}