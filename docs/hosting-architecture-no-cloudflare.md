# Obaid Doctrine Labs — Hosting and Implementation Plan

## Owner-approved constraints

- Preserve the existing repository and useful features.
- Do not use Cloudflare for the new system.
- Keep costs at zero unless the owner explicitly approves otherwise.
- Use GitHub Pages for the static frontend and a separate backend only where needed.
- Do not merge into `main` or claim a live deployment until checks and owner-side hosting configuration are verified.

## Current repository findings

- The project is currently a static HTML/CSS/JavaScript site with multiple standalone HTML pages.
- `i18n.js` provides English/Pakistani Urdu localization and RTL direction handling.
- `functions/api/ai.js` is a server-side AI endpoint written for a Cloudflare Pages Functions runtime. GitHub Pages does not execute this endpoint.
- `.github/workflows/deploy-pages.yml` already attempts a GitHub Pages deployment. The observed workflow failure reported that the GitHub Pages site could not be found, which indicates Pages needs to be enabled/configured for this repository or the deployment permission/configuration needs owner-side review. It does not prove the website code itself is broken.
- `scripts/check-site.mjs` checks JavaScript syntax, local asset references, expected homepage card count, localization markers and AI endpoint safety markers. These checks are not browser-level tests and do not prove the Urdu blank-screen issue is fixed.

## Target architecture

### Static frontend

- Keep the current site and its working deterministic tools while auditing and improving them.
- Introduce audience-specific entry routes only after the shared layout and assets work under GitHub Pages' project-site path.
- Target routes: `/pk/ur/` for Pakistan Urdu and `/global/en/` for international English, subject to a routing test against the actual GitHub Pages base URL.
- Use explicit `lang` and `dir` attributes, stable language switching, localized metadata, and equivalent-page links where the equivalent exists.
- Do not use browser-language auto-redirects that prevent direct access to either edition.

### Backend

- GitHub Pages cannot execute server-side AI code. The existing `functions/api/ai.js` must not be assumed to work when served from GitHub Pages.
- Do not move AI secrets into frontend JavaScript or the public repository.
- Keep deterministic calculators, formatters and local file utilities working without an AI backend where practical.
- Before choosing a free backend provider, verify its current free-tier limits, supported runtime, secret storage, deployment method, and whether it sleeps or imposes quotas. Do not add a provider-specific implementation until this check is complete.
- Until a real backend is deployed and tested, AI features must clearly state that they are unavailable rather than return simulated answers.

## Priority sequence

1. Reproduce and diagnose the Urdu blank-screen issue from the actual code; add regression coverage.
2. Run the existing static quality checks and add browser tests if the repository can support them without unnecessary dependencies.
3. Configure GitHub Pages on the repository and verify the project-site base path. This may require the repository owner to enable Pages in Settings.
4. Implement and test the two audience-specific routes without breaking existing page URLs.
5. Audit each existing tool and classify it as verified, incomplete, or backend-dependent.
6. Complete the highest-value tools and the localized learning/assessment foundations.
7. Select and deploy a free backend only after verifying current provider limits and the exact runtime requirements.
8. Run direct-load, refresh, navigation, mobile viewport, English/Urdu switch, keyboard and accessibility checks.
9. Merge only after reviewing the proposed changes and test evidence.

## Required acceptance evidence

Record each test as PASS, FAIL, or NOT TESTED. A static syntax check must not be reported as a successful visual/browser test. Do not claim deployment, AI availability, GDPR/legal compliance, or full localization without evidence.
