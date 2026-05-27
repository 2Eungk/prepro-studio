import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const page = read('src/app/page.tsx');
const workspaceOnboarding = read('src/components/layout/WorkspaceOnboarding.tsx');
const sceneLocationField = read('src/components/sections/schedule/SceneLocationField.tsx');
const mobileScheduleList = read('src/components/sections/schedule/MobileScheduleList.tsx');

const scheduleActionsStart = page.indexOf(": activeTab === 'schedule'");
const scheduleActionsEnd = page.indexOf(": activeTab === 'cueSheet'", scheduleActionsStart);
const scheduleActions = scheduleActionsStart >= 0 && scheduleActionsEnd > scheduleActionsStart
  ? page.slice(scheduleActionsStart, scheduleActionsEnd)
  : '';

const quickActionHandlerStart = page.indexOf('const handleWorkspaceQuickAction = (actionId: string) => {');
const quickActionHandlerEnd = page.indexOf('const handleReadinessAction =', quickActionHandlerStart);
const quickActionHandler = quickActionHandlerStart >= 0 && quickActionHandlerEnd > quickActionHandlerStart
  ? page.slice(quickActionHandlerStart, quickActionHandlerEnd)
  : '';

const emptyScheduleGuideStart = page.indexOf("{activeTab === 'schedule' && showEmptyScheduleGuide");
const emptyScheduleGuideEnd = page.indexOf("{activeTab === 'schedule' && !showEmptyScheduleGuide", emptyScheduleGuideStart);
const emptyScheduleGuide = emptyScheduleGuideStart >= 0 && emptyScheduleGuideEnd > emptyScheduleGuideStart
  ? page.slice(emptyScheduleGuideStart, emptyScheduleGuideEnd)
  : '';

const checks = [
  {
    name: 'post-first-scene schedule primary action advances to storyboard',
    ok: scheduleActions.includes('scenes.length > 0')
      && scheduleActions.includes("id: 'go-storyboard'")
      && scheduleActions.includes('첫 다음 단계')
      && scheduleActions.indexOf("id: 'go-storyboard'") < scheduleActions.indexOf("id: 'schedule-add'"),
  },
  {
    name: 'storyboard shortcut switches tabs and lands on the storyboard workspace',
    ok: quickActionHandler.includes("case 'go-storyboard':")
      && quickActionHandler.includes("setActiveTab('storyboard');")
      && quickActionHandler.includes("document.getElementById('storyboard-workspace-panel')?.scrollIntoView"),
  },
  {
    name: 'storyboard workspace exposes a stable scroll target',
    ok: page.includes('id="storyboard-workspace-panel"')
      && page.indexOf('id="storyboard-workspace-panel"') < page.indexOf('<StoryboardPanel'),
  },
  {
    name: 'storyboard primary action applies a recommended shot into the scene form',
    ok: page.includes("id: 'storyboard-apply-featured'")
      && page.includes('추천 샷으로 추가')
      && page.includes("case 'storyboard-apply-featured':")
      && page.includes('applyStoryboardToSceneForm(featuredStoryboards[0], true)')
      && page.indexOf("id: 'storyboard-apply-featured'") < page.indexOf("id: 'storyboard-gallery'"),
  },
  {
    name: 'first-run landing uses template-specific promise headline',
    ok: workspaceOnboarding.includes('{workspaceLanguage.firstRunTitle}')
      && !workspaceOnboarding.includes('뭐 만들 건지 고르면 바로 데려다줄게요')
      && page.includes('firstRunTitle:')
      && page.includes('workspaceLanguage={workspaceLanguage}'),
  },
  {
    name: 'manual first scene starts focused on the first required field',
    ok: sceneLocationField.includes('autoFocus')
      && sceneLocationField.includes('scene-location-first-success-hint')
      && sceneLocationField.includes('첫 장면은 장소와 내용만 넣으면 바로 추가할 수 있어요.'),
  },
  {
    name: 'empty schedule guide marks the analyzer as the recommended fastest start',
    ok: emptyScheduleGuide.includes('추천 빠른 시작')
      && emptyScheduleGuide.includes('data-first-action="recommended-analyzer"')
      && emptyScheduleGuide.indexOf('추천 빠른 시작') < emptyScheduleGuide.indexOf('직접 추가')
      && emptyScheduleGuide.indexOf('data-first-action="recommended-analyzer"') < emptyScheduleGuide.indexOf('data-first-action="manual-entry"'),
  },
  {
    name: 'mobile empty schedule keeps analyzer import available before sample data',
    ok: mobileScheduleList.includes('onOpenAnalyzer')
      && mobileScheduleList.includes('analyzerLabelByTemplate')
      && mobileScheduleList.includes('{analyzerLabelByTemplate[template]}')
      && mobileScheduleList.indexOf('onOpenAnalyzer') < mobileScheduleList.indexOf('onLoadSampleData')
      && page.includes('onOpenAnalyzer={openScriptAnalyzer}'),
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error('First success loop checks failed:');
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log(`First success loop checks passed (${checks.length})`);
