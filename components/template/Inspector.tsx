// components/template/Inspector.tsx
"use client";

import type { ChangeEvent } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  LockOpen,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  SquareStack,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  buildLongestPlaceholderPreviewContent,
  hasTemplatePlaceholders,
} from "@/lib/domain/placeholders";
import {
  getTemplatePage,
  isTextTemplateElement,
} from "@/lib/domain/template-document";
import {
  TEMPLATE_EDITOR_GRID_SIZE,
  TEMPLATE_EDITOR_NUDGE_LARGE_STEP,
  TEMPLATE_EDITOR_NUDGE_STEP,
  TEMPLATE_EDITOR_SAFE_AREA,
} from "@/lib/domain/template-editor";
import type { TemplateTextElement } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";
import {
  type TemplateRightPanelTab,
  useTemplateUiStore,
} from "@/stores/useTemplateUiStore";

const Inspector = ({ activeTab }: { activeTab: TemplateRightPanelTab }) => {
  const { dataSet } = useDataStore();
  const {
    template,
    styleClipboard,
    updateElement,
    updateMeta,
    setPageSize,
    moveElementsBy,
    alignElementsOnPage,
    distributeElementsOnPage,
    moveElementLayer,
    setElementHidden,
    toggleElementHidden,
    setElementLock,
    toggleElementLock,
    duplicateElements,
    deleteElements,
    copyElementStyle,
    pasteElementStyle,
    applyStylePreset,
  } = useTemplateStore();
  const {
    activePageId,
    selectedElementIds,
    setSelectedElementIds,
    clearSelectedElements,
    showSafeArea,
    setShowSafeArea,
  } = useTemplateUiStore();
  const activePage = getTemplatePage(template.document, activePageId);
  const selectedElements = activePage.elements.filter((element) =>
    selectedElementIds.includes(element.id),
  );
  const selectedElement =
    selectedElements.length === 1 ? selectedElements[0] : null;
  const selectedTextElement: TemplateTextElement | null =
    selectedElement && isTextTemplateElement(selectedElement)
      ? selectedElement
      : null;
  const longestPreviewContent = selectedTextElement
    ? buildLongestPlaceholderPreviewContent(
        selectedTextElement.content ?? "",
        dataSet.table,
      )
    : "";
  const hasLockedSelection = selectedElements.some((element) => element.locked);
  const hasHiddenSelection = selectedElements.some((element) => element.hidden);
  const primaryElement = selectedElements[0] ?? null;

  const handleChange = (
    field: keyof NonNullable<typeof selectedTextElement>,
    value: string | number,
  ) => {
    if (!selectedTextElement || selectedTextElement.locked) {
      return;
    }

    updateElement(activePage.id, selectedTextElement.id, { [field]: value });
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (selectedElementIds.length === 0) {
      return;
    }

    moveElementsBy(activePage.id, selectedElementIds, dx, dy);
  };

  const appendPlaceholder = (placeholderName: string) => {
    if (!selectedTextElement || selectedTextElement.locked) {
      return;
    }

    const token = `{{${placeholderName}}}`;
    const currentContent = selectedTextElement.content ?? "";
    const separator = currentContent.trim().length > 0 ? " " : "";

    updateElement(activePage.id, selectedTextElement.id, {
      content: `${currentContent}${separator}${token}`.trim(),
    });
  };

  const duplicateSelected = () => {
    const nextIds = duplicateElements(activePage.id, selectedElementIds);

    if (nextIds.length > 0) {
      setSelectedElementIds(nextIds);
    }
  };

  const copyStyle = () => {
    if (!primaryElement) {
      return;
    }

    copyElementStyle(activePage.id, primaryElement.id);
    toast.success("Style copied");
  };

  const pasteStyle = () => {
    if (selectedElementIds.length === 0 || !styleClipboard) {
      return;
    }

    pasteElementStyle(activePage.id, selectedElementIds);
    toast.success(
      selectedElementIds.length === 1
        ? "Style pasted"
        : `Style pasted to ${selectedElementIds.length} elements`,
    );
  };

  const applyPreset = (presetId: string) => {
    const preset = template.document.stylePresets?.find(
      (candidate) => candidate.id === presetId,
    );

    if (!preset) {
      return;
    }

    if (selectedElementIds.length === 0) {
      return;
    }

    applyStylePreset(activePage.id, selectedElementIds, preset);
    toast.success(
      selectedElementIds.length === 1
        ? "Preset applied"
        : `Preset applied to ${selectedElementIds.length} elements`,
    );
  };

  const renderContentTab = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="templateName">Template Name</Label>
        <Input
          id="templateName"
          value={template.name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateMeta({ name: event.target.value })
          }
        />
        <Label htmlFor="templateDescription">Description</Label>
        <Input
          id="templateDescription"
          value={template.description}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateMeta({ description: event.target.value })
          }
        />
      </div>

      <Separator />

      <div className="space-y-1">
        <div className="text-sm font-medium">Content</div>
        <p className="text-xs text-muted-foreground">
          Edit template copy and selected text content without mixing in layout
          controls.
        </p>
      </div>

      {selectedTextElement ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Input
              id="content"
              disabled={selectedTextElement.locked}
              value={selectedTextElement.content ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("content", event.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Use placeholder tokens like {`{{name}}`} inside any text block.
            </p>
            {hasTemplatePlaceholders(selectedTextElement.content ?? "") ? (
              <p className="text-xs text-muted-foreground">
                {`Resolved preview sample: ${longestPreviewContent || "No matching data columns"}`}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Insert Dataset Placeholder</Label>
            <div className="flex flex-wrap gap-2">
              {dataSet.table.columns.length > 0 ? (
                dataSet.table.columns.map((column) => (
                  <Button
                    key={column}
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={selectedTextElement.locked}
                    onClick={() => appendPlaceholder(column)}
                  >
                    {`{{${column}}}`}
                  </Button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add dataset columns first to insert placeholders quickly.
                </p>
              )}
            </div>
          </div>
        </>
      ) : selectedElementIds.length > 0 ? (
        <div className="border-t border-dashed border-stone-900/12 pt-4 text-sm text-muted-foreground dark:border-white/10">
          Select a text or placeholder element to edit its content here.
        </div>
      ) : (
        <div className="border-t border-dashed border-stone-900/12 pt-4 text-sm text-muted-foreground dark:border-white/10">
          Select a text element or create a new one from the Insert tab.
        </div>
      )}
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-sm font-medium">Style</div>
        <p className="text-xs text-muted-foreground">
          Apply presets or fine-tune typography for the current selection.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!primaryElement}
            onClick={copyStyle}
          >
            <Copy />
            Copy style
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!styleClipboard || selectedElementIds.length === 0}
            onClick={pasteStyle}
          >
            Paste style
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(template.document.stylePresets ?? []).map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={selectedElementIds.length === 0}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedTextElement ? (
        <>
          <Separator />

          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Input
              id="fontFamily"
              disabled={selectedTextElement.locked}
              value={selectedTextElement.fontFamily ?? ""}
              placeholder="Default system font stack"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("fontFamily", event.target.value)
              }
            />
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              disabled={selectedTextElement.locked}
              value={selectedTextElement.fontSize}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("fontSize", Number(event.target.value))
              }
            />
            <Label htmlFor="lineHeight">Line Height</Label>
            <Input
              id="lineHeight"
              type="number"
              step="0.05"
              min="1"
              disabled={selectedTextElement.locked}
              value={selectedTextElement.lineHeight ?? 1.4}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleChange("lineHeight", Number(event.target.value))
              }
            />
            <Label htmlFor="fontWeight">Font Weight</Label>
            <select
              id="fontWeight"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              disabled={selectedTextElement.locked}
              value={selectedTextElement.fontWeight ?? "normal"}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                handleChange("fontWeight", event.target.value)
              }
            >
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Font Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                disabled={selectedTextElement.locked}
                value={selectedTextElement.color}
                className="h-10 w-16 p-1"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleChange("color", event.target.value)
                }
              />
              <Input
                disabled={selectedTextElement.locked}
                value={selectedTextElement.color}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleChange("color", event.target.value)
                }
              />
            </div>
          </div>
        </>
      ) : (
        <div className="border-t border-dashed border-stone-900/12 pt-4 text-sm text-muted-foreground dark:border-white/10">
          Select a text element to edit font controls. Presets and style paste
          stay available for batch work.
        </div>
      )}
    </div>
  );

  const renderArrangeTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Page Arrangement</div>
          <p className="text-xs text-muted-foreground">
            These controls affect the current page canvas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="pageWidth">Page Width</Label>
            <Input
              id="pageWidth"
              type="number"
              min={1}
              value={activePage.size.width}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPageSize(activePage.id, {
                  ...activePage.size,
                  width: Math.max(Number(event.target.value) || 1, 1),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pageHeight">Page Height</Label>
            <Input
              id="pageHeight"
              type="number"
              min={1}
              value={activePage.size.height}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setPageSize(activePage.id, {
                  ...activePage.size,
                  height: Math.max(Number(event.target.value) || 1, 1),
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-dashed border-stone-900/10 py-2 text-sm dark:border-white/10">
          <div>
            <div className="font-medium">Safe area</div>
            <p className="text-xs text-muted-foreground">
              {`Inset guides render ${TEMPLATE_EDITOR_SAFE_AREA}px from each page edge.`}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowSafeArea(!showSafeArea)}
          >
            {showSafeArea ? "Hide guides" : "Show guides"}
          </Button>
        </div>
      </div>

      {selectedElementIds.length > 0 ? (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Selection</div>
              <p className="text-xs text-muted-foreground">
                {selectedElementIds.length === 1
                  ? `Editing one element on ${activePage.name}.`
                  : `${selectedElementIds.length} elements selected on ${activePage.name}. Batch actions apply to the whole selection.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={duplicateSelected}
              >
                <Copy />
                Duplicate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  deleteElements(activePage.id, selectedElementIds);
                  clearSelectedElements();
                }}
              >
                <Trash2 />
                Delete
              </Button>
              <Button
                type="button"
                size="sm"
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
                size="sm"
                variant="outline"
                onClick={() =>
                  toggleElementHidden(activePage.id, selectedElementIds)
                }
              >
                {hasHiddenSelection ? <Eye /> : <EyeOff />}
                {hasHiddenSelection ? "Show" : "Hide"}
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Move up"
                onClick={() =>
                  nudgeSelected(0, -TEMPLATE_EDITOR_NUDGE_LARGE_STEP)
                }
              >
                <MoveUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Move left"
                onClick={() =>
                  nudgeSelected(-TEMPLATE_EDITOR_NUDGE_LARGE_STEP, 0)
                }
              >
                <MoveLeft />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Move right"
                onClick={() =>
                  nudgeSelected(TEMPLATE_EDITOR_NUDGE_LARGE_STEP, 0)
                }
              >
                <MoveRight />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Move down"
                onClick={() =>
                  nudgeSelected(0, TEMPLATE_EDITOR_NUDGE_LARGE_STEP)
                }
              >
                <MoveDown />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {`Pointer drag and resize snap to ${TEMPLATE_EDITOR_GRID_SIZE}px. Arrow nudges move by ${TEMPLATE_EDITOR_NUDGE_STEP}px, and the larger move controls use ${TEMPLATE_EDITOR_NUDGE_LARGE_STEP}px steps.`}
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Structure</Label>
              <p className="text-xs text-muted-foreground">
                Manage layer order, visibility, and lock state without leaving
                the editor.
              </p>
            </div>
            {selectedElement ? (
              <div className="space-y-2">
                <Label htmlFor="elementName">Element Name</Label>
                <Input
                  id="elementName"
                  value={selectedElement.name ?? ""}
                  disabled={selectedElement.locked}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateElement(activePage.id, selectedElement.id, {
                      name: event.target.value,
                    })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setElementLock(
                        activePage.id,
                        [selectedElement.id],
                        !selectedElement.locked,
                      )
                    }
                  >
                    {selectedElement.locked ? <LockOpen /> : <Lock />}
                    {selectedElement.locked ? "Unlock" : "Lock"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setElementHidden(
                        activePage.id,
                        [selectedElement.id],
                        !selectedElement.hidden,
                      )
                    }
                  >
                    {selectedElement.hidden ? <Eye /> : <EyeOff />}
                    {selectedElement.hidden ? "Show" : "Hide"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Batch structure actions apply to the current selection.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  moveElementLayer(activePage.id, selectedElementIds, "forward")
                }
              >
                <Layers />
                Bring forward
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  moveElementLayer(
                    activePage.id,
                    selectedElementIds,
                    "backward",
                  )
                }
              >
                <Layers />
                Send backward
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  moveElementLayer(activePage.id, selectedElementIds, "front")
                }
              >
                <SquareStack />
                To front
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  moveElementLayer(activePage.id, selectedElementIds, "back")
                }
              >
                <SquareStack />
                To back
              </Button>
            </div>
          </div>

          {selectedTextElement ? (
            <>
              <Separator />

              <div className="space-y-2">
                <Label>Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    disabled={selectedTextElement.locked}
                    value={selectedTextElement.x}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("x", Number(event.target.value))
                    }
                  />
                  <Input
                    type="number"
                    disabled={selectedTextElement.locked}
                    value={selectedTextElement.y}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("y", Number(event.target.value))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Box Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    disabled={selectedTextElement.locked}
                    value={selectedTextElement.width ?? 220}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("width", Number(event.target.value))
                    }
                  />
                  <Input
                    type="number"
                    disabled={selectedTextElement.locked}
                    value={selectedTextElement.height ?? 44}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      handleChange("height", Number(event.target.value))
                    }
                  />
                </div>
              </div>
            </>
          ) : null}

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Align on Page</Label>
              <p className="text-xs text-muted-foreground">
                For multi-select, alignment moves the whole selection block as a
                group.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(activePage.id, selectedElementIds, "left")
                }
              >
                <AlignHorizontalJustifyStart />
                Left
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(
                    activePage.id,
                    selectedElementIds,
                    "center",
                  )
                }
              >
                <AlignHorizontalJustifyCenter />
                Center
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(
                    activePage.id,
                    selectedElementIds,
                    "right",
                  )
                }
              >
                <AlignHorizontalJustifyEnd />
                Right
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(activePage.id, selectedElementIds, "top")
                }
              >
                <AlignVerticalJustifyStart />
                Top
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(
                    activePage.id,
                    selectedElementIds,
                    "middle",
                  )
                }
              >
                <AlignVerticalJustifyCenter />
                Middle
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  alignElementsOnPage(
                    activePage.id,
                    selectedElementIds,
                    "bottom",
                  )
                }
              >
                <AlignVerticalJustifyEnd />
                Bottom
              </Button>
            </div>
          </div>

          {selectedElementIds.length > 2 ? (
            <>
              <Separator />

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Distribute</Label>
                  <p className="text-xs text-muted-foreground">
                    Evenly space the selected elements while keeping the outer
                    elements anchored.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      distributeElementsOnPage(
                        activePage.id,
                        selectedElementIds,
                        "horizontal",
                      )
                    }
                  >
                    Distribute X
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      distributeElementsOnPage(
                        activePage.id,
                        selectedElementIds,
                        "vertical",
                      )
                    }
                  >
                    Distribute Y
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="border-t border-dashed border-stone-900/12 pt-4 dark:border-white/10">
          <div className="text-sm font-medium">No Element Selected</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Page size and safe area stay available here. Select one or more
            elements to unlock alignment, layer, and geometry controls.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setSelectedElementIds(
                  activePage.elements.map((element) => element.id),
                )
              }
            >
              Select page elements
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ScrollArea className="h-full border-stone-900/12 pl-6 dark:border-white/10">
      {activeTab === "content"
        ? renderContentTab()
        : activeTab === "style"
          ? renderStyleTab()
          : renderArrangeTab()}
    </ScrollArea>
  );
};

export default Inspector;
