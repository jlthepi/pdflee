// app/api/generate/route.ts
import { fail } from "@/lib/server/http";

export const runtime = "nodejs";

export const POST = async () => {
  return fail(
    410,
    "GENERATE_ROUTE_DEPRECATED",
    "Use POST /api/generate-jobs with saved template and data set resources.",
  );
};
