// stores/useTemplateStore.ts
import { create } from "zustand";

import { createDefaultTemplateDraft } from "@/lib/domain/defaults";
import { buildTemplateDraftFingerprint } from "@/lib/domain/draft-fingerprint";
import {
  getTemplateStylePreset,
  pickTemplateElementStyle,
  TEMPLATE_DUPLICATE_OFFSET,
  type TemplateStylePatch,
} from "@/lib/domain/template-style";
import {
  createTemplateBoxElement,
  createTemplateImageElement,
  createTemplateLineElement,
  createTemplateTextElement,
} from "@/lib/domain/template-elements";
import {
  alignElementsToPage,
  alignElementToPage,
  clampElementPosition,
  distributeElementsOnAxis,
  getElementBox,
  moveElementsWithinPage,
  normalizeElementForPage,
  snapElementPosition,
} from "@/lib/domain/template-editor";
import {
  createTemplatePage,
  moveItemInArray,
  normalizeTemplateDocument,
} from "@/lib/domain/template-document";
import type {
  PageSize,
  TemplateDraft,
  TemplateElement,
  TemplateStylePreset,
} from "@/types/domain";

const TEMPLATE_HISTORY_LIMIT = 100;

type ElementInsertPosition = {
  x: number;
  y: number;
};

type DuplicateOffset = {
  x: number;
  y: number;
};

type TemplateHistoryState = {
  pastTemplates: TemplateDraft[];
  futureTemplates: TemplateDraft[];
};

type LayerMoveDirection = "forward" | "backward" | "front" | "back";

type TemplateStore = TemplateHistoryState & {
  template: TemplateDraft;
  persistedFingerprint: string | null;
  canUndo: boolean;
  canRedo: boolean;
  styleClipboard: TemplateStylePatch | null;
  setTemplate: (
    template: TemplateDraft,
    options?: {
      persisted?: boolean;
    },
  ) => void;
  markTemplatePersisted: (template?: TemplateDraft) => void;
  undo: () => void;
  redo: () => void;
  updateMeta: (
    update: Partial<Pick<TemplateDraft, "name" | "description">>,
  ) => void;
  addPage: () => string;
  duplicatePage: (pageId: string) => string | null;
  removePage: (pageId: string) => string | null;
  renamePage: (pageId: string, name: string) => void;
  movePage: (pageId: string, direction: "up" | "down") => string | null;
  setPageSize: (pageId: string, size: PageSize) => void;
  setElements: (pageId: string, elements: TemplateElement[]) => void;
  updateElement: (
    pageId: string,
    id: string,
    update: Partial<TemplateElement>,
  ) => void;
  renameElement: (pageId: string, id: string, name: string) => void;
  setElementPosition: (
    pageId: string,
    id: string,
    x: number,
    y: number,
  ) => void;
  setElementSize: (
    pageId: string,
    id: string,
    width: number,
    height: number,
  ) => void;
  moveElementBy: (pageId: string, id: string, dx: number, dy: number) => void;
  moveElementsBy: (
    pageId: string,
    ids: string[],
    dx: number,
    dy: number,
  ) => void;
  alignElementOnPage: (
    pageId: string,
    id: string,
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) => void;
  alignElementsOnPage: (
    pageId: string,
    ids: string[],
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) => void;
  distributeElementsOnPage: (
    pageId: string,
    ids: string[],
    axis: "horizontal" | "vertical",
  ) => void;
  moveElementLayer: (
    pageId: string,
    ids: string[],
    direction: LayerMoveDirection,
  ) => void;
  setElementHidden: (pageId: string, ids: string[], hidden: boolean) => void;
  toggleElementHidden: (pageId: string, ids: string[]) => void;
  setElementLock: (pageId: string, ids: string[], locked: boolean) => void;
  toggleElementLock: (pageId: string, ids: string[]) => void;
  deleteElement: (pageId: string, id: string) => void;
  deleteElements: (pageId: string, ids: string[]) => void;
  duplicateElement: (
    pageId: string,
    id: string,
    offset?: DuplicateOffset,
  ) => string | null;
  duplicateElements: (
    pageId: string,
    ids: string[],
    offset?: DuplicateOffset,
  ) => string[];
  copyElementStyle: (pageId: string, id: string) => void;
  pasteElementStyle: (pageId: string, ids: string[]) => void;
  applyStylePreset: (
    pageId: string,
    ids: string[],
    preset: TemplateStylePreset,
  ) => void;
  addTextElement: (pageId: string, position?: ElementInsertPosition) => string;
  addPlaceholderElement: (
    pageId: string,
    content?: string,
    position?: ElementInsertPosition,
  ) => string;
  addBoxElement: (pageId: string, position?: ElementInsertPosition) => string;
  addLineElement: (pageId: string, position?: ElementInsertPosition) => string;
  addImageElement: (
    pageId: string,
    options?: {
      src?: string;
      alt?: string;
      position?: ElementInsertPosition;
    },
  ) => string;
};

const cloneTemplate = <Value>(value: Value): Value => {
  return structuredClone(value);
};

const normalizeTemplate = (template: TemplateDraft) => {
  return {
    ...template,
    document: normalizeTemplateDocument(template.document),
  };
};

const resolvePageSize = (template: TemplateDraft, pageId: string) => {
  return (
    template.document.pages.find((page) => page.id === pageId)?.size ?? {
      width: 794,
      height: 1123,
    }
  );
};

const getPage = (template: TemplateDraft, pageId: string) => {
  return template.document.pages.find((page) => page.id === pageId) ?? null;
};

const mapPageElements = (
  template: TemplateDraft,
  pageId: string,
  mapElement: (element: TemplateElement) => TemplateElement | null,
) => {
  return {
    ...template,
    document: {
      ...template.document,
      pages: template.document.pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              elements: page.elements.flatMap((element) => {
                const nextElement = mapElement(element);
                return nextElement ? [nextElement] : [];
              }),
            }
          : page,
      ),
    },
  };
};

const commitTemplateUpdate = ({
  state,
  nextTemplate,
}: {
  state: TemplateStore;
  nextTemplate: TemplateDraft;
}) => {
  const normalizedTemplate = normalizeTemplate(nextTemplate);
  const previousFingerprint = buildTemplateDraftFingerprint(state.template);
  const nextFingerprint = buildTemplateDraftFingerprint(normalizedTemplate);

  if (previousFingerprint === nextFingerprint) {
    return state;
  }

  const nextPastTemplates = [
    ...state.pastTemplates.slice(-(TEMPLATE_HISTORY_LIMIT - 1)),
    cloneTemplate(state.template),
  ];

  return {
    template: normalizedTemplate,
    pastTemplates: nextPastTemplates,
    futureTemplates: [],
    canUndo: nextPastTemplates.length > 0,
    canRedo: false,
  };
};

const normalizeElementsForPage = ({
  elements,
  pageSize,
}: {
  elements: TemplateElement[];
  pageSize: PageSize;
}) => {
  return elements.map((element) =>
    normalizeElementForPage({
      element,
      pageSize,
    }),
  );
};

const mapUnlockedElements = ({
  page,
  ids,
}: {
  page: { elements: TemplateElement[] };
  ids: string[];
}) => {
  const selectedIds = new Set(ids);

  return page.elements.filter(
    (element) => selectedIds.has(element.id) && !element.locked,
  );
};

const insertElementOnPage = ({
  state,
  pageId,
  element,
}: {
  state: TemplateStore;
  pageId: string;
  element: TemplateElement;
}) => {
  const pageSize = resolvePageSize(state.template, pageId);
  const nextPosition = snapElementPosition({
    x: element.x,
    y: element.y,
    elementBox: getElementBox(element),
    pageSize,
  });
  const newElement = normalizeElementForPage({
    element: {
      ...element,
      x: nextPosition.x,
      y: nextPosition.y,
    },
    pageSize,
  });

  return {
    newElement,
    nextTemplate: {
      ...state.template,
      document: {
        ...state.template.document,
        pages: state.template.document.pages.map((page) =>
          page.id === pageId
            ? { ...page, elements: [...page.elements, newElement] }
            : page,
        ),
      },
    },
  };
};

const applyTemplateStylePatch = (
  element: TemplateElement,
  patch: TemplateStylePatch,
): TemplateElement => {
  const geometryPatch = {
    ...(typeof patch.width === "number" ? { width: patch.width } : {}),
    ...(typeof patch.height === "number" ? { height: patch.height } : {}),
  };

  if (element.type !== "text") {
    return {
      ...element,
      ...geometryPatch,
    };
  }

  return {
    ...element,
    ...geometryPatch,
    ...(patch.fontFamily !== undefined ? { fontFamily: patch.fontFamily } : {}),
    ...(typeof patch.fontSize === "number" ? { fontSize: patch.fontSize } : {}),
    ...(patch.fontWeight !== undefined ? { fontWeight: patch.fontWeight } : {}),
    ...(typeof patch.lineHeight === "number"
      ? { lineHeight: patch.lineHeight }
      : {}),
    ...(patch.color !== undefined ? { color: patch.color } : {}),
  };
};

const moveSelectedLayers = ({
  elements,
  ids,
  direction,
}: {
  elements: TemplateElement[];
  ids: string[];
  direction: LayerMoveDirection;
}) => {
  const selectedIds = new Set(ids);

  if (selectedIds.size === 0) {
    return elements;
  }

  if (direction === "front") {
    return [
      ...elements.filter((element) => !selectedIds.has(element.id)),
      ...elements.filter((element) => selectedIds.has(element.id)),
    ];
  }

  if (direction === "back") {
    return [
      ...elements.filter((element) => selectedIds.has(element.id)),
      ...elements.filter((element) => !selectedIds.has(element.id)),
    ];
  }

  const nextElements = [...elements];

  if (direction === "forward") {
    for (let index = nextElements.length - 2; index >= 0; index -= 1) {
      const currentElement = nextElements[index];
      const nextElement = nextElements[index + 1];

      if (
        selectedIds.has(currentElement.id) &&
        !selectedIds.has(nextElement.id)
      ) {
        nextElements[index] = nextElement;
        nextElements[index + 1] = currentElement;
      }
    }

    return nextElements;
  }

  for (let index = 1; index < nextElements.length; index += 1) {
    const previousElement = nextElements[index - 1];
    const currentElement = nextElements[index];

    if (
      selectedIds.has(currentElement.id) &&
      !selectedIds.has(previousElement.id)
    ) {
      nextElements[index - 1] = currentElement;
      nextElements[index] = previousElement;
    }
  }

  return nextElements;
};

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  template: createDefaultTemplateDraft(),
  persistedFingerprint: null,
  pastTemplates: [],
  futureTemplates: [],
  canUndo: false,
  canRedo: false,
  styleClipboard: null,
  setTemplate: (template, options) =>
    set((state) => {
      const normalizedTemplate = normalizeTemplate(template);

      return {
        template: normalizedTemplate,
        persistedFingerprint: options?.persisted
          ? buildTemplateDraftFingerprint(normalizedTemplate)
          : state.persistedFingerprint,
        pastTemplates: [],
        futureTemplates: [],
        canUndo: false,
        canRedo: false,
      };
    }),
  markTemplatePersisted: (template = get().template) =>
    set({
      persistedFingerprint: buildTemplateDraftFingerprint({
        name: template.name,
        description: template.description,
        document: template.document,
      }),
    }),
  undo: () =>
    set((state) => {
      const previousTemplate =
        state.pastTemplates[state.pastTemplates.length - 1];

      if (!previousTemplate) {
        return state;
      }

      const nextPastTemplates = state.pastTemplates.slice(0, -1);
      const nextFutureTemplates = [
        cloneTemplate(state.template),
        ...state.futureTemplates,
      ];

      return {
        template: normalizeTemplate(previousTemplate),
        pastTemplates: nextPastTemplates,
        futureTemplates: nextFutureTemplates,
        canUndo: nextPastTemplates.length > 0,
        canRedo: nextFutureTemplates.length > 0,
      };
    }),
  redo: () =>
    set((state) => {
      const [nextTemplate, ...remainingFutureTemplates] = state.futureTemplates;

      if (!nextTemplate) {
        return state;
      }

      const nextPastTemplates = [
        ...state.pastTemplates.slice(-(TEMPLATE_HISTORY_LIMIT - 1)),
        cloneTemplate(state.template),
      ];

      return {
        template: normalizeTemplate(nextTemplate),
        pastTemplates: nextPastTemplates,
        futureTemplates: remainingFutureTemplates,
        canUndo: true,
        canRedo: remainingFutureTemplates.length > 0,
      };
    }),
  updateMeta: (update) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          ...update,
        },
      }),
    ),
  addPage: () => {
    const pageId = crypto.randomUUID();
    const pageSize = get().template.document.pages[0]?.size ?? {
      width: 794,
      height: 1123,
    };

    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: [
              ...state.template.document.pages,
              createTemplatePage({
                id: pageId,
                name: `Page ${state.template.document.pages.length + 1}`,
                size: pageSize,
              }),
            ],
          },
        },
      }),
    );

    return pageId;
  },
  duplicatePage: (pageId) => {
    const sourcePage = get().template.document.pages.find(
      (page) => page.id === pageId,
    );

    if (!sourcePage) {
      return null;
    }

    const nextPageId = crypto.randomUUID();

    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: [
              ...state.template.document.pages,
              createTemplatePage({
                id: nextPageId,
                name: `${sourcePage.name} Copy`,
                size: sourcePage.size,
                elements: sourcePage.elements.map((element) => ({
                  ...element,
                  id: crypto.randomUUID(),
                  x: element.x + TEMPLATE_DUPLICATE_OFFSET.x,
                  y: element.y + TEMPLATE_DUPLICATE_OFFSET.y,
                })),
              }),
            ],
          },
        },
      }),
    );

    return nextPageId;
  },
  removePage: (pageId) => {
    const pages = get().template.document.pages;

    if (pages.length <= 1) {
      return pageId;
    }

    const pageIndex = pages.findIndex((page) => page.id === pageId);
    const fallbackPage =
      pages[pageIndex + 1] ?? pages[pageIndex - 1] ?? pages[0] ?? null;

    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.filter(
              (page) => page.id !== pageId,
            ),
          },
        },
      }),
    );

    return fallbackPage?.id ?? null;
  },
  renamePage: (pageId, name) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.map((page) =>
              page.id === pageId ? { ...page, name } : page,
            ),
          },
        },
      }),
    ),
  movePage: (pageId, direction) => {
    const pageIndex = get().template.document.pages.findIndex(
      (page) => page.id === pageId,
    );

    if (pageIndex === -1) {
      return null;
    }

    const targetIndex = direction === "up" ? pageIndex - 1 : pageIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= get().template.document.pages.length
    ) {
      return pageId;
    }

    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: moveItemInArray(
              state.template.document.pages,
              pageIndex,
              targetIndex,
            ),
          },
        },
      }),
    );

    return pageId;
  },
  setPageSize: (pageId, size) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    size,
                    elements: normalizeElementsForPage({
                      elements: page.elements,
                      pageSize: size,
                    }),
                  }
                : page,
            ),
          },
        },
      }),
    ),
  setElements: (pageId, elements) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.map((page) =>
              page.id === pageId
                ? {
                    ...page,
                    elements: normalizeElementsForPage({
                      elements,
                      pageSize: page.size,
                    }),
                  }
                : page,
            ),
          },
        },
      }),
    ),
  updateElement: (pageId, id, update) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            element.id === id
              ? normalizeElementForPage({
                  element: { ...element, ...update },
                  pageSize: resolvePageSize(state.template, pageId),
                })
              : element,
          ),
        },
      }),
    ),
  renameElement: (pageId, id, name) =>
    get().updateElement(pageId, id, { name }),
  setElementPosition: (pageId, id, x, y) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) => {
            if (element.id !== id) {
              return element;
            }

            const nextPosition = clampElementPosition({
              x,
              y,
              elementBox: getElementBox(element),
              pageSize: resolvePageSize(state.template, pageId),
            });

            return {
              ...element,
              x: nextPosition.x,
              y: nextPosition.y,
            };
          }),
        },
      }),
    ),
  setElementSize: (pageId, id, width, height) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            element.id === id
              ? normalizeElementForPage({
                  element: { ...element, width, height },
                  pageSize: resolvePageSize(state.template, pageId),
                })
              : element,
          ),
        },
      }),
    ),
  moveElementBy: (pageId, id, dx, dy) =>
    get().moveElementsBy(pageId, [id], dx, dy),
  moveElementsBy: (pageId, ids, dx, dy) =>
    set((state) => {
      const page = getPage(state.template, pageId);

      if (!page) {
        return state;
      }

      const selectedElements = mapUnlockedElements({ page, ids });

      if (selectedElements.length === 0) {
        return state;
      }

      const nextPositions = moveElementsWithinPage({
        elements: selectedElements,
        pageSize: page.size,
        dx,
        dy,
      });
      const nextPositionMap = new Map(
        nextPositions.map((position) => [position.id, position]),
      );

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) => {
            const nextPosition = nextPositionMap.get(element.id);

            if (!nextPosition) {
              return element;
            }

            return {
              ...element,
              x: nextPosition.x,
              y: nextPosition.y,
            };
          }),
        },
      });
    }),
  alignElementOnPage: (pageId, id, alignment) =>
    get().alignElementsOnPage(pageId, [id], alignment),
  alignElementsOnPage: (pageId, ids, alignment) =>
    set((state) => {
      const page = getPage(state.template, pageId);

      if (!page) {
        return state;
      }

      const selectedElements = mapUnlockedElements({ page, ids });

      if (selectedElements.length === 0) {
        return state;
      }

      const nextPositions =
        selectedElements.length === 1
          ? selectedElements.map((element) => {
              const nextPosition = alignElementToPage({
                element,
                pageSize: page.size,
                alignment,
              });

              return {
                id: element.id,
                x: nextPosition.x,
                y: nextPosition.y,
              };
            })
          : alignElementsToPage({
              elements: selectedElements,
              pageSize: page.size,
              alignment,
            });
      const nextPositionMap = new Map(
        nextPositions.map((position) => [position.id, position]),
      );

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) => {
            const nextPosition = nextPositionMap.get(element.id);

            if (!nextPosition) {
              return element;
            }

            return {
              ...element,
              x: nextPosition.x,
              y: nextPosition.y,
            };
          }),
        },
      });
    }),
  distributeElementsOnPage: (pageId, ids, axis) =>
    set((state) => {
      const page = getPage(state.template, pageId);

      if (!page) {
        return state;
      }

      const selectedElements = mapUnlockedElements({ page, ids });

      if (selectedElements.length < 3) {
        return state;
      }

      const nextPositions = distributeElementsOnAxis({
        elements: selectedElements,
        axis,
      });
      const nextPositionMap = new Map(
        nextPositions.map((position) => [position.id, position]),
      );

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) => {
            const nextPosition = nextPositionMap.get(element.id);

            if (!nextPosition) {
              return element;
            }

            return normalizeElementForPage({
              element: {
                ...element,
                x: nextPosition.x,
                y: nextPosition.y,
              },
              pageSize: page.size,
            });
          }),
        },
      });
    }),
  moveElementLayer: (pageId, ids, direction) =>
    set((state) => {
      const page = getPage(state.template, pageId);

      if (!page || ids.length === 0) {
        return state;
      }

      const nextElements = moveSelectedLayers({
        elements: page.elements,
        ids,
        direction,
      });

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.map((currentPage) =>
              currentPage.id === pageId
                ? { ...currentPage, elements: nextElements }
                : currentPage,
            ),
          },
        },
      });
    }),
  setElementHidden: (pageId, ids, hidden) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            ids.includes(element.id) ? { ...element, hidden } : element,
          ),
        },
      }),
    ),
  toggleElementHidden: (pageId, ids) => {
    const page = getPage(get().template, pageId);

    if (!page) {
      return;
    }

    const selectedElements = page.elements.filter((element) =>
      ids.includes(element.id),
    );
    const shouldHide = selectedElements.some((element) => !element.hidden);
    get().setElementHidden(pageId, ids, shouldHide);
  },
  setElementLock: (pageId, ids, locked) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            ids.includes(element.id) ? { ...element, locked } : element,
          ),
        },
      }),
    ),
  toggleElementLock: (pageId, ids) => {
    const page = getPage(get().template, pageId);

    if (!page) {
      return;
    }

    const selectedElements = page.elements.filter((element) =>
      ids.includes(element.id),
    );
    const shouldUnlock = selectedElements.every((element) => element.locked);
    get().setElementLock(pageId, ids, !shouldUnlock);
  },
  deleteElement: (pageId, id) => get().deleteElements(pageId, [id]),
  deleteElements: (pageId, ids) =>
    set((state) => {
      const page = getPage(state.template, pageId);

      if (!page) {
        return state;
      }

      const unlockedSelectedIds = new Set(
        mapUnlockedElements({ page, ids }).map((element) => element.id),
      );

      if (unlockedSelectedIds.size === 0) {
        return state;
      }

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            unlockedSelectedIds.has(element.id) ? null : element,
          ),
        },
      });
    }),
  duplicateElement: (pageId, id, offset = TEMPLATE_DUPLICATE_OFFSET) => {
    const [nextId] = get().duplicateElements(pageId, [id], offset);
    return nextId ?? null;
  },
  duplicateElements: (pageId, ids, offset = TEMPLATE_DUPLICATE_OFFSET) => {
    const page = getPage(get().template, pageId);

    if (!page) {
      return [];
    }

    const selectedIds = new Set(ids);
    const sourceElements = page.elements.filter((element) =>
      selectedIds.has(element.id),
    );

    if (sourceElements.length === 0) {
      return [];
    }

    const duplicates = sourceElements.map((sourceElement) => ({
      ...sourceElement,
      id: crypto.randomUUID(),
      x: sourceElement.x + offset.x,
      y: sourceElement.y + offset.y,
      locked: false,
    }));

    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...state.template,
          document: {
            ...state.template.document,
            pages: state.template.document.pages.map((currentPage) =>
              currentPage.id === pageId
                ? {
                    ...currentPage,
                    elements: normalizeElementsForPage({
                      elements: [...currentPage.elements, ...duplicates],
                      pageSize: currentPage.size,
                    }),
                  }
                : currentPage,
            ),
          },
        },
      }),
    );

    return duplicates.map((duplicate) => duplicate.id);
  },
  copyElementStyle: (pageId, id) => {
    const page = getPage(get().template, pageId);
    const sourceElement = page?.elements.find((element) => element.id === id);

    if (!sourceElement) {
      return;
    }

    set({
      styleClipboard: pickTemplateElementStyle(sourceElement),
    });
  },
  pasteElementStyle: (pageId, ids) =>
    set((state) => {
      if (!state.styleClipboard) {
        return state;
      }

      const styleClipboard = state.styleClipboard;

      return commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            ids.includes(element.id)
              ? applyTemplateStylePatch(element, styleClipboard)
              : element,
          ),
        },
      });
    }),
  applyStylePreset: (pageId, ids, preset) =>
    set((state) =>
      commitTemplateUpdate({
        state,
        nextTemplate: {
          ...mapPageElements(state.template, pageId, (element) =>
            ids.includes(element.id) && element.type === "text"
              ? {
                  ...element,
                  ...getTemplateStylePreset(preset),
                }
              : element,
          ),
        },
      }),
    ),
  addTextElement: (pageId, position) => {
    const baseElement = createTemplateTextElement({
      content: "New text",
      x: position?.x ?? 50,
      y: position?.y ?? 50,
    });
    let newElementId = baseElement.id;

    set((state) => {
      const { newElement, nextTemplate } = insertElementOnPage({
        state,
        pageId,
        element: baseElement,
      });
      newElementId = newElement.id;

      return commitTemplateUpdate({ state, nextTemplate });
    });

    return newElementId;
  },
  addPlaceholderElement: (pageId, content = "Hello {{name}}", position) => {
    const baseElement: TemplateElement = {
      ...createTemplateTextElement({
        content,
        x: position?.x ?? 50,
        y: position?.y ?? 110,
      }),
      width: 260,
      fontWeight: "medium",
    };
    let newElementId = baseElement.id;

    set((state) => {
      const { newElement, nextTemplate } = insertElementOnPage({
        state,
        pageId,
        element: baseElement,
      });
      newElementId = newElement.id;

      return commitTemplateUpdate({ state, nextTemplate });
    });

    return newElementId;
  },
  addBoxElement: (pageId, position) => {
    const baseElement = createTemplateBoxElement({
      x: position?.x ?? 50,
      y: position?.y ?? 50,
    });
    let newElementId = baseElement.id;

    set((state) => {
      const { newElement, nextTemplate } = insertElementOnPage({
        state,
        pageId,
        element: baseElement,
      });
      newElementId = newElement.id;

      return commitTemplateUpdate({ state, nextTemplate });
    });

    return newElementId;
  },
  addLineElement: (pageId, position) => {
    const baseElement = createTemplateLineElement({
      x: position?.x ?? 50,
      y: position?.y ?? 50,
    });
    let newElementId = baseElement.id;

    set((state) => {
      const { newElement, nextTemplate } = insertElementOnPage({
        state,
        pageId,
        element: baseElement,
      });
      newElementId = newElement.id;

      return commitTemplateUpdate({ state, nextTemplate });
    });

    return newElementId;
  },
  addImageElement: (pageId, options) => {
    const baseElement = createTemplateImageElement({
      src: options?.src,
      alt: options?.alt,
      x: options?.position?.x ?? 50,
      y: options?.position?.y ?? 50,
    });
    let newElementId = baseElement.id;

    set((state) => {
      const { newElement, nextTemplate } = insertElementOnPage({
        state,
        pageId,
        element: baseElement,
      });
      newElementId = newElement.id;

      return commitTemplateUpdate({ state, nextTemplate });
    });

    return newElementId;
  },
}));
