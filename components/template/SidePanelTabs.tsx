// components/template/SidePanelTabs.tsx
"use client";

import type { LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SidePanelTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
};

type SidePanelTabsProps<T extends string> = {
  side: "left" | "right";
  activeTab: T;
  tabs: SidePanelTab<T>[];
  onChange: (tab: T) => void;
  className?: string;
};

const SidePanelTabs = <T extends string>({
  side,
  activeTab,
  tabs,
  onChange,
  className,
}: SidePanelTabsProps<T>) => {
  return (
    <TooltipProvider>
      <Tabs
        value={activeTab}
        onValueChange={(value) => onChange(value as T)}
        orientation="vertical"
        className={cn(
          "pointer-events-none absolute top-16 z-20",
          side === "right"
            ? "right-0 translate-x-full"
            : "left-0 -translate-x-full",
          className,
        )}
      >
        <TabsList
          variant="line"
          className="pointer-events-auto flex-col gap-2 bg-transparent p-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value={tab.id}
                    aria-label={tab.label}
                    className={cn(
                      "h-10 w-10 min-w-10 rounded-none items-center justify-center border-y border-stone-900/12 py-2 px-3 text-muted-foreground transition hover:text-foreground",
                      side === "right"
                        ? "rounded-r-xl border-r border-l-0 rounded-l-none"
                        : "rounded-l-xl border-l border-r-0 rounded-r-none",
                      "after:hidden data-[state=active]:border-stone-950 data-[state=active]:text-stone-950 dark:border-white/10 dark:data-[state=active]:border-stone-50 dark:data-[state=active]:text-stone-50",
                      // "data-[state=active]:bg-background data-[state=inactive]:bg-background/92",
                    )}
                  >
                    <Icon className="size-6" />
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side={side === "right" ? "right" : "left"}
                  sideOffset={10}
                >
                  {tab.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TabsList>
      </Tabs>
    </TooltipProvider>
  );
};

export default SidePanelTabs;
