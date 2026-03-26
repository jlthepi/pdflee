// components/template/MenuBar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MenubarCheckboxItem,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useDataStore } from "@/stores/useDataStore";
import { getTemplatePage } from "@/lib/domain/template-document";
import { exportTemplate, importTemplate } from "@/lib/templates";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";
import type { PersistedTemplate, TemplateRecord } from "@/types/domain";

const toDraft = (template: PersistedTemplate) => ({
  id: template.record.id,
  name: template.record.name,
  description: template.version.description,
  currentVersion: template.version.version,
  document: template.version.document,
});

const MenuBar = () => {
  const { dataSet } = useDataStore();
  const {
    template,
    setTemplate,
    canRedo,
    canUndo,
    styleClipboard,
    deleteElements,
    duplicateElements,
    addTextElement,
    addPlaceholderElement,
    movePage,
    copyElementStyle,
    pasteElementStyle,
    moveElementLayer,
    toggleElementHidden,
    toggleElementLock,
    applyStylePreset,
    redo,
    undo,
  } = useTemplateStore();
  const {
    activePageId,
    selectedElementIds,
    setActivePageId,
    setSelectedElementId,
    setSelectedElementIds,
    clearSelectedElements,
  } = useTemplateUiStore();
  const activePage = getTemplatePage(template.document, activePageId);
  const selectedElements = activePage.elements.filter((element) =>
    selectedElementIds.includes(element.id),
  );
  const [importOpen, setImportOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = async () => {
    const response = await fetch("/api/templates");
    const payload = (await response.json()) as {
      ok: boolean;
      data: TemplateRecord[];
    };

    if (payload.ok) {
      return payload.data;
    }

    return null;
  };

  useEffect(() => {
    let active = true;

    if (libraryOpen) {
      void fetchTemplates().then((nextTemplates) => {
        if (active && nextTemplates) {
          setTemplates(nextTemplates);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [libraryOpen]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = await importTemplate(file);
      setTemplate(parsed, { persisted: false });
      setActivePageId(parsed.document.pages[0]?.id ?? null);
      setImportOpen(false);
      toast.success("Template draft loaded");
    } catch {
      toast.error("Failed to load template draft");
    }
  };

  const handleSave = async () => {
    const response = await fetch(
      template.id ? `/api/templates/${template.id}` : "/api/templates",
      {
        method: template.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: PersistedTemplate;
    };

    if (!payload.ok) {
      toast.error("Template save failed");
      return;
    }

    setTemplate(toDraft(payload.data), { persisted: true });
    setActivePageId(payload.data.version.document.pages[0]?.id ?? null);
    toast.success(`Template saved as version ${payload.data.version.version}`);
  };

  const handleLoadTemplate = async (templateId: string) => {
    const response = await fetch(`/api/templates/${templateId}`);
    const payload = (await response.json()) as {
      ok: boolean;
      data: PersistedTemplate;
    };

    if (!payload.ok) {
      toast.error("Failed to load saved template");
      return;
    }

    setTemplate(toDraft(payload.data), { persisted: true });
    setLibraryOpen(false);
    setActivePageId(payload.data.version.document.pages[0]?.id ?? null);
    toast.success("Template loaded");
  };

  const duplicateSelected = (offset?: { x: number; y: number }) => {
    const nextIds = duplicateElements(
      activePage.id,
      selectedElementIds,
      offset,
    );

    if (nextIds.length > 0) {
      setSelectedElementIds(nextIds);
    }
  };

  const insertPresetBlock = (presetId: string) => {
    const preset = template.document.stylePresets?.find(
      (candidate) => candidate.id === presetId,
    );

    if (!preset) {
      return;
    }

    const nextId = addTextElement(activePage.id);
    applyStylePreset(activePage.id, [nextId], preset);
    setSelectedElementId(nextId);
  };

  return (
    <div className="border-b border-stone-900/12 pb-2 dark:border-white/10">
      <Menubar className="h-auto rounded-none border-0 bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setImportOpen(true)}>
              Import Draft <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => exportTemplate(template)}>
              Export Draft <MenubarShortcut>⌘E</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => void handleSave()}>
              Save Version <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={() => setLibraryOpen(true)}>
              Load Saved
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled>
              Current version: {template.currentVersion ?? 0}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled={!canUndo} onClick={undo}>
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem disabled={!canRedo} onClick={redo}>
              Redo
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() =>
                setSelectedElementIds(
                  activePage.elements.map((element) => element.id),
                )
              }
            >
              Select All
              <MenubarShortcut>⌘A</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={clearSelectedElements}
            >
              Clear Selection
              <MenubarShortcut>Esc</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() => {
                deleteElements(activePage.id, selectedElementIds);
                clearSelectedElements();
              }}
            >
              Delete Selected
              <MenubarShortcut>⌫</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Structure</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Page</MenubarLabel>
            <MenubarItem
              onClick={() => setActivePageId(movePage(activePage.id, "up"))}
            >
              Move Page Up
              <MenubarShortcut>⌥↑</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              onClick={() => setActivePageId(movePage(activePage.id, "down"))}
            >
              Move Page Down
              <MenubarShortcut>⌥↓</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarLabel>Selection</MenubarLabel>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                moveElementLayer(activePage.id, selectedElementIds, "forward")
              }
            >
              Bring Forward
              <MenubarShortcut>⌘]</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                moveElementLayer(activePage.id, selectedElementIds, "backward")
              }
            >
              Send Backward
              <MenubarShortcut>⌘[</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                moveElementLayer(activePage.id, selectedElementIds, "front")
              }
            >
              Bring to Front
              <MenubarShortcut>⇧⌘]</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                moveElementLayer(activePage.id, selectedElementIds, "back")
              }
            >
              Send to Back
              <MenubarShortcut>⇧⌘[</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              checked={selectedElements.some((element) => element.locked)}
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                toggleElementLock(activePage.id, selectedElementIds)
              }
            >
              Lock / Unlock
              <MenubarShortcut>⌘L</MenubarShortcut>
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              checked={selectedElements.some((element) => element.hidden)}
              disabled={selectedElementIds.length === 0}
              onClick={() =>
                toggleElementHidden(activePage.id, selectedElementIds)
              }
            >
              Hide / Show
              <MenubarShortcut>⇧⌘H</MenubarShortcut>
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() => duplicateSelected()}
            >
              Duplicate with Offset
              <MenubarShortcut>⌘D</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() => duplicateSelected({ x: 0, y: 0 })}
            >
              Duplicate in Place
              <MenubarShortcut>⇧⌘D</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Style</MenubarTrigger>
          <MenubarContent>
            <MenubarSeparator />
            <MenubarItem
              disabled={selectedElementIds.length === 0}
              onClick={() => {
                copyElementStyle(activePage.id, selectedElementIds[0]);
                toast.success("Style copied");
              }}
            >
              Copy Style
              <MenubarShortcut>⇧⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              disabled={selectedElementIds.length === 0 || !styleClipboard}
              onClick={() => {
                pasteElementStyle(activePage.id, selectedElementIds);
                toast.success("Style pasted");
              }}
            >
              Paste Style
              <MenubarShortcut>⇧⌘V</MenubarShortcut>
            </MenubarItem>
            {(template.document.stylePresets?.length ?? 0) > 0 ? (
              <>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger disabled={selectedElementIds.length === 0}>
                    Apply Preset
                  </MenubarSubTrigger>
                  <MenubarSubContent>
                    {(template.document.stylePresets ?? []).map((preset) => (
                      <MenubarItem
                        key={preset.id}
                        onClick={() => {
                          applyStylePreset(
                            activePage.id,
                            selectedElementIds,
                            preset,
                          );
                          toast.success(`Preset applied: ${preset.name}`);
                        }}
                      >
                        {preset.name}
                      </MenubarItem>
                    ))}
                  </MenubarSubContent>
                </MenubarSub>
              </>
            ) : null}
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Insert</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() =>
                setSelectedElementId(addTextElement(activePage.id))
              }
            >
              Text
            </MenubarItem>
            <MenubarItem
              onClick={() =>
                setSelectedElementId(addPlaceholderElement(activePage.id))
              }
            >
              Placeholder
            </MenubarItem>
            {dataSet.table.columns.length > 0 ? (
              <>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Quick Placeholder</MenubarSubTrigger>
                  <MenubarSubContent>
                    {dataSet.table.columns.map((column) => (
                      <MenubarItem
                        key={column}
                        onClick={() =>
                          setSelectedElementId(
                            addPlaceholderElement(
                              activePage.id,
                              `{{${column}}}`,
                            ),
                          )
                        }
                      >
                        {column}
                      </MenubarItem>
                    ))}
                  </MenubarSubContent>
                </MenubarSub>
              </>
            ) : null}
            {(template.document.stylePresets?.length ?? 0) > 0 ? (
              <>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Preset Text Block</MenubarSubTrigger>
                  <MenubarSubContent>
                    {(template.document.stylePresets ?? []).map((preset) => (
                      <MenubarItem
                        key={preset.id}
                        onClick={() => insertPresetBlock(preset.id)}
                      >
                        {preset.name}
                      </MenubarItem>
                    ))}
                  </MenubarSubContent>
                </MenubarSub>
              </>
            ) : null}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Template Draft</DialogTitle>
            <DialogDescription>
              Import a previously exported JSON draft.
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Templates</DialogTitle>
            <DialogDescription>
              Load the latest saved version from the local SQLite store.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {templates.map((record) => (
              <button
                key={record.id}
                type="button"
                className="rounded-lg border px-3 py-2 text-left hover:bg-muted"
                onClick={() => void handleLoadTemplate(record.id)}
              >
                <div className="font-medium">{record.name}</div>
                <div className="text-xs text-muted-foreground">
                  Version {record.currentVersion} ·{" "}
                  {new Date(record.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
            {templates.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No saved templates yet.
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuBar;
