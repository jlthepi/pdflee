// components/template/panels/PanelSection.tsx
"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type PanelSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
};

const PanelSection = ({
  title,
  description,
  children,
  defaultOpen = true,
  className,
  contentClassName,
}: PanelSectionProps) => {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "border-t border-stone-900/12 pt-4 dark:border-white/10",
        className,
      )}
    >
      <CollapsibleTrigger className="group flex w-full items-start justify-between gap-3 text-left">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <ChevronDown className="mt-0.5 size-4 text-muted-foreground transition group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("pt-4", contentClassName)}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PanelSection;
