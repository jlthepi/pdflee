// lib/domain/defaults.ts
import { createTemplatePage } from "@/lib/domain/template-document";
import {
  DEFAULT_TEMPLATE_LINE_HEIGHT,
  DEFAULT_TEMPLATE_STYLE_PRESETS,
} from "@/lib/domain/template-text";
import type { DataSetDraft, TemplateDraft } from "@/types/domain";

export const DEFAULT_PAGE_SIZE = {
  width: 794,
  height: 1123,
};

export const createDefaultTemplateDraft = (): TemplateDraft => ({
  name: "Untitled Template",
  description: "Editable PDF template",
  document: {
    stylePresets: DEFAULT_TEMPLATE_STYLE_PRESETS,
    pages: [
      createTemplatePage({
        name: "Page 1",
        size: DEFAULT_PAGE_SIZE,
        elements: [
          {
            id: crypto.randomUUID(),
            type: "text",
            name: "Header",
            content: "Header 1",
            x: 100,
            y: 100,
            width: 240,
            height: 48,
            fontSize: 18,
            color: "#000000",
            fontWeight: "bold",
            lineHeight: DEFAULT_TEMPLATE_LINE_HEIGHT,
            locked: false,
            hidden: false,
          },
          {
            id: crypto.randomUUID(),
            type: "text",
            name: "Greeting",
            content: "Hello {{name}}",
            x: 100,
            y: 150,
            width: 260,
            height: 44,
            fontSize: 16,
            color: "#000000",
            lineHeight: DEFAULT_TEMPLATE_LINE_HEIGHT,
            locked: false,
            hidden: false,
          },
        ],
      }),
    ],
  },
});

export const createDefaultDataSetDraft = (): DataSetDraft => ({
  name: "Sample Data",
  description: "Sample records for PDF generation",
  table: {
    columns: ["name", "title", "date"],
    rows: [
      ["PDFlee", "Launch", "2026-03-25"],
      ["Team", "Review", "2026-03-26"],
    ],
  },
});
