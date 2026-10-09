# Obaid Doctrine Labs

A responsive static website starter for Obaid Doctrine Labs, built with plain HTML, CSS and JavaScript.

## Website files
- `index.html` — homepage and tool catalogue
- `styles.css` — responsive layout and styling
- `app.js` — mobile navigation and footer year
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `limitations.html` — project and policy pages
- `favicon.svg` — site icon
- `.gitignore` — excludes common local build artifacts and environment files

## Current status
This is a static HTML/CSS/JavaScript site with browser-based utilities and optional server-side AI features. The AI writing, summary and PDF Q&A features use `functions/api/ai.js` and require a working Cloudflare Pages deployment plus a Workers AI binding named `AI`. Verify the live deployment and review the privacy and terms drafts before a public launch.

## Deploy with Cloudflare Pages
1. Open the existing Cloudflare Pages project in Workers & Pages.
2. Confirm the GitHub repository `obaiddoctrinelabs/Obaid-Doctrine-Labs` is connected to the `main` branch.
3. For this plain HTML site, leave the build command empty and set the output directory to `.` (the repository root).
4. Save settings and confirm a successful deployment before testing the provided Pages URL. Avoid creating a duplicate project if the existing Pages project is already live.

Keep the repository private if you prefer. Do not put passwords, API keys, or other secrets in frontend files.

## Optional AI features (Cloudflare Workers AI)

The site remains usable without AI. Browser-only tools such as the text formatter, unit converter, JSON helper, planner, budget calculator, CSV helper, cyber-safety checklist, and business calculators do not need an AI API key.

To enable the AI Writing & Summary and PDF Q&A features:
1. In Cloudflare, open **Workers & Pages → Obaid Doctrine Labs → Settings → Functions** (or **Settings → Bindings**, depending on the dashboard layout).
2. Add a **Workers AI** binding named exactly `AI` and save.
3. Deploy this version of the site. The Pages Function at `functions/api/ai.js` serves `POST /api/ai`; the model runs server-side so no API token is exposed in browser JavaScript.
4. Test with non-sensitive sample text first. PDF Q&A extracts text in the browser and sends the extracted text only when a question is submitted.

Cloudflare Workers AI currently documents a free allocation of **10,000 Neurons per day** on the Workers Free plan. Usage and model availability can change; check the Cloudflare dashboard before enabling public AI access. Do not upgrade to a paid plan unless you explicitly choose to. Public endpoints can be abused, so monitor usage and disable the AI binding if unexpected usage appears.

## Manual smoke-test checklist

- Open the homepage on a phone and desktop; verify the menu opens and closes.
- Search for a tool and filter by each category; clear the search and filters.
- Test each browser tool with normal input, empty input, and invalid input where applicable.
- Verify JSON validation/formatting, unit conversion (including Celsius/Fahrenheit/Kelvin), task removal, budget totals and CSV export.
- Test PDF text extraction with a small text-based PDF; scanned PDFs may need OCR.
- After enabling the AI binding, test a short summary and a PDF question. Confirm the site displays a clear message if AI is not configured or the free quota is exhausted.
- Check About, Contact, Privacy, Terms, and Limitations links. Read and revise the legal drafts before a public launch.

This checklist is a manual QA plan, not a claim that every browser/device combination has been tested automatically.
