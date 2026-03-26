// components/generate/GenerateSamplePreview.tsx
"use client";

import type { GenerateMode } from "@/types/domain";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SampleField = {
  placeholder: string;
  value: string;
  status: "matched" | "missing";
};

type GenerateSamplePreviewProps = {
  mode: GenerateMode;
  rowCount: number;
  outputKind: "pdf" | "zip";
  sampleRowIndex: number | null;
  fields: SampleField[];
};

const toneClassNameByStatus = {
  matched: "border-emerald-200 bg-emerald-50 text-emerald-700",
  missing: "border-amber-200 bg-amber-50 text-amber-700",
} satisfies Record<SampleField["status"], string>;

const modeLabelByValue = {
  single: "Sample first row",
  selection: "Preview first selected row",
  all: "Preview first batch row",
} satisfies Record<GenerateMode, string>;

const GenerateSamplePreview = ({
  mode,
  rowCount,
  outputKind,
  sampleRowIndex,
  fields,
}: GenerateSamplePreviewProps) => {
  return (
    <Card className="border-0 bg-transparent py-0 ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">Run Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10">
            <div className="text-xs text-muted-foreground">Mode</div>
            <div className="mt-1 text-sm font-medium">
              {modeLabelByValue[mode]}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10">
            <div className="text-xs text-muted-foreground">Rows</div>
            <div className="mt-1 text-sm font-medium">{rowCount}</div>
          </div>
          <div className="rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10">
            <div className="text-xs text-muted-foreground">Download</div>
            <div className="mt-1 text-sm font-medium uppercase">
              {outputKind}
            </div>
          </div>
        </div>

        {sampleRowIndex === null ? (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            Select a valid row to inspect how placeholder values will be
            resolved.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium">
              Row {sampleRowIndex + 1} snapshot
            </div>
            {fields.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.placeholder}
                    className="rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs">{`{{${field.placeholder}}}`}</div>
                      <Badge
                        variant="outline"
                        className={cn(toneClassNameByStatus[field.status])}
                      >
                        {field.status === "matched" ? "Mapped" : "Missing"}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm">
                      {field.status === "matched" ? (
                        field.value || (
                          <span className="text-muted-foreground">
                            Empty value
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          No matching data column
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
                This template has no placeholders, so every generated output
                will be static.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerateSamplePreview;
