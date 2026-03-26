// app/api/datasets/[dataSetId]/route.ts
import { fail, ok } from "@/lib/server/http";
import { getDataSet, saveDataSet } from "@/lib/server/repositories";
import { dataSetDraftSchema } from "@/lib/validation";

type Context = {
  params: Promise<{
    dataSetId: string;
  }>;
};

export const GET = async (_request: Request, context: Context) => {
  const { dataSetId } = await context.params;

  try {
    const dataSet = await getDataSet(dataSetId);
    return ok(dataSet);
  } catch (error) {
    return fail(404, "DATASET_NOT_FOUND", "Data set was not found.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};

export const PUT = async (request: Request, context: Context) => {
  const { dataSetId } = await context.params;

  try {
    const body = await request.json();
    const draft = dataSetDraftSchema.parse({
      ...body,
      id: dataSetId,
    });
    const dataSet = await saveDataSet(draft);
    return ok(dataSet);
  } catch (error) {
    return fail(400, "INVALID_DATASET_DRAFT", "Data set update is invalid.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};
