import { useNavigate } from "@tanstack/react-router";
import type { GraphPayload } from "@/lib/intelligence/types";

export function KnowledgeGraph({ data }: { data: GraphPayload }) {
  const navigate = useNavigate();
  const w = 960;
  const h = 620;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto max-w-full text-fg" role="img" aria-label="AI knowledge graph">
      {data.edges.map((e) => {
        const a = data.nodes.find((n) => n.id === e.from);
        const b = data.nodes.find((n) => n.id === e.to);
        if (!a || !b) return null;
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            strokeOpacity={0.18}
          />
        );
      })}
      {data.nodes.map((n) => {
        const r = n.id === "ai" ? 28 : 8 + Math.min(18, Math.sqrt(n.count + 1) * 3);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            className="cursor-pointer"
            onClick={() => {
              if (n.id === "ai") void navigate({ to: "/trends" });
              else void navigate({ to: "/search", search: { q: n.label, category: n.id } });
            }}
          >
            <circle r={r} fill={n.id === "ai" ? "var(--color-accent)" : "var(--color-surface-2)"} stroke="var(--color-border-strong)" />
            <text
              textAnchor="middle"
              y={r + 14}
              className="fill-current"
              fontSize={n.id === "ai" ? 12 : 10}
              fontFamily="IBM Plex Sans, sans-serif"
            >
              {n.label}
            </text>
            {n.id !== "ai" && (
              <text
                textAnchor="middle"
                y={4}
                fontSize={9}
                fontFamily="IBM Plex Mono, monospace"
                fill="var(--color-muted)"
              >
                {n.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
