import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { Button } from "@/components/ui/button";
import { compareFn, fetchItems } from "@/lib/server/feed";

export const Route = createFileRoute("/compare")({
  loader: () => fetchItems({ data: { range: "month", limit: 80 } }),
  component: ComparePage,
});

function ComparePage() {
  const items = Route.useLoaderData();
  const [a, setA] = useState(items[0]?.id ?? "");
  const [b, setB] = useState(items[1]?.id ?? "");
  const [out, setOut] = useState<Awaited<ReturnType<typeof compareFn>> | null>(null);
  const [busy, setBusy] = useState(false);
  const options = useMemo(
    () => items.map((i) => ({ id: i.id, label: `${i.kind}: ${i.title.slice(0, 80)}` })),
    [items],
  );

  return (
    <FeedScaffold>
      <PageHeader
        kicker="Side by side"
        title="Compare"
        body="Architecture, disclosed specs, hardware, and artifacts. Missing numbers stay Unknown / not verified."
      />
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <select className="h-10 rounded-md border border-border bg-surface px-2 text-sm" value={a} onChange={(e) => setA(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select className="h-10 rounded-md border border-border bg-surface px-2 text-sm" value={b} onChange={(e) => setB(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        disabled={!a || !b || a === b || busy}
        onClick={() => {
          setBusy(true);
          void compareFn({ data: { a, b } })
            .then(setOut)
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Comparing…" : "Compare"}
      </Button>
      {out && out.ok && (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-subtle">
              <tr>
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">A</th>
                <th className="px-3 py-2">B</th>
              </tr>
            </thead>
            <tbody>
              {out.table.rows.map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-3 py-2 text-muted">{row[0]}</td>
                  <td className="px-3 py-2">{row[1]}</td>
                  <td className="px-3 py-2">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {out.narrative && (
            <div className="whitespace-pre-wrap border-t border-border p-4 text-sm leading-relaxed">{out.narrative}</div>
          )}
        </div>
      )}
    </FeedScaffold>
  );
}
