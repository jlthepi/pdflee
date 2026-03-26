// app/template/page.tsx
"use client";

import { useEffect } from "react";

import { Layout } from "@/components/layout/Layout";
import Canvas from "@/components/template/Canvas";
import Inspector from "@/components/template/Inspector";
import MenuBar from "@/components/template/MenuBar";
import SidePanelTabs from "@/components/template/SidePanelTabs";
import Toolbox from "@/components/template/Toolbox";
import {
  TEMPLATE_EDITOR_NUDGE_LARGE_STEP,
  TEMPLATE_EDITOR_NUDGE_STEP,
} from "@/lib/domain/template-editor";
import { TEMPLATE_DUPLICATE_OFFSET } from "@/lib/domain/template-style";
import { getTemplatePage } from "@/lib/domain/template-document";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";

const TemplatePage = () => {
  const {
    template,
    moveElementsBy,
    deleteElements,
    duplicateElements,
    copyElementStyle,
    pasteElementStyle,
    styleClipboard,
    moveElementLayer,
    toggleElementLock,
    toggleElementHidden,
    undo,
    redo,
  } = useTemplateStore();
  const {
    activePageId,
    activeLeftPanelTab,
    activeRightPanelTab,
    selectedElementIds,
    setActivePageId,
    setActiveLeftPanelTab,
    setActiveRightPanelTab,
    setSelectedElementIds,
    clearSelectedElements,
  } = useTemplateUiStore();
  const activePage = getTemplatePage(template.document, activePageId);

  useEffect(() => {
    if (template.document.pages.length === 0) {
      return;
    }

    const isCurrentPageMissing = !template.document.pages.some(
      (page) => page.id === activePageId,
    );

    if (!activePageId || isCurrentPageMissing) {
      setActivePageId(template.document.pages[0].id);
    }
  }, [activePageId, setActivePageId, template.document.pages]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "OPTION", "BUTTON"].includes(
          target.tagName,
        )
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === "z" && event.shiftKey) {
          event.preventDefault();
          redo();
          return;
        }

        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          undo();
          return;
        }

        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          redo();
          return;
        }

        if (event.key.toLowerCase() === "a") {
          event.preventDefault();
          setSelectedElementIds(activePage.elements.map((element) => element.id));
          return;
        }

        if (selectedElementIds.length > 0) {
          if (event.key === "]" && event.shiftKey) {
            event.preventDefault();
            moveElementLayer(activePage.id, selectedElementIds, "front");
            return;
          }

          if (event.key === "[") {
            event.preventDefault();
            moveElementLayer(
              activePage.id,
              selectedElementIds,
              event.shiftKey ? "back" : "backward",
            );
            return;
          }

          if (event.key === "]") {
            event.preventDefault();
            moveElementLayer(activePage.id, selectedElementIds, "forward");
            return;
          }

          if (event.key.toLowerCase() === "l") {
            event.preventDefault();
            toggleElementLock(activePage.id, selectedElementIds);
            return;
          }

          if (event.key.toLowerCase() === "h" && event.shiftKey) {
            event.preventDefault();
            toggleElementHidden(activePage.id, selectedElementIds);
            return;
          }

          if (event.key.toLowerCase() === "c" && event.shiftKey) {
            event.preventDefault();
            copyElementStyle(activePage.id, selectedElementIds[0]);
            return;
          }

          if (
            event.key.toLowerCase() === "v" &&
            event.shiftKey &&
            styleClipboard
          ) {
            event.preventDefault();
            pasteElementStyle(activePage.id, selectedElementIds);
            return;
          }
        }
      }

      if (selectedElementIds.length === 0) {
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        deleteElements(activePage.id, selectedElementIds);
        clearSelectedElements();
        return;
      }

      const movement = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      } as const;

      if (event.key in movement) {
        event.preventDefault();
        const [dx, dy] = movement[event.key as keyof typeof movement];
        const step = event.shiftKey
          ? TEMPLATE_EDITOR_NUDGE_LARGE_STEP
          : TEMPLATE_EDITOR_NUDGE_STEP;
        moveElementsBy(activePage.id, selectedElementIds, dx * step, dy * step);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const nextIds = duplicateElements(
          activePage.id,
          selectedElementIds,
          event.shiftKey ? { x: 0, y: 0 } : TEMPLATE_DUPLICATE_OFFSET,
        );

        if (nextIds.length > 0) {
          setSelectedElementIds(nextIds);
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearSelectedElements();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activePage.id,
    activePage.elements,
    clearSelectedElements,
    copyElementStyle,
    deleteElements,
    duplicateElements,
    moveElementsBy,
    moveElementLayer,
    pasteElementStyle,
    redo,
    selectedElementIds,
    setSelectedElementIds,
    styleClipboard,
    toggleElementLock,
    toggleElementHidden,
    undo,
  ]);

  return (
    <Layout width="wide" mainScroll="locked">
      <div className="grid h-full min-h-0 gap-8 px-1 py-5 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(280px,320px)]">
        <div className="relative min-h-0 overflow-hidden border-r pr-6">
          <MenuBar />
          <Toolbox activeTab={activeLeftPanelTab} />
          <SidePanelTabs
            side="right"
            activeTab={activeLeftPanelTab}
            onChange={setActiveLeftPanelTab}
            tabs={[
              { id: "structure", label: "Element" },
              { id: "pages", label: "Pages" },
              { id: "insert", label: "Insert" },
            ]}
          />
        </div>
        <div className="min-h-0 overflow-y-auto">
          <Canvas />
        </div>
        <div className="relative min-h-0 overflow-hidden border-l pl-6">
          <Inspector activeTab={activeRightPanelTab} />
          <SidePanelTabs
            side="left"
            activeTab={activeRightPanelTab}
            onChange={setActiveRightPanelTab}
            tabs={[
              { id: "content", label: "Content" },
              { id: "style", label: "Style" },
              { id: "arrange", label: "Arrange" },
            ]}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TemplatePage;
