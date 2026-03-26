// lib/domain/data-table.ts
import type { DataTable } from "@/types/domain";

export type DataTableColumnStatus = "blank" | "duplicate" | "mapped" | "unused";

export type DataTableColumnDiagnostic = {
  index: number;
  name: string;
  normalizedName: string;
  filledCellCount: number;
  isBlank: boolean;
  isDuplicate: boolean;
  isMapped: boolean;
  status: DataTableColumnStatus;
};

export type DataTableDiagnostics = {
  columns: DataTableColumnDiagnostic[];
  blankColumnIndexes: number[];
  duplicateColumnNames: string[];
  invalidColumnCount: number;
  rowCount: number;
  columnCount: number;
  totalCellCount: number;
  filledCellCount: number;
  completionRate: number;
  rowsWithMissingValues: number;
  blankRowIndexes: number[];
};

export type DataTableHealth = {
  completionRatio: number;
  duplicateColumnNames: string[];
  emptyColumnIndexes: number[];
  blankRowIndexes: number[];
};

export const normalizeDataColumnName = (value: string) => value.trim();

export const getDataTableDiagnostics = ({
  table,
  placeholders = [],
}: {
  table: DataTable;
  placeholders?: string[];
}): DataTableDiagnostics => {
  const normalizedColumns = table.columns.map(normalizeDataColumnName);
  const placeholderSet = new Set(placeholders.map(normalizeDataColumnName));
  const duplicateCounts = normalizedColumns.reduce<Map<string, number>>(
    (accumulator, columnName) => {
      if (!columnName) {
        return accumulator;
      }

      accumulator.set(columnName, (accumulator.get(columnName) ?? 0) + 1);
      return accumulator;
    },
    new Map(),
  );

  const columns: DataTableColumnDiagnostic[] = table.columns.map(
    (name, index) => {
      const normalizedName = normalizedColumns[index];
      const filledCellCount = table.rows.reduce(
        (count, row) =>
          normalizeDataColumnName(row[index] ?? "") ? count + 1 : count,
        0,
      );
      const isBlank = normalizedName.length === 0;
      const isDuplicate =
        !isBlank && (duplicateCounts.get(normalizedName) ?? 0) > 1;
      const isMapped = !isBlank && placeholderSet.has(normalizedName);

      return {
        index,
        name,
        normalizedName,
        filledCellCount,
        isBlank,
        isDuplicate,
        isMapped,
        status: isBlank
          ? "blank"
          : isDuplicate
            ? "duplicate"
            : isMapped
              ? "mapped"
              : "unused",
      };
    },
  );

  const totalCellCount = table.columns.length * table.rows.length;
  const filledCellCount = columns.reduce(
    (count, column) => count + column.filledCellCount,
    0,
  );
  const blankRowIndexes = table.rows
    .map((row, rowIndex) =>
      row.every((value) => normalizeDataColumnName(value ?? "") === "")
        ? rowIndex
        : null,
    )
    .filter((rowIndex): rowIndex is number => rowIndex !== null);
  const rowsWithMissingValues = table.rows.filter((row) =>
    table.columns.some(
      (_, columnIndex) =>
        normalizeDataColumnName(row[columnIndex] ?? "") === "",
    ),
  ).length;

  return {
    columns,
    blankColumnIndexes: columns
      .filter((column) => column.isBlank)
      .map((column) => column.index),
    duplicateColumnNames: [...duplicateCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([columnName]) => columnName),
    invalidColumnCount: columns.filter(
      (column) => column.isBlank || column.isDuplicate,
    ).length,
    rowCount: table.rows.length,
    columnCount: table.columns.length,
    totalCellCount,
    filledCellCount,
    completionRate: totalCellCount === 0 ? 0 : filledCellCount / totalCellCount,
    rowsWithMissingValues,
    blankRowIndexes,
  };
};

export const getDataTableHealth = (table: DataTable): DataTableHealth => {
  const diagnostics = getDataTableDiagnostics({ table });

  return {
    completionRatio: diagnostics.completionRate,
    duplicateColumnNames: diagnostics.duplicateColumnNames,
    emptyColumnIndexes: diagnostics.blankColumnIndexes,
    blankRowIndexes: diagnostics.blankRowIndexes,
  };
};
