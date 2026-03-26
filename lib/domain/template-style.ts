// lib/domain/template-style.ts
import type {
  TemplateElement,
  TemplateStylePreset,
  TemplateTextStyle,
} from "@/types/domain";

export const TEMPLATE_DUPLICATE_OFFSET = {
  x: 20,
  y: 20,
} as const;

export type TemplateStylePatch = Partial<TemplateTextStyle> &
  Pick<TemplateElement, "width" | "height">;

export const pickTemplateElementStyle = (
  element: TemplateElement,
): TemplateStylePatch => {
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
