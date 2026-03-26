// components/generate/GenerateJobHistory.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { summarizeRowIndexes } from "@/lib/domain/generate-job";
import type { GenerateJobRecord } from "@/types/domain";

type GenerateJobHistoryProps = {
  jobs: GenerateJobRecord[];
  isLoading: boolean;
  loadError: string | null;
  onApplyJob: (job: GenerateJobRecord) => void;
};

const GenerateJobHistory = ({
  jobs,
  isLoading,
  loadError,
  onApplyJob,
}: GenerateJobHistoryProps) => {
  return (
    <section className="space-y-4 border-t border-stone-900/12 pt-5 dark:border-white/10">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Generation History</h2>
        <p className="text-sm text-muted-foreground">
          Reuse the exact row selection and run mode from a previous job.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          Loading saved jobs...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
          {loadError}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          No generation jobs yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-4 rounded-2xl border border-stone-900/12 px-4 py-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{job.output.fileName}</div>
                  <Badge variant="outline" className="uppercase">
                    {job.output.kind}
                  </Badge>
                  <Badge variant="outline">{job.mode}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">
                    {summarizeRowIndexes(job.payload.rowIndexes)}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Template v{job.templateVersion}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Data v{job.dataSetVersion}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyJob(job)}
                >
                  Apply Run Setup
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default GenerateJobHistory;
