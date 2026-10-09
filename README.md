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
This is an early static starter. Tool cards marked “Coming soon” are not interactive yet. No generative AI API is connected. Review the privacy and terms drafts before a public launch.

## Deploy with Cloudflare Pages
1. Open Cloudflare Dashboard and go to Workers & Pages.
2. Create a Pages project and connect this GitHub repository.
3. Choose the `main` branch.
4. For this plain HTML site, leave the build command empty and set the output directory to `/` (the repository root) if the current dashboard accepts that setting.
5. Deploy, then open the provided Pages URL to test the homepage and all navigation links.

Keep the repository private if you prefer. Do not put passwords, API keys, or other secrets in frontend files.
