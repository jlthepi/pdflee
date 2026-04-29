"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ImageIcon } from "lucide-react";

import TemplateElementContextMenu from "@/components/template/TemplateElementContextMenu";
import TemplateText from "@/components/template/TemplateText";
import { getElementBox } from "@/lib/domain/template-editor";
import { isTextTemplateElement } from "@/lib/domain/template-document";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";
import type {
  TemplateBoxElement,
  TemplateElement,
  TemplateImageElement,
  TemplateLineElement,
} from "@/types/domain";

const DRAG_SUPPRESSION_THRESHOLD = 3;

const TemplateBoxRenderer = ({ element }: { element: TemplateBoxElement }) => {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundColor: element.fillColor ?? "transparent",
        borderColor: element.borderColor ?? "#111827",
        borderRadius: `${element.borderRadius ?? 0}px`,
        borderStyle: "solid",
        borderWidth: `${element.borderWidth ?? 1}px`,
        opacity: element.opacity ?? 1,
      }}
    />
  );
};

const TemplateImageRenderer = ({
  element,
}: {
  element: TemplateImageElement;
}) => {
  if (!element.src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center border border-dashed border-stone-300 bg-stone-50 text-stone-400">
        <ImageIcon className="size-5" aria-hidden />
        <span className="sr-only">{element.alt || element.name}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={element.src}
      alt={element.alt || element.name}
      draggable={false}
      className="absolute inset-0 size-full"
      style={{
        objectFit: element.objectFit ?? "contain",
        opacity: element.opacity ?? 1,
      }}
    />
  );
};

const TemplateLineRenderer = ({ element }: { element: TemplateLineElement }) => {
  const elementBox = getElementBox(element);
  const orientation =
    element.orientation ??
    (elementBox.height > elementBox.width ? "vertical" : "horizontal");
  const strokeWidth = Math.max(element.strokeWidth ?? 1, 1);

  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute"
        style={
          orientation === "vertical"
            ? {
                bottom: 0,
                left: "50%",
                top: 0,
                transform: "translateX(-50%)",
                width: `${strokeWidth}px`,
                backgroundColor: element.strokeColor ?? "#111827",
              }
            : {
                height: `${strokeWidth}px`,
                left: 0,
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: element.strokeColor ?? "#111827",
              }
        }
      />
    </div>
  );
};

const TemplateElementContent = ({
  pageId,
  element,
  isEditing,
  onTextOverflowRiskChange,
}: {
  pageId: string;
  element: TemplateElement;
  isEditing: boolean;
  onTextOverflowRiskChange: (hasOverflowRisk: boolean) => void;
}) => {
  switch (element.type) {
    case "box":
      return <TemplateBoxRenderer element={element} />;
    case "image":
      return <TemplateImageRenderer element={element} />;
    case "line":
      return <TemplateLineRenderer element={element} />;
    case "text":
      return isTextTemplateElement(element) ? (
        <TemplateText
          pageId={pageId}
          element={element}
          isEditing={isEditing}
          onOverflowRiskChange={onTextOverflowRiskChange}
        />
      ) : null;
    default:
      return null;
  }
};

const TemplateCanvasElementBody = ({
  pageId,
  element,
}: {
  pageId: string;
  element: TemplateElement;
}) => {
  const { id, x, y, locked } = element;
  const elementRef = useRef<HTMLDivElement | null>(null);
  const dragPointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const [hasTextOverflowRisk, setHasTextOverflowRisk] = useState(false);
  const { template } = useTemplateStore();
  const {
    selectedElementIds,
    editingElementId,
    dragSession,
    resizeSession,
    setSelectedElementId,
    toggleSelectedElementId,
    setEditingElementId,
    startDrag,
    startResize,
  } = useTemplateUiStore();
  const elementBox = getElementBox(element);
  const isSelected = selectedElementIds.includes(id);
  const isEditing = editingElementId === id && element.type === "text";
  const isDragging = dragSession?.elementIds.includes(id) ?? false;
  const isResizing = resizeSession?.elementId === id;
  const isLocked = locked === true;

  const startTextEditing = () => {
    if (isLocked || element.type !== "text") {
      return;
    }

    setEditingElementId(id);
  };

  const startElementDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isEditing) {
      return;
    }

    const elementNode = elementRef.current;

    if (!elementNode) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.shiftKey) {
      toggleSelectedElementId(id);
      return;
    }

    if (!isSelected) {
      setSelectedElementId(id);
    }

    if (isLocked) {
      return;
    }

    const page = template.document.pages.find(
      (candidate) => candidate.id === pageId,
    );
    const activeDragIds =
      isSelected && selectedElementIds.length > 1 ? selectedElementIds : [id];
    const originElements =
      page?.elements
        .filter(
          (candidate) =>
            activeDragIds.includes(candidate.id) &&
            !candidate.hidden &&
            !candidate.locked,
        )
        .map((candidate) => {
          const candidateBox = getElementBox(candidate);

          return {
            id: candidate.id,
            x: candidate.x,
            y: candidate.y,
            width: candidateBox.width,
            height: candidateBox.height,
          };
        }) ?? [];

    if (originElements.length === 0) {
      return;
    }

    startDrag({
      pageId,
      elementId: id,
      elementIds: originElements.map((candidate) => candidate.id),
      pointerId: event.pointerId,
      originPointer: {
        x: event.clientX,
        y: event.clientY,
      },
      originElement: {
        x,
        y,
      },
      elementSize: {
        width: elementBox.width,
        height: elementBox.height,
      },
      originElements,
    });

    dragPointerOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    const handlePointerEnd = (nextEvent: PointerEvent) => {
      const dragPointerOrigin = dragPointerOriginRef.current;

      dragPointerOriginRef.current = null;

      if (!dragPointerOrigin) {
        return;
      }

      const moved =
        Math.abs(nextEvent.clientX - dragPointerOrigin.x) >
          DRAG_SUPPRESSION_THRESHOLD ||
        Math.abs(nextEvent.clientY - dragPointerOrigin.y) >
          DRAG_SUPPRESSION_THRESHOLD;

      if (!moved) {
        return;
      }

      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    };

    window.addEventListener("pointerup", handlePointerEnd, { once: true });
    window.addEventListener("pointercancel", handlePointerEnd, { once: true });
  };

  const elementBody = (
    <div
      ref={elementRef}
      role="button"
      tabIndex={0}
      aria-label={element.name}
      aria-pressed={isSelected}
      className="absolute"
      onClick={(event) => {
        if (isEditing) {
          return;
        }

        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }

        if (event.shiftKey || event.metaKey || event.ctrlKey) {
          return;
        }

        setSelectedElementId(id);
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startTextEditing();
      }}
      onContextMenu={(event) => {
        event.stopPropagation();

        if (!isEditing && !isSelected) {
          setSelectedElementId(id);
        }
      }}
      onPointerDown={startElementDrag}
      onKeyDown={(event) => {
        if (isEditing) {
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          startTextEditing();
          return;
        }

        if (event.key === " ") {
          event.preventDefault();
          if (event.shiftKey) {
            toggleSelectedElementId(id);
            return;
          }

          setSelectedElementId(id);
        }
      }}
      style={{
        top: y,
        left: x,
        width: elementBox.width,
        height: elementBox.height,
        opacity: isLocked ? 0.72 : 1,
        cursor: isEditing
          ? "text"
          : isLocked
            ? "default"
            : isDragging
              ? "grabbing"
              : isResizing
                ? "nwse-resize"
                : "grab",
        userSelect: isEditing ? "text" : "none",
        touchAction: "none",
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {isSelected ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "rgba(59,130,246,0.08)",
          }}
        />
      ) : null}
      <TemplateElementContent
        pageId={pageId}
        element={element}
        isEditing={isEditing}
        onTextOverflowRiskChange={setHasTextOverflowRisk}
      />
      {isSelected ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            border: hasTextOverflowRisk
              ? "1px dashed rgba(217,119,6,0.9)"
              : "1px dashed #3b82f6",
            boxShadow: "0 8px 20px rgba(59,130,246,0.08)",
          }}
        />
      ) : null}
      {isSelected && !isEditing && !isLocked ? (
        <button
          type="button"
          aria-label={`Resize ${element.type}`}
          className="absolute -bottom-2 -right-2 z-20 flex size-5 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();

            startResize({
              pageId,
              elementId: id,
              pointerId: event.pointerId,
              originPointer: {
                x: event.clientX,
                y: event.clientY,
              },
              originElement: {
                x,
                y,
              },
              originSize: {
                width: elementBox.width,
                height: elementBox.height,
              },
            });
          }}
        >
          <span className="block size-2 rounded-[2px] bg-current" />
        </button>
      ) : null}
    </div>
  );

  if (isEditing) {
    return elementBody;
  }

  return (
    <TemplateElementContextMenu pageId={pageId} elementId={id}>
      {elementBody}
    </TemplateElementContextMenu>
  );
};

const TemplateCanvasElement = ({
  pageId,
  element,
}: {
  pageId: string;
  element: TemplateElement;
}) => {
  return <TemplateCanvasElementBody pageId={pageId} element={element} />;
};

export default TemplateCanvasElement;
