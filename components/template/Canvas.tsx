// components/template/Canvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoveDiagonal, ScanSearch } from "lucide-react";

import TemplateCanvasContextMenu from "@/components/template/TemplateCanvasContextMenu";
import TemplateCanvasElement from "@/components/template/TemplateCanvasElement";
import {
  clampSelectionDelta,
  createSelectionRect,
  getElementsIntersectingSelectionRect,
  getSafeAreaFrame,
  getSelectionBounds,
  type SelectionRect,
  TEMPLATE_EDITOR_GRID_SIZE,
  snapElementPosition,
  snapElementSize,
} from "@/lib/domain/template-editor";
import type { TemplateSnapGuide } from "@/lib/domain/template-editor";
import { getTemplatePage } from "@/lib/domain/template-document";
import { useTemplateStore } from "@/stores/useTemplateStore";
import { useTemplateUiStore } from "@/stores/useTemplateUiStore";
import type { TemplateElement } from "@/types/domain";

type PreviewElement = {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PreviewPayload = {
  elements: PreviewElement[];
  guides: TemplateSnapGuide[];
};

type MarqueeSession = {
  pointerId: number;
  startX: number;
  startY: number;
  additive: boolean;
};

const MARQUEE_DRAG_THRESHOLD = 4;

const Canvas = () => {
  const { template, moveElementsBy, setElementSize } = useTemplateStore();
  const {
    activePageId,
    dragSession,
    resizeSession,
    selectedElementId,
    selectedElementIds,
    clearSelectedElements,
    setSelectedElementIds,
    showSafeArea,
    stopDrag,
    stopResize,
  } = useTemplateUiStore();
  const activePage = getTemplatePage(template.document, activePageId);
  const pageSize = activePage.size;
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [previewElements, setPreviewElements] = useState<PreviewElement[]>([]);
  const [previewGuides, setPreviewGuides] = useState<TemplateSnapGuide[]>([]);
  const [marqueeSession, setMarqueeSession] = useState<MarqueeSession | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<SelectionRect | null>(null);
  const previewElementsRef = useRef<PreviewElement[]>([]);
  const pendingPreviewRef = useRef<PreviewPayload | null>(null);
  const previewFrameRef = useRef<number | null>(null);
  const safeAreaFrame = getSafeAreaFrame(pageSize);
  const getCanvasPoint = (clientX: number, clientY: number) => {
    const pageNode = pageRef.current;

    if (!pageNode) {
      return null;
    }

    const rect = pageNode.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const clearPreview = () => {
    if (previewFrameRef.current !== null) {
      cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }

    pendingPreviewRef.current = null;
    previewElementsRef.current = [];
    setPreviewElements([]);
    setPreviewGuides([]);
  };

  const clearMarquee = () => {
    setMarqueeSession(null);
    setMarqueeRect(null);
  };

  const schedulePreview = (payload: PreviewPayload) => {
    pendingPreviewRef.current = payload;

    if (previewFrameRef.current !== null) {
      return;
    }

    previewFrameRef.current = window.requestAnimationFrame(() => {
      const nextPreview = pendingPreviewRef.current;

      previewFrameRef.current = null;

      if (!nextPreview) {
        return;
      }

      setPreviewElements(nextPreview.elements);
      previewElementsRef.current = nextPreview.elements;
      setPreviewGuides(nextPreview.guides);
    });
  };

  useEffect(() => {
    if (!dragSession && !resizeSession) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (
        dragSession &&
        event.pointerId === dragSession.pointerId &&
        dragSession.pageId === activePage.id
      ) {
        const deltaX = event.clientX - dragSession.originPointer.x;
        const deltaY = event.clientY - dragSession.originPointer.y;

        if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) {
          return;
        }

        if (dragSession.originElements.length > 1) {
          const groupBounds = getSelectionBounds(dragSession.originElements);

          if (!groupBounds) {
            return;
          }

          const snappedGroupPosition = snapElementPosition({
            x: groupBounds.x + deltaX,
            y: groupBounds.y + deltaY,
            elementBox: {
              width: groupBounds.width,
              height: groupBounds.height,
            },
            pageSize,
          });
          const clampedDelta = clampSelectionDelta({
            bounds: groupBounds,
            dx: snappedGroupPosition.x - groupBounds.x,
            dy: snappedGroupPosition.y - groupBounds.y,
            pageSize,
          });

          schedulePreview({
            elements: dragSession.originElements.map((originElement) => ({
              elementId: originElement.id,
              x: originElement.x + clampedDelta.dx,
              y: originElement.y + clampedDelta.dy,
              width: originElement.width,
              height: originElement.height,
            })),
            guides: snappedGroupPosition.guides,
          });
          return;
        }

        const nextPosition = snapElementPosition({
          x: dragSession.originElement.x + deltaX,
          y: dragSession.originElement.y + deltaY,
          elementBox: dragSession.elementSize,
          pageSize,
        });

        schedulePreview({
          elements: [
            {
              elementId: dragSession.elementId,
              x: nextPosition.x,
              y: nextPosition.y,
              width: dragSession.elementSize.width,
              height: dragSession.elementSize.height,
            },
          ],
          guides: nextPosition.guides,
        });
      }

      if (
        resizeSession &&
        event.pointerId === resizeSession.pointerId &&
        resizeSession.pageId === activePage.id
      ) {
        const deltaX = event.clientX - resizeSession.originPointer.x;
        const deltaY = event.clientY - resizeSession.originPointer.y;
        const nextSize = snapElementSize({
          width: resizeSession.originSize.width + deltaX,
          height: resizeSession.originSize.height + deltaY,
          x: resizeSession.originElement.x,
          y: resizeSession.originElement.y,
          pageSize,
        });

        schedulePreview({
          elements: [
            {
              elementId: resizeSession.elementId,
              x: resizeSession.originElement.x,
              y: resizeSession.originElement.y,
              width: nextSize.width,
              height: nextSize.height,
            },
          ],
          guides: [],
        });
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const latestPreviewElements =
        pendingPreviewRef.current?.elements ?? previewElementsRef.current;

      if (dragSession && event.pointerId === dragSession.pointerId) {
        const latestPrimaryPreview = latestPreviewElements.find(
          (previewElement) => previewElement.elementId === dragSession.elementId,
        );
        const primaryOriginElement = dragSession.originElements.find(
          (originElement) => originElement.id === dragSession.elementId,
        );

        if (latestPrimaryPreview && primaryOriginElement) {
          moveElementsBy(
            activePage.id,
            dragSession.elementIds,
            latestPrimaryPreview.x - primaryOriginElement.x,
            latestPrimaryPreview.y - primaryOriginElement.y,
          );
        }

        stopDrag();
      }

      if (resizeSession && event.pointerId === resizeSession.pointerId) {
        const latestPreview = latestPreviewElements.find(
          (previewElement) => previewElement.elementId === resizeSession.elementId,
        );

        if (latestPreview?.elementId === resizeSession.elementId) {
          setElementSize(
            activePage.id,
            resizeSession.elementId,
            latestPreview.width,
            latestPreview.height,
          );
        }

        stopResize();
      }

      clearPreview();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      clearPreview();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [
    activePage.id,
    dragSession,
    moveElementsBy,
    pageSize,
    resizeSession,
    setElementSize,
    stopDrag,
    stopResize,
  ]);

  useEffect(() => {
    if (!marqueeSession || dragSession || resizeSession) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== marqueeSession.pointerId) {
        return;
      }

      const nextPoint = getCanvasPoint(event.clientX, event.clientY);

      if (!nextPoint) {
        return;
      }

      const nextRect = createSelectionRect({
        startX: marqueeSession.startX,
        startY: marqueeSession.startY,
        currentX: nextPoint.x,
        currentY: nextPoint.y,
        pageSize,
      });

      setMarqueeRect(nextRect);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== marqueeSession.pointerId) {
        return;
      }

      const nextPoint = getCanvasPoint(event.clientX, event.clientY);
      const finalRect = nextPoint
        ? createSelectionRect({
            startX: marqueeSession.startX,
            startY: marqueeSession.startY,
            currentX: nextPoint.x,
            currentY: nextPoint.y,
            pageSize,
          })
        : marqueeRect;

      if (
        finalRect &&
        (finalRect.width > MARQUEE_DRAG_THRESHOLD ||
          finalRect.height > MARQUEE_DRAG_THRESHOLD)
      ) {
        const intersectingIds = getElementsIntersectingSelectionRect({
          elements: activePage.elements.filter((element) => !element.hidden),
          rect: finalRect,
        }).map((element) => element.id);

        setSelectedElementIds(
          marqueeSession.additive
            ? [...selectedElementIds, ...intersectingIds]
            : intersectingIds,
        );
      } else if (!marqueeSession.additive) {
        clearSelectedElements();
      }

      clearMarquee();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [
    activePage.elements,
    clearSelectedElements,
    dragSession,
    marqueeRect,
    marqueeSession,
    pageSize,
    resizeSession,
    selectedElementIds,
    setSelectedElementIds,
  ]);

  const renderedElements = activePage.elements
    .filter((element) => !element.hidden)
    .map(
    (element): TemplateElement => {
      const previewElement = previewElements.find(
        (candidate) => candidate.elementId === element.id,
      );

      if (!previewElement) {
        return element;
      }

      return {
        ...element,
        x: previewElement.x,
        y: previewElement.y,
        width: previewElement.width,
        height: previewElement.height,
      };
    },
  );
  const selectionBounds = getSelectionBounds(
    renderedElements.filter((element) => selectedElementIds.includes(element.id)),
  );

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-6">
      <TemplateCanvasContextMenu pageId={activePage.id}>
        <div className="relative pt-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between">
            <div className="px-1 py-1 text-[11px] text-stone-500 dark:border-stone-900/10">
              Page{" "}
              {template.document.pages.findIndex(
                (page) => page.id === activePage.id,
              ) + 1}{" "}
              of {template.document.pages.length}
            </div>
            <div className="px-1 py-1 text-[11px] text-stone-500 dark:border-stone-900/10">
              {dragSession ? (
                <span className="inline-flex items-center gap-1">
                  <MoveDiagonal className="size-3" />
                  {`Moving selected element · ${TEMPLATE_EDITOR_GRID_SIZE}px grid snap`}
                </span>
              ) : resizeSession ? (
                <span className="inline-flex items-center gap-1">
                  <ScanSearch className="size-3" />
                  {`Resizing selected box · ${TEMPLATE_EDITOR_GRID_SIZE}px step`}
                </span>
              ) : marqueeSession ? (
                <span className="inline-flex items-center gap-1">
                  <ScanSearch className="size-3" />
                  Drag to select elements
                </span>
              ) : selectedElementIds.length > 1 ? (
                `${selectedElementIds.length} elements selected`
              ) : selectedElementId &&
                activePage.elements.find((element) => element.id === selectedElementId)
                  ?.hidden ? (
                "Selected element is hidden"
              ) : selectedElementId ? (
                "Selected element ready"
              ) : (
                "Select an element to edit"
              )}
            </div>
          </div>
          <div
            ref={pageRef}
            className="relative overflow-hidden rounded-lg border bg-white shadow-xl"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                const nextPoint = getCanvasPoint(event.clientX, event.clientY);

                if (!nextPoint) {
                  return;
                }

                setMarqueeSession({
                  pointerId: event.pointerId,
                  startX: nextPoint.x,
                  startY: nextPoint.y,
                  additive: event.shiftKey || event.metaKey || event.ctrlKey,
                });
                setMarqueeRect(
                  createSelectionRect({
                    startX: nextPoint.x,
                    startY: nextPoint.y,
                    currentX: nextPoint.x,
                    currentY: nextPoint.y,
                    pageSize,
                  }),
                );
              }
            }}
            style={{
              width: `${pageSize.width}px`,
              height: `${pageSize.height}px`,
            }}
          >
            {showSafeArea ? (
              <div
                aria-hidden
                className="pointer-events-none absolute border border-dashed border-stone-950/12"
                style={{
                  left: `${safeAreaFrame.x}px`,
                  top: `${safeAreaFrame.y}px`,
                  width: `${safeAreaFrame.width}px`,
                  height: `${safeAreaFrame.height}px`,
                }}
              />
            ) : null}
            {selectionBounds && selectedElementIds.length > 1 ? (
              <div
                aria-hidden
                className="pointer-events-none absolute border border-dashed border-primary/35"
                style={{
                  left: `${selectionBounds.x - 4}px`,
                  top: `${selectionBounds.y - 4}px`,
                  width: `${selectionBounds.width + 8}px`,
                  height: `${selectionBounds.height + 8}px`,
                }}
              />
            ) : null}
            {previewGuides.map((guide) => (
              <div
                key={`${guide.axis}-${guide.position}`}
                className="pointer-events-none absolute z-10 bg-sky-500/35"
                style={
                  guide.axis === "x"
                    ? {
                        top: 0,
                        bottom: 0,
                        left: `${guide.position}px`,
                        width: "1px",
                      }
                    : {
                        left: 0,
                        right: 0,
                        top: `${guide.position}px`,
                        height: "1px",
                      }
                }
              />
            ))}
            {marqueeRect &&
            (marqueeRect.width > MARQUEE_DRAG_THRESHOLD ||
              marqueeRect.height > MARQUEE_DRAG_THRESHOLD) ? (
              <div
                aria-hidden
                className="pointer-events-none absolute z-10 border border-sky-500/45 bg-sky-500/12"
                style={{
                  left: `${marqueeRect.x}px`,
                  top: `${marqueeRect.y}px`,
                  width: `${marqueeRect.width}px`,
                  height: `${marqueeRect.height}px`,
                }}
              />
            ) : null}
            {renderedElements.map((element) => (
              <TemplateCanvasElement
                key={element.id}
                pageId={activePage.id}
                element={element}
              />
            ))}
          </div>
        </div>
      </TemplateCanvasContextMenu>
    </div>
  );
};

export default Canvas;
