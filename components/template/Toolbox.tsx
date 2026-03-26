// components/template/Toolbox.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  LockOpen,
  Search,
  SquareStack,
  Trash2,
} from "lucide-react";

import TemplateDataMappingPanel from "@/components/shared/TemplateDataMappingPanel";
import PanelSection from "@/components/template/panels/PanelSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getTemplateElementDisplayName,
  getTemplateElementSearchText,
  getTemplatePage,
  isTextTemplateElement,
} from "@/lib/domain/template-document";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";
import {
  type TemplateLeftPanelTab,
  useTemplateUiStore,
} from "@/stores/useTemplateUiStore";

const getElementPreview = (content: string) => {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Empty text";
  }

  if (normalized.length <= 44) {
    return normalized;
  }

  return `${normalized.slice(0, 44)}...`;
};

const Toolbox = ({ activeTab }: { activeTab: TemplateLeftPanelTab }) => {
  const {
    template,
    addPage,
    duplicatePage,
    removePage,
    movePage,
    addTextElement,
    addPlaceholderElement,
    renamePage,
    renameElement,
    toggleElementHidden,
    toggleElementLock,
    moveElementLayer,
    duplicateElements,
    deleteElements,
  } = useTemplateStore();
  const { dataSet } = useDataStore();
  const {
    activePageId,
    selectedElementId,
    selectedElementIds,
    editingElementId,
    setActivePageId,
    setActiveRightPanelTab,
    setSelectedElementId,
    setSelectedElementIds,
    toggleSelectedElementId,
  } = useTemplateUiStore();
  const activePage = getTemplatePage(template.document, activePageId);
  const activePageIndex = template.document.pages.findIndex(
    (page) => page.id === activePage.id,
  );
  const [elementQuery, setElementQuery] = useState("");
  const [renamingElementId, setRenamingElementId] = useState<string | null>(
    null,
  );
  const [renamingValue, setRenamingValue] = useState("");

  const insertPlaceholderToken = (column: string) => {
    const token = `{{${column}}}`;
    const nextElementId = addPlaceholderElement(activePage.id, token);
    setActiveRightPanelTab("content");
    setSelectedElementId(nextElementId);
  };

  const startRename = (elementId: string) => {
    setRenamingElementId(elementId);
    setRenamingValue(getTemplateElementDisplayName(activePage, elementId));
  };

  const commitRename = () => {
    if (!renamingElementId) {
      return;
    }

    renameElement(activePage.id, renamingElementId, renamingValue);
    setRenamingElementId(null);
    setRenamingValue("");
  };

  const orderedElements = [...activePage.elements].reverse();
  const filteredElements = orderedElements.filter((element) =>
    getTemplateElementSearchText(element).includes(
      elementQuery.trim().toLowerCase(),
    ),
  );
  const selectedElements = activePage.elements.filter((element) =>
    selectedElementIds.includes(element.id),
  );
  const hasLockedSelection = selectedElements.some((element) => element.locked);
  const hasHiddenSelection = selectedElements.some((element) => element.hidden);

  const renderPagesPanel = () => (
    <div className="space-y-5">
      <PanelSection
        title="Pages"
        description="Switch pages, rename them, and control ordering from one place."
      >
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{`Active · Page ${activePageIndex + 1}`}</span>
            <span>{`${activePage.size.width} x ${activePage.size.height}`}</span>
          </div>
          <Input
            value={activePage.name}
            onChange={(event) => renamePage(activePage.id, event.target.value)}
            placeholder="Page name"
            aria-label="Active page name"
          />
        </div>

        <div className="mt-4 space-y-1">
          {template.document.pages.map((page, index) => {
            const isActive = page.id === activePage.id;

            return (
              <div
                key={page.id}
                className={`group border-b border-stone-900/10 py-2 dark:border-white/10 ${
                  isActive
                    ? "text-stone-950 dark:text-stone-50"
                    : "text-stone-600 dark:text-stone-400"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setActivePageId(page.id)}
                  onKeyDown={(event) => {
                    if (!event.altKey) {
                      return;
                    }

                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      movePage(page.id, "up");
                      return;
                    }

                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      movePage(page.id, "down");
                    }
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {`P${index + 1}`}
                      </span>
                      <span className="truncate font-medium">{page.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {page.elements.length} elements
                    </div>
                  </div>
                  {isActive ? (
                    <span className="mt-1 h-2 w-2 rounded-full bg-stone-950 dark:bg-stone-50" />
                  ) : null}
                </button>
                <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Move page up"
                    onClick={() => movePage(page.id, "up")}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Move page down"
                    onClick={() => movePage(page.id, "down")}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Duplicate page"
                    onClick={() => {
                      const nextPageId = duplicatePage(page.id);

                      if (nextPageId) {
                        setActivePageId(nextPageId);
                      }
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Delete page"
                    disabled={template.document.pages.length === 1}
                    onClick={() => {
                      const nextPageId = removePage(page.id);
                      setActivePageId(nextPageId ?? activePage.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActivePageId(addPage())}
          >
            Add page
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const nextPageId = duplicatePage(activePage.id);

              if (nextPageId) {
                setActivePageId(nextPageId);
              }
            }}
          >
            Duplicate page
          </Button>
        </div>
      </PanelSection>
    </div>
  );

  const renderStructurePanel = () => (
    <div className="space-y-5">
      <PanelSection
        title="Elements"
        description="Search, select, reorder, and manage elements on the current page."
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={elementQuery}
            onChange={(event) => setElementQuery(event.target.value)}
            className="pl-8"
            placeholder="Search elements"
            aria-label="Search elements"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {filteredElements.length} result
          {filteredElements.length === 1 ? "" : "s"}
        </p>

        {selectedElementIds.length > 0 ? (
          <div className="space-y-2 border-b border-stone-900/10 pb-4 dark:border-white/10">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>
                {selectedElementIds.length === 1
                  ? "Selected element"
                  : `${selectedElementIds.length} selected`}
              </span>
              <span>{`on ${activePage.name}`}</span>
            </div>
            {selectedElementIds.length === 1 && selectedElementId ? (
              <Input
                value={getTemplateElementDisplayName(
                  activePage,
                  selectedElementId,
                )}
                onChange={(event) =>
                  renameElement(
                    activePage.id,
                    selectedElementId,
                    event.target.value,
                  )
                }
                placeholder="Element name"
                aria-label="Selected element name"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  toggleElementLock(activePage.id, selectedElementIds)
                }
              >
                {hasLockedSelection ? <LockOpen /> : <Lock />}
                {hasLockedSelection ? "Unlock" : "Lock"}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  toggleElementHidden(activePage.id, selectedElementIds)
                }
              >
                {hasHiddenSelection ? <Eye /> : <EyeOff />}
                {hasHiddenSelection ? "Show" : "Hide"}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  moveElementLayer(activePage.id, selectedElementIds, "front")
                }
              >
                <Layers />
                Bring to front
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  moveElementLayer(activePage.id, selectedElementIds, "back")
                }
              >
                <SquareStack />
                Send to back
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-1">
          {filteredElements.length > 0 ? (
            filteredElements.map((element) => {
              const isSelected = selectedElementIds.includes(element.id);
              const isEditing = editingElementId === element.id;
              const isRenaming = renamingElementId === element.id;
              const actionIds = isSelected ? selectedElementIds : [element.id];

              return (
                <div
                  key={element.id}
                  className={`group border-b border-stone-900/10 py-2 transition dark:border-white/10 ${
                    isSelected
                      ? "border-stone-950 text-stone-950 dark:border-stone-100 dark:text-stone-50"
                      : "text-stone-600 dark:text-stone-400"
                  }`}
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={(event) => {
                      if (event.shiftKey || event.metaKey || event.ctrlKey) {
                        toggleSelectedElementId(element.id);
                        return;
                      }

                      setSelectedElementId(element.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        startRename(element.id);
                      }
                    }}
                  >
                    <div className="mt-1 h-5 w-0.5 shrink-0 bg-transparent group-focus-within:bg-stone-950 group-hover:bg-stone-950/35 dark:group-focus-within:bg-stone-50 dark:group-hover:bg-stone-50/35" />
                    <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                      {element.hidden ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      {element.locked ? (
                        <Lock className="size-3.5" />
                      ) : (
                        <LockOpen className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      {isRenaming ? (
                        <Input
                          value={renamingValue}
                          onChange={(event) =>
                            setRenamingValue(event.target.value)
                          }
                          onBlur={commitRename}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitRename();
                              return;
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              setRenamingElementId(null);
                              setRenamingValue("");
                            }
                          }}
                          className="h-7"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="truncate text-sm font-medium"
                          onDoubleClick={() => startRename(element.id)}
                        >
                          {getTemplateElementDisplayName(
                            activePage,
                            element.id,
                          )}
                        </div>
                      )}
                      <div className="truncate text-xs text-muted-foreground">
                        {isTextTemplateElement(element)
                          ? getElementPreview(element.content ?? "")
                          : "Element"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{element.type}</span>
                        {element.hidden ? <span>hidden</span> : null}
                        {element.locked ? <span>locked</span> : null}
                        {isEditing ? <span>editing</span> : null}
                        {selectedElementId === element.id &&
                        selectedElementIds.length > 1 ? (
                          <span>primary</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      {`${Math.round(element.x)}, ${Math.round(element.y)}`}
                    </div>
                  </button>

                  <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={
                        element.hidden ? "Show element" : "Hide element"
                      }
                      onClick={() => {
                        toggleElementHidden(activePage.id, actionIds);

                        if (!isSelected) {
                          setSelectedElementId(element.id);
                        }
                      }}
                    >
                      {element.hidden ? <Eye /> : <EyeOff />}
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={
                        element.locked ? "Unlock element" : "Lock element"
                      }
                      onClick={() => {
                        toggleElementLock(activePage.id, actionIds);

                        if (!isSelected) {
                          setSelectedElementId(element.id);
                        }
                      }}
                    >
                      {element.locked ? <LockOpen /> : <Lock />}
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Bring forward"
                      onClick={() => {
                        moveElementLayer(activePage.id, actionIds, "forward");

                        if (!isSelected) {
                          setSelectedElementId(element.id);
                        }
                      }}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Send backward"
                      onClick={() => {
                        moveElementLayer(activePage.id, actionIds, "backward");

                        if (!isSelected) {
                          setSelectedElementId(element.id);
                        }
                      }}
                    >
                      <ChevronDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Duplicate element"
                      onClick={() => {
                        const nextIds = duplicateElements(
                          activePage.id,
                          actionIds,
                        );

                        if (nextIds.length > 0) {
                          setSelectedElementIds(nextIds);
                        }
                      }}
                    >
                      <Copy />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Delete element"
                      onClick={() => {
                        deleteElements(activePage.id, actionIds);

                        if (isSelected) {
                          setSelectedElementIds(
                            selectedElementIds.filter(
                              (id) => !actionIds.includes(id),
                            ),
                          );
                          return;
                        }

                        if (selectedElementId === element.id) {
                          setSelectedElementId(null);
                        }
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : activePage.elements.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              No matching elements on this page.
            </p>
          ) : (
            <div className="space-y-3 text-xs text-muted-foreground">
              <p>No elements on this page yet.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveRightPanelTab("content");
                    setSelectedElementId(addTextElement(activePage.id));
                  }}
                >
                  Add text
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveRightPanelTab("content");
                    setSelectedElementId(addPlaceholderElement(activePage.id));
                  }}
                >
                  Add placeholder
                </Button>
              </div>
            </div>
          )}
        </div>
      </PanelSection>

      <PanelSection
        title="Placeholder Mapping"
        description="Use this as the editor-side checklist before switching to generation."
        defaultOpen={false}
      >
        <TemplateDataMappingPanel
          document={template.document}
          table={dataSet.table}
          className="border-0 pt-0"
          compact
        />
      </PanelSection>
    </div>
  );

  const renderInsertPanel = () => (
    <div className="space-y-5">
      <PanelSection
        title="Insert"
        description="Keep creation quick. Structure management stays in its own tab."
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const nextElementId = addTextElement(activePage.id);
              setActiveRightPanelTab("content");
              setSelectedElementId(nextElementId);
            }}
          >
            Add text
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const nextElementId = addPlaceholderElement(activePage.id);
              setActiveRightPanelTab("content");
              setSelectedElementId(nextElementId);
            }}
          >
            Add placeholder
          </Button>
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Quick placeholder
          </div>
          <div className="flex flex-wrap gap-2">
            {dataSet.table.columns.length > 0 ? (
              dataSet.table.columns.slice(0, 8).map((column) => (
                <Button
                  key={column}
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => insertPlaceholderToken(column)}
                >
                  {`{{${column}}}`}
                </Button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No dataset columns yet. Add or import data to get placeholder
                suggestions here.
              </p>
            )}
          </div>
        </div>
      </PanelSection>
    </div>
  );

  return activeTab === "pages"
    ? renderPagesPanel()
    : activeTab === "insert"
      ? renderInsertPanel()
      : renderStructurePanel();
};

export default Toolbox;
