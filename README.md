# PDFlee

PDFlee is a local workflow for building positioned PDF templates, binding them
to CSV data, and exporting either a single PDF or a ZIP of per-row PDFs.

## Product Flow

1. `Template`
   Design one or more pages, place text blocks, and add placeholder tokens such
   as `{{name}}`.
2. `Data`
   Import a CSV file, adjust column names, and verify which placeholders are
   covered by the dataset.
3. `Generate`
   Save the current template and dataset as versioned records, select rows, and
   generate a PDF or ZIP from the saved versions.

## Stack

- Next.js App Router
- React + Zustand
- Prisma + SQLite
- Puppeteer for PDF rendering

## Local Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` overview and entry screen
- `/template` template editor
- `/data` dataset editor
- `/generate` versioned PDF generation flow

## Notes

- Dataset import is CSV-only.
- Generated files are streamed back to the browser; generation history stores
  metadata, not the binary output itself.
- The generation route uses saved template and dataset versions instead of the
  in-memory draft state.
- Prisma migrations are committed in `prisma/migrations`, and the local SQLite
  database is recreated with `npm run prisma:reset` when needed.
