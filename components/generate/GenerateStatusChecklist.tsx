// components/generate/GenerateStatusChecklist.tsx
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-0 bg-transparent py-0 ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">Run Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">{item.label}</div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0", toneClassNameByStatus[item.status])}
              >
                {labelByStatus[item.status]}
              </Badge>
            </div>

            {item.actionHref && item.actionLabel ? (
              <div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={item.actionHref}>{item.actionLabel}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default GenerateStatusChecklist;
