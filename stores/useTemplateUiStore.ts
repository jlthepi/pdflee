// stores/useTemplateUiStore.ts
import { create } from "zustand";

import type { TemplateSnapGuide } from "@/lib/domain/template-editor";

export type TemplateLeftPanelTab = "structure" | "pages" | "insert";
export type TemplateRightPanelTab = "content" | "style" | "arrange";

type DragSession = {
  pageId: string;
  elementId: string;
  elementIds: string[];
  pointerId: number;
  originPointer: {
    x: number;
    y: number;
  };
  originElement: {
    x: number;
    y: number;
  };
  elementSize: {
    width: number;
    height: number;
  };
  originElements: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

type ResizeSession = {
  pageId: string;
  elementId: string;
  pointerId: number;
  originPointer: {
    x: number;
    y: number;
  };
  originElement: {
    x: number;
    y: number;
  };
  originSize: {
    width: number;
    height: number;
  };
};

type TemplateUiStore = {
  activePageId: string | null;
  activeLeftPanelTab: TemplateLeftPanelTab;
  activeRightPanelTab: TemplateRightPanelTab;
  selectedElementId: string | null;
  selectedElementIds: string[];
  editingElementId: string | null;
  dragSession: DragSession | null;
  resizeSession: ResizeSession | null;
  snapGuides: TemplateSnapGuide[];
  showSafeArea: boolean;
  setActivePageId: (pageId: string | null) => void;
  setActiveLeftPanelTab: (tab: TemplateLeftPanelTab) => void;
  setActiveRightPanelTab: (tab: TemplateRightPanelTab) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  toggleSelectedElementId: (id: string) => void;
  clearSelectedElements: () => void;
  setEditingElementId: (id: string | null) => void;
  startDrag: (dragSession: DragSession) => void;
  stopDrag: () => void;
  startResize: (resizeSession: ResizeSession) => void;
  stopResize: () => void;
  setSnapGuides: (snapGuides: TemplateSnapGuide[]) => void;
  clearSnapGuides: () => void;
  setShowSafeArea: (showSafeArea: boolean) => void;
};

const normalizeSelection = (ids: string[]) => {
  return [...new Set(ids.filter(Boolean))];
};

export const useTemplateUiStore = create<TemplateUiStore>((set) => ({
  activePageId: null,
  activeLeftPanelTab: "structure",
  activeRightPanelTab: "arrange",
  selectedElementId: null,
  selectedElementIds: [],
  editingElementId: null,
  dragSession: null,
  resizeSession: null,
  snapGuides: [],
  showSafeArea: true,
  setActiveLeftPanelTab: (activeLeftPanelTab) => set({ activeLeftPanelTab }),
  setActiveRightPanelTab: (activeRightPanelTab) => set({ activeRightPanelTab }),
  setActivePageId: (activePageId) =>
    set({
      activePageId,
      selectedElementId: null,
      selectedElementIds: [],
      editingElementId: null,
      dragSession: null,
      resizeSession: null,
      snapGuides: [],
    }),
  setSelectedElementId: (selectedElementId) =>
    set((state) => ({
      selectedElementId,
      selectedElementIds: selectedElementId ? [selectedElementId] : [],
      editingElementId:
        selectedElementId === state.editingElementId
          ? state.editingElementId
          : null,
    })),
  setSelectedElementIds: (ids) =>
    set((state) => {
      const normalizedIds = normalizeSelection(ids);

      return {
        selectedElementId: normalizedIds[0] ?? null,
        selectedElementIds: normalizedIds,
        editingElementId:
          state.editingElementId &&
          normalizedIds.includes(state.editingElementId)
            ? state.editingElementId
            : null,
      };
    }),
  toggleSelectedElementId: (id) =>
    set((state) => {
      const isSelected = state.selectedElementIds.includes(id);
      const nextSelectedElementIds = isSelected
        ? state.selectedElementIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedElementIds, id];

      return {
        selectedElementId: nextSelectedElementIds[0] ?? null,
        selectedElementIds: nextSelectedElementIds,
        editingElementId:
          state.editingElementId &&
          nextSelectedElementIds.includes(state.editingElementId)
            ? state.editingElementId
            : null,
      };
    }),
  clearSelectedElements: () =>
    set({
      selectedElementId: null,
      selectedElementIds: [],
      editingElementId: null,
    }),
  setEditingElementId: (editingElementId) =>
    set((state) => {
      const selectedElementIds = editingElementId
        ? normalizeSelection([editingElementId, ...state.selectedElementIds])
        : state.selectedElementIds;

      return {
        activeRightPanelTab: editingElementId
          ? "content"
          : state.activeRightPanelTab,
        editingElementId,
        selectedElementId: selectedElementIds[0] ?? null,
        selectedElementIds,
      };
    }),
  startDrag: (dragSession) =>
    set({
      dragSession,
      resizeSession: null,
      editingElementId: null,
      snapGuides: [],
    }),
  stopDrag: () => set({ dragSession: null, snapGuides: [] }),
  startResize: (resizeSession) =>
    set({
      resizeSession,
      dragSession: null,
      editingElementId: null,
      snapGuides: [],
    }),
  stopResize: () => set({ resizeSession: null, snapGuides: [] }),
  setSnapGuides: (snapGuides) => set({ snapGuides }),
  clearSnapGuides: () => set({ snapGuides: [] }),
  setShowSafeArea: (showSafeArea) => set({ showSafeArea }),
}));
