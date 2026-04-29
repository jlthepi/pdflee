// components/data/DataPreview.tsx
import DataTable from "@/components/data/DataTable";
import TemplateDataMappingPanel from "@/components/shared/TemplateDataMappingPanel";
import { getDataTableDiagnostics } from "@/lib/domain/data-table";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";

const DataPreview = () => {
  const { dataSet } = useDataStore();
  const { template } = useTemplateStore();
  const diagnostics = getDataTableDiagnostics({
    table: dataSet.table,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-stone-900/12 pb-5 text-[11px] uppercase tracking-[0.18em] text-stone-500 dark:border-white/10 dark:text-stone-400">
        <span>Table workspace</span>
        <span>{Math.round(diagnostics.completionRate * 100)}% filled</span>
        {diagnostics.blankColumnIndexes.length > 0 ? (
          <span>{diagnostics.blankColumnIndexes.length} empty headers</span>
        ) : null}
        {diagnostics.duplicateColumnNames.length > 0 ? (
          <span>{diagnostics.duplicateColumnNames.length} duplicate headers</span>
        ) : null}
        {diagnostics.rowsWithMissingValues > 0 ? (
          <span>{diagnostics.rowsWithMissingValues} incomplete rows</span>
        ) : (
          <span>Rows complete</span>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-0">
          <DataTable />
        </div>
        <aside className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 border-t border-stone-900/12 pt-6 xl:border-t-0 xl:border-l xl:pl-8 xl:pt-0 dark:border-white/10">
          <TemplateDataMappingPanel
            document={template.document}
            table={dataSet.table}
            title="Live Mapping"
            description="A compact read on how the current sheet lines up with template placeholders."
            className="border-t-0 pt-0"
            compact
          />
        </aside>
      </div>
    </div>
  );
};

export default DataPreview;
