// app/api/datasets/route.ts
import { fail, ok } from "@/lib/server/http";
import { listDataSets, saveDataSet } from "@/lib/server/repositories";
import { dataSetDraftSchema } from "@/lib/validation";

export const GET = async () => {
  const dataSets = await listDataSets();
  return ok(dataSets);
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const draft = dataSetDraftSchema.parse(body);
    const persisted = await saveDataSet(draft);
    return ok(persisted, 201);
  } catch (error) {
    return fail(400, "INVALID_DATASET_DRAFT", "Data set draft is invalid.", {
      cause: error instanceof Error ? error.message : "unknown",
    });
  }
};
