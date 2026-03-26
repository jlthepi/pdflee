// app/api/templates/[templateId]/route.ts
import { fail, ok } from "@/lib/server/http";
import { getTemplate, saveTemplate } from "@/lib/server/repositories";
import { templateDraftSchema } from "@/lib/validation";

type Context = {
  params: Promise<{
    templateId: string;
  }>;
};

export const GET = async (_request: Request, context: Context) => {
  const { templateId } = await context.params;

  try {
    const template = await getTemplate(templateId);
    return ok(template);
  } catch (error) {
    return fail(404, "TEMPLATE_NOT_FOUND", "Template was not found.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};

export const PUT = async (request: Request, context: Context) => {
  const { templateId } = await context.params;

  try {
    const body = await request.json();
    const draft = templateDraftSchema.parse({
      ...body,
      id: templateId,
    });
    const template = await saveTemplate(draft);
    return ok(template);
  } catch (error) {
    return fail(400, "INVALID_TEMPLATE_DRAFT", "Template update is invalid.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};
