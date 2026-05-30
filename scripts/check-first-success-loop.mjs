import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const page = read('src/app/page.tsx');
const appHeader = read('src/components/header/AppHeader.tsx');
const workspaceOnboarding = read('src/components/layout/WorkspaceOnboarding.tsx');
const sceneLocationField = read('src/components/sections/schedule/SceneLocationField.tsx');
const mobileScheduleList = read('src/components/sections/schedule/MobileScheduleList.tsx');
const mobileTimelineCards = read('src/components/sections/schedule/MobileTimelineCards.tsx');
const readinessChecklist = read('src/components/sections/schedule/ReadinessChecklist.tsx');
const scheduleControlsPanel = read('src/components/sections/schedule/ScheduleControlsPanel.tsx');
const cueSheetPanel = read('src/components/sections/CueSheetPanel.tsx');

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
    name: 'first-run onboarding does not duplicate the top production-type selector',
    ok: workspaceOnboarding.includes('현재 제작 분야 확인')
      && workspaceOnboarding.includes('제작 분야는 상단 설정 바에서 바꿀 수 있습니다.')
      && workspaceOnboarding.includes('자료 상태 고르기')
      && workspaceOnboarding.includes('분야 변경은 상단 설정')
      && workspaceOnboarding.includes('현재 분야 보기')
      && !workspaceOnboarding.includes('어떤 제작물인가요?')
      && !workspaceOnboarding.includes('분야 다시 선택')
      && !workspaceOnboarding.includes('onSelectTemplate')
      && !workspaceOnboarding.includes('cards.map((item)')
      && !page.includes('onSelectTemplate={handleTemplateChange}'),
  },
  {
    name: 'first-run setup drawer hides duplicate start actions',
    ok: appHeader.includes('showProjectSetupActions: boolean;')
      && appHeader.includes('showProjectSetupActions,')
      && appHeader.includes('{showProjectSetupActions && (')
      && appHeader.indexOf('{showProjectSetupActions && (') < appHeader.indexOf("onClick={() => onSetShowAnalyzer(true)}")
      && appHeader.indexOf('{showProjectSetupActions && (') < appHeader.indexOf('onClick={onLoadSampleData}')
      && page.includes('showProjectSetupActions={!isFirstRun}')
      && page.indexOf('showProjectSetupActions={!isFirstRun}') < page.indexOf('productionTemplateOptions={productionTemplateOptions}'),
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
      && emptyScheduleGuide.includes('대본이 있어요')
      && emptyScheduleGuide.includes('시나리오로 시작하기')
      && emptyScheduleGuide.includes('직접 입력하기')
      && emptyScheduleGuide.includes('샘플로 둘러보기')
      && emptyScheduleGuide.includes('기획부터 정리하기')
      && emptyScheduleGuide.includes('콜타임, 이동, 식사는 바로 다음 단계에서 시간 블록으로 붙이면 됩니다.')
      && emptyScheduleGuide.includes('시간 블록 붙이기')
      && emptyScheduleGuide.includes('콜타임, 이동, 식사, 리허설')
      && emptyScheduleGuide.indexOf('추천 빠른 시작') < emptyScheduleGuide.indexOf('직접 입력하기')
      && emptyScheduleGuide.indexOf('data-first-action="recommended-analyzer"') < emptyScheduleGuide.indexOf('data-first-action="manual-entry"'),
  },
  {
    name: 'first-run cards make scenario start primary without hiding secondary choices',
    ok: page.includes("label: template === 'film' ? '대본이 있어요' : '자료가 있어요'")
      && page.includes('시나리오, PDF, 샷리스트를 넣으면 씬·장소·인물 초안으로 바로 시작합니다.')
      && page.includes("label: '직접 입력하기'")
      && page.includes("label: '샘플로 둘러보기'")
      && page.includes("label: '기획부터 정리하기'")
      && workspaceOnboarding.includes('sm:col-span-2')
      && workspaceOnboarding.includes("'시나리오로 시작하기'")
      && workspaceOnboarding.includes('{isRecommended ? recommendedActionLabel : item.label}')
      && workspaceOnboarding.includes('aria-hidden="true"')
      && workspaceOnboarding.includes('바로 시작하기')
      && workspaceOnboarding.includes('border-teal-200/70 bg-teal-300')
      && emptyScheduleGuide.includes('aria-hidden="true"')
      && emptyScheduleGuide.includes('바로 시작하기')
      && emptyScheduleGuide.includes('border border-black/15 bg-black')
      && page.indexOf("label: template === 'film' ? '대본이 있어요' : '자료가 있어요'") < page.indexOf("label: '직접 입력하기'"),
  },
  {
    name: 'mobile empty schedule keeps analyzer import available before sample data',
    ok: mobileScheduleList.includes('onOpenAnalyzer')
      && mobileScheduleList.includes('analyzerLabelByTemplate')
      && mobileScheduleList.includes('{analyzerLabelByTemplate[template]}')
      && mobileScheduleList.indexOf('onOpenAnalyzer') < mobileScheduleList.indexOf('onLoadSampleData')
      && page.includes('onOpenAnalyzer={openScriptAnalyzer}'),
  },
  {
    name: 'mobile timeline labels time blocks separately from scene numbering',
    ok: mobileScheduleList.includes("rowNumber={filteredTimelineRows.slice(0, index + 1).filter((item) => item.type === 'scene').length}")
      && mobileTimelineCards.includes('타임라인 ${rowNumber}번째 시간 블록')
      && mobileTimelineCards.includes('시간')
      && page.includes("rowNumber: focusRowIndex >= 0 ? timelineRows.slice(0, focusRowIndex + 1).filter((row) => row.type === 'scene').length : undefined")
      && mobileScheduleList.indexOf("rowNumber={filteredTimelineRows.slice(0, index + 1).filter((item) => item.type === 'scene').length}") < mobileScheduleList.indexOf('onEdit={() => onEditScene(row.scene)}')
      && mobileTimelineCards.indexOf('title={`타임라인 ${rowNumber}번째 시간 블록`}') < mobileTimelineCards.indexOf('>\n          시간\n        </span>'),
  },
  {
    name: 'post-first-scene timeline exposes one-click operational time blocks',
    ok: scheduleControlsPanel.includes('운영 블록 빠른 추가')
      && scheduleControlsPanel.includes('activeDaySceneCount > 0')
      && scheduleControlsPanel.includes('콜타임 / 장비 하차')
      && scheduleControlsPanel.includes('세팅 / 리허설')
      && scheduleControlsPanel.includes('이동 / 주차 확인')
      && scheduleControlsPanel.includes('식사 / 휴식')
      && scheduleControlsPanel.includes('철수 / 백업')
      && scheduleControlsPanel.includes("placement: 'before-first-scene'")
      && scheduleControlsPanel.includes("placement: 'after-current-order'")
      && scheduleControlsPanel.includes('onQuickAddBreak(preset)')
      && page.includes('const addQuickBreak = (preset: QuickBreakPreset) => {')
      && page.includes('const firstSceneIndex = timelineRows.findIndex((row) => row.type === \'scene\');')
      && page.includes('restoreTimelineOrder(nextOrder);')
      && page.includes('onQuickAddBreak={addQuickBreak}')
      && scheduleControlsPanel.indexOf('운영 블록 빠른 추가') < scheduleControlsPanel.indexOf('고급 필터 · 제작 점검'),
  },
  {
    name: 'cue sheet explains shoot-ready gaps and returns to schedule fixes',
    ok: cueSheetPanel.includes('큐시트 준비도')
      && cueSheetPanel.includes('바로 현장 공유 가능한 큐')
      && cueSheetPanel.includes('다음 액션:')
      && cueSheetPanel.includes('getMissingReferenceCount')
      && cueSheetPanel.includes('샷/포커스/레퍼런스')
      && cueSheetPanel.includes('콘티/레퍼런스')
      && cueSheetPanel.includes('촬영표에서 보강')
      && cueSheetPanel.includes('onGoSchedule')
      && page.includes('onGoSchedule={handleGoSchedule}')
      && cueSheetPanel.indexOf('큐시트 준비도') < cueSheetPanel.indexOf('촬영표에서 보강'),
  },
  {
    name: 'mobile header keeps backup education compact before the schedule',
    ok: appHeader.includes('flex gap-2 overflow-x-auto rounded-xl')
      && appHeader.includes('prepro-btn prepro-btn--ghost shrink-0')
      && appHeader.includes('{!isFirstRun && (')
      && appHeader.includes('<details className="rounded-2xl border border-teal-400/25')
      && appHeader.includes('md:hidden')
      && appHeader.includes('브라우저에만 저장 · 백업 필요')
      && appHeader.includes('자세히 / 백업하기 열기')
      && appHeader.includes('hidden rounded-2xl border border-teal-400/25')
      && appHeader.includes('md:block')
      && appHeader.includes('items-center gap-1.5 rounded-full')
      && appHeader.includes('{templateLabel} / {weatherLabel || location || \'날씨 위치 미정\'} / {activeShootingDate}')
      && appHeader.includes("isFirstRun ? 'p-3' : 'p-4'")
      && appHeader.indexOf('브라우저에만 저장 · 백업 필요') < appHeader.indexOf('서버 DB에 프로젝트를 저장하지 않습니다.'),
  },
  {
    name: 'first-run header keeps backup actions behind visible management disclosure',
    ok: appHeader.includes('isFirstRun: boolean;')
      && appHeader.includes('isFirstRun,')
      && page.includes('isFirstRun={isFirstRun}')
      && appHeader.includes('관리 메뉴 열기')
      && appHeader.includes('<span>관리</span>')
      && appHeader.includes("{!isFirstRun && (")
      && appHeader.includes('백업하기')
      && appHeader.includes('백업에서 복원')
      && appHeader.indexOf('관리 메뉴 열기') < appHeader.indexOf('백업하기')
      && appHeader.indexOf("{!isFirstRun && (") < appHeader.indexOf('브라우저에만 저장 · 백업 필요')
      && appHeader.includes("isFirstRun ? 'gap-3 md:gap-4' : 'gap-4 md:gap-8'")
      && appHeader.includes("isFirstRun ? 'hidden lg:inline-flex' : 'hidden sm:inline-flex'"),
  },
  {
    name: 'first-run setup controls collapse production type and date weather details',
    ok: appHeader.includes("isFirstRun ? '현재 기준' : workspaceLanguage.setupLabel")
      && appHeader.includes("isFirstRun ? '변경/날짜·날씨' : '날짜/날씨 설정'")
      && appHeader.includes('{!isFirstRun && (')
      && appHeader.includes('{isFirstRun && (')
      && appHeader.includes('<div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">제작 분야</div>')
      && appHeader.indexOf("isFirstRun ? '현재 기준' : workspaceLanguage.setupLabel") < appHeader.indexOf("isFirstRun ? '변경/날짜·날씨' : '날짜/날씨 설정'")
      && appHeader.indexOf('<div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">제작 분야</div>') < appHeader.indexOf('id="weather-location"'),
  },
  {
    name: 'first-run empty schedule brings primary start area forward with compact next flow',
    ok: emptyScheduleGuide.includes('rounded-3xl border border-neutral-900 bg-neutral-950/80 p-4 md:p-5')
      && emptyScheduleGuide.includes('lg:grid-cols-[minmax(0,1fr)_280px]')
      && emptyScheduleGuide.includes('data-first-action="recommended-analyzer"')
      && emptyScheduleGuide.includes('바로 시작하기')
      && emptyScheduleGuide.includes('현장 입력 순서')
      && emptyScheduleGuide.includes('<aside className="rounded-2xl border border-neutral-900 bg-black/45 p-4">')
      && emptyScheduleGuide.indexOf('data-first-action="recommended-analyzer"') < emptyScheduleGuide.indexOf('현장 입력 순서')
      && emptyScheduleGuide.indexOf('바로 시작하기') < emptyScheduleGuide.indexOf('현장 입력 순서'),
  },
  {
    name: 'top header actions stay focused and move management actions behind disclosure',
    ok: appHeader.includes('<span>새 프로젝트</span>')
      && appHeader.includes("'파일 가져오기'")
      && appHeader.includes('<span>{shareStatus || \'공유\'}</span>')
      && appHeader.includes('관리 메뉴 열기')
      && appHeader.includes('백업하기')
      && appHeader.includes('백업에서 복원')
      && appHeader.includes('리포트 모드 켜기')
      && appHeader.includes('리포트 모드 끄기')
      && appHeader.indexOf('<span>새 프로젝트</span>') < appHeader.indexOf('관리 메뉴 열기')
      && appHeader.indexOf('<span>{shareStatus || \'공유\'}</span>') < appHeader.indexOf('관리 메뉴 열기')
      && !appHeader.includes('<span>새로</span>')
      && !appHeader.includes(">JSON 백업<")
      && !appHeader.includes('백업 복원')
      && !appHeader.includes('리포트 모드 OFF')
      && !appHeader.includes('리포트 모드 ON'),
  },
  {
    name: 'mobile workspace nav hides long captions while preserving scrollable touch targets',
    ok: appHeader.includes('py-1.5 backdrop-blur md:py-2')
      && appHeader.includes('flex items-center gap-1.5 overflow-x-auto custom-scrollbar md:gap-2')
      && appHeader.includes('hidden min-w-max shrink-0 rounded-2xl')
      && appHeader.includes('min-h-11 min-w-[72px]')
      && appHeader.includes('md:min-w-[112px]')
      && appHeader.includes('mt-1 hidden text-[10px] font-bold text-neutral-600 md:block')
      && appHeader.includes('min-h-11 min-w-[112px]')
      && appHeader.includes('md:min-w-[136px]')
      && appHeader.indexOf('min-h-11 min-w-[72px]') < appHeader.indexOf('mt-1 hidden text-[10px] font-bold text-neutral-600 md:block')
      && appHeader.indexOf('min-h-11 min-w-[112px]') > appHeader.indexOf('mainWorkspaceTabs'),
  },
  {
    name: 'mobile field control keeps status filters collapsed until needed',
    ok: mobileTimelineCards.includes('group/mobile-field-filters')
      && mobileTimelineCards.includes('open={statusFilter !== \'all\'}')
      && mobileTimelineCards.includes('상태 필터')
      && mobileTimelineCards.includes('대기 {reportStats.pending} · NG {reportStats.ng} · 완료 {reportStats.done}')
      && mobileTimelineCards.includes('group-open/mobile-field-filters:hidden')
      && mobileTimelineCards.indexOf('group/mobile-field-filters') < mobileTimelineCards.indexOf('다음 확인으로 이동')
      && mobileTimelineCards.indexOf('상태 필터') < mobileTimelineCards.indexOf('onSetStatusFilter(statusFilter === item.id ? \'all\' : item.id)'),
  },
  {
    name: 'mobile sample project notice stays compact before field controls',
    ok: page.includes('샘플 보기 중 · 내 프로젝트로 쓰기')
      && page.includes('실제 프로젝트로 쓰려면 표시를 지우거나 새로 시작하세요.')
      && page.includes('<details className="md:hidden">')
      && page.includes('<div className="hidden flex-col gap-3 md:flex')
      && page.includes('rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 md:p-4')
      && page.indexOf('샘플 보기 중 · 내 프로젝트로 쓰기') < page.indexOf('내 프로젝트로 사용')
      && page.indexOf('샘플 보기 중 · 내 프로젝트로 쓰기') < page.indexOf('<ShootDaySelector'),
  },
  {
    name: 'mobile workflow bar keeps next action and weather control on one compact row',
    ok: workspaceOnboarding.includes('p-2.5 md:p-3')
      && workspaceOnboarding.includes('hidden text-[11px] font-bold text-neutral-600 sm:block')
      && workspaceOnboarding.includes('grid grid-cols-[minmax(0,1fr)_auto] gap-2')
      && workspaceOnboarding.includes('min-h-12 min-w-0')
      && workspaceOnboarding.includes('hidden truncate text-[10px] font-bold opacity-70 sm:block')
      && workspaceOnboarding.includes('<span className="sm:hidden">날씨</span>')
      && workspaceOnboarding.indexOf('grid grid-cols-[minmax(0,1fr)_auto] gap-2') < workspaceOnboarding.indexOf('<span className="sm:hidden">날씨</span>'),
  },
  {
    name: 'post-first-scene prompt focuses next steps above departure checklist',
    ok: readinessChecklist.includes('postFirstScenePrompt')
      && readinessChecklist.includes('첫 씬 저장 완료')
      && readinessChecklist.includes('장소 확정하기')
      && readinessChecklist.includes('콘티 연결하기')
      && readinessChecklist.includes('출연/스태프 추가하기')
      && readinessChecklist.indexOf('첫 씬 저장 완료') < readinessChecklist.indexOf('출발 전 체크리스트')
      && page.includes('postFirstScenePrompt={scenes.length > 0}')
      && readinessChecklist.includes("id: 'permit'")
      && readinessChecklist.includes("id: 'storyboard'")
      && readinessChecklist.includes("id: 'people'")
      && readinessChecklist.includes('onClick={() => onAction(item.id)}'),
  },
  {
    name: 'readiness checklist covers equipment rental and backup planning',
    ok: page.includes("id: 'equipmentPlan'")
      && page.includes("label: '장비 / 렌탈'")
      && page.includes('scenesWithoutGear')
      && page.includes('equipmentPlanningReady')
      && page.includes('자체 보유·렌탈·구매·대여처·픽업/반납 시간')
      && page.includes('백업·미디어·전원')
      && page.includes("case 'equipmentPlan':")
      && page.includes("focusPlanningAnchor('details', equipmentPlanningAnchor)")
      && page.includes("film: { sectionId: 'production', fieldId: 'technicalNeeds' }")
      && page.indexOf("id: 'equipmentPlan'") > page.indexOf("id: 'storyboard'")
      && page.indexOf("case 'equipmentPlan':") < page.indexOf("case 'duration':"),
  },
  {
    name: 'readiness checklist groups departure items into scannable priority sections',
    ok: readinessChecklist.includes('const readinessGroups')
      && readinessChecklist.includes("label: '지금 할 일'")
      && readinessChecklist.includes("itemIds: ['schedule', 'metadata', 'duration']")
      && readinessChecklist.includes("label: '촬영 전 확인'")
      && readinessChecklist.includes("itemIds: ['permit', 'people', 'storyboard', 'equipmentPlan', 'sceneBreakdown', 'locationScout', 'weather']")
      && readinessChecklist.includes("label: '제출/정리'")
      && readinessChecklist.includes("itemIds: ['shortFilmPackage']")
      && readinessChecklist.indexOf("label: '지금 할 일'") < readinessChecklist.indexOf("label: '촬영 전 확인'")
      && readinessChecklist.indexOf("label: '촬영 전 확인'") < readinessChecklist.indexOf("label: '제출/정리'")
      && readinessChecklist.includes('group.items.map((item) =>')
      && readinessChecklist.includes('group.items.length > 0'),
  },
  {
    name: 'readiness checklist surfaces a compact field-day top-risk summary',
    ok: readinessChecklist.includes('오늘 먼저 확인')
      && readinessChecklist.includes('오늘 출발 준비 양호')
      && readinessChecklist.includes("item.status === 'critical' || item.status === 'warning'")
      && readinessChecklist.includes('.slice(0, 3)')
      && readinessChecklist.includes('topRiskItems.map((item) => (')
      && readinessChecklist.includes('onClick={() => onAction(item.id)}')
      && readinessChecklist.indexOf('오늘 먼저 확인') < readinessChecklist.indexOf('전체 체크리스트 펼쳐보기'),
  },
  {
    name: 'top-risk summary exposes field acknowledgement without opening the full checklist',
    ok: readinessChecklist.includes('topRiskItems.map((item) => (')
      && readinessChecklist.includes('onClick={() => onAcknowledge(item.id)}')
      && readinessChecklist.includes('현장 확인 완료')
      && readinessChecklist.indexOf('onClick={() => onAction(item.id)}', readinessChecklist.indexOf('topRiskItems.map((item) => (')) < readinessChecklist.indexOf('onClick={() => onAcknowledge(item.id)}', readinessChecklist.indexOf('topRiskItems.map((item) => ('))
      && readinessChecklist.indexOf('onClick={() => onAcknowledge(item.id)}', readinessChecklist.indexOf('topRiskItems.map((item) => (')) < readinessChecklist.indexOf('전체 체크리스트 펼쳐보기'),
  },
  {
    name: 'readiness full checklist is collapsed by default and opens for departure mode',
    ok: readinessChecklist.includes('<details className="group/details')
      && readinessChecklist.includes('open={isDepartureMode}')
      && readinessChecklist.includes('전체 체크리스트 펼쳐보기')
      && readinessChecklist.includes('출발 전에는 크게, 평소에는 우선 위험만 먼저 봅니다.')
      && readinessChecklist.indexOf('오늘 먼저 확인') < readinessChecklist.indexOf('<details className="group/details')
      && readinessChecklist.indexOf('<details className="group/details') < readinessChecklist.indexOf('group.items.map((item) =>'),
  },
  {
    name: 'readiness checklist computes durable risk progress counts',
    ok: readinessChecklist.includes('const totalRiskCount = checks.filter((item) => item.status === \'critical\' || item.status === \'warning\').length;')
      && readinessChecklist.includes('const remainingRiskCount = topRiskItemsSource.length;')
      && readinessChecklist.includes('const acknowledgedRiskCount = acknowledgedRiskItems.length;')
      && readinessChecklist.includes('const hasRiskProgress = totalRiskCount > 0;')
      && readinessChecklist.indexOf('const acknowledgedRiskItems = checks.filter') < readinessChecklist.indexOf('const topRiskItemsSource = checks.filter')
      && readinessChecklist.indexOf('const topRiskItemsSource = checks.filter') < readinessChecklist.indexOf('const topRiskItems = topRiskItemsSource.slice(0, 3);'),
  },
  {
    name: 'readiness checklist shows high-visibility remaining and completed summary before top risks',
    ok: readinessChecklist.includes('출발 전 확인 {remainingRiskCount}개 남음')
      && readinessChecklist.includes('이번 촬영 확인 {acknowledgedRiskCount}개 완료')
      && readinessChecklist.includes('text-3xl font-black')
      && readinessChecklist.includes('text-base font-black')
      && readinessChecklist.includes('border-2')
      && readinessChecklist.includes('bg-red-950/65')
      && readinessChecklist.includes('bg-teal-950/65')
      && readinessChecklist.includes('text-red-50')
      && readinessChecklist.includes('text-teal-50')
      && readinessChecklist.includes('remainingRiskCount === 0 && acknowledgedRiskCount > 0')
      && readinessChecklist.includes('이번 촬영 확인 완료 · 원본 준비 데이터는 유지됨')
      && readinessChecklist.indexOf('출발 전 확인 {remainingRiskCount}개 남음') < readinessChecklist.indexOf('오늘 먼저 확인')
      && readinessChecklist.indexOf('이번 촬영 확인 {acknowledgedRiskCount}개 완료') < readinessChecklist.indexOf('오늘 먼저 확인')
      && !readinessChecklist.includes('text-neutral-600">{topRiskItems.length}개 우선'),
  },
  {
    name: 'readiness checklist preserves good-ready state when no risk progress exists',
    ok: readinessChecklist.includes('hasRiskProgress ? (')
      && readinessChecklist.includes(') : null')
      && readinessChecklist.includes('오늘 출발 준비 양호')
      && readinessChecklist.indexOf('hasRiskProgress ? (') < readinessChecklist.indexOf('오늘 먼저 확인')
      && readinessChecklist.indexOf('오늘 출발 준비 양호') > readinessChecklist.indexOf('오늘 먼저 확인'),
  },
  {
    name: 'readiness warning and critical items expose a field acknowledgement action',
    ok: readinessChecklist.includes('acknowledgedCheckIds')
      && readinessChecklist.includes('onAcknowledge')
      && readinessChecklist.includes('acknowledgeable')
      && readinessChecklist.includes('현장 확인 완료')
      && readinessChecklist.includes("onClick={(event) => {")
      && readinessChecklist.includes('event.stopPropagation();')
      && readinessChecklist.includes('onAcknowledge(item.id);'),
  },
  {
    name: 'readiness acknowledgement controls use mobile-sized touch targets',
    ok: readinessChecklist.includes('w-full min-h-11')
      && readinessChecklist.includes('text-xs font-black')
      && readinessChecklist.indexOf('w-full min-h-11') > readinessChecklist.indexOf('onUnacknowledge(item.id);')
      && readinessChecklist.indexOf('w-full min-h-11') < readinessChecklist.indexOf('onAcknowledge(item.id);'),
  },
  {
    name: 'readiness top-risk summary excludes session-acknowledged warning and critical items',
    ok: readinessChecklist.includes('const acknowledgedCheckIdSet = new Set(acknowledgedCheckIds);')
      && readinessChecklist.includes("!acknowledgedCheckIdSet.has(item.id)")
      && readinessChecklist.indexOf("!acknowledgedCheckIdSet.has(item.id)") > readinessChecklist.indexOf('const topRiskItems = checks')
      && readinessChecklist.indexOf("!acknowledgedCheckIdSet.has(item.id)") < readinessChecklist.indexOf('.slice(0, 3)'),
  },
  {
    name: 'readiness acknowledged items stay visible with session-only non-fix copy',
    ok: readinessChecklist.includes('isAcknowledged')
      && readinessChecklist.includes('이번 촬영만 확인')
      && readinessChecklist.includes('원본 준비 데이터는 바뀌지 않습니다')
      && readinessChecklist.includes('acknowledgedCheckIdSet.has(item.id)')
      && readinessChecklist.includes('group.items.map((item) => {')
      && readinessChecklist.includes('return (')
      && readinessChecklist.lastIndexOf('이번 촬영만 확인') > readinessChecklist.indexOf('group.items.map((item) => {'),
  },
  {
    name: 'readiness acknowledged warning and critical items expose a reversible undo action',
    ok: readinessChecklist.includes('onUnacknowledge')
      && readinessChecklist.includes('다시 확인 필요')
      && readinessChecklist.includes('원본 준비 데이터는 바뀌지 않습니다')
      && readinessChecklist.includes('이번 촬영 확인 표시만 해제합니다')
      && readinessChecklist.includes('onClick={(event) => {')
      && readinessChecklist.includes('event.stopPropagation();')
      && readinessChecklist.includes('onUnacknowledge(item.id);')
      && readinessChecklist.indexOf('다시 확인 필요') > readinessChecklist.indexOf('isAcknowledged ? (')
      && readinessChecklist.indexOf('onUnacknowledge(item.id);') > readinessChecklist.indexOf('isAcknowledged ? ('),
  },
  {
    name: 'readiness acknowledgement is session state passed from the page and reset with project/session changes',
    ok: page.includes('const [acknowledgedReadinessCheckIds, setAcknowledgedReadinessCheckIds] = useState<string[]>([]);')
      && page.includes('const handleAcknowledgeReadinessCheck = (checkId: string) => {')
      && page.includes('setAcknowledgedReadinessCheckIds((current) => current.includes(checkId) ? current : [...current, checkId]);')
      && page.includes('setAcknowledgedReadinessCheckIds([]);')
      && page.includes('acknowledgedCheckIds={acknowledgedReadinessCheckIds}')
      && page.includes('onAcknowledge={handleAcknowledgeReadinessCheck}')
      && !page.includes('localStorage.setItem(\'prepro-readiness')
      && !page.includes('localStorage.setItem("prepro-readiness'),
  },
  {
    name: 'readiness unacknowledge removes the item from session state so it can return to top risk',
    ok: page.includes('const handleUnacknowledgeReadinessCheck = (checkId: string) => {')
      && page.includes('setAcknowledgedReadinessCheckIds((current) => current.filter((id) => id !== checkId));')
      && page.includes('onUnacknowledge={handleUnacknowledgeReadinessCheck}')
      && readinessChecklist.includes("!acknowledgedCheckIdSet.has(item.id)")
      && readinessChecklist.indexOf("!acknowledgedCheckIdSet.has(item.id)") > readinessChecklist.indexOf('const topRiskItems = checks')
      && readinessChecklist.indexOf("!acknowledgedCheckIdSet.has(item.id)") < readinessChecklist.indexOf('.slice(0, 3)'),
  },
  {
    name: 'readiness exposes a prominent departure-check mode CTA near progress',
    ok: readinessChecklist.includes('출발 전 확인 시작')
      && readinessChecklist.includes('필드 체크 모드')
      && readinessChecklist.includes('onStartDepartureMode')
      && readinessChecklist.includes('min-h-14')
      && readinessChecklist.includes('text-base font-black')
      && readinessChecklist.includes('bg-white text-black')
      && readinessChecklist.indexOf('출발 전 확인 시작') > readinessChecklist.indexOf('출발 전 확인 {remainingRiskCount}개 남음')
      && readinessChecklist.indexOf('출발 전 확인 시작') < readinessChecklist.indexOf('오늘 먼저 확인'),
  },
  {
    name: 'departure-check mode activation scrolls and focuses a stable checklist anchor',
    ok: page.includes('const departureChecklistAnchorId = \'departure-checklist\';')
      && page.includes('const [isDepartureMode, setIsDepartureMode] = useState(false);')
      && page.includes('const handleStartDepartureMode = () => {')
      && page.includes('setIsDepartureMode(true);')
      && page.includes('document.getElementById(departureChecklistAnchorId)')
      && page.includes("target?.scrollIntoView({ behavior: 'smooth', block: 'start' });")
      && page.includes('target?.focus({ preventScroll: true });')
      && readinessChecklist.includes('id={departureAnchorId}')
      && readinessChecklist.includes('tabIndex={-1}')
      && page.includes('departureAnchorId={departureChecklistAnchorId}')
      && page.includes('isDepartureMode={isDepartureMode}')
      && page.includes('onStartDepartureMode={handleStartDepartureMode}'),
  },
  {
    name: 'departure-check mode makes progress and top risks visually primary on mobile without hiding full actions',
    ok: readinessChecklist.includes('isDepartureMode')
      && readinessChecklist.includes('ring-4 ring-cyan-300/70')
      && readinessChecklist.includes('sm:grid-cols-2')
      && readinessChecklist.includes('md:grid-cols-3')
      && readinessChecklist.includes('text-4xl font-black')
      && readinessChecklist.includes('출발 전 모드')
      && readinessChecklist.includes('현장 출발 직전에는 남은 위험과 우선 조치만 크게 봅니다')
      && readinessChecklist.includes('전체 체크리스트와 데이터 수정 액션은 아래에 그대로 유지됩니다')
      && readinessChecklist.includes('visibleGroups.map((group) =>')
      && readinessChecklist.includes('onClick={() => onAction(item.id)}')
      && readinessChecklist.includes('onAcknowledge(item.id);')
      && readinessChecklist.includes('onUnacknowledge(item.id);')
      && readinessChecklist.indexOf('출발 전 모드') < readinessChecklist.indexOf('오늘 먼저 확인')
      && readinessChecklist.indexOf('오늘 먼저 확인') < readinessChecklist.indexOf('visibleGroups.map((group) =>'),
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
