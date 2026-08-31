import { Badge } from "@/components/ui/badge";
import type { ItemRecord } from "@/lib/intelligence/types";
import { SOURCE_BY_ID } from "@/lib/intelligence/sources";
import { CATEGORY_BY_ID } from "@/lib/intelligence/taxonomy";
import { formatRelative } from "@/lib/utils";

export function Score({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-14">
      <div className="mb-1 flex items-center justify-between gap-2 font-mono text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{Math.round(value)}</span>
      </div>
      <div className="score-bar h-0.5 overflow-hidden rounded-full">
        <span style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function EvidenceBadge({ status }: { status: ItemRecord["evidenceStatus"] }) {
  const tone =
    status === "confirmed" ? "ok" : status === "reported" ? "accent" : status === "community" ? "muted" : "warn";
  return <Badge tone={tone}>{status}</Badge>;
}

export function ReliabilityBadge({ sourceId }: { sourceId: string }) {
  const rel = SOURCE_BY_ID[sourceId]?.reliability ?? "tertiary";
  return (
    <Badge tone={rel === "primary" ? "ok" : rel === "secondary" ? "accent" : "muted"}>
      {rel}
    </Badge>
  );
}

export function CategoryChips({ ids, limit = 3 }: { ids: string[]; limit?: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ids.slice(0, limit).map((id) => (
        <Badge key={id} tone="muted">
          {CATEGORY_BY_ID[id]?.label ?? id}
        </Badge>
      ))}
    </div>
  );
}

export function ItemMeta({ item }: { item: ItemRecord }) {
  const source = SOURCE_BY_ID[item.sourceId];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="font-medium text-fg">{source?.name ?? item.sourceId}</span>
      <span className="text-subtle">·</span>
      <span className="tabular-nums">{formatRelative(item.publishedAt)}</span>
      <span className="text-subtle">·</span>
      <span className="uppercase tracking-wide">{item.kind}</span>
      <EvidenceBadge status={item.evidenceStatus} />
      <ReliabilityBadge sourceId={item.sourceId} />
    </div>
  );
}
