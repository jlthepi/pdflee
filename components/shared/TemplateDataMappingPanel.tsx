// components/shared/TemplateDataMappingPanel.tsx
"use client";

import {
  getTemplateDataMappingSummary,
  type TemplateDataMappingSummary,
} from "@/lib/domain/placeholders";
import { cn } from "@/lib/utils";
import type { DataTable, TemplateDocument } from "@/types/domain";
import { Badge } from "@/components/ui/badge";

type TemplateDataMappingPanelProps = {
  document: TemplateDocument;
  table: DataTable;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
};

const SummaryTile = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning";
}) => {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-border bg-muted/50 text-foreground";

  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClassName)}>
      <div className="text-xs text-current/80">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
};

const MappingBadgeList = ({
  items,
  emptyLabel,
  variant,
}: {
  items: string[];
  emptyLabel: string;
  variant: "matched" | "missing" | "unused";
}) => {
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  const className =
    variant === "matched"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : variant === "missing"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-border bg-muted/50 text-muted-foreground";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className={className}>
          {item}
        </Badge>
      ))}
    </div>
  );
};

const MappingCoverageRows = ({
  coverage,
}: {
  coverage: TemplateDataMappingSummary["coverage"];
}) => {
  if (coverage.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
        No placeholders detected in the current template.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {coverage.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-lg border px-3 py-2"
        >
          <span className="font-mono text-sm">{item.name}</span>
          <Badge
            variant="outline"
            className={
              item.matched
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }
          >
            {item.matched ? "Matched column" : "Missing column"}
          </Badge>
        </div>
      ))}
    </div>
  );
};

const TemplateDataMappingPanel = ({
  document,
  table,
  title,
  description,
  className,
  compact = false,
}: TemplateDataMappingPanelProps) => {
  const summary = getTemplateDataMappingSummary(document, table);

  return (
    <div
      className={cn(
        "border-t border-stone-900/12 pt-4 dark:border-white/10",
        className,
      )}
    >
      {title || description ? (
        <div className="space-y-1">
          {title ? <h2 className="text-sm font-semibold">{title}</h2> : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-3 sm:grid-cols-3",
          title || description ? "mt-4" : "",
        )}
      >
        <SummaryTile
          label="Matched"
          value={summary.matchedPlaceholders.length}
          tone="success"
        />
        <SummaryTile
          label="Missing"
          value={summary.missingPlaceholders.length}
          tone={summary.missingPlaceholders.length > 0 ? "warning" : "default"}
        />
        <SummaryTile
          label="Unused Columns"
          value={summary.unusedColumns.length}
          tone="default"
        />
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Placeholder Coverage
          </div>
          <MappingCoverageRows coverage={summary.coverage} />
        </div>

        {!compact && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Matched Columns
              </div>
              <MappingBadgeList
                items={summary.matchedColumns}
                emptyLabel="No dataset columns match yet."
                variant="matched"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Unused Columns
              </div>
              <MappingBadgeList
                items={summary.unusedColumns}
                emptyLabel="Every column currently maps to a placeholder."
                variant="unused"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateDataMappingPanel;
