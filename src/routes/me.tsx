import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FeedScaffold, ItemGrid, PageHeader } from "@/components/feed/feed-page";
import { fetchItems } from "@/lib/server/feed";
import { usePersonal } from "@/lib/store/personal";
import type { ItemRecord } from "@/lib/intelligence/types";

export const Route = createFileRoute("/me")({
  loader: () => fetchItems({ data: { range: "month", limit: 80 } }),
  component: MePage,
});

function MePage() {
  const all = Route.useLoaderData();
  const bookmarks = usePersonal((s) => s.bookmarks);
  const topics = usePersonal((s) => s.topics);
  const orgs = usePersonal((s) => s.orgs);
  const lists = usePersonal((s) => s.lists);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const saved = all.filter((i) => bookmarks.includes(i.id));
  const feed = all.filter(
    (i) => i.categories.some((c) => topics.includes(c)) || (i.orgId && orgs.includes(i.orgId)),
  );

  return (
    <FeedScaffold>
      <PageHeader
        kicker="Local"
        title="My AI"
        body="Bookmarks, follows, and reading lists stay on this device. The shared corpus is not personal."
      />
      {!ready ? (
        <p className="text-sm text-muted">Loading local state…</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="mb-3 text-lg">My feed</h2>
            <ItemGrid items={feed.slice(0, 20)} empty="Follow topics on the Learning page to fill this feed." />
          </section>
          <section className="mb-10">
            <h2 className="mb-3 text-lg">Saved</h2>
            <SavedList items={saved} />
          </section>
          <section>
            <h2 className="mb-3 text-lg">Lists</h2>
            {lists.map((l) => (
              <p key={l.id} className="text-sm text-muted">
                {l.name} · {l.itemIds.length} items
              </p>
            ))}
          </section>
        </>
      )}
    </FeedScaffold>
  );
}

function SavedList({ items }: { items: ItemRecord[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted">
        Nothing saved yet. Bookmark from any briefing.{" "}
        <Link to="/" className="text-accent">
          Back to home
        </Link>
      </p>
    );
  }
  return <ItemGrid items={items} empty="" />;
}
