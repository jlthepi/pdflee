// components/data/DataUploadDialog.tsx
import type { ChangeEvent } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDataStore } from "@/stores/useDataStore";

type DataUploadDialogProps = {
  uploadDialogOpen: boolean;
  setUploadDialogOpen: (open: boolean) => void;
};

const DataUploadDialog = ({
  uploadDialogOpen,
  setUploadDialogOpen,
}: DataUploadDialogProps) => {
  const { importFile } = useDataStore();

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Data</DialogTitle>
          <DialogDescription>
            Upload a CSV file. The first row becomes the column names.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            void importFile(file)
              .then(() => {
                setUploadDialogOpen(false);
                toast.success("Data imported");
              })
              .catch((error: unknown) => {
                const message =
                  error instanceof Error &&
                  error.message === "CSV_ONLY_SUPPORTED"
                    ? "Only CSV files are supported."
                    : error instanceof Error && error.message === "CSV_EMPTY"
                      ? "The CSV file is empty."
                      : error instanceof Error &&
                          error.message === "CSV_PARSE_FAILED"
                        ? "Failed to parse the CSV file."
                        : "Failed to import data file";

                toast.error(message);
              });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DataUploadDialog;
