# Han Market visitor guide

Independent Vietnamese and English visitor information for https://hanmarket.org. Static Astro pages are served by the native Cloudflare Worker, including `/api/weather`.

Use Node 24.12 or newer in the 24 series and pnpm 11.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

Wrangler serves `dist` as assets and uses `src/worker.ts` for HTTPS routing, honest 404 responses and live weather. Its project name is `hanmarket`. No deployment is implied by a local build.

The two language homepages share verified place coordinates and corresponding FAQ content. Published opening-hour guidance links to the dated city tourism article; no third-party rating or recurring schedule is asserted in structured data.

Optional Google Analytics retains its existing measurement ID and settings pages. It loads only after an opt-in stored in localStorage. Withdrawal disables further measurement. Maps and external fonts are separate services disclosed in the privacy pages.

Weather is fetched at runtime from Open-Meteo. Provider failures return 503 and an unavailable message instead of sample forecasts. Weather and navigation responses are excluded from service-worker caching.

Photograph originals and individual licences are listed in `src/data/photos.json` and the visible bilingual footer.
