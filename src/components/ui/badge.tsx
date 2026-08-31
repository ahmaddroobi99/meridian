import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: ComponentProps<"span"> & { tone?: "default" | "accent" | "ok" | "warn" | "danger" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "muted" && "bg-surface-2 text-muted",
        tone === "default" && "bg-surface-2 text-muted",
        className,
      )}
      {...props}
    />
  );
}
