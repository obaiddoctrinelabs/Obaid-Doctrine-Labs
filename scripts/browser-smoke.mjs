import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (message.type() === "error") errors.push("console: " + message.text());
});

try {
  await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "networkidle" });
  const main = page.locator("main#main");
  const cards = page.locator(".tool-card");
  if (!(await main.isVisible())) throw new Error("Homepage main content is not visible on initial load.");
  if (await cards.count() !== 16) throw new Error("Expected 16 tool cards, found " + await cards.count());
  if (!(await cards.first().isVisible())) throw new Error("First tool card is not visible on initial load.");

  await page.locator('[data-language="ur"]').click();
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
  if (!(await main.isVisible())) throw new Error("Homepage main content became hidden after switching to Urdu.");
  if (!(await cards.first().isVisible())) throw new Error("Tool cards became hidden after switching to Urdu.");
  if (!(await page.getByRole("button", { name: "اردو" }).isVisible())) throw new Error("Urdu language control is not visible.");
  if (!(await page.locator("body").innerText()).includes("ٹول")) throw new Error("Urdu interface text was not applied.");

  // The user's reported failure occurs after language selection and can persist after reload.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
  if (!(await main.isVisible())) throw new Error("Homepage main content is not visible after reloading in saved Urdu mode.");
  if (!(await cards.first().isVisible())) throw new Error("Tool cards are not visible after reloading in saved Urdu mode.");

  // Open every interactive tool card to catch missing handlers or empty workspaces.
  await page.locator('[data-language="en"]').click();
  await page.waitForFunction(() => document.documentElement.dir === "ltr" && document.documentElement.lang === "en");
  const toolButtons = page.locator(".tool-open");
  const toolButtonCount = await toolButtons.count();
  if (toolButtonCount < 15) throw new Error("Expected at least 15 interactive tool buttons, found " + toolButtonCount);
  for (let i = 0; i < toolButtonCount; i++) {
    const button = toolButtons.nth(i);
    await button.click();
    if (!(await page.locator("#workspace").isVisible())) throw new Error("Tool workspace did not open for card " + i + ".");
    if (!(await page.locator("#workspaceTitle").innerText()).trim()) throw new Error("Tool workspace title is empty for card " + i + ".");
    if (!(await page.locator("#workspaceBody").innerText()).trim()) throw new Error("Tool workspace content is empty for card " + i + ".");
  }

  // Exercise JSON Helper with known valid input and verify deterministic output.
  await page.locator('.tool-open[data-tool="json"]').click();
  const jsonInput = page.locator("#jsonInput");
  await jsonInput.fill('{"hello":"world"}');
  await page.locator("#jsonFormat").click();
  if (!(await page.locator("#jsonOutput").inputValue()).includes('"hello": "world"')) {
    throw new Error("JSON Helper did not format valid JSON as expected.");
  }

  // Directly load informational pages and ensure content is visible on mobile.
  for (const path of ["about.html", "contact.html", "privacy.html", "terms.html", "limitations.html", "pdf-tool.html"]) {
    const response = await page.goto("http://127.0.0.1:4173/" + path, { waitUntil: "networkidle" });
    if (!response || !response.ok()) throw new Error(path + " failed to load successfully.");
    const subpageMain = page.locator("main");
    if (!(await subpageMain.isVisible())) throw new Error(path + " main content is not visible.");
    if (!(await subpageMain.innerText()).trim()) throw new Error(path + " has empty main content.");
  }

  if (errors.length) throw new Error("Browser JavaScript/console errors: " + errors.join(" | "));
  console.log("PASS: mobile homepage, all 16 tools, Urdu switch/reload, JSON Helper, and all informational pages; no uncaught browser errors.");
} finally {
  await browser.close();
}
