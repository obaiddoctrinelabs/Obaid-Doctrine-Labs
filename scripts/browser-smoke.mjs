import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "networkidle" });
  const main = page.locator("main#main");
  const cards = page.locator(".tool-card");
  if (!(await main.isVisible())) throw new Error("Homepage main content is not visible on initial load.");
  if (!(await cards.count())) throw new Error("Tool cards are missing on initial load.");

  await page.locator('[data-language="ur"]').click();
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
  if (!(await main.isVisible())) throw new Error("Homepage main content became hidden after switching to Urdu.");
  if (!(await cards.first().isVisible())) throw new Error("Tool cards became hidden after switching to Urdu.");
  if (!(await page.getByRole("button", { name: "اردو" }).isVisible())) throw new Error("Urdu language control is not visible.");

  // Verify the selected language survives a refresh, a common mobile failure path.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
  if (!(await main.isVisible())) throw new Error("Homepage main content is not visible after reloading in saved Urdu mode.");
  if (!(await cards.first().isVisible())) throw new Error("Tool cards are not visible after reloading in saved Urdu mode.");

  await page.locator('[data-language="en"]').click();
  await page.waitForFunction(() => document.documentElement.dir === "ltr" && document.documentElement.lang === "en");
  if (!(await main.isVisible())) throw new Error("Homepage main content became hidden after switching back to English.");
  if (errors.length) throw new Error("Browser JavaScript errors: " + errors.join(" | "));

  console.log("PASS: mobile homepage content remains visible on initial load, after Urdu switch, after Urdu reload, and after switching back to English; no uncaught page errors.");
} finally {
  await browser.close();
}
