// components/template/TemplateCanvasContextMenu.tsx
"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";
import type { MouseEvent, ReactElement } from "react";
import {
  Box,
  Braces,
  ClipboardPaste,
  Image as ImageIcon,
  Minus,
  Plus,
  Type,
} from "lucide-react";
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

const readImageFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Image file did not produce a data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Image read failed"));
    reader.readAsDataURL(file);
  });
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
    addBoxElement,
    addLineElement,
    addImageElement,
    pasteElementStyle,
  } = useTemplateStore();
  const { selectedElementIds, setSelectedElementId } = useTemplateUiStore();
  const [contextPoint, setContextPoint] = useState<ContextPoint | null>(null);
  const [pendingImagePoint, setPendingImagePoint] =
    useState<ContextPoint | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const insertBoxAtContext = () => {
    const nextId = addBoxElement(pageId, contextPoint ?? undefined);
    setSelectedElementId(nextId);
  };

  const insertLineAtContext = () => {
    const nextId = addLineElement(pageId, contextPoint ?? undefined);
    setSelectedElementId(nextId);
  };

  const requestImageAtContext = () => {
    setPendingImagePoint(contextPoint);
    window.setTimeout(() => imageInputRef.current?.click(), 0);
  };

  const handleImageFileInsert = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const insertPoint = pendingImagePoint ?? contextPoint ?? undefined;
    event.target.value = "";
    setPendingImagePoint(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      const nextId = addImageElement(pageId, {
        src: dataUrl,
        alt: file.name,
        position: insertPoint,
      });
      setSelectedElementId(nextId);
      toast.success("Image embedded");
    } catch {
      toast.error("Failed to read image file");
    }
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
    <>
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
            Add placeholder text here
          </ContextMenuItem>
          <ContextMenuItem onSelect={insertBoxAtContext}>
            <Box />
            Add box here
          </ContextMenuItem>
          <ContextMenuItem onSelect={insertLineAtContext}>
            <Minus />
            Add line here
          </ContextMenuItem>
          <ContextMenuItem onSelect={requestImageAtContext}>
            <ImageIcon />
            Add image here
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
                      onSelect={() =>
                        insertDatasetPlaceholderAtContext(column)
                      }
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileInsert}
      />
    </>
  );
};

export default TemplateCanvasContextMenu;
