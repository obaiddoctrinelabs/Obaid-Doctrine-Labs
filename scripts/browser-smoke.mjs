import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1
});
const page = await context.newPage();
await page.setViewportSize({ width: 390, height: 844 });
const errors = [];
page.setDefaultTimeout(10000);
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  // A missing /api/ai route on static hosting is an expected condition for testing local fallbacks.
  if (message.type() === "error" && !/(?:4\d\d|5\d\d)|Failed to load resource/i.test(message.text())) {
    errors.push("console: " + message.text());
  }
});

try {
  await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "domcontentloaded" });
  // Disable decorative smooth scrolling/transitions so mobile automation measures behavior, not animation timing.
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; } *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }" });
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
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
  if (!(await main.isVisible())) throw new Error("Homepage main content is not visible after reloading in saved Urdu mode.");
  if (!(await cards.first().isVisible())) throw new Error("Tool cards are not visible after reloading in saved Urdu mode.");

  // Return to the top after reload so the sticky header is not covered by scroll restoration.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".site-header").scrollIntoViewIfNeeded();

  // Diagnose the exact hit target if RTL layout moves the control outside its tappable area.
  const englishSwitch = page.locator('[data-language="en"]');
  const hitTest = await englishSwitch.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      hit: hit ? { tag: hit.tagName, id: hit.id, className: String(hit.className || "") } : null
    };
  });
  console.log("RTL language-switcher hit test:", JSON.stringify(hitTest));

  // Open every interactive tool card to catch missing handlers or empty workspaces.
  await englishSwitch.click();
  await page.waitForFunction(() => document.documentElement.dir === "ltr" && document.documentElement.lang === "en");
  const toolButtons = page.locator(".tool-open");
  const toolButtonCount = await toolButtons.count();
  if (toolButtonCount < 15) throw new Error("Expected at least 15 interactive tool buttons, found " + toolButtonCount);
  let openedWorkspaces = 0;
  for (let i = 0; i < toolButtonCount; i++) {
    const button = toolButtons.nth(i);
    const toolName = await button.getAttribute("data-tool");
    if (!toolName) {
      // The PDF Q&A card intentionally navigates to its dedicated page instead of an inline workspace.
      const href = await button.getAttribute("href");
      if (!href || !href.includes("pdf-tool.html")) throw new Error("Unrecognized non-workspace tool card at index " + i + ".");
      continue;
    }
    await button.click();
    if (!(await page.locator("#workspace").isVisible())) throw new Error("Tool workspace did not open for " + toolName + ".");
    if (!(await page.locator("#workspaceTitle").innerText()).trim()) throw new Error("Tool workspace title is empty for " + toolName + ".");
    if (!(await page.locator("#workspaceBody").innerText()).trim()) throw new Error("Tool workspace content is empty for " + toolName + ".");
    openedWorkspaces++;
  }
  if (openedWorkspaces !== 15) throw new Error("Expected 15 inline tool workspaces, opened " + openedWorkspaces + ".");

  // Exercise JSON Helper with known valid input and verify deterministic output.
  await page.locator('.tool-open[data-tool="json"]').click();
  const jsonInput = page.locator("#jsonInput");
  await jsonInput.fill('{"hello":"world"}');
  await page.locator("#jsonFormat").click();
  if (!(await page.locator("#jsonOutput").inputValue()).includes('"hello": "world"')) {
    throw new Error("JSON Helper did not format valid JSON as expected.");
  }

  // AI-dependent tools must fail honestly and still provide a clearly labelled local fallback.
  await page.locator('.tool-open[data-tool="summary"]').click();
  await page.locator("#aiText").fill("The sky is blue. The grass is green.");
  await page.locator("#aiSummarize").click();
  await page.locator("#aiResult").waitFor({ state: "visible" });
  if (!(await page.locator("#aiResult").innerText()).includes("LOCAL OUTLINE")) {
    throw new Error("Unavailable AI backend did not provide the labelled local summary fallback.");
  }
  if (!(await page.locator("#toolMessage").innerText()).includes("local fallback")) {
    throw new Error("AI fallback status was not explained to the visitor.");
  }

  // Directly load informational pages and ensure content is visible on mobile.
  const directPages = [
    { path: "about.html" },
    { path: "contact.html" },
    { path: "privacy.html" },
    { path: "terms.html" },
    { path: "limitations.html" },
    { path: "pdf-tool.html" },
    { path: "pk/ur/", language: "ur" },
    { path: "global/en/", language: "en" }
  ];
  for (const item of directPages) {
    const response = await page.goto("http://127.0.0.1:4173/" + item.path, { waitUntil: "domcontentloaded" });
    if (!response || !response.ok()) throw new Error(item.path + " failed to load successfully.");
    const subpageMain = page.locator("main");
    if (!(await subpageMain.isVisible())) throw new Error(item.path + " main content is not visible.");
    if (!(await (await subpageMain.innerText()).trim())) throw new Error(item.path + " has empty main content.");
    const menuToggle = page.locator("#menuToggle");
    if (!(await menuToggle.isVisible())) throw new Error(item.path + " has no visible mobile navigation toggle.");
    await menuToggle.click();
    if (!(await page.locator("#mainNav").evaluate(nav => nav.classList.contains("open")))) {
      throw new Error(item.path + " mobile navigation did not open.");
    }
    await menuToggle.click();
    if (await page.locator("#mainNav").evaluate(nav => nav.classList.contains("open"))) {
      throw new Error(item.path + " mobile navigation did not close.");
    }
    if (item.language) {
      const expectedDirection = item.language === "ur" ? "rtl" : "ltr";
      if (await page.locator("html").getAttribute("dir") !== expectedDirection) {
        throw new Error(item.path + " did not select the expected " + item.language + " language/direction.");
      }
      if (item.language === "ur") {
        await page.locator('[data-language="en"]').click();
        await page.waitForFunction(() => document.documentElement.dir === "ltr" && document.documentElement.lang === "en");
        if (!(await subpageMain.isVisible())) throw new Error("Pakistan route content disappeared when switching to English.");
        await page.locator('[data-language="ur"]').click();
        await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.lang === "ur-PK");
        if (!(await subpageMain.isVisible())) throw new Error("Pakistan route content disappeared when switching back to Urdu.");
      }
    }
  }

  if (errors.length) throw new Error("Browser JavaScript/console errors: " + errors.join(" | "));
  console.log("PASS: mobile homepage, all 16 tools, Urdu switch/reload, JSON Helper, and all informational pages; no uncaught browser errors.");
} finally {
  await browser.close();
}
