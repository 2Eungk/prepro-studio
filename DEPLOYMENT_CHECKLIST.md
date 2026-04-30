# PrePro Studio Deployment Checklist

Use this before the first public deployment and before every meaningful release.

## 1. Product QA

- Load sample data in each template: 영화, 광고, 행사.
- Confirm sample data stays in the selected template after loading.
- Edit one schedule item and change its storyboard or shot plan.
- Add one location with Korean search text and confirm weather appears.
- Add one person with contact and call time.
- Run AI 동선 최적화 and confirm time blocks remain in place.
- Toggle report mode and mark one item 완료, one item NG.

## 2. Export QA

- Export schedule PDF from the 스케줄 tab.
- Export 콜시트 PDF from the 인원 tab.
- Export 결과 PDF from the 리포트 tab.
- Confirm storyboard images stay 16:9 and are not cropped.
- Confirm edit/delete/drag controls do not appear in exported PDFs.
- Save JSON, reload the app, and open the JSON backup.

## 3. Build QA

```bash
npm run release:check
```

Required pass conditions:

- ESLint passes.
- Storyboard DB reports 130 sequential 16:9 PNG files.
- Next.js production build completes.

## 4. Environment

- Keep `.env.local` out of Git.
- Copy `.env.example` into Vercel environment variables only when needed.
- Leave AdSense variables blank until AdSense is approved.
- If AdSense is enabled, set all three values together:
  - `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
  - `NEXT_PUBLIC_ADSENSE_TOP_SLOT`
  - `NEXT_PUBLIC_ADSENSE_MIDDLE_SLOT`

## 5. Vercel Settings

- Framework preset: Next.js.
- Build command: `npm run build`.
- Install command: `npm install`.
- Output directory: leave default.
- Node version: use Vercel default unless a runtime issue appears.

## 6. Public Launch Smoke Test

- Open the production URL on desktop and mobile width.
- Confirm no horizontal overflow in the header and schedule table.
- Confirm weather loads for Seoul and at least one edited Korean location.
- Confirm storyboard thumbnails load from `/shot_*.png`.
- Confirm PDF export shows `PDF 저장됨`.
- Confirm no placeholder ad slot appears when AdSense env values are blank.

## 7. Not Yet Included

- Multi-user sync and shared editing require a backend/database.
- Login and saved cloud projects are not implemented yet.
- Payment, donation, or Pro subscription flow is not implemented yet.
