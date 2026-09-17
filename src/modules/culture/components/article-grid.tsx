import { ArticleCard } from "./article-card";
import type { Article } from "../types";

interface ArticleGridProps {
  articles: Article[];
  savedIds?: Set<string>;
}

export function ArticleGrid({ articles, savedIds }: ArticleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          isSaved={savedIds?.has(article.id)}
        />
      ))}
    </div>
  );
}