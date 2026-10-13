import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const fail = (message) => { console.error("FAIL:", message); process.exitCode = 1; };
const pass = (message) => console.log("PASS:", message);

const jsFiles = ["app.js", "tools-extra.js", "ai-tools.js", "i18n.js", "functions/api/ai.js"];
for (const file of jsFiles) {
  if (!fs.existsSync(path.join(root, file))) { fail(`Missing JavaScript file: ${file}`); continue; }
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) fail(`JavaScript syntax check failed for ${file}:\n${result.stderr || result.stdout}`);
  else pass(`JavaScript syntax: ${file}`);
}

const htmlFiles = [];
function collectHtml(directory, relative = "") {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    const relativePath = path.join(relative, entry.name);
    if (entry.isDirectory()) collectHtml(absolute, relativePath);
    else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(relativePath);
  }
}
collectHtml(root);
if (!htmlFiles.includes("index.html")) fail("index.html is missing");
if (!htmlFiles.includes(path.join("pk", "ur", "index.html"))) fail("Pakistan Urdu entry route is missing");
if (!htmlFiles.includes(path.join("global", "en", "index.html"))) fail("Global English entry route is missing");
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(ref)) continue;
    let local;
    try { local = decodeURIComponent(ref.split("#")[0].split("?")[0]); }
    catch { fail(`${file} has an invalid encoded local asset reference: ${ref}`); continue; }
    if (!local) continue;
    const resolved = local.startsWith("/")
      ? path.resolve(root, local.slice(1))
      : path.resolve(root, path.dirname(file), local);
    if (!fs.existsSync(resolved)) fail(`${file} references missing local asset: ${ref}`);
  }
}
if (!process.exitCode) pass(`Local HTML asset references checked in ${htmlFiles.length} HTML files`);

const home = fs.existsSync(path.join(root, "index.html")) ? fs.readFileSync(path.join(root, "index.html"), "utf8") : "";
const cardCount = (home.match(/<article class="tool-card(?: featured)?"/g) || []).length;
if (cardCount !== 16) fail(`Expected 16 tool cards in index.html, found ${cardCount}`);
else pass("Homepage lists all 16 tool cards");

const i18n = fs.existsSync(path.join(root, "i18n.js")) ? fs.readFileSync(path.join(root, "i18n.js"), "utf8") : "";
for (const marker of ['document.documentElement.lang', 'document.documentElement.dir', 'localStorage.setItem("odl-language"', 'data-language="ur"']) {
  if (!i18n.includes(marker)) fail(`Localization marker missing: ${marker}`);
}
if (!process.exitCode) pass("English/Urdu language, direction, and persistence markers present");

const homeUrduAlternate = home.match(/<link\\s+rel="alternate"\\s+hreflang="ur-PK"\\s+href="([^"]+)"/i)?.[1] || "";
if (homeUrduAlternate !== "https://obaiddoctrinelabs.github.io/Obaid-Doctrine-Labs/pk/ur/") {
  fail("Homepage hreflang=ur-PK must point to the dedicated Pakistan Urdu route");
} else {
  pass("Homepage Urdu hreflang points to the dedicated Pakistan Urdu route");
}

const sitemapPath = path.join(root, "sitemap.xml");
const robots = fs.existsSync(path.join(root, "robots.txt")) ? fs.readFileSync(path.join(root, "robots.txt"), "utf8") : "";
if (!fs.existsSync(sitemapPath)) fail("sitemap.xml is missing");
else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  for (const route of ["/Obaid-Doctrine-Labs/", "/Obaid-Doctrine-Labs/pk/ur/", "/Obaid-Doctrine-Labs/global/en/", "/Obaid-Doctrine-Labs/about.html", "/Obaid-Doctrine-Labs/contact.html", "/Obaid-Doctrine-Labs/privacy.html", "/Obaid-Doctrine-Labs/terms.html", "/Obaid-Doctrine-Labs/limitations.html", "/Obaid-Doctrine-Labs/pdf-tool.html"]) {
    if (!sitemap.includes(route)) fail(`sitemap.xml is missing route: ${route}`);
  }
  if (!robots.includes("sitemap.xml")) fail("robots.txt does not advertise sitemap.xml");
  if (!process.exitCode) pass("XML sitemap and robots.txt sitemap reference present");
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (!/<meta\s+name="description"\s+content="/i.test(html)) fail(`${file} is missing a meta description`);
  if (!/<link\s+rel="canonical"\s+href="/i.test(html)) fail(`${file} is missing a canonical URL`);
  if (!/<meta\s+property="og:title"\s+content="/i.test(html)) fail(`${file} is missing Open Graph title metadata`);
}
if (!process.exitCode) pass("SEO metadata: descriptions, canonical URLs, and Open Graph titles");

const aiEndpoint = fs.existsSync(path.join(root, "functions/api/ai.js")) ? fs.readFileSync(path.join(root, "functions/api/ai.js"), "utf8") : "";
for (const marker of ["MAX_TEXT = 12000", "MAX_QUESTION = 2000", "MAX_BODY_BYTES = 200_000", "submitted text and PDF content as untrusted data"]) {
  if (!aiEndpoint.includes(marker)) fail(`AI endpoint safety marker missing: ${marker}`);
}
if (!process.exitCode) pass("AI endpoint input limits and untrusted-content guard present");

if (process.exitCode) {
  console.error("\nQuality checks failed. Fix these errors before merging.");
} else {
  console.log("\nAll static quality checks passed. These checks do not replace browser/manual testing of every tool.");
}
