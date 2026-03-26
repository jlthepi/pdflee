// components/layout/Providers.tsx
"use client";

import type { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";

const Providers = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};

export default Providers;
