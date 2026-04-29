// lib/domain/template-style.ts
import { isTextTemplateElement } from "@/lib/domain/template-document";
import type {
  TemplateElement,
  TemplateElementBase,
  TemplateStylePreset,
  TemplateTextStyle,
} from "@/types/domain";

export const TEMPLATE_DUPLICATE_OFFSET = {
  x: 20,
  y: 20,
} as const;

export type TemplateStylePatch = Partial<TemplateTextStyle> &
  Pick<TemplateElementBase, "width" | "height">;

export const pickTemplateElementStyle = (
  element: TemplateElement,
): TemplateStylePatch => {
  if (!isTextTemplateElement(element)) {
    return {
      width: element.width,
      height: element.height,
    };
  }

  return {
    width: element.width,
    height: element.height,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    color: element.color,
  };
};

export const getTemplateStylePreset = (
  preset: TemplateStylePreset,
): TemplateStylePatch => {
  return {
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    lineHeight: preset.lineHeight,
    color: preset.color,
  };
};
