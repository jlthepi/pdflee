// app/generate/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import GenerateHistoryList from "@/components/generate/GenerateHistoryList";
import GenerateSamplePreview from "@/components/generate/GenerateSamplePreview";
import GenerateSelectionTable from "@/components/generate/GenerateSelectionTable";
import GenerateStatusChecklist, {
  type GenerateChecklistItem,
} from "@/components/generate/GenerateStatusChecklist";
import { Layout } from "@/components/layout/Layout";
import TemplateDataMappingPanel from "@/components/shared/TemplateDataMappingPanel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  MAX_GENERATION_ITEMS,
  summarizeRowIndexes,
} from "@/lib/domain/generate-job";
import {
  buildGenerateDataSetIdentityKey,
  normalizeSelectedRowIndexes,
} from "@/lib/domain/generate-selection";
import {
  extractPlaceholders,
  getGenerationReadiness,
  mapRowToRecord,
} from "@/lib/domain/placeholders";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";
import type {
  GenerateMode,
  GenerateJobRecord,
  PersistedDataSet,
  PersistedTemplate,
} from "@/types/domain";

const modeOptions: Array<{
  value: GenerateMode;
  label: string;
  description: string;
}> = [
  {
    value: "single",
    label: "Sample Row",
    description: "Render one PDF from the first row to verify the template.",
  },
  {
    value: "selection",
    label: "Picked Rows",
    description: "Choose exactly which records belong in this run.",
  },
  {
    value: "all",
    label: "Full Batch",
    description: `Generate every row at once, up to ${MAX_GENERATION_ITEMS} rows per run.`,
  },
];

const GeneratePage = () => {
  const { template, setTemplate } = useTemplateStore();
  const { dataSet, setDataSet } = useDataStore();
  const [mode, setMode] = useState<GenerateMode>("single");
  const [selectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);
  const [jobs, setJobs] = useState<GenerateJobRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [hasJobLoadError, setHasJobLoadError] = useState(false);
  const previousDataSetIdentityKeyRef = useRef<string | null>(null);
  const dataSetIdentityKey = useMemo(
    () => buildGenerateDataSetIdentityKey(dataSet),
    [dataSet],
  );

  const placeholders = useMemo(
    () => extractPlaceholders(template.document),
    [template.document],
  );
  const readiness = useMemo(
    () =>
      getGenerationReadiness({
        document: template.document,
        table: dataSet.table,
        mode,
        selectedRowIndexes,
      }),
    [dataSet.table, mode, selectedRowIndexes, template.document],
  );
  const sampleRowIndex = readiness.selectedRowIndexes[0] ?? null;
  const sampleRowRecord = useMemo(() => {
    if (sampleRowIndex === null) {
      return null;
    }

    return mapRowToRecord(
      dataSet.table.columns,
      dataSet.table.rows[sampleRowIndex] ?? [],
    );
  }, [dataSet.table.columns, dataSet.table.rows, sampleRowIndex]);
  const sampleFields = useMemo(() => {
    if (sampleRowRecord === null) {
      return [] as Array<{
        placeholder: string;
        value: string;
        status: "matched" | "missing";
      }>;
    }

    const missingPlaceholderSet = new Set(readiness.missingPlaceholders);

    return placeholders.slice(0, 8).map((placeholder) => ({
      placeholder,
      value: sampleRowRecord[placeholder] ?? "",
      status: missingPlaceholderSet.has(placeholder)
        ? ("missing" as const)
        : ("matched" as const),
    }));
  }, [placeholders, readiness.missingPlaceholders, sampleRowRecord]);

  const currentTemplateName = template.name || "Untitled template";
  const currentDataSetName = dataSet.name || "Untitled data set";
  const templateBlocker = readiness.blockers.includes(
    "Add at least one template element.",
  );
  const dataBlocker = readiness.blockers.includes(
    "Import or add at least one data row.",
  );
  const selectionBlocker = readiness.blockers.some((blocker) =>
    blocker.includes("Select one or more data rows"),
  );
  const limitBlocker = readiness.blockers.some((blocker) =>
    blocker.includes(`Generate up to ${MAX_GENERATION_ITEMS} rows`),
  );
  const runScopeBlocker =
    readiness.blockers.find(
      (blocker) =>
        blocker.includes("Select one or more data rows") ||
        blocker.includes(`Generate up to ${MAX_GENERATION_ITEMS} rows`),
    ) ?? null;
  const checklistItems = useMemo<GenerateChecklistItem[]>(() => {
    const mappingStatus =
      placeholders.length === 0 || readiness.missingPlaceholders.length > 0
        ? "warning"
        : "ready";

    return [
      {
        id: "template",
        label: "Template",
        detail: templateBlocker
          ? "Add at least one text element before generating."
          : `${currentTemplateName} is ready across ${template.document.pages.length} page(s).`,
        status: templateBlocker ? "blocked" : "ready",
        actionHref: "/template",
        actionLabel: "Open Template",
      },
      {
        id: "dataset",
        label: "Data Set",
        detail: dataBlocker
          ? "Import or add rows before running a generation job."
          : `${currentDataSetName} has ${dataSet.table.rows.length} row(s) and ${dataSet.table.columns.length} column(s).`,
        status: dataBlocker ? "blocked" : "ready",
        actionHref: "/data",
        actionLabel: "Open Data",
      },
      {
        id: "mapping",
        label: "Placeholder Mapping",
        detail:
          placeholders.length === 0
            ? "No placeholders detected. Every generated output will be static."
            : readiness.missingPlaceholders.length > 0
              ? `${readiness.missingPlaceholders.length} placeholder(s) still need matching columns.`
              : `All ${placeholders.length} placeholder(s) are mapped to dataset columns.`,
        status: mappingStatus,
        actionHref:
          placeholders.length === 0 || readiness.missingPlaceholders.length > 0
            ? "/template"
            : undefined,
        actionLabel:
          placeholders.length === 0 || readiness.missingPlaceholders.length > 0
            ? "Review Mapping"
            : undefined,
      },
      {
        id: "scope",
        label: "Run Scope",
        detail:
          selectionBlocker || limitBlocker
            ? (runScopeBlocker ?? "Choose a valid row range for this run.")
            : readiness.selectedRowCount === 0
              ? "No rows will be generated."
              : `${summarizeRowIndexes(readiness.selectedRowIndexes)} will produce a ${readiness.outputKind.toUpperCase()}.`,
        status:
          selectionBlocker || limitBlocker
            ? "blocked"
            : readiness.selectedRowCount > 0
              ? "ready"
              : "warning",
      },
    ];
  }, [
    currentDataSetName,
    currentTemplateName,
    dataBlocker,
    dataSet.table.columns.length,
    dataSet.table.rows.length,
    limitBlocker,
    placeholders.length,
    readiness.missingPlaceholders.length,
    readiness.outputKind,
    readiness.selectedRowCount,
    readiness.selectedRowIndexes,
    runScopeBlocker,
    selectionBlocker,
    template.document.pages.length,
    templateBlocker,
  ]);

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    setHasJobLoadError(false);

    try {
      const response = await fetch("/api/generate-jobs");
      const payload = (await response.json()) as {
        ok: boolean;
        data: GenerateJobRecord[];
      };

      if (!response.ok || !payload.ok) {
        throw new Error("GENERATE_JOBS_LOAD_FAILED");
      }

      setJobs(payload.data);
    } catch {
      setHasJobLoadError(true);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    if (
      previousDataSetIdentityKeyRef.current !== null &&
      previousDataSetIdentityKeyRef.current !== dataSetIdentityKey
    ) {
      setSelectedRowIndexes([]);
    }

    previousDataSetIdentityKeyRef.current = dataSetIdentityKey;
  }, [dataSetIdentityKey]);

  useEffect(() => {
    setSelectedRowIndexes((currentSelectedRowIndexes) =>
      normalizeSelectedRowIndexes(
        currentSelectedRowIndexes,
        dataSet.table.rows.length,
      ),
    );
  }, [dataSet.table.rows.length]);

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRowIndexes((currentSelectedRowIndexes) =>
      currentSelectedRowIndexes.includes(rowIndex)
        ? currentSelectedRowIndexes.filter(
            (selectedRowIndex) => selectedRowIndex !== rowIndex,
          )
        : normalizeSelectedRowIndexes(
            [...currentSelectedRowIndexes, rowIndex],
            dataSet.table.rows.length,
          ),
    );
  };

  const clearSelectedRows = () => {
    setSelectedRowIndexes([]);
  };

  const selectAllRows = () => {
    setSelectedRowIndexes(dataSet.table.rows.map((_, rowIndex) => rowIndex));
  };

  const saveTemplate = async () => {
    const response = await fetch(
      template.id ? `/api/templates/${template.id}` : "/api/templates",
      {
        method: template.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: PersistedTemplate;
    };

    if (!payload.ok) {
      throw new Error("TEMPLATE_SAVE_FAILED");
    }

    setTemplate({
      id: payload.data.record.id,
      name: payload.data.record.name,
      description: payload.data.version.description,
      currentVersion: payload.data.version.version,
      document: payload.data.version.document,
    });

    return payload.data.record.id;
  };

  const saveDataSet = async () => {
    const response = await fetch(
      dataSet.id ? `/api/datasets/${dataSet.id}` : "/api/datasets",
      {
        method: dataSet.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataSet),
      },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: PersistedDataSet;
    };

    if (!payload.ok) {
      throw new Error("DATASET_SAVE_FAILED");
    }

    setDataSet({
      id: payload.data.record.id,
      name: payload.data.record.name,
      description: payload.data.version.description,
      currentVersion: payload.data.version.version,
      table: payload.data.version.table,
    });

    return payload.data.record.id;
  };

  const applyJobSetup = (job: GenerateJobRecord) => {
    setMode(job.mode);
    setSelectedRowIndexes(
      normalizeSelectedRowIndexes(
        job.payload.rowIndexes,
        dataSet.table.rows.length,
      ),
    );
    toast.success("Previous generation setup applied");
  };

  const handleGenerate = async () => {
    if (readiness.blockers.length > 0) {
      toast.error(readiness.blockers[0]);
      return;
    }

    setIsGenerating(true);

    try {
      const [templateId, dataSetId] = await Promise.all([
        saveTemplate(),
        saveDataSet(),
      ]);
      const response = await fetch("/api/generate-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          dataSetId,
          mode,
          rowIndexes: readiness.selectedRowIndexes,
          fileBaseName: template.name || "pdflee",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: {
            message?: string;
          };
        } | null;

        throw new Error(payload?.error?.message ?? "PDF generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ??
        `${template.name || "pdflee"}.pdf`;

      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success(
        `${readiness.selectedRowCount} row(s) generated as ${readiness.outputKind.toUpperCase()}.`,
      );
      await loadJobs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "PDF generation failed",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-10 px-1 py-5">
        <div className="border-b border-stone-900/12 pb-6 dark:border-white/10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500 dark:text-stone-400">
                Generate
              </div>
              <h1 className="max-w-4xl text-[clamp(2.8rem,6vw,4.8rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-stone-950 dark:text-stone-50">
                Generate PDFs.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Verify row scope, review mapping coverage, and export the
                current template and dataset without leaving the work surface.
              </p>
            </div>

            <div className="self-end border-t border-stone-900/12 pt-4 text-sm dark:border-white/10 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                Current Drafts
              </div>
              <div className="mt-2 font-medium tracking-tight">
                {currentTemplateName}
              </div>
              <div className="mt-1 text-muted-foreground">
                paired with {currentDataSetName}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
            <span>Template v{template.currentVersion ?? 0}</span>
            <span>Data v{dataSet.currentVersion ?? 0}</span>
            <span>{readiness.selectedRowCount} rows in run</span>
            <span>{readiness.matchedColumns.length} mapped columns</span>
          </div>
        </div>

        <div className="border-y border-stone-900/12 dark:border-white/10">
          <div className="grid lg:grid-cols-3">
          {modeOptions.map((option) => {
            const isActive = mode === option.value;
            const countLabel =
              option.value === "single"
                ? "1 row"
                : option.value === "selection"
                  ? `${readiness.selectedRowCount} selected`
                  : `${dataSet.table.rows.length} total`;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`border-b border-stone-900/12 px-4 py-4 text-left transition last:border-b-0 dark:border-white/10 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                  isActive
                    ? "border-l-2 border-l-stone-900 bg-stone-900/[0.03] text-stone-950 dark:border-l-stone-50 dark:bg-white/[0.03] dark:text-stone-50"
                    : "text-muted-foreground hover:text-stone-950 dark:hover:text-stone-50"
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                  {countLabel}
                </div>
                <div className="mt-2 text-base font-semibold tracking-tight">
                  {option.label}
                </div>
              </button>
            );
          })}
          </div>
          <p className="px-4 py-3 text-sm text-muted-foreground">
            {modeOptions.find((option) => option.value === mode)?.description}
          </p>
        </div>

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {mode === "selection" ? (
              <GenerateSelectionTable
                columns={dataSet.table.columns}
                rows={dataSet.table.rows}
                matchedColumns={readiness.matchedColumns}
                selectedRowIndexes={selectedRowIndexes}
                toggleRowSelection={toggleRowSelection}
                selectAllRows={selectAllRows}
                clearSelectedRows={clearSelectedRows}
              />
            ) : null}

            <TemplateDataMappingPanel
              document={template.document}
              table={dataSet.table}
              title="Template to Data Mapping"
              description="Check coverage before saving versions and starting the job."
              variant="minimal"
            />

            <GenerateSamplePreview
              mode={mode}
              rowCount={readiness.selectedRowCount}
              outputKind={readiness.outputKind}
              sampleRowIndex={sampleRowIndex}
              fields={sampleFields}
            />
          </div>

          <div className="space-y-8 xl:border-l xl:border-stone-900/12 xl:pl-6 xl:dark:border-white/10">
            <GenerateStatusChecklist items={checklistItems} />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-stone-900/12 bg-background/95 py-3 backdrop-blur dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">
                Action
              </div>
              <div className="text-sm font-medium tracking-tight">
                Run this generation job
              </div>
              <p className="text-sm text-muted-foreground">
                {readiness.blockers.length > 0
                  ? readiness.blockers[0]
                  : (readiness.warnings[0] ??
                    `${summarizeRowIndexes(readiness.selectedRowIndexes)} will be exported as ${readiness.outputKind.toUpperCase()}.`)}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || readiness.blockers.length > 0}
              className="rounded-none"
            >
              {isGenerating ? <Spinner className="size-4" /> : null}
              {isGenerating
                ? "Generating..."
                : `Generate ${readiness.outputKind.toUpperCase()}`}
            </Button>
          </div>
        </div>

        <GenerateHistoryList
          jobs={jobs}
          isLoading={isLoadingJobs}
          hasError={hasJobLoadError}
          onApplyJob={applyJobSetup}
        />
      </div>
    </Layout>
  );
};

export default GeneratePage;
