// components/data/DataPreview.tsx
import DataTable from "@/components/data/DataTable";
import TemplateDataMappingPanel from "@/components/shared/TemplateDataMappingPanel";
import { Container } from "@/components/ui/container";
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
    <Container>
      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <h1 className="text-lg font-semibold">{dataSet.name}</h1>
          <p className="text-sm text-muted-foreground">{dataSet.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-1">
              {dataSet.table.columns.length} columns
            </span>
            <span className="rounded-full border px-2 py-1">
              {dataSet.table.rows.length} rows
            </span>
            <span className="rounded-full border px-2 py-1">
              {Math.round(diagnostics.completionRate * 100)}% filled
            </span>
            {diagnostics.duplicateColumnNames.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                {diagnostics.duplicateColumnNames.length} duplicate headers
              </span>
            )}
            {diagnostics.blankColumnIndexes.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                {diagnostics.blankColumnIndexes.length} empty headers
              </span>
            )}
            {diagnostics.rowsWithMissingValues > 0 && (
              <span className="rounded-full border px-2 py-1">
                {diagnostics.rowsWithMissingValues} incomplete rows
              </span>
            )}
          </div>
        </div>
        <TemplateDataMappingPanel
          document={template.document}
          table={dataSet.table}
          title="Live Mapping"
          description="See how the current dataset lines up with template placeholders before generating."
          compact
        />
      </div>
      <DataTable />
    </Container>
  );
};

export default DataPreview;
