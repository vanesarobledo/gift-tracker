# Gift Tracker

A small personal app for tracking gifts for friends and family: who still needs shopping for, which gifts are planned, bought and given. See [SPEC.md](./SPEC.md) for the product brief.

Data lives in the browser's `localStorage`. Use **Data → Download export** for backups.

## Structure

- `src/domain/`: pure, framework-free logic (types, recipient grouping, totals, date helpers, cascading operations, import validation). This is where the rules live, and it's what the unit tests cover.
- `src/stores/`: the Pinia store (a thin wrapper that applies domain operations) and `localStorage` persistence.
- `src/views/`, `src/components/`: the Vue UI, styled with Tailwind CSS v4.

## Commands

```sh
npm install
npm run dev         # dev server
npm run test:unit   # Vitest
npm run type-check
npm run lint
npm run build       # type-check + production build to dist/
```

## Deploying

Netlify builds with `npm run build` and publishes `dist` (see `netlify.toml`). `public/_redirects` holds the SPA fallback so deep links like `/occasions/abc` work.
