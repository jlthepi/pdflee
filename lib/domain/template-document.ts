// lib/domain/template-document.ts
import {
  DEFAULT_TEMPLATE_LINE_HEIGHT,
  DEFAULT_TEMPLATE_STYLE_PRESETS,
} from "@/lib/domain/template-text";
import {
  getDefaultElementName,
  normalizeTemplateElement,
} from "@/lib/domain/template-elements";
import type {
  PageSize,
  TemplateCoordinateSystem,
  TemplateDocument,
  TemplateDocumentSchemaVersion,
  TemplateDocumentUnit,
  TemplateElement,
  TemplateElementInput,
  TemplatePage,
  TemplateStylePreset,
  TemplateTextElement,
} from "@/types/domain";

type LegacyTemplateDocument = {
  page: PageSize;
  elements: TemplateElementInput[];
  stylePresets?: TemplateStylePreset[];
};

type TemplatePageInput = Partial<Omit<TemplatePage, "elements">> & {
  size: PageSize;
  elements?: TemplateElementInput[];
};

type TemplateDocumentInput = Omit<TemplateDocument, "pages"> & {
  pages?: TemplatePageInput[];
};

export const TEMPLATE_DOCUMENT_SCHEMA_VERSION = 1 satisfies TemplateDocumentSchemaVersion;
export const TEMPLATE_DOCUMENT_UNIT = "px" satisfies TemplateDocumentUnit;
export const TEMPLATE_DOCUMENT_COORDINATE_SYSTEM =
  "top-left" satisfies TemplateCoordinateSystem;

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

const normalizeTemplatePage = (
  page: TemplatePageInput,
  index: number,
): TemplatePage => {
  return {
    id: page.id || crypto.randomUUID(),
    name: page.name || `Page ${index + 1}`,
    size: page.size,
    elements: (page.elements ?? []).map((element, elementIndex) =>
      normalizeTemplateElement(element, elementIndex),
    ),
  };
};

const createFallbackTemplatePage = () => {
  return createTemplatePage({
    name: "Page 1",
    size: { width: 794, height: 1123 },
  });
};

const isLegacyTemplateDocument = (
  document: TemplateDocumentInput | LegacyTemplateDocument,
): document is LegacyTemplateDocument => {
  return "page" in document;
};

export const migrateTemplateDocument = (
  document: TemplateDocumentInput | LegacyTemplateDocument,
): TemplateDocument => {
  if (isLegacyTemplateDocument(document)) {
    return {
      schemaVersion: TEMPLATE_DOCUMENT_SCHEMA_VERSION,
      unit: TEMPLATE_DOCUMENT_UNIT,
      coordinateSystem: TEMPLATE_DOCUMENT_COORDINATE_SYSTEM,
      pages: [
        createTemplatePage({
          name: "Page 1",
          size: document.page,
          elements: document.elements.map((element, index) =>
            normalizeTemplateElement(element, index),
          ),
        }),
      ],
      stylePresets:
        document.stylePresets?.map(normalizeStylePreset) ??
        DEFAULT_TEMPLATE_STYLE_PRESETS,
    };
  }

  const pages =
    document.pages && document.pages.length > 0
      ? document.pages.map(normalizeTemplatePage)
      : [createFallbackTemplatePage()];

  return {
    schemaVersion: TEMPLATE_DOCUMENT_SCHEMA_VERSION,
    unit: document.unit ?? TEMPLATE_DOCUMENT_UNIT,
    coordinateSystem:
      document.coordinateSystem ?? TEMPLATE_DOCUMENT_COORDINATE_SYSTEM,
    pages,
    stylePresets:
      document.stylePresets?.map(normalizeStylePreset) ??
      DEFAULT_TEMPLATE_STYLE_PRESETS,
  };
};

export { normalizeTemplateElement };

export const normalizeTemplateDocument = migrateTemplateDocument;

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
