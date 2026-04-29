// lib/domain/template-editor.ts
import { normalizeTemplateElement } from "@/lib/domain/template-elements";
import type {
  PageSize,
  TemplateElement,
  TemplateElementInput,
} from "@/types/domain";

export const TEMPLATE_EDITOR_GRID_SIZE = 1;
export const TEMPLATE_EDITOR_SNAP_THRESHOLD = 6;
export const TEMPLATE_EDITOR_NUDGE_STEP = 2;
export const TEMPLATE_EDITOR_NUDGE_LARGE_STEP = 8;
export const TEMPLATE_ELEMENT_MIN_WIDTH = 80;
export const TEMPLATE_ELEMENT_MIN_HEIGHT = 36;
export const TEMPLATE_EDITOR_SAFE_AREA = 32;

type ElementBox = {
  width: number;
  height: number;
};

export type TemplateSnapGuide = {
  axis: "x" | "y";
  position: number;
};

type PositionedElement = Pick<
  TemplateElement,
  "id" | "x" | "y" | "width" | "height"
>;

type SelectionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SelectionRect = SelectionBounds;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const snapToGrid = (value: number) => {
  return (
    Math.round(value / TEMPLATE_EDITOR_GRID_SIZE) * TEMPLATE_EDITOR_GRID_SIZE
  );
};

export const getElementBox = (
  element: Pick<TemplateElement, "width" | "height">,
): ElementBox => {
  return {
    width: Math.max(element.width ?? 220, TEMPLATE_ELEMENT_MIN_WIDTH),
    height: Math.max(element.height ?? 44, TEMPLATE_ELEMENT_MIN_HEIGHT),
  };
};

export const getSafeAreaFrame = (pageSize: PageSize) => {
  return {
    x: TEMPLATE_EDITOR_SAFE_AREA,
    y: TEMPLATE_EDITOR_SAFE_AREA,
    width: Math.max(pageSize.width - TEMPLATE_EDITOR_SAFE_AREA * 2, 0),
    height: Math.max(pageSize.height - TEMPLATE_EDITOR_SAFE_AREA * 2, 0),
  };
};

export const getSelectionBounds = (elements: PositionedElement[]) => {
  if (elements.length === 0) {
    return null;
  }

  const [firstElement, ...restElements] = elements;
  const firstBox = getElementBox(firstElement);
  let minX = firstElement.x;
  let minY = firstElement.y;
  let maxX = firstElement.x + firstBox.width;
  let maxY = firstElement.y + firstBox.height;

  restElements.forEach((element) => {
    const elementBox = getElementBox(element);
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + elementBox.width);
    maxY = Math.max(maxY, element.y + elementBox.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  } satisfies SelectionBounds;
};

export const createSelectionRect = ({
  startX,
  startY,
  currentX,
  currentY,
  pageSize,
}: {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pageSize: PageSize;
}) => {
  const clampedStartX = clamp(startX, 0, pageSize.width);
  const clampedStartY = clamp(startY, 0, pageSize.height);
  const clampedCurrentX = clamp(currentX, 0, pageSize.width);
  const clampedCurrentY = clamp(currentY, 0, pageSize.height);
  const x = Math.min(clampedStartX, clampedCurrentX);
  const y = Math.min(clampedStartY, clampedCurrentY);

  return {
    x,
    y,
    width: Math.abs(clampedCurrentX - clampedStartX),
    height: Math.abs(clampedCurrentY - clampedStartY),
  } satisfies SelectionRect;
};

export const getElementsIntersectingSelectionRect = ({
  elements,
  rect,
}: {
  elements: PositionedElement[];
  rect: SelectionRect;
}) => {
  if (rect.width <= 0 || rect.height <= 0) {
    return [];
  }

  return elements.filter((element) => {
    const elementBox = getElementBox(element);
    const elementRight = element.x + elementBox.width;
    const elementBottom = element.y + elementBox.height;
    const rectRight = rect.x + rect.width;
    const rectBottom = rect.y + rect.height;

    return !(
      elementRight < rect.x ||
      element.x > rectRight ||
      elementBottom < rect.y ||
      element.y > rectBottom
    );
  });
};

export const clampElementPosition = ({
  x,
  y,
  elementBox,
  pageSize,
}: {
  x: number;
  y: number;
  elementBox: ElementBox;
  pageSize: PageSize;
}) => {
  const maxX = Math.max(pageSize.width - elementBox.width, 0);
  const maxY = Math.max(pageSize.height - elementBox.height, 0);

  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY),
  };
};

export const clampElementSize = ({
  width,
  height,
  x,
  y,
  pageSize,
}: {
  width: number;
  height: number;
  x: number;
  y: number;
  pageSize: PageSize;
}) => {
  const maxWidth = Math.max(pageSize.width - x, TEMPLATE_ELEMENT_MIN_WIDTH);
  const maxHeight = Math.max(pageSize.height - y, TEMPLATE_ELEMENT_MIN_HEIGHT);

  return {
    width: clamp(width, TEMPLATE_ELEMENT_MIN_WIDTH, maxWidth),
    height: clamp(height, TEMPLATE_ELEMENT_MIN_HEIGHT, maxHeight),
  };
};

export const clampSelectionDelta = ({
  bounds,
  dx,
  dy,
  pageSize,
}: {
  bounds: SelectionBounds;
  dx: number;
  dy: number;
  pageSize: PageSize;
}) => {
  return {
    dx: clamp(dx, -bounds.x, pageSize.width - (bounds.x + bounds.width)),
    dy: clamp(dy, -bounds.y, pageSize.height - (bounds.y + bounds.height)),
  };
};

export const normalizeElementForPage = ({
  element,
  pageSize,
}: {
  element: TemplateElementInput;
  pageSize: PageSize;
}): TemplateElement => {
  const normalizedElement = normalizeTemplateElement(element);
  const nextSize = clampElementSize({
    width: normalizedElement.width ?? 220,
    height: normalizedElement.height ?? 44,
    x: normalizedElement.x,
    y: normalizedElement.y,
    pageSize,
  });
  const nextPosition = clampElementPosition({
    x: normalizedElement.x,
    y: normalizedElement.y,
    elementBox: nextSize,
    pageSize,
  });

  return {
    ...normalizedElement,
    x: nextPosition.x,
    y: nextPosition.y,
    width: nextSize.width,
    height: nextSize.height,
  };
};

const getPositionSnapTargets = ({
  pageSize,
  elementBox,
}: {
  pageSize: PageSize;
  elementBox: ElementBox;
}) => {
  const safeArea = getSafeAreaFrame(pageSize);
  const centerX = (pageSize.width - elementBox.width) / 2;
  const centerY = (pageSize.height - elementBox.height) / 2;

  return {
    x: [
      { elementPosition: safeArea.x, guidePosition: safeArea.x },
      {
        elementPosition: safeArea.x + safeArea.width - elementBox.width,
        guidePosition: safeArea.x + safeArea.width,
      },
      { elementPosition: centerX, guidePosition: pageSize.width / 2 },
    ],
    y: [
      { elementPosition: safeArea.y, guidePosition: safeArea.y },
      {
        elementPosition: safeArea.y + safeArea.height - elementBox.height,
        guidePosition: safeArea.y + safeArea.height,
      },
      { elementPosition: centerY, guidePosition: pageSize.height / 2 },
    ],
  };
};

export const snapElementPosition = ({
  x,
  y,
  elementBox,
  pageSize,
}: {
  x: number;
  y: number;
  elementBox: ElementBox;
  pageSize: PageSize;
}) => {
  const clampedPosition = clampElementPosition({
    x,
    y,
    elementBox,
    pageSize,
  });
  const guides: TemplateSnapGuide[] = [];
  const targets = getPositionSnapTargets({ pageSize, elementBox });

  let nextX = clampElementPosition({
    x: snapToGrid(clampedPosition.x),
    y: clampedPosition.y,
    elementBox,
    pageSize,
  }).x;
  let nextY = clampElementPosition({
    x: clampedPosition.x,
    y: snapToGrid(clampedPosition.y),
    elementBox,
    pageSize,
  }).y;

  const matchedTargetX = targets.x.find(
    (target) =>
      Math.abs(clampedPosition.x - target.elementPosition) <=
      TEMPLATE_EDITOR_SNAP_THRESHOLD,
  );
  const matchedTargetY = targets.y.find(
    (target) =>
      Math.abs(clampedPosition.y - target.elementPosition) <=
      TEMPLATE_EDITOR_SNAP_THRESHOLD,
  );

  if (matchedTargetX) {
    nextX = clampElementPosition({
      x: matchedTargetX.elementPosition,
      y: clampedPosition.y,
      elementBox,
      pageSize,
    }).x;
    guides.push({ axis: "x", position: matchedTargetX.guidePosition });
  }

  if (matchedTargetY) {
    nextY = clampElementPosition({
      x: clampedPosition.x,
      y: matchedTargetY.elementPosition,
      elementBox,
      pageSize,
    }).y;
    guides.push({ axis: "y", position: matchedTargetY.guidePosition });
  }

  return {
    x: nextX,
    y: nextY,
    guides,
  };
};

export const snapElementSize = ({
  width,
  height,
  x,
  y,
  pageSize,
}: {
  width: number;
  height: number;
  x: number;
  y: number;
  pageSize: PageSize;
}) => {
  return clampElementSize({
    width: snapToGrid(width),
    height: snapToGrid(height),
    x,
    y,
    pageSize,
  });
};

export const alignElementToPage = ({
  element,
  pageSize,
  alignment,
}: {
  element: TemplateElement;
  pageSize: PageSize;
  alignment: "left" | "center" | "right" | "top" | "middle" | "bottom";
}) => {
  const elementBox = getElementBox(element);
  const currentPosition = clampElementPosition({
    x: element.x,
    y: element.y,
    elementBox,
    pageSize,
  });

  switch (alignment) {
    case "left":
      return { x: 0, y: currentPosition.y };
    case "center":
      return {
        x: clampElementPosition({
          x: (pageSize.width - elementBox.width) / 2,
          y: currentPosition.y,
          elementBox,
          pageSize,
        }).x,
        y: currentPosition.y,
      };
    case "right":
      return {
        x: clampElementPosition({
          x: pageSize.width - elementBox.width,
          y: currentPosition.y,
          elementBox,
          pageSize,
        }).x,
        y: currentPosition.y,
      };
    case "top":
      return { x: currentPosition.x, y: 0 };
    case "middle":
      return {
        x: currentPosition.x,
        y: clampElementPosition({
          x: currentPosition.x,
          y: (pageSize.height - elementBox.height) / 2,
          elementBox,
          pageSize,
        }).y,
      };
    case "bottom":
      return {
        x: currentPosition.x,
        y: clampElementPosition({
          x: currentPosition.x,
          y: pageSize.height - elementBox.height,
          elementBox,
          pageSize,
        }).y,
      };
  }
};

export const alignElementsToPage = ({
  elements,
  pageSize,
  alignment,
}: {
  elements: TemplateElement[];
  pageSize: PageSize;
  alignment: "left" | "center" | "right" | "top" | "middle" | "bottom";
}) => {
  if (elements.length <= 1) {
    return elements.map((element) => {
      const nextPosition = alignElementToPage({ element, pageSize, alignment });

      return {
        id: element.id,
        x: nextPosition.x,
        y: nextPosition.y,
      };
    });
  }

  const bounds = getSelectionBounds(elements);

  if (!bounds) {
    return [];
  }

  let dx = 0;
  let dy = 0;

  switch (alignment) {
    case "left":
      dx = -bounds.x;
      break;
    case "center":
      dx = (pageSize.width - bounds.width) / 2 - bounds.x;
      break;
    case "right":
      dx = pageSize.width - (bounds.x + bounds.width);
      break;
    case "top":
      dy = -bounds.y;
      break;
    case "middle":
      dy = (pageSize.height - bounds.height) / 2 - bounds.y;
      break;
    case "bottom":
      dy = pageSize.height - (bounds.y + bounds.height);
      break;
  }

  const clampedDelta = clampSelectionDelta({
    bounds,
    dx,
    dy,
    pageSize,
  });

  return elements.map((element) => ({
    id: element.id,
    x: element.x + clampedDelta.dx,
    y: element.y + clampedDelta.dy,
  }));
};

export const moveElementsWithinPage = ({
  elements,
  pageSize,
  dx,
  dy,
}: {
  elements: TemplateElement[];
  pageSize: PageSize;
  dx: number;
  dy: number;
}) => {
  const bounds = getSelectionBounds(elements);

  if (!bounds) {
    return [];
  }

  const clampedDelta = clampSelectionDelta({
    bounds,
    dx,
    dy,
    pageSize,
  });

  return elements.map((element) => ({
    id: element.id,
    x: element.x + clampedDelta.dx,
    y: element.y + clampedDelta.dy,
  }));
};

export const distributeElementsOnAxis = ({
  elements,
  axis,
}: {
  elements: TemplateElement[];
  axis: "horizontal" | "vertical";
}) => {
  if (elements.length < 3) {
    return [];
  }

  const sortedElements = [...elements].sort((left, right) =>
    axis === "horizontal" ? left.x - right.x : left.y - right.y,
  );

  const starts = sortedElements.map((element) =>
    axis === "horizontal" ? element.x : element.y,
  );
  const sizes = sortedElements.map((element) =>
    axis === "horizontal"
      ? getElementBox(element).width
      : getElementBox(element).height,
  );
  const firstStart = starts[0];
  const lastEnd = starts[starts.length - 1] + sizes[sizes.length - 1];
  const totalSize = sizes.reduce((sum, size) => sum + size, 0);
  const gap = (lastEnd - firstStart - totalSize) / (sortedElements.length - 1);

  if (!Number.isFinite(gap)) {
    return [];
  }

  let cursor = firstStart;

  return sortedElements.map((element, index) => {
    if (index === 0) {
      cursor = firstStart + sizes[index] + gap;
      return {
        id: element.id,
        x: element.x,
        y: element.y,
      };
    }

    const nextPosition =
      index === sortedElements.length - 1 ? starts[starts.length - 1] : cursor;
    cursor = nextPosition + sizes[index] + gap;

    return axis === "horizontal"
      ? { id: element.id, x: nextPosition, y: element.y }
      : { id: element.id, x: element.x, y: nextPosition };
  });
};
