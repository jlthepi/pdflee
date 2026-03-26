// components/layout/Layout.tsx
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import Header from "./Header";

type LayoutProps = {
  children: ReactNode;
  width?: "default" | "wide";
  mainScroll?: "page" | "locked";
};

export const Layout = ({
  children,
  width = "default",
  mainScroll = "page",
}: LayoutProps) => {
  return (
    <div className="relative flex h-screen min-h-screen min-h-0 flex-col overflow-hidden supports-[height:100svh]:h-svh supports-[height:100svh]:min-h-svh text-stone-950 dark:text-stone-50">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-1/2 w-full -translate-x-1/2 px-4 sm:px-8 lg:px-12",
          width === "wide" ? "max-w-[1800px]" : "max-w-7xl",
        )}
      >
        <div className="relative h-full">
          <div className="absolute inset-y-0 -left-5 w-px bg-stone-900/10 dark:bg-white/8" />
          <div className="absolute inset-y-0 -right-5 w-px bg-stone-900/10 dark:bg-white/8" />
        </div>
      </div>
      <Header width={width} />
      <main
        className={cn(
          "relative min-h-0 flex-1",
          mainScroll === "page" ? "overflow-y-auto" : "overflow-hidden",
        )}
      >
        <div
          className={cn(
            "relative mx-auto w-full px-4 sm:px-8 lg:px-12",
            mainScroll === "locked" ? "h-full min-h-0" : "",
            width === "wide" ? "max-w-[1800px]" : "max-w-7xl",
          )}
        >
          <div className={cn(mainScroll === "locked" ? "h-full min-h-0" : "")}>
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};
