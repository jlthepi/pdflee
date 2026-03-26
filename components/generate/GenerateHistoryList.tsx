// components/generate/GenerateHistoryList.tsx
"use client";

import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-0 bg-transparent py-0 ring-0">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-semibold">Recent Runs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-0">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Loading previous generation jobs...
          </div>
        ) : null}

        {!isLoading && hasError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            Could not load generation history right now.
          </div>
        ) : null}

        {!isLoading && !hasError && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
            No generation jobs yet.
          </div>
        ) : null}

        {!isLoading && !hasError
          ? jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-stone-900/10 bg-background/70 px-4 py-4 dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{job.output.fileName}</div>
                      <Badge
                        variant="outline"
                        className={cn(outputToneClassName[job.output.kind])}
                      >
                        {job.output.kind.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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
                    onClick={() => onApplyJob(job)}
                  >
                    <RotateCcw />
                    Apply Setup
                  </Button>
                </div>
              </div>
            ))
          : null}
      </CardContent>
    </Card>
  );
};

export default GenerateHistoryList;
