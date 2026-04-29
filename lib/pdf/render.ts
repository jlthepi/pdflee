// lib/pdf/render.ts
import sanitizeHtml from "sanitize-html";

import {
  mapRowToRecord,
  resolveTemplateContentPlaceholders,
} from "@/lib/domain/placeholders";
import {
  getTemplateFontFamily,
  getTemplateLineHeight,
  TEMPLATE_TEXT_PADDING_X,
  TEMPLATE_TEXT_PADDING_Y,
} from "@/lib/domain/template-text";
import type {
  DataTable,
  TemplateBoxElement,
  TemplateDocument,
  TemplateElement,
  TemplateImageElement,
  TemplateLineElement,
  TemplateTextElement,
} from "@/types/domain";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const replacePlaceholders = (content: string, row: Record<string, string>) => {
  return escapeHtml(resolveTemplateContentPlaceholders(content, row));
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const toCssPx = (value: unknown) => {
  return isFiniteNumber(value) ? `${value}px` : undefined;
};

const toCssNumber = (value: unknown) => {
  return isFiniteNumber(value) ? `${value}` : undefined;
};

const toCssOpacity = (value: unknown) => {
  if (!isFiniteNumber(value)) {
    return undefined;
  }

  return `${Math.min(Math.max(value, 0), 1)}`;
};

const toCssColor = (value: unknown, fallback: string) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || /[;{}<>]/.test(trimmedValue)) {
    return fallback;
  }

  return trimmedValue;
};

const toCssObjectFit = (value: unknown) => {
  return value === "cover" || value === "fill" || value === "contain"
    ? value
    : "contain";
};

const toCssFontWeight = (value: unknown) => {
  return value === "medium" ||
    value === "semibold" ||
    value === "bold" ||
    value === "normal"
    ? value
    : "normal";
};

const toStyle = (
  entries: Array<[string, string | number | undefined]>,
) => {
  return entries
    .filter((entry): entry is [string, string | number] => {
      return entry[1] !== undefined && entry[1] !== "";
    })
    .map(([name, value]) => `${name}:${value};`)
    .join("");
};

const getElementWidth = (element: TemplateElement, fallback: number) => {
  return isFiniteNumber(element.width) ? element.width : fallback;
};

const getElementHeight = (element: TemplateElement, fallback: number) => {
  return isFiniteNumber(element.height) ? element.height : fallback;
};

const getElementOpacity = (element: TemplateElement) => {
  return (element as { opacity?: unknown }).opacity;
};

const getElementBorderRadius = (element: TemplateElement) => {
  return (element as { borderRadius?: unknown }).borderRadius;
};

const isSupportedImageSource = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();

  return (
    /^https?:\/\//i.test(trimmedValue) ||
    /^data:image\/[a-z0-9.+-]+[;,]/i.test(trimmedValue)
  );
};

const renderTextElement = (
  element: TemplateTextElement,
  row: Record<string, string>,
) => {
  const style = toStyle([
    ["position", "absolute"],
    ["left", toCssPx(element.x) ?? "0px"],
    ["top", toCssPx(element.y) ?? "0px"],
    ["width", toCssPx(element.width)],
    ["height", toCssPx(element.height)],
    ["font-size", `${isFiniteNumber(element.fontSize) ? element.fontSize : 16}px`],
    ["color", toCssColor(element.color, "#000000")],
    ["font-family", getTemplateFontFamily(element.fontFamily)],
    ["font-weight", toCssFontWeight(element.fontWeight)],
    ["line-height", toCssNumber(getTemplateLineHeight(element.lineHeight))],
    ["white-space", "pre-wrap"],
    ["overflow", "hidden"],
    ["overflow-wrap", "anywhere"],
    ["word-break", "break-word"],
    ["box-sizing", "border-box"],
    [
      "padding",
      `${TEMPLATE_TEXT_PADDING_Y}px ${TEMPLATE_TEXT_PADDING_X}px`,
    ],
    ["opacity", toCssOpacity(getElementOpacity(element))],
  ]);

  return `
    <div
      data-template-element="${escapeHtml(element.id)}"
      style="${style}"
    >${replacePlaceholders(element.content ?? "", row)}</div>
  `;
};

const renderBoxElement = (element: TemplateBoxElement) => {
  const borderWidth = isFiniteNumber(element.borderWidth)
    ? Math.max(element.borderWidth, 0)
    : 0;
  const elementBorderRadius = getElementBorderRadius(element);
  const borderRadius = isFiniteNumber(elementBorderRadius)
    ? Math.max(elementBorderRadius, 0)
    : 0;
  const style = toStyle([
    ["position", "absolute"],
    ["left", toCssPx(element.x) ?? "0px"],
    ["top", toCssPx(element.y) ?? "0px"],
    ["width", `${getElementWidth(element, 220)}px`],
    ["height", `${getElementHeight(element, 120)}px`],
    ["box-sizing", "border-box"],
    ["background-color", toCssColor(element.fillColor, "transparent")],
    [
      "border",
      `${borderWidth}px solid ${toCssColor(element.borderColor, "transparent")}`,
    ],
    ["border-radius", toCssPx(borderRadius)],
    ["opacity", toCssOpacity(element.opacity)],
  ]);

  return `
    <div
      data-template-element="${escapeHtml(element.id)}"
      style="${style}"
    ></div>
  `;
};

const renderLineElement = (element: TemplateLineElement) => {
  const strokeWidth = isFiniteNumber(element.strokeWidth)
    ? Math.max(element.strokeWidth, 1)
    : 1;
  const isVertical = element.orientation === "vertical";
  const style = toStyle([
    ["position", "absolute"],
    ["left", toCssPx(element.x) ?? "0px"],
    ["top", toCssPx(element.y) ?? "0px"],
    [
      "width",
      isVertical ? `${strokeWidth}px` : `${getElementWidth(element, 160)}px`,
    ],
    [
      "height",
      isVertical ? `${getElementHeight(element, 160)}px` : `${strokeWidth}px`,
    ],
    ["box-sizing", "border-box"],
    ["background-color", toCssColor(element.strokeColor, "#000000")],
    ["opacity", toCssOpacity(getElementOpacity(element))],
  ]);

  return `
    <div
      data-template-element="${escapeHtml(element.id)}"
      style="${style}"
    ></div>
  `;
};

const renderImageElement = (element: TemplateImageElement) => {
  if (!isSupportedImageSource(element.src)) {
    return "";
  }

  const elementBorderRadius = getElementBorderRadius(element);
  const borderRadius = isFiniteNumber(elementBorderRadius)
    ? Math.max(elementBorderRadius, 0)
    : 0;
  const frameStyle = toStyle([
    ["position", "absolute"],
    ["left", toCssPx(element.x) ?? "0px"],
    ["top", toCssPx(element.y) ?? "0px"],
    ["width", `${getElementWidth(element, 220)}px`],
    ["height", `${getElementHeight(element, 160)}px`],
    ["box-sizing", "border-box"],
    ["overflow", "hidden"],
    ["border-radius", toCssPx(borderRadius)],
    ["opacity", toCssOpacity(getElementOpacity(element))],
  ]);
  const imageStyle = toStyle([
    ["display", "block"],
    ["width", "100%"],
    ["height", "100%"],
    ["object-fit", toCssObjectFit(element.objectFit)],
  ]);

  return `
    <div
      data-template-element="${escapeHtml(element.id)}"
      style="${frameStyle}"
    >
      <img
        src="${escapeHtml(element.src.trim())}"
        alt="${escapeHtml(element.alt ?? "")}"
        style="${imageStyle}"
      />
    </div>
  `;
};

const renderTemplateElement = (
  element: TemplateElement,
  row: Record<string, string>,
) => {
  if (element.hidden) {
    return "";
  }

  switch (element.type) {
    case "text":
      return renderTextElement(element, row);
    case "box":
      return renderBoxElement(element);
    case "line":
      return renderLineElement(element);
    case "image":
      return renderImageElement(element);
    default:
      return "";
  }
};

const sanitizeTemplateHtmlOptions: Parameters<typeof sanitizeHtml>[1] & {
  allowedSchemesByTag: Record<string, string[]>;
} = {
  allowedTags: ["html", "head", "style", "body", "div", "img"],
  allowVulnerableTags: true,
  allowedAttributes: {
    div: ["class", "style", "data-template-element", "data-template-page"],
    img: ["src", "alt", "style"],
    body: ["style"],
  },
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
};

export const buildTemplateHtml = (
  template: TemplateDocument,
  row: Record<string, string>,
) => {
  const pageCss = template.pages
    .map((page, pageIndex) => {
      return `
        @page pdflee-page-${pageIndex + 1} {
          size: ${page.size.width}px ${page.size.height}px;
          margin: 0;
        }
      `;
    })
    .join("\n");

  const pages = template.pages
    .map((page, pageIndex) => {
      const elements = page.elements
        .map((element) => renderTemplateElement(element, row))
        .join("\n");

      return `
        <div
          class="pdflee-template-page"
          data-template-page="${page.id}"
          style="
            display:block;
            page: pdflee-page-${pageIndex + 1};
            width:${page.size.width}px;
            height:${page.size.height}px;
            position:relative;
            overflow:hidden;
            box-sizing:border-box;
            break-inside:avoid;
            break-after:${pageIndex === template.pages.length - 1 ? "auto" : "page"};
            print-color-adjust:exact;
            -webkit-print-color-adjust:exact;
          "
        >
          ${elements}
        </div>
      `;
    })
    .join("\n");

  return sanitizeHtml(
    `
      <html>
        <head>
          <style>
            ${pageCss}
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              font-size: 0;
              line-height: 0;
            }
          </style>
        </head>
        <body>
          ${pages}
        </body>
      </html>
    `,
    sanitizeTemplateHtmlOptions,
  );
};

export const getRowsForIndexes = (table: DataTable, rowIndexes: number[]) => {
  return rowIndexes.map((rowIndex) =>
    mapRowToRecord(table.columns, table.rows[rowIndex] ?? []),
  );
};
