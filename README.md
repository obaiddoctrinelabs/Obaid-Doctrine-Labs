# Obaid Doctrine Labs

A responsive static HTML/CSS/JavaScript website for Obaid Doctrine Labs. The project is being upgraded in place; this repository is the source of truth.

## Existing website files

- `index.html` — homepage and tool catalogue
- `pk/ur/index.html` — Pakistan Urdu audience entry route
- `global/en/index.html` — global English audience entry route
- `styles.css` — responsive layout and styling
- `app.js`, `tools-extra.js`, `ai-tools.js` — client-side interactions and tools
- `i18n.js` — English/Pakistani Urdu translations and RTL direction handling
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `limitations.html` — project and policy pages
- `scripts/check-site.mjs` — static JavaScript, asset-reference, localization-marker and safety-marker checks
- `functions/api/ai.js` — legacy server-side AI endpoint written for a Cloudflare Pages Functions runtime; it is not executable on GitHub Pages and is not part of the approved target hosting plan

## Approved hosting direction

- Static frontend: GitHub Pages.
- Backend: a separate provider only when a real server-side feature requires it. Provider selection must be based on verified current free-tier limits and secret-management support.
- Cloudflare is not part of the approved hosting or deployment plan.
- No paid service or upgrade may be enabled without the owner's explicit permission.

GitHub Pages only serves static files. It does not run server-side functions, so `functions/api/ai.js` must not be expected to work on GitHub Pages. AI writing, summarization and AI PDF Q&A must be treated as unavailable until a compatible separate backend and its AI provider are configured and tested. Do not substitute fabricated AI responses or expose API keys in browser code.

## GitHub Pages setup

The repository contains `.github/workflows/deploy-pages.yml`, which publishes the repository root through GitHub Actions. The repository owner may need to enable GitHub Pages and select **GitHub Actions** under **Settings → Pages → Build and deployment → Source**. If the workflow reports that the Pages site cannot be found, verify that repository setting before retrying.

The workflow's existence is not proof that a live deployment succeeded. Verify the deployment URL and test the live pages after Pages is enabled. The two audience entry routes are `pk/ur/` (Pakistan Urdu) and `global/en/` (global English). Each opens the shared tool library in the route's language; the routes do not duplicate tool code. Keep relative asset paths and the repository base path intact.

## Privacy and safety

- Keep passwords, API keys, tokens and other secrets out of frontend files and public commits.
- Prefer browser-local processing for deterministic tools and file utilities where practical.
- Do not send sensitive or confidential data to an AI service.
- Privacy and terms pages are drafts and must be updated to describe the services actually deployed before public launch.
- Do not claim legal compliance, AI availability, complete localization or successful deployment without evidence.

## Manual regression checklist

- Open the English homepage and Urdu homepage directly.
- Open `pk/ur/` and `global/en/` directly; confirm each selects the intended language even if another language was previously saved.
- Switch English → Urdu and Urdu → English; confirm the main content remains visible.
- Open representative tool pages directly and refresh them.
- Test browser back/forward navigation.
- On a narrow mobile viewport, verify navigation, text direction, form controls and the main content.
- Test tools with valid, empty and invalid inputs as appropriate.
- Verify JSON validation, unit conversion, budget totals, CSV export and PDF text extraction with known test cases.
- Confirm AI-dependent tools report an honest unavailable/configuration message until a real backend is connected.
- Check About, Contact, Privacy, Terms and Limitations pages.

The static quality script is useful but does not replace real browser, mobile, accessibility or deployment tests. Record any test that has not been run as **NOT TESTED**.
