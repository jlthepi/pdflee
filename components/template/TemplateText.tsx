// components/template/TemplateText.tsx
"use client";

import { useEffect, useRef, useState } from "react";

import TemplateElementContextMenu from "@/components/template/TemplateElementContextMenu";
import { isTextTemplateElement } from "@/lib/domain/template-document";
import { getElementBox } from "@/lib/domain/template-editor";
import {
  buildLongestPlaceholderPreviewContent,
  hasTemplatePlaceholders,
} from "@/lib/domain/placeholders";
import {
  getTemplateFontFamily,
  getTemplateLineHeight,
  getTemplateTextMinHeight,
  TEMPLATE_TEXT_PADDING_X,
  TEMPLATE_TEXT_PADDING_Y,
} from "@/lib/domain/template-text";
import { useDataStore } from "@/stores/useDataStore";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";
import type { TemplateElement, TemplateTextElement } from "@/types/domain";

const TEXT_EDIT_DEBOUNCE_MS = 250;

const TemplateTextBody = ({
  pageId,
  element,
}: {
  pageId: string;
  element: TemplateTextElement;
}) => {
  const {
    id,
    content,
    x,
    y,
    width,
    height,
    fontSize,
    color,
    fontFamily,
    fontWeight,
    lineHeight,
    locked,
  } = element;
  const elementRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragPointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const originalContentRef = useRef(content ?? "");
  const committedContentRef = useRef(content ?? "");
  const draftContentRef = useRef(content ?? "");
  const [draftContent, setDraftContent] = useState(content ?? "");
  const [hasOverflowRisk, setHasOverflowRisk] = useState(false);
  const { dataSet } = useDataStore();
  const { template, updateElement } = useTemplateStore();
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
  const isSelected = selectedElementIds.includes(id);
  const isEditing = editingElementId === id;
  const isDragging = dragSession?.elementIds.includes(id) ?? false;
  const isResizing = resizeSession?.elementId === id;
  const isLocked = locked === true;
  const contentValue = content ?? "";
  const resolvedPreviewContent = buildLongestPlaceholderPreviewContent(
    contentValue,
    dataSet.table,
  );
  const resolvedLineHeight = getTemplateLineHeight(lineHeight);
  const resolvedFontFamily = getTemplateFontFamily(fontFamily);

  useEffect(() => {
    committedContentRef.current = contentValue;

    if (!isEditing) {
      draftContentRef.current = contentValue;
    }
  }, [contentValue, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();
    const contentLength = textarea.value.length;
    textarea.setSelectionRange(contentLength, contentLength);
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const measurementNode = measurementRef.current;

    if (!measurementNode) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const nextHasOverflowRisk =
        measurementNode.scrollHeight > measurementNode.clientHeight + 1 ||
        measurementNode.scrollWidth > measurementNode.clientWidth + 1;

      setHasOverflowRisk((currentHasOverflowRisk) =>
        currentHasOverflowRisk === nextHasOverflowRisk
          ? currentHasOverflowRisk
          : nextHasOverflowRisk,
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    content,
    fontFamily,
    fontSize,
    fontWeight,
    height,
    lineHeight,
    resolvedPreviewContent,
    width,
  ]);

  const commitContent = (nextContent: string) => {
    if (nextContent === committedContentRef.current) {
      return;
    }

    committedContentRef.current = nextContent;
    updateElement(pageId, id, {
      content: nextContent,
    });
  };

  const clearPendingCommit = () => {
    if (!debounceRef.current) {
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = null;
  };

  const scheduleCommit = (nextContent: string) => {
    clearPendingCommit();
    debounceRef.current = setTimeout(() => {
      commitContent(nextContent);
      debounceRef.current = null;
    }, TEXT_EDIT_DEBOUNCE_MS);
  };

  const startEditing = () => {
    originalContentRef.current = committedContentRef.current;
    setDraftContent(contentValue);
    draftContentRef.current = contentValue;
    setEditingElementId(id);
  };

  const finishEditing = () => {
    clearPendingCommit();
    commitContent(draftContentRef.current);
    setEditingElementId(null);
  };

  const cancelEditing = () => {
    clearPendingCommit();
    const originalContent = originalContentRef.current;
    draftContentRef.current = originalContent;
    setDraftContent(originalContent);
    commitContent(originalContent);
    setEditingElementId(null);
  };

  const elementBody = (
    <div
      ref={elementRef}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
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
        if (isLocked) {
          return;
        }
        startEditing();
      }}
      onContextMenu={(event) => {
        event.stopPropagation();

        if (!isEditing && !isSelected) {
          setSelectedElementId(id);
        }
      }}
      onPointerDown={(event) => {
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

        const page = template.document.pages.find((page) => page.id === pageId);
        const activeDragIds =
          isSelected && selectedElementIds.length > 1
            ? selectedElementIds
            : [id];
        const originElements =
          page?.elements
            .filter(
              (candidate) =>
                activeDragIds.includes(candidate.id) && !candidate.hidden,
            )
            .map((candidate) => {
              const elementBox = getElementBox(candidate);

              return {
                id: candidate.id,
                x: candidate.x,
                y: candidate.y,
                width: elementBox.width,
                height: elementBox.height,
              };
            }) ?? [];

        if (originElements.length === 0) {
          return;
        }

        const rect = elementNode.getBoundingClientRect();

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
            width: width ?? rect.width,
            height: height ?? rect.height,
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
            Math.abs(nextEvent.clientX - dragPointerOrigin.x) > 3 ||
            Math.abs(nextEvent.clientY - dragPointerOrigin.y) > 3;

          if (!moved) {
            return;
          }

          suppressNextClickRef.current = true;
          window.setTimeout(() => {
            suppressNextClickRef.current = false;
          }, 0);
        };

        window.addEventListener("pointerup", handlePointerEnd, { once: true });
        window.addEventListener("pointercancel", handlePointerEnd, {
          once: true,
        });
      }}
      onKeyDown={(event) => {
        if (isEditing) {
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (isLocked) {
            return;
          }
          startEditing();
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
        position: "absolute",
        top: y,
        left: x,
        width,
        height,
        fontSize,
        lineHeight: resolvedLineHeight,
        padding: `${TEMPLATE_TEXT_PADDING_Y}px ${TEMPLATE_TEXT_PADDING_X}px`,
        boxSizing: "border-box",
        border: isSelected
          ? hasOverflowRisk
            ? "1px dashed rgba(217,119,6,0.9)"
            : "1px dashed #3b82f6"
          : "1px solid transparent",
        backgroundColor: isSelected ? "rgba(59,130,246,0.08)" : "transparent",
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
        color,
        fontFamily: resolvedFontFamily,
        fontWeight: fontWeight ?? "normal",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        boxShadow: isSelected ? "0 8px 20px rgba(59,130,246,0.08)" : "none",
        zIndex: isSelected ? 10 : 1,
        transition: isDragging || isResizing ? "none" : "box-shadow 120ms ease",
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draftContent}
          onChange={(event) => {
            const nextContent = event.target.value;
            draftContentRef.current = nextContent;
            setDraftContent(nextContent);
            scheduleCommit(nextContent);
          }}
          onBlur={finishEditing}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation();

            if (event.key === "Escape") {
              event.preventDefault();
              cancelEditing();
              return;
            }

            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              finishEditing();
            }
          }}
          className="h-full w-full resize-none border-0 bg-transparent p-0 outline-none"
          style={{
            minHeight: getTemplateTextMinHeight(height)
              ? `${getTemplateTextMinHeight(height)}px`
              : undefined,
            color,
            fontFamily: resolvedFontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight ?? "normal",
            lineHeight: resolvedLineHeight,
          }}
        />
      ) : (
        contentValue
      )}
      {!isEditing ? (
        <div
          ref={measurementRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-0"
          style={{
            padding: `${TEMPLATE_TEXT_PADDING_Y}px ${TEMPLATE_TEXT_PADDING_X}px`,
            fontFamily: resolvedFontFamily,
            fontSize: `${fontSize}px`,
            fontWeight: fontWeight ?? "normal",
            lineHeight: resolvedLineHeight,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {resolvedPreviewContent}
        </div>
      ) : null}
      {hasOverflowRisk && !isEditing ? (
        <div className="pointer-events-none absolute right-2 top-2 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-700">
          {hasTemplatePlaceholders(contentValue) ? "Overflow risk" : "Overflow"}
        </div>
      ) : null}
      {isSelected && !isEditing && !isLocked ? (
        <button
          type="button"
          aria-label="Resize text"
          className="absolute -bottom-2 -right-2 z-20 flex size-5 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm"
          onPointerDown={(event) => {
            const elementNode = elementRef.current;

            if (!elementNode) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            const rect = elementNode.getBoundingClientRect();

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
                width: width ?? rect.width,
                height: height ?? rect.height,
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

const TemplateText = ({
  pageId,
  element,
}: {
  pageId: string;
  element: TemplateElement;
}) => {
  if (!isTextTemplateElement(element)) {
    return null;
  }

  return <TemplateTextBody pageId={pageId} element={element} />;
};

export default TemplateText;
