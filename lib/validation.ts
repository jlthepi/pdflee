// lib/validation.ts
import { z } from "zod";

import { normalizeTemplateDocument } from "@/lib/domain/template-document";

const templateElementBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().min(48).optional(),
  height: z.number().min(24).optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

const templateTextStyleSchema = z.object({
  fontSize: z.number().min(1),
  color: z.string().min(1),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  lineHeight: z.number().min(1).max(3).optional(),
});

const templateTextElementSchema = templateElementBaseSchema
  .extend({
    type: z.literal("text"),
    content: z.string(),
  })
  .merge(templateTextStyleSchema);

const templateBoxElementSchema = templateElementBaseSchema.extend({
  type: z.literal("box"),
  fillColor: z.string().min(1),
  borderColor: z.string().min(1),
  borderWidth: z.number().min(0),
  borderRadius: z.number().min(0).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

const templateImageElementSchema = templateElementBaseSchema.extend({
  type: z.literal("image"),
  src: z.string().min(1),
  alt: z.string().optional(),
  objectFit: z.enum(["contain", "cover", "fill"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

const templateLineElementSchema = templateElementBaseSchema.extend({
  type: z.literal("line"),
  strokeColor: z.string().min(1),
  strokeWidth: z.number().min(1),
  orientation: z.enum(["horizontal", "vertical"]),
});

export const templateElementSchema = z.discriminatedUnion("type", [
  templateTextElementSchema,
  templateBoxElementSchema,
  templateImageElementSchema,
  templateLineElementSchema,
]);

const templateStylePresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fontSize: z.number().min(1),
  color: z.string().min(1),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  lineHeight: z.number().min(1).max(3).optional(),
});

const pageSizeSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1),
});

const templatePageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  size: pageSizeSchema,
  elements: z.array(templateElementSchema),
});

const templateDocumentSchema = z
  .union([
    z.object({
      pages: z.array(templatePageSchema).min(1),
      stylePresets: z.array(templateStylePresetSchema).optional(),
    }),
    z.object({
      page: pageSizeSchema,
      elements: z.array(templateElementSchema),
    }),
  ])
  .transform((document) => normalizeTemplateDocument(document));

export const templateDraftSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  currentVersion: z.number().optional(),
  document: templateDocumentSchema,
});

export const dataSetDraftSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string(),
  currentVersion: z.number().optional(),
  table: z.object({
    columns: z.array(z.string().min(1)),
    rows: z.array(z.array(z.string())),
  }),
});

export const generateJobRequestSchema = z
  .object({
    templateId: z.string().min(1).optional(),
    dataSetId: z.string().min(1).optional(),
    templateDraft: templateDraftSchema.optional(),
    dataSetDraft: dataSetDraftSchema.optional(),
    mode: z.enum(["single", "selection", "all"]),
    rowIndexes: z.array(z.number().int().nonnegative()).default([]),
    fileBaseName: z.string().min(1).max(64).default("pdflee"),
  })
  .superRefine((input, ctx) => {
    if (!input.templateId && !input.templateDraft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Template id or draft is required.",
        path: ["templateDraft"],
      });
    }

    if (!input.dataSetId && !input.dataSetDraft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data set id or draft is required.",
        path: ["dataSetDraft"],
      });
    }
  });
