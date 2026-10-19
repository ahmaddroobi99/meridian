import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Bookmark, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { FeedScaffold, PageHeader } from "@/components/feed/feed-page";
import { ArticleCard } from "@/components/feed/article-card";
import { EvidenceBadge, ItemMeta, ReliabilityBadge, Score } from "@/components/feed/meta";
import { StackDiagram } from "@/components/viz/stack-diagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { explainFn, fetchItem } from "@/lib/server/feed";
import { SOURCE_BY_ID } from "@/lib/intelligence/sources";
import { usePersonal } from "@/lib/store/personal";

export const Route = createFileRoute("/item/$id")({
  loader: ({ params }) => fetchItem({ data: { id: params.id } }),
  component: ItemPage,
});

function ItemPage() {
  const { item, related, cluster } = Route.useLoaderData();
  const markRead = usePersonal((s) => s.markRead);
  const toggle = usePersonal((s) => s.toggleBookmark);
  const saved = usePersonal((s) => s.bookmarks.includes(item?.id ?? ""));
  const rate = usePersonal((s) => s.rate);
  const rating = usePersonal((s) => (item ? s.ratings[item.id] : 0));
  const [brief, setBrief] = useState<string | null>(item?.engineerBrief ?? null);
  const [deep, setDeep] = useState<string | null>(item?.deepAnalysis ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (item) markRead(item.id);
  }, [item, markRead]);

  if (!item) {
    return (
      <FeedScaffold>
        <PageHeader title="Not found" body="This briefing is not in the live corpus." />
      </FeedScaffold>
    );
  }

  const run = async (mode: "engineer" | "deep") => {
    setBusy(mode);
    setErr(null);
    const r = await explainFn({ data: { id: item.id, mode } });
    setBusy(null);
    if (!r.ok) setErr(r.error);
    else if (mode === "engineer") setBrief(r.text);
    else setDeep(r.text);
  };

  const source = SOURCE_BY_ID[item.sourceId];

  return (
    <FeedScaffold>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="muted">{item.kind}</Badge>
          <Badge>{item.difficulty}</Badge>
          <EvidenceBadge status={item.evidenceStatus} />
          <ReliabilityBadge sourceId={item.sourceId} />
        </div>
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{item.title}</h1>
        <div className="mt-4">
          <ItemMeta item={item} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild size="sm">
            <a href={item.url} target="_blank" rel="noreferrer">
              Original source <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggle(item.id)}>
            <Bookmark className={saved ? "fill-accent text-accent" : ""} />
            {saved ? "Saved" : "Save"}
          </Button>
          <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void run("engineer")}>
            {busy === "engineer" ? "Writing…" : "Explain like an engineer"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => void run("deep")}>
            {busy === "deep" ? "Writing…" : "Deep analysis"}
          </Button>
        </div>
        {err && <p className="mt-3 text-sm text-danger">{err}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Score value={item.importanceScore} label="importance" />
          <Score value={item.technicalDepth} label="depth" />
          <Score value={item.noveltyScore} label="novelty" />
          <Score value={item.researchQuality} label="research" />
        </div>
        <p className="mt-3 text-xs text-subtle">
          Rank = 25% technical + 20% novelty + 15% credibility + 15% practical + 10% community + 10% recency + 5% trend.
        </p>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-subtle">30-second summary</h2>
          <p className="mt-2 text-base leading-relaxed">{item.summary}</p>
        </section>
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-subtle">Why it matters</h2>
          <p className="mt-2 leading-relaxed text-muted">{item.whyItMatters}</p>
        </section>
        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-subtle">Technical breakdown</h2>
          <p className="mt-2 leading-relaxed text-muted">{item.technicalSummary}</p>
        </section>

        <div className="mt-8">
          <StackDiagram item={item} />
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Block label="Key concepts" values={item.keyConcepts} />
          <Block label="Models" values={item.models} />
          <Block label="Datasets" values={item.datasets} />
          <Block label="Hardware" values={item.hardware} />
          <Block label="Frameworks" values={item.frameworks} />
          <Block label="Code / GitHub" values={item.github} links />
        </dl>

        {item.buildNotes && (
          <section className="mt-8 rounded-xl border border-border bg-surface p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-subtle">What to build</h2>
            <p className="mt-2 text-sm leading-relaxed">{item.buildNotes}</p>
          </section>
        )}

        {brief && (
          <section className="mt-8 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-subtle">Engineer brief</h2>
            {brief}
          </section>
        )}
        {deep && (
          <section className="mt-8 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-subtle">Deep analysis</h2>
            {deep}
          </section>
        )}

        {cluster.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-subtle">Same development</h2>
            <p className="mb-3 text-sm text-muted">Duplicates clustered. Primary source is shown first.</p>
            <ul className="grid gap-2">
              {cluster.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                  <span>{SOURCE_BY_ID[c.sourceId]?.name ?? c.sourceId}</span>
                  <a href={c.url} className="text-accent" target="_blank" rel="noreferrer">
                    {c.kind}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.arxivId && (
          <p className="mt-6 text-sm">
            Paper:{" "}
            <a className="text-accent" href={`https://arxiv.org/abs/${item.arxivId}`} target="_blank" rel="noreferrer">
              arXiv:{item.arxivId}
            </a>
          </p>
        )}

        <div className="mt-8 flex items-center gap-2 text-sm text-muted">
          Usefulness
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => rate(item.id, n)}
              className={`size-8 rounded-md border ${rating === n ? "border-accent text-accent" : "border-border"}`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-subtle">
          Summaries are extracted from public abstracts and feed metadata. They are not a substitute for the original.
          AI briefs are generated on demand and cached. Specs not present in the source are marked unverified.
          {source ? ` Publisher: ${source.name}.` : ""}
        </p>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-3xl">
          <h2 className="mb-4 text-xl">Related</h2>
          <div className="grid gap-3">
            {related.map((r) => (
              <ArticleCard key={r.id} item={r} dense />
            ))}
          </div>
        </section>
      )}
    </FeedScaffold>
  );
}

function Block({ label, values, links }: { label: string; values: string[]; links?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <dt className="font-mono text-xs uppercase tracking-widest text-subtle">{label}</dt>
      <dd className="mt-2 text-sm">
        {values.length === 0
          ? "Unknown / not verified"
          : values.map((v) =>
              links ? (
                <a key={v} href={v} className="mr-2 inline-flex items-center gap-1 text-accent" target="_blank" rel="noreferrer">
                  {v.replace("https://github.com/", "")} <ArrowUpRight className="size-3" />
                </a>
              ) : (
                <span key={v} className="mr-2 inline-block">
                  {v}
                </span>
              ),
            )}
      </dd>
    </div>
  );
}
