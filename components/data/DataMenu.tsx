// components/data/DataMenu.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { toast } from "sonner";

import { buildDataSetDraftFingerprint } from "@/lib/domain/draft-fingerprint";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataUiStore } from "@/stores/useDataUiStore";
import { useDataStore } from "@/stores/useDataStore";
import type { DataSetRecord, PersistedDataSet } from "@/types/domain";

const exportDataSet = (
  dataSet: ReturnType<typeof useDataStore.getState>["dataSet"],
) => {
  const blob = new Blob([JSON.stringify(dataSet, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${dataSet.name || "dataset"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const toDraft = (dataSet: PersistedDataSet) => ({
  id: dataSet.record.id,
  name: dataSet.record.name,
  description: dataSet.version.description,
  currentVersion: dataSet.version.version,
  table: dataSet.version.table,
});

const DataMenu = () => {
  const { dataSet, persistedFingerprint, setDataSet } = useDataStore();
  const { setDataUploadOpen } = useDataUiStore();
  const [dataSets, setDataSets] = useState<DataSetRecord[]>([]);
  const selectedDataSetId = dataSets.some((record) => record.id === dataSet.id)
    ? dataSet.id
    : undefined;
  const currentFingerprint = buildDataSetDraftFingerprint({
    name: dataSet.name,
    description: dataSet.description,
    table: dataSet.table,
  });
  const isDirty =
    persistedFingerprint !== null && persistedFingerprint !== currentFingerprint;
  const statusLabel =
    persistedFingerprint === null
      ? "Local draft"
      : isDirty
        ? "Unsaved changes"
        : `Saved version ${dataSet.currentVersion ?? 1}`;

  const fetchDataSets = useCallback(async () => {
    try {
      const response = await fetch("/api/datasets");
      const payload = (await response.json()) as {
        ok: boolean;
        data: DataSetRecord[];
      };

      if (payload.ok) {
        return payload.data;
      }

      toast.error("Failed to fetch saved data sets");
    } catch {
      toast.error("Failed to fetch saved data sets");
    }

    return null;
  }, []);

  useEffect(() => {
    let active = true;

    void fetchDataSets().then((nextDataSets) => {
      if (active && nextDataSets) {
        setDataSets(nextDataSets);
      }
    });

    return () => {
      active = false;
    };
  }, [fetchDataSets]);

  const handleSave = async () => {
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
      toast.error("Data set save failed");
      return;
    }

    setDataSet(toDraft(payload.data), { persisted: true });
    const nextDataSets = await fetchDataSets();

    if (nextDataSets) {
      setDataSets(nextDataSets);
    }

    toast.success(`Data set saved as version ${payload.data.version.version}`);
  };

  const handleLoad = async (dataSetId: string) => {
    const response = await fetch(`/api/datasets/${dataSetId}`);
    const payload = (await response.json()) as {
      ok: boolean;
      data: PersistedDataSet;
    };

    if (!payload.ok) {
      toast.error("Failed to load data set");
      return;
    }

    setDataSet(toDraft(payload.data), { persisted: true });
    toast.success("Data set loaded");
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          <span>Utility rail</span>
          <span>{statusLabel}</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setDataUploadOpen(true)}
          >
            <Upload />
            Upload CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSave()}
          >
            <Save />
            Save Version
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exportDataSet(dataSet)}
          >
            <Download />
            Export Draft
          </Button>

          <Select
            value={selectedDataSetId}
            onValueChange={(value) => {
              void handleLoad(value);
            }}
            disabled={!dataSets.length}
          >
            <SelectTrigger
              size="sm"
              className="min-w-56 justify-between border-stone-900/12 bg-white/40 dark:border-white/10 dark:bg-white/5"
              aria-label="Load saved data set"
            >
              <SelectValue
                placeholder={
                  dataSets.length ? "Load saved data set" : "No saved data sets"
                }
              />
            </SelectTrigger>
            <SelectContent align="end">
              {dataSets.map((record) => (
                <SelectItem key={record.id} value={record.id}>
                  {record.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DataMenu;
