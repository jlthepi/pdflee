// components/generate/GenerateRowPreview.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import {
  getRowPlaceholderPreview,
  type RowPlaceholderPreviewItem,
} from "@/lib/domain/placeholders";
import type { DataTable, TemplateDocument } from "@/types/domain";
import { cn } from "@/lib/utils";

type GenerateRowPreviewProps = {
  document: TemplateDocument;
  table: DataTable;
  rowIndexes: number[];
};

const PreviewItem = ({ item }: { item: RowPlaceholderPreviewItem }) => {
  return (
    <div className="rounded-2xl border border-stone-900/12 px-3 py-3 dark:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm">{item.placeholder}</span>
        <Badge
          variant="outline"
          className={
            item.matchedColumn
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }
        >
          {item.matchedColumn ? "Mapped" : "Missing"}
        </Badge>
      </div>
      <div
        className={cn(
          "mt-3 text-sm",
          item.isEmpty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {item.matchedColumn
          ? item.value || "Empty value for this row"
          : "No matching column"}
      </div>
    </div>
  );
};

const GenerateRowPreview = ({
  document,
  table,
  rowIndexes,
}: GenerateRowPreviewProps) => {
  const previewRowIndex = rowIndexes[0];
  const previewItems =
    previewRowIndex === undefined
      ? []
      : getRowPlaceholderPreview({
          document,
          table,
          rowIndex: previewRowIndex,
        });

  return (
    <section className="space-y-4 border-t border-stone-900/12 pt-5 dark:border-white/10">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Sample Content Check</h2>
        <p className="text-sm text-muted-foreground">
          Preview the first row that will be used in this run before generating
          the final PDF or ZIP.
        </p>
      </div>

      {previewRowIndex === undefined ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          No row selected yet. Choose a run mode and row selection first.
        </div>
      ) : previewItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
          The template has no placeholders, so every row will produce the same
          static output.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-1">
              Previewing row {previewRowIndex + 1}
            </span>
            {rowIndexes.length > 1 ? (
              <span className="rounded-full border px-2 py-1">
                +{rowIndexes.length - 1} more row
                {rowIndexes.length === 2 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {previewItems.map((item) => (
              <PreviewItem key={item.placeholder} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default GenerateRowPreview;
