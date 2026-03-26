// components/template/TemplateCanvasContextMenu.tsx
"use client";

import { Children, cloneElement, isValidElement, useState } from "react";
import type { MouseEvent, ReactElement } from "react";
import { Braces, ClipboardPaste, Plus, Type } from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";

type ContextPoint = {
  x: number;
  y: number;
};

const TemplateCanvasContextMenu = ({
  pageId,
  children,
}: {
  pageId: string;
  children: ReactElement;
}) => {
  const { dataSet } = useDataStore();
  const {
    styleClipboard,
    addTextElement,
    addPlaceholderElement,
    pasteElementStyle,
  } = useTemplateStore();
  const { selectedElementIds, setSelectedElementId } = useTemplateUiStore();
  const [contextPoint, setContextPoint] = useState<ContextPoint | null>(null);

  const insertTextAtContext = () => {
    const nextId = addTextElement(pageId, contextPoint ?? undefined);
    setSelectedElementId(nextId);
  };

  const insertPlaceholderAtContext = () => {
    const nextId = addPlaceholderElement(
      pageId,
      undefined,
      contextPoint ?? undefined,
    );
    setSelectedElementId(nextId);
  };

  const insertDatasetPlaceholderAtContext = (column: string) => {
    const nextId = addPlaceholderElement(
      pageId,
      `{{${column}}}`,
      contextPoint ?? undefined,
    );
    setSelectedElementId(nextId);
  };

  const onlyChild = Children.only(children);

  if (
    !isValidElement<{
      onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
    }>(onlyChild)
  ) {
    return children;
  }

  const enhancedChild = cloneElement(onlyChild, {
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      onlyChild.props.onContextMenu?.(event);

      if (event.target !== event.currentTarget) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      setContextPoint({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      setSelectedElementId(null);
    },
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{enhancedChild}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        <ContextMenuLabel>Canvas actions</ContextMenuLabel>
        <ContextMenuItem onSelect={insertTextAtContext}>
          <Type />
          Add text here
        </ContextMenuItem>
        <ContextMenuItem onSelect={insertPlaceholderAtContext}>
          <Braces />
          Add placeholder here
        </ContextMenuItem>
        {dataSet.table.columns.length > 0 ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Braces />
                Insert dataset placeholder
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {dataSet.table.columns.map((column) => (
                  <ContextMenuItem
                    key={column}
                    onSelect={() => insertDatasetPlaceholderAtContext(column)}
                  >
                    {column}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        ) : null}
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!styleClipboard || selectedElementIds.length === 0}
          onSelect={() => {
            pasteElementStyle(pageId, selectedElementIds);
            toast.success("Style pasted");
          }}
        >
          <ClipboardPaste />
          Paste style
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            const nextId = addTextElement(pageId);
            setSelectedElementId(nextId);
          }}
        >
          <Plus />
          Add text at default position
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TemplateCanvasContextMenu;
