// components/generate/GenerateHistoryList.tsx
"use client";

import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { summarizeRowIndexes } from "@/lib/domain/generate-job";
import { cn } from "@/lib/utils";
import type { GenerateJobRecord } from "@/types/domain";

type GenerateHistoryListProps = {
  jobs: GenerateJobRecord[];
  isLoading: boolean;
  hasError: boolean;
  onApplyJob: (job: GenerateJobRecord) => void;
};

const outputToneClassName = {
  pdf: "border-sky-200 bg-sky-50 text-sky-700",
  zip: "border-violet-200 bg-violet-50 text-violet-700",
} satisfies Record<GenerateJobRecord["output"]["kind"], string>;

const GenerateHistoryList = ({
  jobs,
  isLoading,
  hasError,
  onApplyJob,
}: GenerateHistoryListProps) => {
  return (
    <section className="border-t border-stone-900/12 pt-4 dark:border-white/10">
      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
          History
        </div>
        <h2 className="text-sm font-semibold tracking-tight">Recent Runs</h2>
      </div>

      <div className="mt-4 border-b border-stone-900/12 dark:border-white/10">
        {isLoading ? (
          <div className="flex items-center gap-2 border-t border-stone-900/12 py-4 text-sm text-muted-foreground dark:border-white/10">
            <Spinner className="size-4" />
            Loading previous generation jobs...
          </div>
        ) : null}

        {!isLoading && hasError ? (
          <div className="border-t border-rose-200 py-4 text-sm text-rose-700">
            Could not load generation history right now.
          </div>
        ) : null}

        {!isLoading && !hasError && jobs.length === 0 ? (
          <div className="border-t border-dashed border-stone-900/12 py-4 text-sm text-muted-foreground dark:border-white/10">
            No generation jobs yet.
          </div>
        ) : null}

        {!isLoading && !hasError
          ? jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-start justify-between gap-4 border-t border-stone-900/12 py-4 dark:border-white/10"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium tracking-tight">
                      {job.output.fileName}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 rounded-none bg-transparent px-2 uppercase tracking-[0.18em]",
                        outputToneClassName[job.output.kind],
                      )}
                    >
                      {job.output.kind.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{job.mode}</span>
                    <span>{job.output.itemCount} item(s)</span>
                    <span>{summarizeRowIndexes(job.payload.rowIndexes)}</span>
                    <span>Template v{job.templateVersion}</span>
                    <span>Data v{job.dataSetVersion}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none"
                  onClick={() => onApplyJob(job)}
                >
                  <RotateCcw />
                  Apply Setup
                </Button>
              </div>
            ))
          : null}
      </div>
    </section>
  );
};

export default GenerateHistoryList;
