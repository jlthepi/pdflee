// app/page.tsx
import Link from "next/link";

const workflowSteps = [
  {
    label: "01",
    title: "Template",
    description:
      "Place text blocks, resize them, and define placeholder tokens.",
    href: "/template",
  },
  {
    label: "02",
    title: "Data",
    description:
      "Import CSV data, rename columns, and review live placeholder coverage.",
    href: "/data",
  },
  {
    label: "03",
    title: "Generate",
    description:
      "Save versions, choose rows, and export a PDF or ZIP from the current set.",
    href: "/generate",
  },
];

const LandingPage = () => {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7f4ec_0%,#efe9dc_42%,#e5ddd1_100%)] text-stone-950">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-white/70 blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-stone-900/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
          <div className="flex items-center justify-between border-b border-stone-900/10 pb-4 text-sm uppercase tracking-[0.28em] text-stone-700">
            <span>PDFlee</span>
            <span>Template to PDF studio</span>
          </div>

          <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)] lg:items-end">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-[clamp(3.8rem,10vw,8.6rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-stone-950">
                Design once.
                <br />
                Fill data.
                <br />
                Export PDF.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
                PDFlee is a local editor for building positioned template pages,
                binding them to CSV columns, and generating single or batched
                PDF files from saved template and dataset versions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/template"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
                >
                  Start in Template
                </Link>
                <Link
                  href="/generate"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-stone-900/15 bg-white/70 px-6 text-sm font-medium text-stone-900 backdrop-blur transition hover:bg-white"
                >
                  Open Generate Flow
                </Link>
              </div>
            </div>

            <div className="justify-self-end rounded-[2rem] border border-stone-900/10 bg-stone-950 px-6 py-7 text-stone-100 shadow-[0_30px_80px_rgba(41,37,36,0.18)]">
              <div className="mt-4 space-y-5">
                {workflowSteps.map((step) => (
                  <Link
                    key={step.href}
                    href={step.href}
                    className="block border-t border-white/10 pt-5 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        {step.label}
                      </span>
                      <span className="text-sm text-stone-500">Open</span>
                    </div>
                    <div className="mt-2 text-2xl font-medium tracking-[-0.03em]">
                      {step.title}
                    </div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-stone-400">
                      {step.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-stone-900/10 pt-4 text-sm text-stone-700 sm:grid-cols-3">
            <div>Stored locally with Prisma + SQLite version records.</div>
            <div>CSV column names map directly to template placeholders.</div>
            <div>
              Multi-row generation returns a ZIP with one PDF per selected row.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
