// app/api/generate-jobs/route.ts
import JSZip from "jszip";
import type { Browser } from "puppeteer";

import {
  MAX_GENERATION_ITEMS,
  resolveGenerateRowIndexes,
} from "@/lib/domain/generate-job";
import { buildTemplateHtml, getRowsForIndexes } from "@/lib/pdf/render";
import { getPdfBrowser } from "@/lib/server/pdf-browser";
import { toGenerateJobErrorResponse } from "@/lib/server/generate-job-errors";
import { fail, ok } from "@/lib/server/http";
import {
  ensureDataSetForGeneration,
  ensureTemplateForGeneration,
  getDataSet,
  getTemplate,
  listGenerateJobs,
  recordGenerateJob,
} from "@/lib/server/repositories";
import { generateJobRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

const PDF_RENDER_CONCURRENCY = 3;
const PDF_RENDER_TIMEOUT_MS = 15_000;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64);

const toArrayBuffer = (bytes: Uint8Array) => Uint8Array.from(bytes).buffer;

const createPdf = async (browser: Browser, html: string) => {
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: PDF_RENDER_TIMEOUT_MS,
    });

    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `PDF_RENDER_FAILED:${error.message}`
        : "PDF_RENDER_FAILED",
    );
  } finally {
    await page.close();
  }
};

const mapWithConcurrency = async <TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  worker: (item: TInput, index: number) => Promise<TOutput>,
) => {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
};

export const GET = async () => {
  const jobs = await listGenerateJobs();
  return ok(jobs);
};

const resolveTemplateForJob = async (
  input: ReturnType<typeof generateJobRequestSchema.parse>,
) => {
  if (input.templateDraft) {
    return ensureTemplateForGeneration(input.templateDraft);
  }

  return getTemplate(input.templateId!);
};

const resolveDataSetForJob = async (
  input: ReturnType<typeof generateJobRequestSchema.parse>,
) => {
  if (input.dataSetDraft) {
    return ensureDataSetForGeneration(input.dataSetDraft);
  }

  return getDataSet(input.dataSetId!);
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const input = generateJobRequestSchema.parse(body);

    const [template, dataSet] = await Promise.all([
      resolveTemplateForJob(input),
      resolveDataSetForJob(input),
    ]);

    const rowIndexes = resolveGenerateRowIndexes(
      dataSet.version.table,
      input.mode,
      input.rowIndexes,
    );

    if (rowIndexes.length === 0) {
      return fail(
        400,
        "NO_ROWS_SELECTED",
        "At least one row must be selected for generation.",
        {
          category: "precondition",
        },
      );
    }

    if (rowIndexes.length > MAX_GENERATION_ITEMS) {
      return fail(
        400,
        "TOO_MANY_ROWS_SELECTED",
        `Generate at most ${MAX_GENERATION_ITEMS} rows per request.`,
        {
          category: "precondition",
          maxItems: MAX_GENERATION_ITEMS,
        },
      );
    }

    const rows = getRowsForIndexes(dataSet.version.table, rowIndexes);
    const browser = await getPdfBrowser().catch((error) => {
      throw new Error(
        error instanceof Error
          ? `PDF_BROWSER_UNAVAILABLE:${error.message}`
          : "PDF_BROWSER_UNAVAILABLE",
      );
    });

    const pdfs = await mapWithConcurrency(
      rows,
      PDF_RENDER_CONCURRENCY,
      (row) => createPdf(browser, buildTemplateHtml(template.version.document, row)),
    );

    const safeBaseName = sanitizeFileName(input.fileBaseName);
    const output =
      pdfs.length === 1
        ? {
            kind: "pdf" as const,
            fileName: `${safeBaseName}.pdf`,
            itemCount: 1,
          }
        : {
            kind: "zip" as const,
            fileName: `${safeBaseName}.zip`,
            itemCount: pdfs.length,
          };

    const job = await recordGenerateJob({
      templateId: template.record.id,
      templateVersion: template.version.version,
      dataSetId: dataSet.record.id,
      dataSetVersion: dataSet.version.version,
      mode: input.mode,
      payload: {
        templateId: template.record.id,
        templateVersion: template.version.version,
        dataSetId: dataSet.record.id,
        dataSetVersion: dataSet.version.version,
        mode: input.mode,
        rowIndexes,
      },
      output,
    });

    let responseBytes = pdfs[0];
    let responseContentType = "application/pdf";

    if (output.kind === "zip") {
      const archive = new JSZip();

      pdfs.forEach((pdf: Uint8Array, index: number) => {
        archive.file(`${safeBaseName}-${rowIndexes[index] + 1}.pdf`, pdf);
      });
      archive.file(
        "report.json",
        JSON.stringify(
          {
            jobId: job.id,
            generatedAt: job.createdAt,
            rowIndexes,
            count: pdfs.length,
          },
          null,
          2,
        ),
      );
      responseBytes = await archive.generateAsync({ type: "uint8array" });
      responseContentType = "application/zip";
    }

    return new Response(
      new Blob([toArrayBuffer(responseBytes)], {
        type: responseContentType,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": responseContentType,
          "Content-Disposition": `attachment; filename="${output.fileName}"`,
          "X-Pdflee-Job-Id": job.id,
          "X-Pdflee-Template-Id": template.record.id,
          "X-Pdflee-Template-Version": `${template.version.version}`,
          "X-Pdflee-Data-Set-Id": dataSet.record.id,
          "X-Pdflee-Data-Set-Version": `${dataSet.version.version}`,
        },
      },
    );
  } catch (error) {
    return toGenerateJobErrorResponse(error);
  }
};
