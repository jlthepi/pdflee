// components/generate/GenerateRunPlan.tsx
"use client";

import { cn } from "@/lib/utils";
import type { GenerateMode } from "@/types/domain";

type GenerateRunPlanProps = {
  mode: GenerateMode;
  rowCount: number;
  selectedRowCount: number;
  outputKind: "pdf" | "zip";
  templateName: string;
  templateVersion?: number;
  dataSetName: string;
  dataSetVersion?: number;
  templateIsDirty: boolean;
  dataSetIsDirty: boolean;
  onModeChange: (mode: GenerateMode) => void;
};

const modeOptions: Array<{
  value: GenerateMode;
  title: string;
  description: string;
}> = [
  {
    value: "single",
    title: "Sample run",
    description: "Generate the first row only to verify layout and content.",
  },
  {
    value: "selection",
    title: "Curated batch",
    description: "Choose the exact rows to include in this run.",
  },
  {
    value: "all",
    title: "Full batch",
    description: "Generate every available row in the current data set.",
  },
];

const GenerateRunPlan = ({
  mode,
  rowCount,
  selectedRowCount,
  outputKind,
  templateName,
  templateVersion,
  dataSetName,
  dataSetVersion,
  templateIsDirty,
  dataSetIsDirty,
  onModeChange,
}: GenerateRunPlanProps) => {
  return (
    <section className="space-y-4 border-t border-stone-900/12 pt-5 dark:border-white/10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Run Plan</h2>
          <p className="text-sm text-muted-foreground">
            Choose how many rows to run and confirm whether this execution
            reuses the latest saved versions or creates new snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-2 py-1">
            Output {outputKind.toUpperCase()}
          </span>
          <span className="rounded-full border px-2 py-1">
            {selectedRowCount} row{selectedRowCount === 1 ? "" : "s"} queued
          </span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <div className="grid gap-3 md:grid-cols-3">
          {modeOptions.map((option) => {
            const isActive = option.value === mode;
            const countLabel =
              option.value === "single"
                ? "1 row"
                : option.value === "selection"
                  ? `${selectedRowCount} selected`
                  : `${rowCount} total`;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onModeChange(option.value)}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-colors",
                  isActive
                    ? "border-stone-950 bg-stone-950 text-stone-50 dark:border-stone-50 dark:bg-stone-50 dark:text-stone-950"
                    : "border-stone-900/12 hover:border-stone-900/30 dark:border-white/10 dark:hover:border-white/30",
                )}
              >
                <div className="text-xs uppercase tracking-[0.2em] opacity-70">
                  {countLabel}
                </div>
                <div className="mt-3 text-base font-semibold">
                  {option.title}
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    isActive
                      ? "text-stone-200 dark:text-stone-700"
                      : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-stone-900/12 px-4 py-4 dark:border-white/10">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Template Snapshot
            </div>
            <div className="mt-2 text-sm font-medium">{templateName}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {templateIsDirty
                ? `Generate will create a new snapshot from v${templateVersion ?? 0}.`
                : `Generate will reuse saved version v${templateVersion ?? 0}.`}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-900/12 px-4 py-4 dark:border-white/10">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Data Snapshot
            </div>
            <div className="mt-2 text-sm font-medium">{dataSetName}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {dataSetIsDirty
                ? `Generate will create a new snapshot from v${dataSetVersion ?? 0}.`
                : `Generate will reuse saved version v${dataSetVersion ?? 0}.`}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenerateRunPlan;
