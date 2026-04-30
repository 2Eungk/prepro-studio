# PrePro Studio

Professional production SaaS for film, advertising, and event sketch schedules. It combines a dailies/call sheet workflow, location weather intelligence, cast and crew call times, storyboard references, JSON project backup, and PDF export.

## Tech Stack

- Next.js App Router
- Tailwind CSS
- Zustand
- date-fns
- dnd-kit
- Open-Meteo API

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Release Checks

Run the full local release check before deployment:

```bash
npm run release:check
```

This runs:

- `npm run lint`
- `npm run check:storyboards`
- `npm run build`

## Storyboard Assets

Storyboard references are stored in `src/data/storyboardDb.ts` and mapped to `public/shot_01.png` through `public/shot_130.png`.

```bash
npm run check:storyboards
```

The audit verifies unique DB URLs, sequential filenames, existing PNG files, and 16:9 image ratios.

## Optional AdSense

Ads are disabled unless all public AdSense variables are set. Leave them blank before approval or if the product should stay ad-free.

```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=
NEXT_PUBLIC_ADSENSE_TOP_SLOT=
NEXT_PUBLIC_ADSENSE_MIDDLE_SLOT=
```

## Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) before publishing.
