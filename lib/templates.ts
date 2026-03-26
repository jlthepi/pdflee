// lib/templates.ts
import { normalizeTemplateDocument } from "@/lib/domain/template-document";
import type { TemplateDraft } from "@/types/domain";

export const exportTemplate = (template: TemplateDraft): void => {
  const blob = new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${template.name || "template"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const importTemplate = (file: File): Promise<TemplateDraft> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = JSON.parse(reader.result as string) as TemplateDraft;
        resolve({
          ...content,
          document: normalizeTemplateDocument(content.document),
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
};
