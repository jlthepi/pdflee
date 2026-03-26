// components/template/SidePanelTabs.tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type SidePanelTab<T extends string> = {
  id: T;
  label: string;
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
    <Tabs
      value={activeTab}
      onValueChange={(value) => onChange(value as T)}
      orientation="vertical"
      className={cn(
        "pointer-events-none absolute top-24 z-20",
        side === "right"
          ? "right-0 translate-x-[calc(100%-1px)]"
          : "left-0 -translate-x-[calc(100%-1px)]",
        className,
      )}
    >
      <TabsList
        variant="line"
        className="pointer-events-auto flex-col gap-2 bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "h-10 min-w-[92px] items-center border-y border-stone-900/12 bg-[color:var(--background)] px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground",
              side === "right"
                ? "justify-start rounded-r-xl border-r border-l-0"
                : "justify-end rounded-l-xl border-l border-r-0",
              "after:hidden data-[state=active]:border-stone-950 data-[state=active]:text-stone-950 dark:border-white/10 dark:data-[state=active]:border-stone-50 dark:data-[state=active]:text-stone-50",
              "data-[state=active]:bg-[color:var(--background)] data-[state=inactive]:bg-[color:var(--background)]/92",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default SidePanelTabs;
