// components/template/TemplateElementContextMenu.tsx
"use client";

import type { ReactNode } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  SquareStack,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";

const TemplateElementContextMenu = ({
  pageId,
  elementId,
  children,
}: {
  pageId: string;
  elementId: string;
  children: ReactNode;
}) => {
  const {
    styleClipboard,
    duplicateElements,
    deleteElements,
    alignElementsOnPage,
    moveElementLayer,
    toggleElementLock,
    toggleElementHidden,
    copyElementStyle,
    pasteElementStyle,
  } = useTemplateStore();
  const { selectedElementIds, setSelectedElementId, setSelectedElementIds } =
    useTemplateUiStore();
  const actionElementIds = selectedElementIds.includes(elementId)
    ? selectedElementIds
    : [elementId];

  const duplicateSelected = (offset?: { x: number; y: number }) => {
    const nextIds = duplicateElements(pageId, actionElementIds, offset);

    if (nextIds.length > 0) {
      setSelectedElementIds(nextIds);
    }
  };

  const deleteSelected = () => {
    deleteElements(pageId, actionElementIds);
    setSelectedElementId(null);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-56">
        <ContextMenuLabel>
          {actionElementIds.length > 1
            ? "Selected elements"
            : "Selected element"}
        </ContextMenuLabel>
        <ContextMenuItem
          onSelect={() => copyElementStyle(pageId, actionElementIds[0])}
        >
          <ClipboardCopy />
          Copy style
          <ContextMenuShortcut>⇧⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!styleClipboard}
          onSelect={() => {
            pasteElementStyle(pageId, actionElementIds);
            toast.success("Style pasted");
          }}
        >
          <ClipboardPaste />
          Paste style
          <ContextMenuShortcut>⇧⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => duplicateSelected()}>
          <Copy />
          Duplicate with offset
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => duplicateSelected({ x: 0, y: 0 })}>
          <Copy />
          Duplicate in place
          <ContextMenuShortcut>⇧⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => toggleElementLock(pageId, actionElementIds)}
        >
          <Lock />
          Lock / Unlock
          <ContextMenuShortcut>⌘L</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => toggleElementHidden(pageId, actionElementIds)}
        >
          {actionElementIds.length === 1 ? <EyeOff /> : <Eye />}
          Hide / Show
          <ContextMenuShortcut>⇧⌘H</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={deleteSelected} variant="destructive">
          <Trash2 />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers />
            Arrange
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onSelect={() =>
                moveElementLayer(pageId, actionElementIds, "forward")
              }
            >
              <Layers />
              Bring forward
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                moveElementLayer(pageId, actionElementIds, "backward")
              }
            >
              <Layers />
              Send backward
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                moveElementLayer(pageId, actionElementIds, "front")
              }
            >
              <SquareStack />
              Bring to front
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                moveElementLayer(pageId, actionElementIds, "back")
              }
            >
              <SquareStack />
              Send to back
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Align on page</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "left")
              }
            >
              <AlignHorizontalJustifyStart />
              Left
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "center")
              }
            >
              <AlignHorizontalJustifyCenter />
              Center
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "right")
              }
            >
              <AlignHorizontalJustifyEnd />
              Right
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "top")
              }
            >
              <AlignVerticalJustifyStart />
              Top
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "middle")
              }
            >
              <AlignVerticalJustifyCenter />
              Middle
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() =>
                alignElementsOnPage(pageId, actionElementIds, "bottom")
              }
            >
              <AlignVerticalJustifyEnd />
              Bottom
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TemplateElementContextMenu;
