// lib/server/pdf-browser.ts
import puppeteer, { type Browser } from "puppeteer";

declare global {
  var __pdfleeBrowserPromise: Promise<Browser> | undefined;
}

const createBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  browser.on("disconnected", () => {
    global.__pdfleeBrowserPromise = undefined;
  });

  return browser;
};

export const getPdfBrowser = async () => {
  if (!global.__pdfleeBrowserPromise) {
    global.__pdfleeBrowserPromise = createBrowser().catch((error) => {
      global.__pdfleeBrowserPromise = undefined;
      throw error;
    });
  }

  return global.__pdfleeBrowserPromise;
};
