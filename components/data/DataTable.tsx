// components/data/DataTable.tsx
import { useState } from "react";
import { AlertTriangle, Rows3, Trash2 } from "lucide-react";

import {
  getDataTableDiagnostics,
  type DataTableColumnDiagnostic,
  type DataTableColumnStatus,
} from "@/lib/domain/data-table";
import { getTemplateDataMappingSummary } from "@/lib/domain/placeholders";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";

const getColumnToneClassName = (status: DataTableColumnStatus) => {
  if (status === "mapped") {
    return {
      input:
        "border-0 border-b border-emerald-500/55 bg-transparent px-0 shadow-none focus-visible:border-emerald-600 focus-visible:ring-0",
      dot: "bg-emerald-500",
    };
  }

  if (status === "duplicate") {
    return {
      input:
        "border-0 border-b border-amber-500/65 bg-transparent px-0 shadow-none focus-visible:border-amber-600 focus-visible:ring-0",
      dot: "bg-amber-500",
    };
  }

  if (status === "blank") {
    return {
      input:
        "border-0 border-b border-amber-500/65 bg-transparent px-0 shadow-none focus-visible:border-amber-600 focus-visible:ring-0",
      dot: "bg-amber-500",
    };
  }

  return {
    input:
      "border-0 border-b border-stone-300 bg-transparent px-0 shadow-none focus-visible:border-stone-500 focus-visible:ring-0 dark:border-stone-700 dark:focus-visible:border-stone-500",
    dot: "bg-stone-300 dark:bg-stone-600",
  };
};

const EditableTable = ({
  rows,
  columns,
  diagnostics,
  renameColumn,
  handleCellChange,
  addDataRow,
  removeDataRows,
  removeDataColumn,
  selectedRowIndexes,
  toggleRowSelection,
  toggleAllRows,
}: {
  rows: string[][];
  columns: string[];
  diagnostics: DataTableColumnDiagnostic[];
  renameColumn: (colIdx: number, value: string) => void;
  handleCellChange: (rowIdx: number, colIdx: number, value: string) => void;
  addDataRow: () => void;
  removeDataRows: (rowIndexes: number[]) => void;
  removeDataColumn: (colIdx: number) => void;
  selectedRowIndexes: number[];
  toggleRowSelection: (rowIndex: number) => void;
  toggleAllRows: (checked: boolean) => void;
}) => {
  const allRowsSelected =
    rows.length > 0 && selectedRowIndexes.length === rows.length;
  const hasPartialSelection =
    selectedRowIndexes.length > 0 && selectedRowIndexes.length < rows.length;

  return (
    <Table className="min-w-[1080px] border-separate border-spacing-0">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="sticky left-0 top-0 z-30 w-28 border-b border-r border-stone-900/10 bg-[#f6f1e7]/95 align-top backdrop-blur dark:border-white/10 dark:bg-stone-950/95">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    allRowsSelected
                      ? true
                      : hasPartialSelection
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(checked) => toggleAllRows(Boolean(checked))}
                  aria-label="Select all rows"
                />
                <span className="text-xs uppercase tracking-[0.22em] text-stone-600 dark:text-stone-400">
                  Rows
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {rows.length} total
              </div>
            </div>
          </TableHead>
          {columns.map((column, columnIndex) => {
            const columnDiagnostic = diagnostics[columnIndex];
            const tone = getColumnToneClassName(columnDiagnostic.status);

            return (
              <TableHead
                key={`${column}-${columnIndex}`}
                className="sticky top-0 z-20 min-w-[220px] border-b border-stone-900/10 bg-[#f6f1e7]/95 align-top backdrop-blur dark:border-white/10 dark:bg-stone-950/95"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Input
                      value={column}
                      onChange={(event) =>
                        renameColumn(columnIndex, event.target.value)
                      }
                      className={cn("h-8", tone.input)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${column || `column ${columnIndex + 1}`} column`}
                      onClick={() => removeDataColumn(columnIndex)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {columnDiagnostic.filledCellCount}/{rows.length} filled
                    </span>
                  </div>
                  <div className={cn("h-1.5 w-10 rounded-full", tone.dot)} />
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length + 1}
              className="px-6 py-10 text-center whitespace-normal"
            >
              <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                <div className="rounded-full border border-dashed border-stone-900/12 p-3 dark:border-white/10">
                  <Rows3 className="size-5 text-stone-600 dark:text-stone-300" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">No rows yet</div>
                  <p className="text-sm text-muted-foreground">
                    Keep the current schema and add the first row, or upload a
                    CSV from the toolbar above.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDataRow}
                >
                  Add first row
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIndex) => {
            const filledCellCount = columns.filter(
              (_, columnIndex) => (row[columnIndex] ?? "").trim().length > 0,
            ).length;

            return (
              <TableRow key={`row-${rowIndex}`}>
                <TableCell className="sticky left-0 z-10 w-28 border-r border-stone-900/10 bg-[#fbf8f2]/95 align-top dark:border-white/10 dark:bg-stone-950/95">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedRowIndexes.includes(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-stone-900 dark:text-stone-100">
                          Row {rowIndex + 1}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {filledCellCount}/{columns.length} filled
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove row ${rowIndex + 1}`}
                      onClick={() => removeDataRows([rowIndex])}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
                {columns.map((_, columnIndex) => (
                  <TableCell key={`cell-${rowIndex}-${columnIndex}`}>
                    <Input
                      value={row[columnIndex] ?? ""}
                      onChange={(event) =>
                        handleCellChange(
                          rowIndex,
                          columnIndex,
                          event.target.value,
                        )
                      }
                      className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:border-ring focus-visible:ring-0"
                    />
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

const DataTable = () => {
  const {
    dataSet,
    renameColumn,
    setDataCell,
    addDataRow,
    removeDataRows,
    addDataColumn,
    removeDataColumn,
  } = useDataStore();
  const { template } = useTemplateStore();
  const [rawSelectedRowIndexes, setSelectedRowIndexes] = useState<number[]>([]);
  const mapping = getTemplateDataMappingSummary(
    template.document,
    dataSet.table,
  );
  const diagnostics = getDataTableDiagnostics({
    table: dataSet.table,
    placeholders: mapping.placeholders,
  });
  const selectedRowIndexes = rawSelectedRowIndexes.filter(
    (rowIndex) => rowIndex < dataSet.table.rows.length,
  );

  const removeSelectedRows = () => {
    removeDataRows(selectedRowIndexes);
    setSelectedRowIndexes([]);
  };

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRowIndexes((currentSelectedRowIndexes) =>
      currentSelectedRowIndexes.includes(rowIndex)
        ? currentSelectedRowIndexes.filter(
            (selectedRowIndex) => selectedRowIndex !== rowIndex,
          )
        : [...currentSelectedRowIndexes, rowIndex].sort(
            (left, right) => left - right,
          ),
    );
  };

  const toggleAllRows = (checked: boolean) => {
    setSelectedRowIndexes(
      checked ? dataSet.table.rows.map((_, rowIndex) => rowIndex) : [],
    );
  };

  if (diagnostics.columnCount === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-2 py-1">
            0 columns configured
          </span>
          <span className="rounded-full border px-2 py-1">
            0 rows configured
          </span>
        </div>
        <div className="rounded-[1.5rem] border border-dashed border-stone-900/12 bg-white/50 px-6 py-10 dark:border-white/10 dark:bg-white/5">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
            <div className="rounded-full border border-dashed border-stone-900/12 p-3 dark:border-white/10">
              <Rows3 className="size-5 text-stone-600 dark:text-stone-300" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold">
                Start with a table schema
              </div>
              <p className="text-sm text-muted-foreground">
                Add the first column before editing rows. If you already have
                data, upload a CSV from the toolbar and PDFlee will build the
                schema for you.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDataColumn}
              >
                Add first column
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDataRow}
              >
                Add first row
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border px-2 py-1">
          {mapping.matchedColumns.length} mapped columns
        </span>
        <span className="rounded-full border px-2 py-1">
          {mapping.missingPlaceholders.length} missing placeholders
        </span>
        <span className="rounded-full border px-2 py-1">
          {diagnostics.invalidColumnCount} invalid columns
        </span>
        <span className="rounded-full border px-2 py-1">
          {Math.round(diagnostics.completionRate * 100)}% cells filled
        </span>
      </div>

      {diagnostics.invalidColumnCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-medium">Column names need attention</div>
            <p className="mt-1 text-amber-800 dark:text-amber-100/80">
              Empty or duplicate headers break placeholder mapping and will
              block generation until they are fixed.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="max-h-[min(68vh,44rem)] overflow-auto rounded-[1.5rem] border border-stone-900/12 bg-white/50 dark:border-white/10 dark:bg-white/5">
          <EditableTable
            rows={dataSet.table.rows}
            columns={dataSet.table.columns}
            diagnostics={diagnostics.columns}
            renameColumn={renameColumn}
            handleCellChange={setDataCell}
            addDataRow={addDataRow}
            removeDataRows={removeDataRows}
            removeDataColumn={removeDataColumn}
            selectedRowIndexes={selectedRowIndexes}
            toggleRowSelection={toggleRowSelection}
            toggleAllRows={toggleAllRows}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDataColumn}
          >
            Add column
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDataRow}
          >
            Add row
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeSelectedRows}
            disabled={selectedRowIndexes.length === 0}
          >
            Delete selected ({selectedRowIndexes.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
