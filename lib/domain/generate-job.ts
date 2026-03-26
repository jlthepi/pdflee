// lib/domain/generate-job.ts
import type { DataTable, GenerateMode } from "@/types/domain";

export const MAX_GENERATION_ITEMS = 25;

export const resolveGenerateRowIndexes = (
  table: DataTable,
  mode: GenerateMode,
  selectedRowIndexes: number[],
) => {
  const availableIndexes = table.rows.map((_, index) => index);

  if (mode === "single") {
    return availableIndexes.length > 0 ? [0] : [];
  }

  if (mode === "all") {
    return availableIndexes;
  }

  const availableIndexSet = new Set(availableIndexes);

  return selectedRowIndexes.filter((index) => availableIndexSet.has(index));
};

export const getGenerateOutputKind = (rowCount: number) => {
  return rowCount > 1 ? "zip" : "pdf";
};

export const summarizeRowIndexes = (rowIndexes: number[], maxVisible = 4) => {
  if (rowIndexes.length === 0) {
    return "No rows";
  }

  const visibleIndexes = rowIndexes
    .slice(0, maxVisible)
    .map((rowIndex) => rowIndex + 1);
  const remainingCount = rowIndexes.length - visibleIndexes.length;

  if (remainingCount <= 0) {
    return `Rows ${visibleIndexes.join(", ")}`;
  }

  return `Rows ${visibleIndexes.join(", ")} +${remainingCount} more`;
};
