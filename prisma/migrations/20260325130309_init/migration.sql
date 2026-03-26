-- CreateTable
CREATE TABLE "TemplateRecord" (
    "entityId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateVersionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateVersionRecord_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "TemplateRecord" ("entityId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSetRecord" (
    "entityId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DataSetVersionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataSetVersionRecord_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "DataSetRecord" ("entityId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenerateJobRecord" (
    "entityId" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "dataSetId" TEXT NOT NULL,
    "dataSetVersion" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GenerateJobRecord_templateId_templateVersion_fkey" FOREIGN KEY ("templateId", "templateVersion") REFERENCES "TemplateVersionRecord" ("entityId", "version") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GenerateJobRecord_dataSetId_dataSetVersion_fkey" FOREIGN KEY ("dataSetId", "dataSetVersion") REFERENCES "DataSetVersionRecord" ("entityId", "version") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateVersionRecord_entityId_idx" ON "TemplateVersionRecord"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersionRecord_entityId_version_key" ON "TemplateVersionRecord"("entityId", "version");

-- CreateIndex
CREATE INDEX "DataSetVersionRecord_entityId_idx" ON "DataSetVersionRecord"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSetVersionRecord_entityId_version_key" ON "DataSetVersionRecord"("entityId", "version");

-- CreateIndex
CREATE INDEX "GenerateJobRecord_templateId_idx" ON "GenerateJobRecord"("templateId");

-- CreateIndex
CREATE INDEX "GenerateJobRecord_dataSetId_idx" ON "GenerateJobRecord"("dataSetId");

-- CreateIndex
CREATE INDEX "GenerateJobRecord_createdAt_idx" ON "GenerateJobRecord"("createdAt");
