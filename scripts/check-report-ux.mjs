import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const desktopTimeline = read('src/components/sections/schedule/DesktopTimelineRows.tsx');
const mobileTimeline = read('src/components/sections/schedule/MobileTimelineCards.tsx');
const reportPanel = read('src/components/sections/ReportPanel.tsx');

const checks = [
  {
    name: 'desktop report mode uses explicit status labels',
    ok: desktopTimeline.includes("{ label: '완료'") && desktopTimeline.includes("{ label: 'NG'") && desktopTimeline.includes("{ label: '대기'"),
  },
  {
    name: 'desktop rows expose current status badge for field operators',
    ok: desktopTimeline.includes('현재 상태') && desktopTimeline.includes('statusMeta'),
  },
  {
    name: 'mobile status buttons include strong selected feedback and Korean labels',
    ok: mobileTimeline.includes('선택됨') && mobileTimeline.includes("{ label: '완료'") && mobileTimeline.includes("{ label: 'NG'"),
  },
  {
    name: 'mobile field bar summarizes done/ng/pending in one glance',
    ok: mobileTimeline.includes('완료 ') && mobileTimeline.includes('NG ') && mobileTimeline.includes('대기 '),
  },
  {
    name: 'report panel has color-coded completion/ng/pending summary strip',
    ok: reportPanel.includes('현장 체크 요약') && reportPanel.includes('남은 확인') && reportPanel.includes('재확인'),
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error('Report UX checks failed:');
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log(`Report UX checks passed (${checks.length})`);
