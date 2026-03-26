// lib/domain/generate-selection.ts
import type { DataSetDraft } from "@/types/domain";

export const buildGenerateDataSetIdentityKey = (
  dataSet: Pick<DataSetDraft, "id" | "name" | "table">,
) => {
  return [
    dataSet.id ?? "draft",
    dataSet.name,
    dataSet.table.columns.join("|"),
  ].join("::");
};

export const normalizeSelectedRowIndexes = (
  selectedRowIndexes: number[],
  rowCount: number,
) => {
  return [...new Set(selectedRowIndexes)]
    .filter((rowIndex) => rowIndex >= 0 && rowIndex < rowCount)
    .sort((left, right) => left - right);
};
