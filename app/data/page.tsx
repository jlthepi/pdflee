// app/data/page.tsx
"use client";

import DataMenu from "@/components/data/DataMenu";
import DataPreview from "@/components/data/DataPreview";
import DataUploadDialog from "@/components/data/DataUploadDialog";
import { Layout } from "@/components/layout/Layout";
import { useDataUiStore } from "@/stores/useDataUiStore";

const DataPage = () => {
  const { dataUploadOpen, setDataUploadOpen } = useDataUiStore();

  return (
    <Layout>
      <div className="flex flex-col gap-6 px-1 py-4">
        <DataMenu />
        <DataPreview />
        <DataUploadDialog
          uploadDialogOpen={dataUploadOpen}
          setUploadDialogOpen={setDataUploadOpen}
        />
      </div>
    </Layout>
  );
};

export default DataPage;
