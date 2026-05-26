import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const page = read('src/app/page.tsx');
const workspaceOnboarding = read('src/components/layout/WorkspaceOnboarding.tsx');

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
