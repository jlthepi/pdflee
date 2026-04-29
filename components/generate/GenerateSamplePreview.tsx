// components/generate/GenerateSamplePreview.tsx
"use client";

import type { GenerateMode } from "@/types/domain";

import { Badge } from "@/components/ui/badge";
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
    <section className="border-t border-stone-900/12 pt-4 dark:border-white/10">
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          Preview
        </div>
        <h2 className="text-sm font-semibold tracking-tight">Run Context</h2>
      </div>

      <div className="mt-4 grid gap-3 border-y border-stone-900/12 py-3 text-sm dark:border-white/10 sm:grid-cols-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Mode
          </div>
          <div className="mt-1 font-medium">{modeLabelByValue[mode]}</div>
        </div>
        <div className="sm:border-l sm:border-stone-900/12 sm:pl-4 sm:dark:border-white/10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Rows
          </div>
          <div className="mt-1 font-medium">{rowCount}</div>
        </div>
        <div className="sm:border-l sm:border-stone-900/12 sm:pl-4 sm:dark:border-white/10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
            Download
          </div>
          <div className="mt-1 font-medium uppercase">{outputKind}</div>
        </div>
      </div>

      <div className="mt-4">
        {sampleRowIndex === null ? (
          <div className="border-y border-dashed border-stone-900/12 py-4 text-sm text-muted-foreground dark:border-white/10">
            Select a valid row to inspect how placeholder values will be
            resolved.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium tracking-tight">
              Row {sampleRowIndex + 1} snapshot
            </div>
            {fields.length > 0 ? (
              <div className="border-y border-stone-900/12 dark:border-white/10">
                {fields.map((field) => (
                  <div
                    key={field.placeholder}
                    className="grid gap-3 border-t border-stone-900/12 px-0 py-3 first:border-t-0 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] dark:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs">{`{{${field.placeholder}}}`}</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 rounded-none bg-transparent px-2 uppercase tracking-[0.18em]",
                          toneClassNameByStatus[field.status],
                        )}
                      >
                        {field.status === "matched" ? "Mapped" : "Missing"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground md:text-foreground">
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
              <div className="border-y border-dashed border-stone-900/12 py-4 text-sm text-muted-foreground dark:border-white/10">
                This template has no placeholders, so every generated output
                will be static.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default GenerateSamplePreview;
