// components/layout/ModeToggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "dark") {
      setTheme("light");
      return;
    }
    if (theme === "light") {
      setTheme("dark");
      return;
    }
    if (theme === "system") {
      setTheme("dark");
      return;
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleToggle}
      className="relative rounded-full border-none border-stone-900/12 text-stone-700 hover:bg-stone-900/4 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/6"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
