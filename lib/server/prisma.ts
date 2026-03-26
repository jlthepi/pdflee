// lib/server/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var __pdfleePrisma: PrismaClient | undefined;
}

export const prisma =
  global.__pdfleePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__pdfleePrisma = prisma;
}
