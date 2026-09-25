import { ArticleCard } from "./article-card";
import type { Article } from "../types";

interface ArticleGridProps {
  articles: Article[];
  savedIds?: Set<string>;
}

export function ArticleGrid({ articles, savedIds }: ArticleGridProps) {
  return (
    <div className="grid-cards-3">
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