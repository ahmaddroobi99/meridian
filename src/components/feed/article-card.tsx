import { Link } from "@tanstack/react-router";
import { Bookmark, Check } from "lucide-react";
import { ItemMeta, Score } from "./meta";
import { CategoryChips } from "./meta";
import type { ItemRecord } from "@/lib/intelligence/types";
import { usePersonal } from "@/lib/store/personal";
import { cn } from "@/lib/utils";

export function ArticleCard({
  item,
  dense = false,
  rank,
}: {
  item: ItemRecord;
  dense?: boolean;
  rank?: number;
}) {
  const bookmarks = usePersonal((s) => s.bookmarks);
  const read = usePersonal((s) => s.read);
  const toggle = usePersonal((s) => s.toggleBookmark);
  const saved = bookmarks.includes(item.id);
  const seen = read.includes(item.id);

  return (
    <article
      className={cn(
        "group relative rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] transition-colors duration-150 hover:border-border-strong",
        seen && "opacity-80",
        dense && "p-3",
      )}
    >
      <div className="flex items-start gap-3">
        {rank != null && (
          <span className="mt-0.5 font-mono text-xs tabular-nums text-subtle">{String(rank).padStart(2, "0")}</span>
        )}
        <div className="min-w-0 flex-1">
          <ItemMeta item={item} />
          <h3 className={cn("mt-2 break-words text-pretty font-medium leading-snug tracking-tight", dense ? "text-sm" : "text-base")}>
            <Link to="/item/$id" params={{ id: item.id }} className="hover:text-accent">
              {item.title}
            </Link>
          </h3>
          {!dense && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{item.summary}</p>
          )}
          {!dense && (
            <p className="mt-2 line-clamp-2 text-sm text-paper/90">
              <span className="font-medium text-fg">Why it matters. </span>
              {item.whyItMatters}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <CategoryChips ids={item.categories} />
            <div className="flex flex-wrap gap-4">
              <Score value={item.importanceScore} label="imp" />
              <Score value={item.technicalDepth} label="depth" />
              <Score value={item.researchQuality} label="qual" />
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label={saved ? "Remove bookmark" : "Bookmark"}
          onClick={() => toggle(item.id)}
          className="size-10 shrink-0 rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        >
          {saved ? <Bookmark className="mx-auto size-4 fill-accent text-accent" /> : <Bookmark className="mx-auto size-4" />}
        </button>
      </div>
      {seen && (
        <span className="absolute right-3 top-3 text-ok">
          <Check className="size-3.5" />
        </span>
      )}
    </article>
  );
}

export function BriefRow({ item, index }: { item: ItemRecord; index: number }) {
  return (
    <Link
      to="/item/$id"
      params={{ id: item.id }}
      className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2"
    >
      <span className="mt-0.5 w-6 font-mono text-xs tabular-nums text-accent">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{item.whyItMatters}</p>
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">{Math.round(item.importanceScore)}</span>
    </Link>
  );
}
