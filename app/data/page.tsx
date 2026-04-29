// app/data/page.tsx
"use client";

import DataMenu from "@/components/data/DataMenu";
import DataPreview from "@/components/data/DataPreview";
import DataUploadDialog from "@/components/data/DataUploadDialog";
import { Layout } from "@/components/layout/Layout";
import { getDataTableDiagnostics } from "@/lib/domain/data-table";
import { buildDataSetDraftFingerprint } from "@/lib/domain/draft-fingerprint";
import { useDataStore } from "@/stores/useDataStore";
import { useDataUiStore } from "@/stores/useDataUiStore";

const DataPage = () => {
  const { dataUploadOpen, setDataUploadOpen } = useDataUiStore();
  const { dataSet, persistedFingerprint } = useDataStore();
  const diagnostics = getDataTableDiagnostics({
    table: dataSet.table,
  });
  const currentFingerprint = buildDataSetDraftFingerprint({
    name: dataSet.name,
    description: dataSet.description,
    table: dataSet.table,
  });
  const isDirty = persistedFingerprint !== currentFingerprint;
  const statusLabel =
    persistedFingerprint === null
      ? "Local draft"
      : isDirty
        ? "Unsaved changes"
        : `Saved version ${dataSet.currentVersion ?? 1}`;

  return (
    <Layout width="wide" mainScroll="locked">
      <div className="flex h-full min-h-0 flex-col">
        <section className="border-b border-stone-900/12 py-6 dark:border-white/10 lg:py-8">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-end">
            <div className="max-w-4xl space-y-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-stone-600 dark:text-stone-400">
                Data workspace
              </div>
              <div className="space-y-2">
                <h1 className="text-[clamp(2.8rem,6vw,5.8rem)] leading-[0.92] font-semibold tracking-[-0.05em] text-stone-950 dark:text-stone-50">
                  {dataSet.name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300 sm:text-base">
                  Refine the data set, normalize the schema, and make sure each
                  column is ready to bind cleanly to template placeholders.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                <span>{dataSet.table.columns.length} columns</span>
                <span>{dataSet.table.rows.length} rows</span>
                <span>{Math.round(diagnostics.completionRate * 100)}% filled</span>
                <span>{statusLabel}</span>
              </div>
            </div>

            <div className="justify-self-end rounded-[2rem] border border-stone-900/10 bg-stone-950 px-6 py-6 text-stone-100 shadow-[0_30px_80px_rgba(41,37,36,0.14)]">
              <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                Current sheet
              </div>
              <div className="mt-5 space-y-4">
                <div className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Status
                    </span>
                    <span className="text-sm text-stone-400">{statusLabel}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Fill rate
                    </span>
                    <span className="text-2xl font-medium tracking-[-0.03em]">
                      {Math.round(diagnostics.completionRate * 100)}%
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Integrity
                    </span>
                    <span className="text-sm text-stone-400">
                      {diagnostics.invalidColumnCount === 0
                        ? "Headers clean"
                        : `${diagnostics.invalidColumnCount} issues`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-stone-900/10 pt-5 dark:border-white/10">
            <DataMenu />
          </div>
        </section>

        <div className="min-h-0 flex-1 py-6 lg:py-7">
          <DataPreview />
        </div>

        <DataUploadDialog
          uploadDialogOpen={dataUploadOpen}
          setUploadDialogOpen={setDataUploadOpen}
        />
      </div>
    </Layout>
  );
};

export default DataPage;
