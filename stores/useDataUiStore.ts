// stores/useDataUiStore.ts
import { create } from "zustand";

type DataUiStore = {
  dataUploadOpen: boolean;
  setDataUploadOpen: (open: boolean) => void;
};

export const useDataUiStore = create<DataUiStore>((set) => ({
  dataUploadOpen: false,
  setDataUploadOpen: (dataUploadOpen) => set({ dataUploadOpen }),
}));
