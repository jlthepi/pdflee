// lib/domain/draft-fingerprint.ts
import { normalizeTemplateDocument } from "@/lib/domain/template-document";
import type { DataSetDraft, TemplateDraft } from "@/types/domain";

export const buildTemplateDraftFingerprint = (
  draft: Pick<TemplateDraft, "name" | "description" | "document">,
) => {
  return JSON.stringify({
    name: draft.name,
    description: draft.description,
    document: normalizeTemplateDocument(draft.document),
  });
};

export const buildDataSetDraftFingerprint = (
  draft: Pick<DataSetDraft, "name" | "description" | "table">,
) => {
  return JSON.stringify({
    name: draft.name,
    description: draft.description,
    table: draft.table,
  });
};
