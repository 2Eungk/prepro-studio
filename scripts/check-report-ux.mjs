import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const desktopTimeline = read('src/components/sections/schedule/DesktopTimelineRows.tsx');
const mobileTimeline = read('src/components/sections/schedule/MobileTimelineCards.tsx');
const mobileScheduleList = read('src/components/sections/schedule/MobileScheduleList.tsx');
const page = `${read('src/app/page.tsx')}\n${read('src/components/app/PreProClientApp.tsx')}`;
const scheduleControls = read('src/components/sections/schedule/ScheduleControlsPanel.tsx');
const reportPanel = read('src/components/sections/ReportPanel.tsx');
const peoplePanel = read('src/components/sections/PeoplePanel.tsx');

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
  {
    name: 'report panel exposes final delivery readiness guidance',
    ok: reportPanel.includes('마무리 / 납품 준비')
      && reportPanel.includes('지금 보낼 것과 남은 확인')
      && reportPanel.includes('촬영표 상태')
      && reportPanel.includes('큐시트 / 콘티 근거')
      && reportPanel.includes('콜시트 연락망')
      && reportPanel.includes('납품 / 백업')
      && reportPanel.includes('sendNowGuidance'),
  },
  {
    name: 'report panel gives practical PDF JSON and remaining-item actions',
    ok: reportPanel.includes('onExportJSON')
      && reportPanel.includes('JSON 백업')
      && reportPanel.includes('결과 PDF')
      && reportPanel.includes('남은 항목')
      && reportPanel.includes('data-html2canvas-ignore="true"')
      && page.includes('onExportJSON={handleExportJSON}')
      && page.includes('callSheetStats={callSheetStats}')
      && page.includes('peopleCount={people.length}'),
  },
  {
    name: 'report sample load avoids native confirm so empty-report browsing does not block mobile/browser QA',
    ok: page.includes('onLoadSampleData={() => handleLoadSampleData(false)}'),
  },
  {
    name: 'report follow-up section can return directly to field check mode',
    ok: reportPanel.includes('남은 항목 체크')
      && reportPanel.includes('reportActionItems.length > 0')
      && reportPanel.includes('onClick={onEnableReportMode}'),
  },
  {
    name: 'mobile field bar can jump to the next unchecked scene',
    ok: mobileTimeline.includes('다음 확인으로 이동')
      && mobileTimeline.includes('scrollIntoView')
      && mobileScheduleList.includes('data-mobile-scene-card')
      && mobileScheduleList.includes('mobile-scene-'),
  },
  {
    name: 'mobile empty schedule actions use field-sized touch targets',
    ok: mobileScheduleList.includes('prepro-btn prepro-btn--primary min-h-11')
      && mobileScheduleList.includes('prepro-btn prepro-btn--secondary min-h-11')
      && mobileScheduleList.includes('prepro-btn prepro-btn--quiet min-h-11')
      && !mobileScheduleList.includes('prepro-btn prepro-btn--primary h-9')
      && !mobileScheduleList.includes('prepro-btn prepro-btn--secondary h-9')
      && !mobileScheduleList.includes('prepro-btn prepro-btn--quiet h-9'),
  },
  {
    name: 'mobile timeline card actions use field-sized touch targets',
    ok: mobileTimeline.includes('prepro-btn prepro-btn--secondary min-h-11')
      && mobileTimeline.includes('prepro-btn prepro-btn--quiet min-h-11')
      && mobileTimeline.includes('prepro-btn prepro-btn--warm min-h-11')
      && mobileTimeline.includes('prepro-btn prepro-btn--danger min-h-11')
      && !mobileTimeline.includes('prepro-btn prepro-btn--secondary h-9')
      && !mobileTimeline.includes('prepro-btn prepro-btn--quiet h-9')
      && !mobileTimeline.includes('prepro-btn prepro-btn--warm h-9')
      && !mobileTimeline.includes('prepro-btn prepro-btn--danger h-9'),
  },
  {
    name: 'report mode entry returns operators to the schedule checkpoint',
    ok: page.includes('handleEnableReportMode')
      && page.includes("setActiveTab('schedule')")
      && page.includes('schedule-report-checkpoint')
      && page.includes('onEnableReportMode={handleEnableReportMode}')
      && scheduleControls.includes('schedule-report-checkpoint'),
  },
  {
    name: 'report mode entry clears stale schedule filters',
    ok: page.includes('const handleEnableReportMode = () => {')
      && page.includes('resetScheduleFilters();')
      && page.indexOf('resetScheduleFilters();') > page.indexOf('const handleEnableReportMode = () => {')
      && page.indexOf('resetScheduleFilters();') < page.indexOf("setActiveTab('schedule')"),
  },
  {
    name: 'schedule shortcuts clear stale filters before entering the timeline',
    ok: page.includes('const handleGoSchedule = () => {')
      && page.includes('onGoSchedule={handleGoSchedule}')
      && page.includes("case 'go-schedule':")
      && page.indexOf('resetScheduleFilters();', page.indexOf('const handleGoSchedule = () => {')) > page.indexOf('const handleGoSchedule = () => {')
      && page.indexOf('resetScheduleFilters();', page.indexOf('const handleGoSchedule = () => {')) < page.indexOf("setActiveTab('schedule');", page.indexOf('const handleGoSchedule = () => {')),
  },
  {
    name: 'first-run schedule guide exposes analyzer import shortcut',
    ok: page.includes('showEmptyScheduleGuide')
      && page.includes('openScriptAnalyzer')
      && page.includes('data-first-action="recommended-analyzer"')
      && page.includes('workspaceLanguage.gettingStarted.analyzer')
      && page.indexOf('openScriptAnalyzer', page.indexOf('showEmptyScheduleGuide')) > page.indexOf('showEmptyScheduleGuide')
      && page.indexOf('openScriptAnalyzer', page.indexOf('showEmptyScheduleGuide')) < page.indexOf('data-first-action="manual-entry"', page.indexOf('showEmptyScheduleGuide')),
  },
  {
    name: 'readiness schedule actions clear stale filters before opening schedule',
    ok: page.includes('const handleReadinessAction = (checkId: string) => {')
      && page.indexOf('resetScheduleFilters();', page.indexOf("case 'schedule':")) > page.indexOf("case 'metadata':")
      && page.indexOf('resetScheduleFilters();', page.indexOf("case 'schedule':")) < page.indexOf("setActiveTab('schedule');", page.indexOf("case 'schedule':"))
      && page.indexOf('resetScheduleFilters();', page.indexOf("case 'duration':")) > page.indexOf("case 'duration':")
      && page.indexOf('resetScheduleFilters();', page.indexOf("case 'duration':")) < page.indexOf("setActiveTab('schedule');", page.indexOf("case 'duration':")),
  },
  {
    name: 'people panel mobile call sheet actions stack before desktop layout',
    ok: peoplePanel.includes('flex flex-col gap-3 md:flex-row md:items-center md:justify-between')
      && peoplePanel.includes('grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto')
      && peoplePanel.includes('min-h-12 w-full justify-center px-5 text-sm md:w-auto')
      && peoplePanel.includes('grid grid-cols-1 gap-2 text-xs sm:grid-cols-3')
      && peoplePanel.includes('prepro-btn min-h-11 w-full justify-center md:h-9 md:min-h-0 md:w-auto')
      && peoplePanel.includes("pdfButtonText('콜시트 PDF')")
      && peoplePanel.includes('누락 인원만 보기'),
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
