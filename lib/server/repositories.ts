// lib/server/repositories.ts
import type { GenerateJobRecord as PrismaGenerateJobRecord } from "@prisma/client";
import {
  buildDataSetDraftFingerprint,
  buildTemplateDraftFingerprint,
} from "@/lib/domain/draft-fingerprint";
import { normalizeTemplateDocument } from "@/lib/domain/template-document";
import type {
  DataSetDraft,
  DataSetRecord,
  DataSetVersion,
  GenerateJobOutput,
  GenerateJobPayload,
  GenerateJobRecord,
  PersistedDataSet,
  PersistedTemplate,
  TemplateDraft,
  TemplateRecord,
  TemplateVersion,
} from "@/types/domain";
import { prisma } from "@/lib/server/prisma";

const asIso = (value: Date) => value.toISOString();

const parseTemplatePayload = (payload: string) => {
  const parsed = JSON.parse(payload) as Omit<
    TemplateVersion,
    "templateId" | "version" | "name" | "createdAt" | "updatedAt"
  > & {
    description: string;
    document: TemplateDraft["document"];
  };

  return {
    ...parsed,
    document: normalizeTemplateDocument(parsed.document),
  };
};

const parseDataSetPayload = (payload: string) => {
  return JSON.parse(payload) as Omit<
    DataSetVersion,
    "dataSetId" | "version" | "name" | "createdAt" | "updatedAt"
  > & {
    description: string;
    table: DataSetDraft["table"];
  };
};

const mapTemplateRecord = (record: {
  entityId: string;
  name: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): TemplateRecord => ({
  id: record.entityId,
  name: record.name,
  description: "",
  currentVersion: record.currentVersion,
  createdAt: asIso(record.createdAt),
  updatedAt: asIso(record.updatedAt),
});

const mapDataSetRecord = (record: {
  entityId: string;
  name: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): DataSetRecord => ({
  id: record.entityId,
  name: record.name,
  description: "",
  currentVersion: record.currentVersion,
  createdAt: asIso(record.createdAt),
  updatedAt: asIso(record.updatedAt),
});

const getCurrentTemplateVersionRecord = async (
  entityId: string,
  version: number,
) => {
  return prisma.templateVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId,
        version,
      },
    },
  });
};

const getCurrentDataSetVersionRecord = async (
  entityId: string,
  version: number,
) => {
  return prisma.dataSetVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId,
        version,
      },
    },
  });
};

export const listTemplates = async (): Promise<TemplateRecord[]> => {
  const records = await prisma.templateRecord.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return records.map(mapTemplateRecord);
};

export const saveTemplate = async (
  draft: TemplateDraft,
): Promise<PersistedTemplate> => {
  const now = new Date();
  const entityId = draft.id ?? crypto.randomUUID();
  const existing = await prisma.templateRecord.findUnique({
    where: { entityId },
  });
  const version = (existing?.currentVersion ?? 0) + 1;

  const normalizedDocument = normalizeTemplateDocument(draft.document);
  const payload = JSON.stringify({
    description: draft.description,
    document: normalizedDocument,
  });

  if (existing) {
    const currentVersion = await getCurrentTemplateVersionRecord(
      entityId,
      existing.currentVersion,
    );

    if (!currentVersion) {
      throw new Error("TEMPLATE_VERSION_NOT_FOUND");
    }

    if (existing.name === draft.name && currentVersion.payload === payload) {
      return getTemplate(entityId);
    }
  }

  await prisma.$transaction([
    prisma.templateRecord.upsert({
      where: { entityId },
      update: {
        name: draft.name,
        currentVersion: version,
        updatedAt: now,
      },
      create: {
        entityId,
        name: draft.name,
        currentVersion: version,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.templateVersionRecord.create({
      data: {
        entityId,
        name: draft.name,
        payload,
        version,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  return getTemplate(entityId);
};

export const ensureTemplateForGeneration = async (
  draft: TemplateDraft,
): Promise<PersistedTemplate> => {
  if (!draft.id) {
    return saveTemplate(draft);
  }

  const record = await prisma.templateRecord.findUnique({
    where: { entityId: draft.id },
  });

  if (!record) {
    return saveTemplate(draft);
  }

  const currentVersion = await prisma.templateVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId: draft.id,
        version: record.currentVersion,
      },
    },
  });

  if (!currentVersion) {
    return saveTemplate(draft);
  }

  const currentFingerprint = buildTemplateDraftFingerprint({
    name: currentVersion.name,
    description: parseTemplatePayload(currentVersion.payload).description,
    document: parseTemplatePayload(currentVersion.payload).document,
  });
  const draftFingerprint = buildTemplateDraftFingerprint(draft);

  if (currentFingerprint === draftFingerprint) {
    return getTemplate(draft.id);
  }

  return saveTemplate(draft);
};

export const getTemplate = async (
  templateId: string,
): Promise<PersistedTemplate> => {
  const record = await prisma.templateRecord.findUnique({
    where: { entityId: templateId },
  });

  if (!record) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const version = await prisma.templateVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId: templateId,
        version: record.currentVersion,
      },
    },
  });

  if (!version) {
    throw new Error("TEMPLATE_VERSION_NOT_FOUND");
  }

  const payload = parseTemplatePayload(version.payload);

  return {
    record: {
      ...mapTemplateRecord(record),
      description: payload.description,
    },
    version: {
      templateId,
      version: version.version,
      name: version.name,
      description: payload.description,
      createdAt: asIso(version.createdAt),
      updatedAt: asIso(version.updatedAt),
      document: normalizeTemplateDocument(payload.document),
    },
  };
};

export const listDataSets = async (): Promise<DataSetRecord[]> => {
  const records = await prisma.dataSetRecord.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return records.map(mapDataSetRecord);
};

export const saveDataSet = async (
  draft: DataSetDraft,
): Promise<PersistedDataSet> => {
  const now = new Date();
  const entityId = draft.id ?? crypto.randomUUID();
  const existing = await prisma.dataSetRecord.findUnique({
    where: { entityId },
  });
  const version = (existing?.currentVersion ?? 0) + 1;

  const payload = JSON.stringify({
    description: draft.description,
    table: draft.table,
  });

  if (existing) {
    const currentVersion = await getCurrentDataSetVersionRecord(
      entityId,
      existing.currentVersion,
    );

    if (!currentVersion) {
      throw new Error("DATASET_VERSION_NOT_FOUND");
    }

    if (existing.name === draft.name && currentVersion.payload === payload) {
      return getDataSet(entityId);
    }
  }

  await prisma.$transaction([
    prisma.dataSetRecord.upsert({
      where: { entityId },
      update: {
        name: draft.name,
        currentVersion: version,
        updatedAt: now,
      },
      create: {
        entityId,
        name: draft.name,
        currentVersion: version,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.dataSetVersionRecord.create({
      data: {
        entityId,
        name: draft.name,
        payload,
        version,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  return getDataSet(entityId);
};

export const ensureDataSetForGeneration = async (
  draft: DataSetDraft,
): Promise<PersistedDataSet> => {
  if (!draft.id) {
    return saveDataSet(draft);
  }

  const record = await prisma.dataSetRecord.findUnique({
    where: { entityId: draft.id },
  });

  if (!record) {
    return saveDataSet(draft);
  }

  const currentVersion = await prisma.dataSetVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId: draft.id,
        version: record.currentVersion,
      },
    },
  });

  if (!currentVersion) {
    return saveDataSet(draft);
  }

  const currentPayload = parseDataSetPayload(currentVersion.payload);
  const currentFingerprint = buildDataSetDraftFingerprint({
    name: currentVersion.name,
    description: currentPayload.description,
    table: currentPayload.table,
  });
  const draftFingerprint = buildDataSetDraftFingerprint(draft);

  if (currentFingerprint === draftFingerprint) {
    return getDataSet(draft.id);
  }

  return saveDataSet(draft);
};

export const getDataSet = async (
  dataSetId: string,
): Promise<PersistedDataSet> => {
  const record = await prisma.dataSetRecord.findUnique({
    where: { entityId: dataSetId },
  });

  if (!record) {
    throw new Error("DATASET_NOT_FOUND");
  }

  const version = await prisma.dataSetVersionRecord.findUnique({
    where: {
      entityId_version: {
        entityId: dataSetId,
        version: record.currentVersion,
      },
    },
  });

  if (!version) {
    throw new Error("DATASET_VERSION_NOT_FOUND");
  }

  const payload = parseDataSetPayload(version.payload);

  return {
    record: {
      ...mapDataSetRecord(record),
      description: payload.description,
    },
    version: {
      dataSetId,
      version: version.version,
      name: version.name,
      description: payload.description,
      createdAt: asIso(version.createdAt),
      updatedAt: asIso(version.updatedAt),
      table: payload.table,
    },
  };
};

export const recordGenerateJob = async (input: {
  templateId: string;
  templateVersion: number;
  dataSetId: string;
  dataSetVersion: number;
  mode: string;
  payload: GenerateJobPayload;
  output: GenerateJobOutput;
}): Promise<GenerateJobRecord> => {
  const now = new Date();
  const entityId = crypto.randomUUID();

  const created = await prisma.generateJobRecord.create({
    data: {
      entityId,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      dataSetId: input.dataSetId,
      dataSetVersion: input.dataSetVersion,
      mode: input.mode,
      output: JSON.stringify(input.output),
      payload: JSON.stringify(input.payload),
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });

  return {
    id: created.entityId,
    templateId: created.templateId,
    templateVersion: created.templateVersion,
    dataSetId: created.dataSetId,
    dataSetVersion: created.dataSetVersion,
    mode: created.mode as GenerateJobRecord["mode"],
    version: created.version,
    createdAt: asIso(created.createdAt),
    updatedAt: asIso(created.updatedAt),
    output: JSON.parse(created.output) as GenerateJobOutput,
    payload: JSON.parse(created.payload) as GenerateJobPayload,
  };
};

export const listGenerateJobs = async (): Promise<GenerateJobRecord[]> => {
  const jobs = await prisma.generateJobRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return jobs.map((job: PrismaGenerateJobRecord) => ({
    id: job.entityId,
    templateId: job.templateId,
    templateVersion: job.templateVersion,
    dataSetId: job.dataSetId,
    dataSetVersion: job.dataSetVersion,
    mode: job.mode as GenerateJobRecord["mode"],
    version: job.version,
    createdAt: asIso(job.createdAt),
    updatedAt: asIso(job.updatedAt),
    output: JSON.parse(job.output) as GenerateJobOutput,
    payload: JSON.parse(job.payload) as GenerateJobPayload,
  }));
};
