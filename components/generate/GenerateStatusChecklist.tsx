// components/generate/GenerateStatusChecklist.tsx
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GenerateChecklistItem = {
  id: string;
  label: string;
  detail: string;
  status: "ready" | "warning" | "blocked";
  actionHref?: string;
  actionLabel?: string;
};

const toneClassNameByStatus = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
} satisfies Record<GenerateChecklistItem["status"], string>;

const labelByStatus = {
  ready: "Ready",
  warning: "Review",
  blocked: "Blocked",
} satisfies Record<GenerateChecklistItem["status"], string>;

type GenerateStatusChecklistProps = {
  items: GenerateChecklistItem[];
};

const GenerateStatusChecklist = ({ items }: GenerateStatusChecklistProps) => {
  return (
    <section className="border-t border-stone-900/12 pt-4 dark:border-white/10">
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          Generate
        </div>
        <h2 className="text-sm font-semibold tracking-tight">Run Checklist</h2>
      </div>

      <div className="mt-4 border-b border-stone-900/12 dark:border-white/10">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 border-t border-stone-900/12 py-4 first:border-t-0 dark:border-white/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="text-sm font-medium tracking-tight">
                  {item.label}
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "h-6 shrink-0 rounded-none bg-transparent px-2 uppercase tracking-[0.18em]",
                  toneClassNameByStatus[item.status],
                )}
              >
                {labelByStatus[item.status]}
              </Badge>
            </div>

            {item.actionHref && item.actionLabel ? (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                  asChild
                >
                  <Link href={item.actionHref}>{item.actionLabel}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
};

export default GenerateStatusChecklist;
