import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { Button } from "@/components/ui/button";
import { adminStats, refreshFeed } from "@/lib/server/feed";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  loader: () => adminStats(),
  component: AdminPage,
});

function AdminPage() {
  const stats = Route.useLoaderData();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <FeedScaffold lastUpdated={stats.lastUpdated}>
      <PageHeader
        kicker="Ingest"
        title="Data monitoring"
        body="Feeds are pulled from official RSS and APIs. Failures are isolated per source. This page is unauthenticated because the corpus is shared."
      />
      <div className="mb-6 flex flex-wrap gap-6 font-mono text-sm tabular-nums">
        <span>ok {stats.sourcesOk}</span>
        <span>failed {stats.sourcesFailed}</span>
        <span>inserted {stats.itemsInserted}</span>
        <span>dupes {stats.duplicatesRemoved}</span>
      </div>
      <Button
        onClick={() => {
          setBusy(true);
          void refreshFeed()
            .then(() => router.invalidate())
            .finally(() => setBusy(false));
        }}
        disabled={busy}
      >
        {busy ? "Collecting…" : "Run collection now"}
      </Button>
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-subtle">
            <tr>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Last fetch</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {stats.sourceStatuses.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2">{s.name}</td>
                <td className={s.ok ? "px-3 py-2 text-ok" : "px-3 py-2 text-danger"}>{s.ok ? "ok" : "fail"}</td>
                <td className="px-3 py-2 tabular-nums">{s.count}</td>
                <td className="px-3 py-2 tabular-nums text-muted">{formatDate(s.lastFetch)}</td>
                <td className="px-3 py-2 text-xs text-danger">{s.error ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeedScaffold>
  );
}
