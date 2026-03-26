// components/data/DataMenu.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Save, Upload } from "lucide-react";
import { toast } from "sonner";

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
  const { dataSet, setDataSet } = useDataStore();
  const { setDataUploadOpen } = useDataUiStore();
  const [dataSets, setDataSets] = useState<DataSetRecord[]>([]);
  const selectedDataSetId = dataSets.some((record) => record.id === dataSet.id)
    ? dataSet.id
    : undefined;

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
    <div className="border-b border-stone-900/12 pb-4 dark:border-white/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
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
        </div>

        <Select
          value={selectedDataSetId}
          onValueChange={(value) => {
            void handleLoad(value);
          }}
          disabled={!dataSets.length}
        >
          <SelectTrigger
            size="sm"
            className="min-w-52 justify-between bg-white/70 dark:bg-input/30"
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
  );
};

export default DataMenu;
