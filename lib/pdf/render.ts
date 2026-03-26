// lib/pdf/render.ts
import sanitizeHtml from "sanitize-html";

import { isTextTemplateElement } from "@/lib/domain/template-document";
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
import type { DataTable, TemplateDocument } from "@/types/domain";

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
        .map((element) => {
          if (element.hidden) {
            return "";
          }

          if (!isTextTemplateElement(element)) {
            return "";
          }

          return `
            <div
              data-template-element="${element.id}"
              style="
                position:absolute;
                left:${element.x}px;
                top:${element.y}px;
                ${element.width ? `width:${element.width}px;` : ""}
                ${element.height ? `height:${element.height}px;` : ""}
                font-size:${element.fontSize}px;
                color:${element.color};
                font-family:${getTemplateFontFamily(element.fontFamily)};
                font-weight:${element.fontWeight ?? "normal"};
                line-height:${getTemplateLineHeight(element.lineHeight)};
                white-space:pre-wrap;
                overflow:hidden;
                overflow-wrap:anywhere;
                word-break:break-word;
                box-sizing:border-box;
                padding:${TEMPLATE_TEXT_PADDING_Y}px ${TEMPLATE_TEXT_PADDING_X}px;
              "
            >${replacePlaceholders(element.content ?? "", row)}</div>
          `;
        })
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
    {
      allowedTags: ["html", "head", "style", "body", "div"],
      allowVulnerableTags: true,
      allowedAttributes: {
        div: ["class", "style", "data-template-element", "data-template-page"],
        body: ["style"],
      },
    },
  );
};

export const getRowsForIndexes = (table: DataTable, rowIndexes: number[]) => {
  return rowIndexes.map((rowIndex) =>
    mapRowToRecord(table.columns, table.rows[rowIndex] ?? []),
  );
};
