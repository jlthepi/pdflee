// components/layout/Header.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { ModeToggle } from "./ModeToggle";

type HeaderProps = {
  width?: "default" | "wide";
};

const navItems = [
  { href: "/template", label: "Template" },
  { href: "/data", label: "Data" },
  { href: "/generate", label: "Generate" },
];

const Header = ({ width = "default" }: HeaderProps) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-900/12 dark:border-white/10">
      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-8 lg:px-12",
          width === "wide" ? "max-w-[1800px]" : "max-w-7xl",
        )}
      >
        <div className="grid grid-cols-[1fr_1fr_1fr] items-center py-3">
          <div className="justify-self-start">
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.28em] text-stone-700 dark:text-stone-300"
            >
              PDFlee
            </Link>
          </div>
          <NavigationMenu className="justify-self-center">
            <NavigationMenuList className="justify-center">
              {navItems.map(({ href, label }, idx) => (
                <React.Fragment key={href}>
                  <NavigationMenuButton
                    href={href}
                    label={label}
                    pathname={pathname}
                  />
                  {idx < navItems.length - 1 && (
                    <ChevronRight className="mx-1 mt-0.5 size-3 text-stone-400 dark:text-stone-500" />
                  )}
                </React.Fragment>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="justify-self-end">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

const NavigationMenuButton = ({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "px-2 py-1 text-xs font-normal transition uppercase tracking-[0.28em]",
            pathname === href
              ? "text-stone-950 dark:text-stone-50 font-medium"
              : "text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50",
          )}
        >
          {label}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};
