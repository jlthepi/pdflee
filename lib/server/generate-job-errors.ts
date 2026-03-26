// lib/server/generate-job-errors.ts
import { ZodError } from "zod";

import { fail } from "@/lib/server/http";

const isMessageError = (error: unknown, message: string) => {
  return error instanceof Error && error.message === message;
};

const isPrismaError = (error: unknown) => {
  return (
    error instanceof Error &&
    [
      "PrismaClientKnownRequestError",
      "PrismaClientUnknownRequestError",
      "PrismaClientValidationError",
      "PrismaClientInitializationError",
      "PrismaClientRustPanicError",
    ].includes(error.name)
  );
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "unknown";
};

export const toGenerateJobErrorResponse = (error: unknown) => {
  if (error instanceof SyntaxError || error instanceof ZodError) {
    return fail(
      400,
      "INVALID_GENERATE_JOB_REQUEST",
      "Generate job request is invalid.",
      {
        category: "validation",
        cause: error instanceof Error ? error.message : "unknown",
        issues: error instanceof ZodError ? error.issues : undefined,
      },
    );
  }

  if (isMessageError(error, "TEMPLATE_NOT_FOUND")) {
    return fail(404, "GENERATE_TEMPLATE_NOT_FOUND", "Template was not found.", {
      category: "not-found",
      resource: "template",
    });
  }

  if (isMessageError(error, "DATASET_NOT_FOUND")) {
    return fail(404, "GENERATE_DATASET_NOT_FOUND", "Data set was not found.", {
      category: "not-found",
      resource: "dataSet",
    });
  }

  if (isMessageError(error, "PDF_BROWSER_UNAVAILABLE")) {
    return fail(
      503,
      "GENERATE_BROWSER_UNAVAILABLE",
      "PDF generation browser is temporarily unavailable.",
      {
        category: "runtime",
      },
    );
  }

  if (
    error instanceof Error &&
    error.message.startsWith("PDF_BROWSER_UNAVAILABLE:")
  ) {
    return fail(
      503,
      "GENERATE_BROWSER_UNAVAILABLE",
      "PDF generation browser is temporarily unavailable.",
      {
        category: "runtime",
        cause: error.message,
      },
    );
  }

  if (isMessageError(error, "PDF_RENDER_FAILED")) {
    return fail(
      500,
      "GENERATE_RENDER_FAILED",
      "PDF rendering failed.",
      {
        category: "runtime",
      },
    );
  }

  if (
    error instanceof Error &&
    error.message.startsWith("PDF_RENDER_FAILED:")
  ) {
    return fail(
      500,
      "GENERATE_RENDER_FAILED",
      "PDF rendering failed.",
      {
        category: "runtime",
        cause: error.message,
      },
    );
  }

  if (
    isMessageError(error, "TEMPLATE_VERSION_NOT_FOUND") ||
    isMessageError(error, "DATASET_VERSION_NOT_FOUND")
  ) {
    return fail(
      500,
      "GENERATE_JOB_RUNTIME_ERROR",
      "Generation failed because persisted resources are inconsistent.",
      {
        category: "runtime",
        cause: getErrorMessage(error),
      },
    );
  }

  if (isPrismaError(error)) {
    return fail(
      500,
      "GENERATE_JOB_RUNTIME_ERROR",
      "Generation failed while accessing persistence.",
      {
        category: "runtime",
        cause: getErrorMessage(error),
      },
    );
  }

  return fail(
    500,
    "GENERATE_JOB_RUNTIME_ERROR",
    "Generation failed unexpectedly.",
    {
      category: "runtime",
      cause: error instanceof Error ? error.message : "unknown",
    },
  );
};
