// types/ui.ts
export type TemplateEditorUiState = {
  selectedElementId: string | null;
  selectedElementIds: string[];
  previewMode: boolean;
  showSafeArea: boolean;
};

export type DataUiState = {
  uploadDialogOpen: boolean;
};
