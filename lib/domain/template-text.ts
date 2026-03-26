// lib/domain/template-text.ts
import type {
  TemplateStylePreset,
  TemplateTextElement,
  TemplateTextStyle,
} from "@/types/domain";

export const DEFAULT_TEMPLATE_FONT_FAMILY =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const DEFAULT_TEMPLATE_LINE_HEIGHT = 1.4;
export const TEMPLATE_TEXT_PADDING_X = 8;
export const TEMPLATE_TEXT_PADDING_Y = 6;
export const TEMPLATE_TEXT_MIN_CONTENT_HEIGHT = 24;
export const DEFAULT_TEMPLATE_STYLE_PRESETS: TemplateStylePreset[] = [
  {
    id: "preset-heading",
    name: "Heading",
    fontSize: 22,
    color: "#111827",
    fontWeight: "bold",
    lineHeight: 1.2,
  },
  {
    id: "preset-body",
    name: "Body",
    fontSize: 16,
    color: "#111827",
    fontWeight: "normal",
    lineHeight: 1.4,
  },
  {
    id: "preset-caption",
    name: "Caption",
    fontSize: 12,
    color: "#475569",
    fontWeight: "medium",
    lineHeight: 1.35,
  },
];

export const getTemplateFontFamily = (fontFamily?: string) => {
  const normalized = fontFamily?.trim();

  return normalized && normalized.length > 0
    ? `${normalized}, ${DEFAULT_TEMPLATE_FONT_FAMILY}`
    : DEFAULT_TEMPLATE_FONT_FAMILY;
};

export const getTemplateLineHeight = (
  lineHeight?: TemplateTextElement["lineHeight"],
) => {
  return lineHeight ?? DEFAULT_TEMPLATE_LINE_HEIGHT;
};

export const getTemplateTextMinHeight = (height?: number) => {
  if (!height) {
    return undefined;
  }

  return Math.max(
    height - TEMPLATE_TEXT_PADDING_Y * 2,
    TEMPLATE_TEXT_MIN_CONTENT_HEIGHT,
  );
};

export const pickTemplateTextStyle = (
  element: Pick<
    TemplateTextElement,
    "fontSize" | "color" | "fontFamily" | "fontWeight" | "lineHeight"
  >,
): TemplateTextStyle => {
  return {
    fontSize: element.fontSize ?? 16,
    color: element.color ?? "#000000",
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
  };
};
