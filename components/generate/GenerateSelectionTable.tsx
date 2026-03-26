// components/generate/GenerateSelectionTable.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type GenerateSelectionTableProps = {
  columns: string[];
  rows: string[][];
  matchedColumns: string[];
  selectedRowIndexes: number[];
  toggleRowSelection: (rowIndex: number) => void;
  selectAllRows: () => void;
  clearSelectedRows: () => void;
};

const GenerateSelectionTable = ({
  columns,
  rows,
  matchedColumns,
  selectedRowIndexes,
  toggleRowSelection,
  selectAllRows,
  clearSelectedRows,
}: GenerateSelectionTableProps) => {
  const allRowsSelected =
    rows.length > 0 && selectedRowIndexes.length === rows.length;

  return (
    <div className="border-t border-stone-900/12 pt-4 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Row Selection</h2>
          <p className="text-sm text-muted-foreground">
            Choose the exact records to include in this run. Click any row to
            toggle it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={selectAllRows}
            disabled={rows.length === 0 || allRowsSelected}
          >
            Select All
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearSelectedRows}
            disabled={selectedRowIndexes.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border px-2 py-1">
          {selectedRowIndexes.length} selected
        </span>
        <span className="rounded-full border px-2 py-1">
          {rows.length} total rows
        </span>
        <span className="rounded-full border px-2 py-1">
          {matchedColumns.length} mapped columns
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          No rows available yet. Add or import data on the Data page first.
        </div>
      ) : (
        <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-stone-900/10 dark:border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-10 w-16 bg-background">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allRowsSelected}
                      onCheckedChange={() => {
                        if (allRowsSelected) {
                          clearSelectedRows();
                          return;
                        }

                        selectAllRows();
                      }}
                      aria-label="Select all rows"
                    />
                    <span>#</span>
                  </div>
                </TableHead>
                {columns.map((column, columnIndex) => (
                  <TableHead
                    key={`${column}-${columnIndex}`}
                    className="sticky top-0 z-10 bg-background"
                  >
                    <div className="space-y-2">
                      <div>{column}</div>
                      <Badge
                        variant="outline"
                        className={
                          matchedColumns.includes(column)
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-border bg-muted/50 text-muted-foreground"
                        }
                      >
                        {matchedColumns.includes(column) ? "Mapped" : "Unused"}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const isSelected = selectedRowIndexes.includes(rowIndex);

                return (
                  <TableRow
                    key={`generate-row-${rowIndex}`}
                    data-state={isSelected ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => toggleRowSelection(rowIndex)}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRowSelection(rowIndex)}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {rowIndex + 1}
                        </span>
                      </div>
                    </TableCell>
                    {columns.map((_, columnIndex) => (
                      <TableCell
                        key={`generate-cell-${rowIndex}-${columnIndex}`}
                      >
                        <div className="truncate">
                          {row[columnIndex] || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default GenerateSelectionTable;
