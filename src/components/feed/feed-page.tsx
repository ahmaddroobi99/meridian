import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ArticleCard } from "./article-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ItemRecord } from "@/lib/intelligence/types";
import { refreshFeed } from "@/lib/server/feed";
import { usePersonal } from "@/lib/store/personal";

export function PageHeader({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body?: string;
}) {
  return (
    <header className="mb-8 max-w-3xl">
      {kicker && (
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent">{kicker}</p>
      )}
      <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{title}</h1>
      {body && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{body}</p>}
    </header>
  );
}

export function ItemGrid({ items, empty }: { items: ItemRecord[]; empty: string }) {
  const waste = usePersonal((s) => s.wasteMyTime);
  const filtered = waste ? items.filter((i) => i.importanceScore >= 48 && i.sourceCredibility >= 60) : items;
  if (!filtered.length) {
    return <p className="text-sm text-muted">{empty}</p>;
  }
  return (
    <div className="grid gap-3">
      {filtered.map((item) => (
        <ArticleCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function FeedScaffold({
  lastUpdated,
  children,
}: {
  lastUpdated?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <AppShell
      lastUpdated={lastUpdated}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void refreshFeed()
          .then(() => router.invalidate())
          .finally(() => setRefreshing(false));
      }}
    >
      {children}
    </AppShell>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}
