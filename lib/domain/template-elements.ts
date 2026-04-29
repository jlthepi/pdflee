import { DEFAULT_TEMPLATE_LINE_HEIGHT } from "@/lib/domain/template-text";
import type {
  TemplateBoxElement,
  TemplateElement,
  TemplateElementBase,
  TemplateElementInput,
  TemplateElementType,
  TemplateImageElement,
  TemplateLineElement,
  TemplateTextElement,
} from "@/types/domain";

const TEMPLATE_ELEMENT_TYPES: TemplateElementType[] = [
  "text",
  "box",
  "image",
  "line",
];

export const getDefaultElementName = (
  type: TemplateElementType,
  index = 0,
) => {
  switch (type) {
    case "box":
      return `Box ${index + 1}`;
    case "image":
      return `Image ${index + 1}`;
    case "line":
      return `Line ${index + 1}`;
    case "text":
    default:
      return `Text ${index + 1}`;
  }
};

const isTemplateElementType = (
  type: TemplateElementInput["type"],
): type is TemplateElementType => {
  return typeof type === "string" && TEMPLATE_ELEMENT_TYPES.includes(type);
};

const getElementType = (element: TemplateElementInput): TemplateElementType => {
  return isTemplateElementType(element.type) ? element.type : "text";
};

const createTemplateElementBase = <Type extends TemplateElementType>({
  id,
  type,
  name,
  x = 0,
  y = 0,
  width,
  height,
  opacity,
  locked = false,
  hidden = false,
}: Partial<TemplateElementBase<Type>> & {
  type: Type;
  name: string;
}): TemplateElementBase<Type> => {
  return {
    id: id || crypto.randomUUID(),
    type,
    name,
    x,
    y,
    width,
    height,
    opacity,
    locked,
    hidden,
  };
};

export const createTextElement = ({
  name,
  content = "",
  fontSize = 16,
  color = "#000000",
  fontFamily,
  fontWeight = "normal",
  lineHeight = DEFAULT_TEMPLATE_LINE_HEIGHT,
  ...base
}: Omit<TemplateElementInput, "type">): TemplateTextElement => {
  return {
    ...createTemplateElementBase({
      ...base,
      type: "text",
      name: name || content || getDefaultElementName("text"),
    }),
    content,
    fontSize,
    color,
    fontFamily,
    fontWeight,
    lineHeight,
  };
};

export const createBoxElement = ({
  name,
  fillColor = "#ffffff",
  borderColor = "#000000",
  borderWidth = 1,
  borderRadius,
  ...base
}: Omit<TemplateElementInput, "type">): TemplateBoxElement => {
  return {
    ...createTemplateElementBase({
      ...base,
      type: "box",
      name: name || getDefaultElementName("box"),
    }),
    fillColor,
    borderColor,
    borderWidth,
    borderRadius,
  };
};

export const createImageElement = ({
  name,
  src = "",
  alt,
  objectFit = "contain",
  ...base
}: Omit<TemplateElementInput, "type">): TemplateImageElement => {
  return {
    ...createTemplateElementBase({
      ...base,
      type: "image",
      name: name || getDefaultElementName("image"),
    }),
    src,
    alt,
    objectFit,
  };
};

export const createLineElement = ({
  name,
  strokeColor = "#000000",
  strokeWidth = 1,
  orientation = "horizontal",
  ...base
}: Omit<TemplateElementInput, "type">): TemplateLineElement => {
  return {
    ...createTemplateElementBase({
      ...base,
      type: "line",
      name: name || getDefaultElementName("line"),
    }),
    strokeColor,
    strokeWidth,
    orientation,
  };
};

export const normalizeTemplateElement = (
  element: TemplateElementInput,
  index = 0,
): TemplateElement => {
  const type = getElementType(element);
  const name = element.name || getDefaultElementName(type, index);

  switch (type) {
    case "box":
      return createBoxElement({
        ...element,
        name,
      });
    case "image":
      return createImageElement({
        ...element,
        name,
      });
    case "line":
      return createLineElement({
        ...element,
        name,
      });
    case "text":
    default:
      return createTextElement({
        ...element,
        name,
      });
  }
};

export const createTemplateTextElement = createTextElement;
export const createTemplateBoxElement = createBoxElement;
export const createTemplateImageElement = createImageElement;
export const createTemplateLineElement = createLineElement;
