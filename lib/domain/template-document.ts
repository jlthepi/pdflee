// lib/domain/template-document.ts
import {
  DEFAULT_TEMPLATE_LINE_HEIGHT,
  DEFAULT_TEMPLATE_STYLE_PRESETS,
} from "@/lib/domain/template-text";
import type {
  PageSize,
  TemplateDocument,
  TemplateElement,
  TemplateElementType,
  TemplatePage,
  TemplateStylePreset,
  TemplateTextElement,
} from "@/types/domain";

type LegacyTemplateDocument = {
  page: PageSize;
  elements: TemplateElement[];
};

const getDefaultElementName = (type: TemplateElementType, index: number) => {
  switch (type) {
    case "box":
      return `Box ${index + 1}`;
    case "image":
      return `Image ${index + 1}`;
    case "line":
      return `Line ${index + 1}`;
    case "text":
    default:
      return `Text ${index + 1}`;
  }
};

export const isTextTemplateElement = (
  element: TemplateElement,
): element is TemplateTextElement => {
  return element.type === "text";
};

const normalizeStylePreset = (
  preset: TemplateStylePreset,
  index: number,
): TemplateStylePreset => {
  return {
    ...preset,
    id: preset.id || `style-preset-${index + 1}`,
    name: preset.name || `Preset ${index + 1}`,
    lineHeight: preset.lineHeight ?? DEFAULT_TEMPLATE_LINE_HEIGHT,
  };
};

export const normalizeTemplateElement = (
  element: TemplateElement,
  index: number,
): TemplateElement => {
  const baseElement = {
    ...element,
    name: element.name || getDefaultElementName(element.type, index),
    locked: element.locked ?? false,
    hidden: element.hidden ?? false,
  };

  if (element.type === "text") {
    return {
      ...baseElement,
      content: element.content ?? "",
      fontSize: element.fontSize ?? 16,
      color: element.color ?? "#000000",
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight ?? "normal",
      lineHeight: element.lineHeight ?? DEFAULT_TEMPLATE_LINE_HEIGHT,
    };
  }

  return baseElement;
};

export const createTemplatePage = ({
  id = crypto.randomUUID(),
  name = "Page",
  size,
  elements = [],
}: {
  id?: string;
  name?: string;
  size: PageSize;
  elements?: TemplateElement[];
}): TemplatePage => {
  return {
    id,
    name,
    size,
    elements,
  };
};

export const normalizeTemplateDocument = (
  document: TemplateDocument | LegacyTemplateDocument,
): TemplateDocument => {
  if ("pages" in document) {
    return {
      pages:
        document.pages.length > 0
          ? document.pages.map((page, index) => ({
              id: page.id,
              name: page.name || `Page ${index + 1}`,
              size: page.size,
              elements: page.elements.map((element, elementIndex) =>
                normalizeTemplateElement(element, elementIndex),
              ),
            }))
          : [
              createTemplatePage({
                name: "Page 1",
                size: { width: 794, height: 1123 },
              }),
            ],
      stylePresets:
        document.stylePresets?.map(normalizeStylePreset) ??
        DEFAULT_TEMPLATE_STYLE_PRESETS,
    };
  }

  return {
    pages: [
      createTemplatePage({
        name: "Page 1",
        size: document.page,
        elements: document.elements.map((element, index) =>
          normalizeTemplateElement(element, index),
        ),
      }),
    ],
    stylePresets: DEFAULT_TEMPLATE_STYLE_PRESETS,
  };
};

export const getTemplatePage = (
  document: TemplateDocument,
  pageId?: string | null,
): TemplatePage => {
  return (
    document.pages.find((page) => page.id === pageId) ??
    document.pages[0] ??
    createTemplatePage({
      name: "Page 1",
      size: { width: 794, height: 1123 },
    })
  );
};

export const findTemplateElement = (
  document: TemplateDocument,
  elementId: string | null,
) => {
  if (!elementId) {
    return null;
  }

  for (const page of document.pages) {
    const element = page.elements.find(
      (candidate) => candidate.id === elementId,
    );

    if (element) {
      return {
        page,
        element,
      };
    }
  }

  return null;
};

export const getAllTemplateElements = (document: TemplateDocument) => {
  return document.pages.flatMap((page) => page.elements);
};

export const getAllTemplateTextElements = (document: TemplateDocument) => {
  return getAllTemplateElements(document).filter(isTextTemplateElement);
};

export const getTemplateElementDisplayName = (
  page: TemplatePage,
  elementId: string,
) => {
  const elementIndex = page.elements.findIndex(
    (element) => element.id === elementId,
  );
  const element = page.elements[elementIndex];

  if (!element) {
    return "Element";
  }

  return element.name || getDefaultElementName(element.type, elementIndex);
};

export const getTemplateElementSearchText = (element: TemplateElement) => {
  return [
    element.name,
    element.type,
    isTextTemplateElement(element) ? element.content : "",
    element.locked ? "locked" : "",
    element.hidden ? "hidden" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const moveItemInArray = <Value>(
  items: Value[],
  fromIndex: number,
  toIndex: number,
) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (typeof movedItem === "undefined") {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
};
