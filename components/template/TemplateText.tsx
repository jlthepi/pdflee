"use client";

import { useEffect, useRef, useState } from "react";

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
import type { TemplateTextElement } from "@/types/domain";

const TEXT_EDIT_DEBOUNCE_MS = 250;

const TemplateText = ({
  pageId,
  element,
  isEditing,
  onOverflowRiskChange,
}: {
  pageId: string;
  element: TemplateTextElement;
  isEditing: boolean;
  onOverflowRiskChange?: (hasOverflowRisk: boolean) => void;
}) => {
  const {
    id,
    content,
    height,
    fontSize,
    color,
    fontFamily,
    fontWeight,
    lineHeight,
  } = element;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalContentRef = useRef(content ?? "");
  const committedContentRef = useRef(content ?? "");
  const draftContentRef = useRef(content ?? "");
  const wasEditingRef = useRef(false);
  const [hasOverflowRisk, setHasOverflowRisk] = useState(false);
  const { dataSet } = useDataStore();
  const { updateElement } = useTemplateStore();
  const { setEditingElementId } = useTemplateUiStore();
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
    if (isEditing && !wasEditingRef.current) {
      originalContentRef.current = committedContentRef.current;
      draftContentRef.current = contentValue;
    }

    wasEditingRef.current = isEditing;
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
      onOverflowRiskChange?.(false);
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
      onOverflowRiskChange?.(nextHasOverflowRisk);
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
    onOverflowRiskChange,
    resolvedPreviewContent,
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

  const finishEditing = () => {
    clearPendingCommit();
    commitContent(draftContentRef.current);
    setEditingElementId(null);
  };

  const cancelEditing = () => {
    clearPendingCommit();
    const originalContent = originalContentRef.current;
    draftContentRef.current = originalContent;
    commitContent(originalContent);
    setEditingElementId(null);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        color,
        fontFamily: resolvedFontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight ?? "normal",
        lineHeight: resolvedLineHeight,
        overflowWrap: "anywhere",
        padding: `${TEMPLATE_TEXT_PADDING_Y}px ${TEMPLATE_TEXT_PADDING_X}px`,
        pointerEvents: isEditing ? "auto" : "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          defaultValue={contentValue}
          onChange={(event) => {
            const nextContent = event.target.value;
            draftContentRef.current = nextContent;
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
    </div>
  );
};

export default TemplateText;
