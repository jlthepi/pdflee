// types/domain.ts
export type PageSize = {
  width: number;
  height: number;
};

export type TemplateDocumentSchemaVersion = 1;
export type TemplateDocumentUnit = "px";
export type TemplateCoordinateSystem = "top-left";
export type TemplateElementType = "text" | "box" | "image" | "line";
export type FontWeightToken =
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | (string & {});

export type TemplateTextStyle = {
  fontSize: number;
  color: string;
  fontFamily?: string;
  fontWeight?: FontWeightToken;
  lineHeight?: number;
};

export type TemplateStylePreset = TemplateTextStyle & {
  id: string;
  name: string;
};

export type TemplateElementBase<
  Type extends TemplateElementType = TemplateElementType,
> = {
  id: string;
  type: Type;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
};

type TemplateTextElementFields = TemplateTextStyle & {
  content: string;
};

type TemplateBoxElementFields = {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius?: number;
};

type TemplateImageElementFields = {
  src: string;
  alt?: string;
  objectFit?: "contain" | "cover" | "fill";
};

type TemplateLineElementFields = {
  strokeColor: string;
  strokeWidth: number;
  orientation: "horizontal" | "vertical";
};

type NonTextElementFields = TemplateBoxElementFields &
  TemplateImageElementFields &
  TemplateLineElementFields;
type NonBoxElementFields = TemplateTextElementFields &
  TemplateImageElementFields &
  TemplateLineElementFields;
type NonImageElementFields = TemplateTextElementFields &
  TemplateBoxElementFields &
  TemplateLineElementFields;
type NonLineElementFields = TemplateTextElementFields &
  TemplateBoxElementFields &
  TemplateImageElementFields;

type CompatibleElementFields<Fields> = {
  [Key in keyof Fields]?: Fields[Key];
};

export type TemplateTextElement = TemplateElementBase<"text"> &
  TemplateTextElementFields &
  CompatibleElementFields<NonTextElementFields>;

export type TemplateBoxElement = TemplateElementBase<"box"> &
  TemplateBoxElementFields &
  CompatibleElementFields<NonBoxElementFields>;

export type TemplateImageElement = TemplateElementBase<"image"> &
  TemplateImageElementFields &
  CompatibleElementFields<NonImageElementFields>;

export type TemplateLineElement = TemplateElementBase<"line"> &
  TemplateLineElementFields &
  CompatibleElementFields<NonLineElementFields>;

export type TemplateElement =
  | TemplateTextElement
  | TemplateBoxElement
  | TemplateImageElement
  | TemplateLineElement;

export type TemplateElementInput = Partial<TemplateElementBase> & {
  type?: TemplateElementType;
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: FontWeightToken;
  lineHeight?: number;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  src?: string;
  alt?: string;
  objectFit?: "contain" | "cover" | "fill";
  strokeColor?: string;
  strokeWidth?: number;
  orientation?: "horizontal" | "vertical";
};

export type TemplatePage = {
  id: string;
  name: string;
  size: PageSize;
  elements: TemplateElement[];
};

export type TemplateDocument = {
  schemaVersion?: TemplateDocumentSchemaVersion;
  unit?: TemplateDocumentUnit;
  coordinateSystem?: TemplateCoordinateSystem;
  pages: TemplatePage[];
  stylePresets?: TemplateStylePreset[];
};

export type TemplateDraft = {
  id?: string;
  name: string;
  description: string;
  currentVersion?: number;
  document: TemplateDocument;
};

export type TemplateRecord = {
  id: string;
  name: string;
  description: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type TemplateVersion = {
  templateId: string;
  version: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  document: TemplateDocument;
};

export type PersistedTemplate = {
  record: TemplateRecord;
  version: TemplateVersion;
};

export type DataCell = string;
export type DataColumn = string;
export type DataRow = string[];

export type DataTable = {
  columns: DataColumn[];
  rows: DataRow[];
};

export type DataSetDraft = {
  id?: string;
  name: string;
  description: string;
  currentVersion?: number;
  table: DataTable;
};

export type DataSetRecord = {
  id: string;
  name: string;
  description: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type DataSetVersion = {
  dataSetId: string;
  version: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  table: DataTable;
};

export type PersistedDataSet = {
  record: DataSetRecord;
  version: DataSetVersion;
};

export type GenerateMode = "single" | "selection" | "all";

export type GenerateJobPayload = {
  templateId: string;
  templateVersion: number;
  dataSetId: string;
  dataSetVersion: number;
  mode: GenerateMode;
  rowIndexes: number[];
};

export type GenerateJobOutput =
  | {
      kind: "pdf";
      fileName: string;
      itemCount: number;
    }
  | {
      kind: "zip";
      fileName: string;
      itemCount: number;
    };

export type GenerateJobRecord = {
  id: string;
  templateId: string;
  templateVersion: number;
  dataSetId: string;
  dataSetVersion: number;
  mode: GenerateMode;
  version: number;
  createdAt: string;
  updatedAt: string;
  output: GenerateJobOutput;
  payload: GenerateJobPayload;
};
