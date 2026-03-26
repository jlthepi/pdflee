// components/generate/GenerateReadinessPanel.tsx
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GenerationReadiness } from "@/lib/domain/placeholders";
import { cn } from "@/lib/utils";

type GenerateReadinessPanelProps = {
  readiness: GenerationReadiness;
  onFocusSelection: () => void;
};

const toneClassName = {
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-stone-900/12 bg-muted/50 text-foreground dark:border-white/10",
} as const;

const GenerateReadinessPanel = ({
  readiness,
  onFocusSelection,
}: GenerateReadinessPanelProps) => {
  return (
    <section className="space-y-4 border-t border-stone-900/12 pt-5 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Readiness</h2>
            <Badge
              variant="outline"
              className={cn(
                readiness.status === "ready"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : readiness.status === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {readiness.status === "ready"
                ? "Ready"
                : readiness.status === "warning"
                  ? "Ready with warnings"
                  : "Blocked"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Resolve blockers first. Warnings will not stop the run, but they can
            produce empty or duplicated output.
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-stone-900/12 px-4 py-3 dark:border-white/10">
            <div className="text-xs text-muted-foreground">
              Rows to Generate
            </div>
            <div className="mt-1 font-medium">{readiness.selectedRowCount}</div>
          </div>
          <div className="rounded-2xl border border-stone-900/12 px-4 py-3 dark:border-white/10">
            <div className="text-xs text-muted-foreground">Output</div>
            <div className="mt-1 font-medium uppercase">
              {readiness.outputKind}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {readiness.issues.length > 0 ? (
          readiness.issues.map((issue) => (
            <div
              key={issue.id}
              className={cn(
                "rounded-2xl border px-4 py-4",
                toneClassName[issue.tone],
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{issue.title}</div>
                  <p className="text-sm text-current/85">{issue.description}</p>
                  {issue.relatedItems?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {issue.relatedItems.map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="border-current/20 text-current"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                {issue.action ? (
                  issue.action.href ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-current/20 bg-transparent text-current hover:bg-white/30"
                    >
                      <Link href={issue.action.href}>{issue.action.label}</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-current/20 bg-transparent text-current hover:bg-white/30"
                      onClick={onFocusSelection}
                    >
                      {issue.action.label}
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            All checks passed. This run is ready to generate.
          </div>
        )}
      </div>
    </section>
  );
};

export default GenerateReadinessPanel;
