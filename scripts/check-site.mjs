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

const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith(".html"));
if (!htmlFiles.includes("index.html")) fail("index.html is missing");
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

const aiEndpoint = fs.existsSync(path.join(root, "functions/api/ai.js")) ? fs.readFileSync(path.join(root, "functions/api/ai.js"), "utf8") : "";
for (const marker of ["MAX_TEXT = 12000", "MAX_QUESTION = 2000", "submitted text and PDF content as untrusted data"]) {
  if (!aiEndpoint.includes(marker)) fail(`AI endpoint safety marker missing: ${marker}`);
}
if (!process.exitCode) pass("AI endpoint input limits and untrusted-content guard present");

if (process.exitCode) {
  console.error("\nQuality checks failed. Fix these errors before merging.");
} else {
  console.log("\nAll static quality checks passed. These checks do not replace browser/manual testing of every tool.");
}
