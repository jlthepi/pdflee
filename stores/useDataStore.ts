// stores/useDataStore.ts
import { create } from "zustand";

import { parseCsv, toDataTable } from "@/lib/domain/csv";
import { createDefaultDataSetDraft } from "@/lib/domain/defaults";
import { buildDataSetDraftFingerprint } from "@/lib/domain/draft-fingerprint";
import type { DataCell, DataSetDraft } from "@/types/domain";

type DataState = {
  dataSet: DataSetDraft;
  persistedFingerprint: string | null;
  setDataSet: (
    dataSet: DataSetDraft,
    options?: {
      persisted?: boolean;
    },
  ) => void;
  markDataSetPersisted: (dataSet?: DataSetDraft) => void;
  updateMeta: (
    update: Partial<Pick<DataSetDraft, "name" | "description">>,
  ) => void;
  importFile: (file: File) => Promise<void>;
  renameColumn: (colIdx: number, value: string) => void;
  setDataCell: (rowIndex: number, colIdx: number, value: string) => void;
  addDataRow: () => void;
  removeDataRows: (rowIndexes: number[]) => void;
  addDataColumn: () => void;
  removeDataColumn: (colIdx: number) => void;
};

export const useDataStore = create<DataState>((set, get) => ({
  dataSet: createDefaultDataSetDraft(),
  persistedFingerprint: null,
  setDataSet: (dataSet, options) =>
    set((state) => ({
      dataSet,
      persistedFingerprint: options?.persisted
        ? buildDataSetDraftFingerprint(dataSet)
        : state.persistedFingerprint,
    })),
  markDataSetPersisted: (dataSet = get().dataSet) =>
    set({
      persistedFingerprint: buildDataSetDraftFingerprint({
        name: dataSet.name,
        description: dataSet.description,
        table: dataSet.table,
      }),
    }),
  updateMeta: (update) =>
    set((state) => ({
      dataSet: {
        ...state.dataSet,
        ...update,
      },
    })),
  importFile: async (file) => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".csv")) {
      throw new Error("CSV_ONLY_SUPPORTED");
    }

    const parsed = parseCsv(await file.text());
    const table = toDataTable(parsed);

    set({
      dataSet: {
        name: file.name.replace(/\.[^.]+$/, ""),
        description: "Imported data set",
        table,
      },
    });
  },
  renameColumn: (colIdx, value) =>
    set((state) => ({
      dataSet: {
        ...state.dataSet,
        table: {
          ...state.dataSet.table,
          columns: state.dataSet.table.columns.map((column, index) =>
            index === colIdx ? value : column,
          ),
        },
      },
    })),
  setDataCell: (rowIdx, colIdx, value: DataCell) =>
    set((state) => {
      const rows = state.dataSet.table.rows.map((row) => [...row]);
      rows[rowIdx][colIdx] = value;

      return {
        dataSet: {
          ...state.dataSet,
          table: {
            ...state.dataSet.table,
            rows,
          },
        },
      };
    }),
  addDataRow: () =>
    set((state) => ({
      dataSet: {
        ...state.dataSet,
        table: {
          ...state.dataSet.table,
          rows: [
            ...state.dataSet.table.rows,
            Array(state.dataSet.table.columns.length).fill(""),
          ],
        },
      },
    })),
  removeDataRows: (rowIndexes) =>
    set((state) => {
      const selectedIndexes = new Set(rowIndexes);

      return {
        dataSet: {
          ...state.dataSet,
          table: {
            ...state.dataSet.table,
            rows: state.dataSet.table.rows.filter(
              (_, index) => !selectedIndexes.has(index),
            ),
          },
        },
      };
    }),
  addDataColumn: () =>
    set((state) => ({
      dataSet: {
        ...state.dataSet,
        table: {
          columns: [
            ...state.dataSet.table.columns,
            `column_${state.dataSet.table.columns.length + 1}`,
          ],
          rows: state.dataSet.table.rows.map((row) => [...row, ""]),
        },
      },
    })),
  removeDataColumn: (colIdx) =>
    set((state) => ({
      dataSet: {
        ...state.dataSet,
        table: {
          columns: state.dataSet.table.columns.filter(
            (_, index) => index !== colIdx,
          ),
          rows: state.dataSet.table.rows.map((row) =>
            row.filter((_, index) => index !== colIdx),
          ),
        },
      },
    })),
}));
