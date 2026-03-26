// lib/domain/placeholders.ts
import type { DataTable, GenerateMode, TemplateDocument } from "@/types/domain";
import {
  getDataTableDiagnostics,
  normalizeDataColumnName,
} from "@/lib/domain/data-table";
import {
  getGenerateOutputKind,
  MAX_GENERATION_ITEMS,
  resolveGenerateRowIndexes,
} from "@/lib/domain/generate-job";
import { getAllTemplateElements, isTextTemplateElement } from "@/lib/domain/template-document";

const PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

export type PlaceholderCoverageItem = {
  name: string;
  matched: boolean;
};

export type TemplateDataMappingSummary = {
  placeholders: string[];
  coverage: PlaceholderCoverageItem[];
  matchedPlaceholders: string[];
  missingPlaceholders: string[];
  matchedColumns: string[];
  unusedColumns: string[];
};

export type GenerationReadiness = {
  status: "ready" | "warning" | "blocked";
  blockers: string[];
  warnings: string[];
  selectedRowIndexes: number[];
  selectedRowCount: number;
  outputKind: "pdf" | "zip";
  missingPlaceholders: string[];
  matchedColumns: string[];
  unusedColumns: string[];
  issues: GenerationReadinessIssue[];
};

export type GenerationReadinessIssue = {
  id: string;
  tone: "blocked" | "warning" | "info";
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
  };
  relatedItems?: string[];
};

export type RowPlaceholderPreviewItem = {
  placeholder: string;
  matchedColumn: boolean;
  value: string;
  isEmpty: boolean;
};

export const extractPlaceholdersFromContent = (content: string) => {
  const placeholders = new Set<string>();
  let match = PLACEHOLDER_REGEX.exec(content);

  while (match) {
    placeholders.add(match[1]);
    match = PLACEHOLDER_REGEX.exec(content);
  }

  PLACEHOLDER_REGEX.lastIndex = 0;

  return [...placeholders];
};

export const hasTemplatePlaceholders = (content: string) => {
  return extractPlaceholdersFromContent(content).length > 0;
};

export const extractPlaceholders = (document: TemplateDocument): string[] => {
  const placeholders = new Set<string>();

  getAllTemplateElements(document).forEach((element) => {
    if (!isTextTemplateElement(element)) {
      return;
    }

    extractPlaceholdersFromContent(element.content ?? "").forEach((placeholder) => {
      placeholders.add(placeholder);
    });
  });

  return [...placeholders];
};

export const mapRowToRecord = (
  columns: string[],
  row: string[],
): Record<string, string> => {
  return columns.reduce<Record<string, string>>((acc, column, index) => {
    const normalizedColumn = normalizeDataColumnName(column);

    if (!normalizedColumn) {
      return acc;
    }

    acc[normalizedColumn] = row[index] ?? "";
    return acc;
  }, {});
};

export const resolveTemplateContentPlaceholders = (
  content: string,
  row: Record<string, string>,
) => {
  return content.replace(PLACEHOLDER_REGEX, (_, key: string) => row[key] ?? "");
};

export const buildLongestPlaceholderPreviewContent = (
  content: string,
  table: DataTable,
) => {
  const placeholders = extractPlaceholdersFromContent(content);

  if (placeholders.length === 0) {
    return content;
  }

  const longestRecord = placeholders.reduce<Record<string, string>>(
    (acc, placeholder) => {
      const columnIndex = table.columns.findIndex(
        (column) => normalizeDataColumnName(column) === placeholder,
      );

      if (columnIndex === -1) {
        acc[placeholder] = "";
        return acc;
      }

      acc[placeholder] = table.rows.reduce((longestValue, row) => {
        const candidateValue = row[columnIndex] ?? "";
        return candidateValue.length > longestValue.length
          ? candidateValue
          : longestValue;
      }, "");

      return acc;
    },
    {},
  );

  return resolveTemplateContentPlaceholders(content, longestRecord);
};

export const getPlaceholderCoverage = (
  document: TemplateDocument,
  table: DataTable,
) => {
  const placeholders = extractPlaceholders(document);
  const columnSet = new Set(
    table.columns
      .map(normalizeDataColumnName)
      .filter((columnName) => columnName.length > 0),
  );

  return placeholders.map(
    (name): PlaceholderCoverageItem => ({
      name,
      matched: columnSet.has(name),
    }),
  );
};

export const getTemplateDataMappingSummary = (
  document: TemplateDocument,
  table: DataTable,
): TemplateDataMappingSummary => {
  const coverage = getPlaceholderCoverage(document, table);
  const matchedPlaceholders = coverage
    .filter((item) => item.matched)
    .map((item) => item.name);
  const missingPlaceholders = coverage
    .filter((item) => !item.matched)
    .map((item) => item.name);
  const placeholderSet = new Set(coverage.map((item) => item.name));
  const matchedColumns = table.columns.filter((column) =>
    placeholderSet.has(normalizeDataColumnName(column)),
  );
  const unusedColumns = table.columns.filter(
    (column) => !placeholderSet.has(normalizeDataColumnName(column)),
  );

  return {
    placeholders: coverage.map((item) => item.name),
    coverage,
    matchedPlaceholders,
    missingPlaceholders,
    matchedColumns,
    unusedColumns,
  };
};

export const getRowPlaceholderPreview = ({
  document,
  table,
  rowIndex,
}: {
  document: TemplateDocument;
  table: DataTable;
  rowIndex: number;
}): RowPlaceholderPreviewItem[] => {
  const row = table.rows[rowIndex] ?? [];
  const record = mapRowToRecord(table.columns, row);

  return getPlaceholderCoverage(document, table).map((item) => {
    const value = item.matched ? record[item.name] ?? "" : "";

    return {
      placeholder: item.name,
      matchedColumn: item.matched,
      value,
      isEmpty: value.trim().length === 0,
    };
  });
};

export const getGenerationReadiness = ({
  document,
  table,
  mode,
  selectedRowIndexes,
}: {
  document: TemplateDocument;
  table: DataTable;
  mode: GenerateMode;
  selectedRowIndexes: number[];
}): GenerationReadiness => {
  const mapping = getTemplateDataMappingSummary(document, table);
  const diagnostics = getDataTableDiagnostics({
    table,
    placeholders: mapping.placeholders,
  });
  const resolvedRowIndexes = resolveGenerateRowIndexes(
    table,
    mode,
    selectedRowIndexes,
  );
  const blockers: string[] = [];
  const warnings: string[] = [];
  const issues: GenerationReadinessIssue[] = [];

  if (getAllTemplateElements(document).length === 0) {
    const message = "Add at least one template element.";
    blockers.push(message);
    issues.push({
      id: "missing-template-elements",
      tone: "blocked",
      title: "Template has no renderable content",
      description: message,
      action: {
        label: "Open Template",
        href: "/template",
      },
    });
  }

  if (table.rows.length === 0) {
    const message = "Import or add at least one data row.";
    blockers.push(message);
    issues.push({
      id: "missing-data-rows",
      tone: "blocked",
      title: "Data set is empty",
      description: message,
      action: {
        label: "Open Data",
        href: "/data",
      },
    });
  }

  if (table.columns.length === 0) {
    const message = "Add at least one data column.";
    blockers.push(message);
    issues.push({
      id: "missing-data-columns",
      tone: "blocked",
      title: "Data set has no columns",
      description: message,
      action: {
        label: "Open Data",
        href: "/data",
      },
    });
  }

  if (mode === "selection" && resolvedRowIndexes.length === 0) {
    const message = "Select one or more data rows to generate.";
    blockers.push(message);
    issues.push({
      id: "selection-required",
      tone: "blocked",
      title: "Selection mode needs at least one row",
      description: message,
      action: {
        label: "Choose rows below",
      },
    });
  }

  if (resolvedRowIndexes.length > MAX_GENERATION_ITEMS) {
    const message = `Generate up to ${MAX_GENERATION_ITEMS} rows at a time. Narrow the selection before running the job.`;
    blockers.push(message);
    issues.push({
      id: "too-many-rows",
      tone: "blocked",
      title: "Selection exceeds the current generation limit",
      description: message,
      action: {
        label: "Trim selection",
      },
    });
  }

  if (diagnostics.blankColumnIndexes.length > 0) {
    const message = `Name all columns before generating. ${diagnostics.blankColumnIndexes.length} column${
      diagnostics.blankColumnIndexes.length > 1 ? "s are" : " is"
    } blank.`;
    blockers.push(message);
    issues.push({
      id: "blank-columns",
      tone: "blocked",
      title: "Unnamed columns block generation",
      description: message,
      action: {
        label: "Fix columns on Data",
        href: "/data",
      },
    });
  }

  if (diagnostics.duplicateColumnNames.length > 0) {
    const message = `Rename duplicate columns before generating. ${diagnostics.duplicateColumnNames.length} duplicate name${
      diagnostics.duplicateColumnNames.length > 1 ? "s were" : " was"
    } found.`;
    blockers.push(message);
    issues.push({
      id: "duplicate-columns",
      tone: "blocked",
      title: "Duplicate column names make placeholder matching ambiguous",
      description: message,
      action: {
        label: "Resolve duplicates",
        href: "/data",
      },
      relatedItems: diagnostics.duplicateColumnNames,
    });
  }

  if (mapping.missingPlaceholders.length > 0) {
    const message = `${mapping.missingPlaceholders.length} placeholder${
      mapping.missingPlaceholders.length > 1 ? "s are" : " is"
    } missing a matching column.`;
    warnings.push(message);
    issues.push({
      id: "missing-placeholder-columns",
      tone: "warning",
      title: "Some placeholders will render empty",
      description: message,
      action: {
        label: "Fix columns on Data",
        href: "/data",
      },
      relatedItems: mapping.missingPlaceholders,
    });
  }

  if (mapping.placeholders.length === 0) {
    const message = "This template has no placeholders. Output will be static.";
    warnings.push(message);
    issues.push({
      id: "static-template",
      tone: "warning",
      title: "Output will be identical for every row",
      description: message,
      action: {
        label: "Review template",
        href: "/template",
      },
    });
  }

  if (mapping.unusedColumns.length > 0) {
    issues.push({
      id: "unused-columns",
      tone: "info",
      title: "Some data columns are not used by the template",
      description: `${mapping.unusedColumns.length} column${
        mapping.unusedColumns.length > 1 ? "s are" : " is"
      } available but currently unused.`,
      action: {
        label: "Review mappings",
        href: "/template",
      },
      relatedItems: mapping.unusedColumns,
    });
  }

  return {
    status:
      blockers.length > 0
        ? "blocked"
        : warnings.length > 0
          ? "warning"
          : "ready",
    blockers,
    warnings,
    selectedRowIndexes: resolvedRowIndexes,
    selectedRowCount: resolvedRowIndexes.length,
    outputKind: getGenerateOutputKind(resolvedRowIndexes.length),
    missingPlaceholders: mapping.missingPlaceholders,
    matchedColumns: mapping.matchedColumns,
    unusedColumns: mapping.unusedColumns,
    issues,
  };
};
