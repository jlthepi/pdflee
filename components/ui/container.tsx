// components/ui/container.tsx
import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = PropsWithChildren<{
  className?: string;
}>;

const Container = ({ children, className }: ContainerProps) => {
  return (
    <div className={cn("mx-auto w-full max-w-7xl", className)}>{children}</div>
  );
};

export { Container };
