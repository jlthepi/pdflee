// components/ui/navigation-menu.tsx
import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const NavigationMenu = ({
  className,
  ...props
}: React.ComponentProps<"nav">) => {
  return <nav className={cn("w-full", className)} {...props} />;
};

const NavigationMenuList = ({
  className,
  ...props
}: React.ComponentProps<"ul">) => {
  return <ul className={cn("flex items-center gap-1", className)} {...props} />;
};

const NavigationMenuItem = ({
  className,
  ...props
}: React.ComponentProps<"li">) => {
  return <li className={cn("list-none", className)} {...props} />;
};

const NavigationMenuLink = ({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) => {
  const Comp = asChild ? Slot.Root : "a";

  return <Comp className={className} {...props} />;
};

export {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
};
