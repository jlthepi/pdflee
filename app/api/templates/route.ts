// app/api/templates/route.ts
import { fail, ok } from "@/lib/server/http";
import { listTemplates, saveTemplate } from "@/lib/server/repositories";
import { templateDraftSchema } from "@/lib/validation";

export const GET = async () => {
  const templates = await listTemplates();
  return ok(templates);
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const draft = templateDraftSchema.parse(body);
    const persisted = await saveTemplate(draft);
    return ok(persisted, 201);
  } catch (error) {
    return fail(400, "INVALID_TEMPLATE_DRAFT", "Template draft is invalid.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};
