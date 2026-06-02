# PrePro Studio Workspace Split UX Improvement Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** PrePro Studio를 “기능 많은 단일 화면”에서 `Plan / Shoot / Storyboard / Diagram / Report` 작업공간 구조로 개선해 사용자가 지금 해야 할 일에 집중하게 만든다.

**Architecture:** 당장 실제 하위 도메인으로 물리 분리하지 않고, 먼저 단일 Next 앱 안에서 작업공간 라우트/모드 구조를 만든다. 공통 프로젝트 데이터는 기존 Zustand `useScheduleStore`를 유지하고, 각 작업공간은 같은 데이터를 다른 목적의 화면으로 보여준다. 추후 필요하면 같은 라우트 구조를 `plan.prepro-studio.com`, `shoot.prepro-studio.com` 같은 서브도메인 rewrites로 연결한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, Tailwind CSS, existing PrePro components.

---

## Product Direction

### Core Decision

PrePro는 여러 앱으로 찢는 게 아니라, 하나의 프로젝트를 여러 작업공간에서 다루는 구조로 간다.

```txt
PrePro Studio
├─ Hub        프로젝트 홈 / 빠른 시작
├─ Plan       기획서 / 브리프 / 대본 분석 / 루틴 프리셋
├─ Shoot      촬영표 / 큐시트 / 장소 / 인원 / 콜시트 / 날씨
├─ Storyboard 콘티 / 샷 / 앵글 / 레퍼런스
├─ Diagram    조명도 / 카메라 배치 / 평면도
└─ Report     마무리 / 납품 / 결과 리포트
```

### User Promise

- 처음 들어온 사람은 “어디서 시작하지?”가 아니라 “지금 할 일 하나”를 고른다.
- 현장에서는 `Shoot`만 열어도 충분해야 한다.
- 콘티/조명도처럼 무거운 시각 기능은 별도 작업공간으로 빠져 본체를 복잡하게 만들지 않는다.
- 기존 JSON 백업/복원과 샘플 데이터는 유지한다.

### Not Doing Yet

- 실제 멀티앱/서브도메인 분리
- 로그인/팀 협업/서버 DB
- Diagram의 풀 캔버스 구현
- AI 필수화

---

## Current Code Observations

- Main page: `src/app/page.tsx`
  - 현재 `activeTab: MainWorkspaceTab` 하나로 planning/schedule/cueSheet/locations/people/budget/storyboard/report를 모두 전환한다.
  - `page.tsx`가 planning definition, schedule filters, modals, import/export, storyboard, report 계산을 모두 들고 있어 점점 거대해지고 있다.
- Header: `src/components/header/AppHeader.tsx`
  - 상단 단계 네비게이션과 날씨/프로젝트 액션이 섞여 있다.
- Existing panels:
  - `src/components/sections/planning/PlanningPanel.tsx`
  - `src/components/sections/schedule/*`
  - `src/components/sections/CueSheetPanel.tsx`
  - `src/components/sections/LocationsPanel.tsx`
  - `src/components/sections/PeoplePanel.tsx`
  - `src/components/sections/BudgetPanel.tsx`
  - `src/components/sections/StoryboardPanel.tsx`
  - `src/components/sections/ReportPanel.tsx`
- New checkpoint already saved:
  - `docs/plans/2026-06-02-lighting-diagram-feature-checkpoint.md`

---

## Target UX IA

### `/` — Hub

Purpose: 프로젝트 홈, 처음 시작, 최근/샘플/복원.

Visible blocks:

1. Current project summary
   - 프로젝트명/유형/촬영일/위치/샘플 여부
2. Primary next action
   - `기획부터 정리하기`
   - `촬영표 만들기`
   - `콘티/샷 보기`
   - `조명도 만들기`는 later/disabled teaser
3. Workspace cards
   - Plan, Shoot, Storyboard, Diagram, Report
4. Backup actions
   - JSON 복원/내보내기
   - 공유

### `/plan` — Plan Workspace

Purpose: 기획/브리프/대본 분석/루틴 프리셋.

Keep here:

- PlanningPanel
- ScriptAnalyzer modal trigger
- AI-free routine presets
- Planning AI settings, but secondary
- 기획서 완성도 체크

Remove from here:

- Full schedule table
- Full storyboard gallery
- Report mode

### `/shoot` — Shoot Workspace

Purpose: 현장 운영. 가장 모바일 중요.

Keep here:

- Shoot date/day selector
- Schedule setup
- Schedule list/table
- Cue sheet summary or nested tab
- LocationsPanel
- PeoplePanel
- Weather/date/location control
- Call-sheet oriented export header

UX rule:

- 모바일에서는 “오늘 다음 할 일 / 현재 촬영표 / 날씨·장소”가 위에 보여야 한다.
- 장소/인원/예산은 full 탭보다 collapsible operational drawers가 낫다.

### `/storyboard` — Storyboard Workspace

Purpose: 샷/콘티/레퍼런스 탐색과 연결.

Keep here:

- StoryboardPanel
- StoryboardGalleryModal
- shot filters
- shot-to-scene connection controls

Add later:

- View modes: grid / sequence / mobile cards
- “이 샷을 촬영표에 추가” flow

### `/diagram` — Diagram Workspace

Purpose: 조명도/카메라 배치/평면도.

Phase 1 state:

- Coming soon / reference-backed planning screen only
- Link to checkpoint and future canvas concept
- From scene/location cards, show disabled or simple `조명도 준비중` affordance

Phase 2 later:

- SVG canvas builder
- objects: wall/window/door/furniture/person/camera/light/modifier/label
- PNG/SVG export

### `/report` — Report Workspace

Purpose: 마무리/납품/결과 정리.

Keep here:

- ReportPanel
- deliverables checklist
- final export/share summary

Copy rule:

- Use `마무리`, `결과 리포트`, `납품`, `후반 정리`.
- Do not use `정산` unless money/accounting feature.

---

## Implementation Strategy

Do not rewrite all at once. First make the product feel split while keeping data and most components intact.

### Phase 0: Safety and Baseline

**Objective:** Make sure current dirty changes and baseline checks are known before refactor.

**Files:**
- No code changes unless checks require a fix.

**Steps:**

1. Run `git status --short`.
2. Keep current uncommitted Kakao/lighting checkpoint changes separate from workspace split work.
3. Run:
   ```bash
   npm run lint
   npm run build
   ```
4. Open `http://localhost:3000` and check console errors.
5. If baseline fails, fix baseline before workspace split.

**Verification:**

- lint passes
- build passes
- no browser JS errors on root

---

### Phase 1: Define Workspace Model

**Objective:** Create one source of truth for workspace IDs, labels, paths, and intent.

**Files:**
- Create: `src/lib/workspaces.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/header/AppHeader.tsx`

**Implementation:**

Create:

```ts
export type PreProWorkspaceId = 'hub' | 'plan' | 'shoot' | 'storyboard' | 'diagram' | 'report';

export type PreProWorkspace = {
  id: PreProWorkspaceId;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  mobilePriority: 'high' | 'medium' | 'low';
};

export const preproWorkspaces: PreProWorkspace[] = [
  { id: 'hub', label: '홈', shortLabel: 'Home', path: '/', description: '프로젝트 시작과 최근 작업', mobilePriority: 'high' },
  { id: 'plan', label: '기획', shortLabel: 'Plan', path: '/plan', description: '브리프, 대본, 루틴 프리셋', mobilePriority: 'medium' },
  { id: 'shoot', label: '촬영', shortLabel: 'Shoot', path: '/shoot', description: '촬영표, 큐시트, 장소, 인원', mobilePriority: 'high' },
  { id: 'storyboard', label: '콘티', shortLabel: 'Shot', path: '/storyboard', description: '샷, 앵글, 레퍼런스', mobilePriority: 'medium' },
  { id: 'diagram', label: '조명도', shortLabel: 'Diagram', path: '/diagram', description: '조명, 카메라, 평면도', mobilePriority: 'low' },
  { id: 'report', label: '마무리', shortLabel: 'Report', path: '/report', description: '결과 리포트와 납품 정리', mobilePriority: 'medium' },
];

export const getWorkspaceById = (id: PreProWorkspaceId) => preproWorkspaces.find((workspace) => workspace.id === id);
```

**Steps:**

1. Add the model file.
2. Import it into header/page only where needed.
3. Do not change visual behavior yet.

**Verification:**

```bash
npm run lint
npm run build
```

Expected: pass.

---

### Phase 2: Add Workspace Shell Navigation

**Objective:** Add a global workspace switcher that makes the product feel like separate modules without changing routes yet.

**Files:**
- Create: `src/components/layout/WorkspaceShellNav.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/header/AppHeader.tsx` if needed

**UX:**

Desktop:

```txt
PrePro Studio
Home | Plan | Shoot | Storyboard | Diagram | Report
```

Mobile:

```txt
[Plan] [Shoot] [Shot] [Diagram] [Report]
```

Current route/tab highlighted.

**Implementation approach:**

- Initially use button state, not Next links, because current app is single-page stateful.
- Map workspace to existing `activeTab` groups:
  - hub -> first-run/project summary area
  - plan -> planning
  - shoot -> schedule or cueSheet/locations/people/budget sub-tabs
  - storyboard -> storyboard
  - diagram -> placeholder
  - report -> report

**Verification:**

- Browser root shows workspace nav.
- Clicking Plan shows planning area.
- Clicking Shoot shows schedule area.
- Clicking Storyboard shows storyboard area.
- Clicking Report shows report area.
- Diagram shows placeholder, no crash.

---

### Phase 3: Refactor Main Workspace State

**Objective:** Separate “workspace” from “subtab”. Current `activeTab` mixes broad workspaces and internal tabs.

**Files:**
- Modify: `src/app/page.tsx`
- Possibly modify: `src/components/header/AppHeader.tsx`

**Current:**

```ts
type MainWorkspaceTab = 'planning' | 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';
```

**Target:**

```ts
type WorkspaceId = 'hub' | 'plan' | 'shoot' | 'storyboard' | 'diagram' | 'report';
type ShootSubtab = 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget';
type PlanSubtab = 'brief' | 'details' | 'ai';
```

**Rules:**

- `workspace` controls major screen.
- `shootSubtab` controls schedule/cueSheet/locations/people/budget inside Shoot.
- `planningWorkspaceTab` can remain for Plan internals.
- Existing localStorage key `prepro-active-tab` should migrate gracefully.

**Migration function:**

```ts
const migrateLegacyActiveTabToWorkspace = (tab?: string): { workspace: WorkspaceId; shootSubtab?: ShootSubtab } => {
  if (tab === 'planning') return { workspace: 'plan' };
  if (tab === 'storyboard') return { workspace: 'storyboard' };
  if (tab === 'report') return { workspace: 'report' };
  if (['schedule', 'cueSheet', 'locations', 'people', 'budget'].includes(tab || '')) {
    return { workspace: 'shoot', shootSubtab: tab as ShootSubtab };
  }
  return { workspace: 'hub' };
};
```

**Verification:**

- Old saved activeTab still opens reasonable workspace.
- No loss of project data.
- `npm run build` passes.

---

### Phase 4: Build Hub Screen

**Objective:** Root screen becomes a clear project hub instead of dense all-in-one onboarding.

**Files:**
- Create: `src/components/workspaces/HubWorkspace.tsx`
- Modify: `src/app/page.tsx`
- Reuse: existing onboarding cards if useful

**Hub content:**

1. Project status card
   - project type
   - scene count
   - location count
   - people count
   - storyboard count
2. Recommended next action
   - If no planning: Plan
   - If planning but no scenes: Shoot / 대본 분석
   - If scenes exist but no storyboard: Storyboard
   - If ready: Report
3. Workspace cards
4. Backup/import/export compact row

**Acceptance criteria:**

- First screen no longer looks like every feature is competing.
- User can answer: “지금 어디로 가야 하지?” within 3 seconds.

**Verification:**

- Browser desktop root.
- Browser mobile width root.
- Console no errors.

---

### Phase 5: Build Shoot Workspace Layout

**Objective:** Make Shoot the field-ready home for schedule/call-sheet usage.

**Files:**
- Create: `src/components/workspaces/ShootWorkspace.tsx`
- Move or compose existing schedule components from `page.tsx`
- Modify: `src/app/page.tsx`

**Layout:**

Desktop:

```txt
[Today / Day selector / Weather]
[Subtabs: 촬영표 | 큐시트 | 장소 | 인원 | 예산]
[Main selected panel]
```

Mobile:

```txt
[Current next item]
[Date / Weather compact]
[촬영표 cards]
[Drawers: 큐시트 / 장소 / 인원]
```

**Important:**

- Do not move store logic yet if it causes large refactor.
- First pass can wrap existing rendered blocks conditionally.
- Keep current schedule controls and export header.

**Verification:**

- `/` or workspace nav Shoot shows same schedule data as before.
- Mobile schedule still visible quickly.
- Location modal still opens.
- Kakao search remains wired.

---

### Phase 6: Build Plan Workspace Layout

**Objective:** Make Plan feel like a focused planning desk.

**Files:**
- Create: `src/components/workspaces/PlanWorkspace.tsx`
- Modify: `src/app/page.tsx`

**Layout:**

- Top: brief completion summary
- Main: PlanningPanel
- Secondary: routine presets / script analyzer / AI helper

**Rules:**

- AI is optional and secondary.
- Offline templates/routines remain primary.
- Avoid showing shoot table here.

**Verification:**

- Planning values edit and persist.
- Script analyzer still opens.
- Routine preset apply still works.

---

### Phase 7: Storyboard Workspace Isolation

**Objective:** Move storyboard into a focused visual workspace.

**Files:**
- Create: `src/components/workspaces/StoryboardWorkspace.tsx`
- Modify: `src/app/page.tsx`

**Layout:**

- Top: filter/search/shot count
- Main: StoryboardPanel
- Optional: selected scene/shot connection context

**Verification:**

- Existing 222 storyboard references still render.
- Filters work.
- Gallery modal still opens.

---

### Phase 8: Diagram Placeholder Workspace

**Objective:** Add a clear entry point for future lighting diagram without implementing canvas yet.

**Files:**
- Create: `src/components/workspaces/DiagramWorkspace.tsx`
- Modify: `src/app/page.tsx`

**Content:**

- Title: `조명도 / 카메라 배치`
- Explain current plan:
  - 장면 스틸 + 탑뷰 조명도
  - 카메라/인물/조명/가구 배치
  - PNG/SVG export 예정
- Show 3 quick template cards:
  - 1인 인터뷰
  - 카페/식당 테이블
  - 제품 테이블탑
- Link/reference to saved plan doc only in dev copy, not user-facing absolute path.

**Verification:**

- Diagram workspace does not feel like broken empty page.
- No local absolute paths in rendered UI.

---

### Phase 9: Report Workspace Isolation

**Objective:** Make final stage a clean 마무리/납품 workspace.

**Files:**
- Create: `src/components/workspaces/ReportWorkspace.tsx`
- Modify: `src/app/page.tsx`

**Copy:**

- Use `마무리`, `결과 리포트`, `납품 정리`.
- Avoid `정산`.

**Verification:**

- ReportPanel renders same data.
- Export/share controls still reachable.

---

### Phase 10: Add Real Routes

**Objective:** Convert workspace state into URL-addressable routes after shell works.

**Files:**
- Create route pages:
  - `src/app/plan/page.tsx`
  - `src/app/shoot/page.tsx`
  - `src/app/storyboard/page.tsx`
  - `src/app/diagram/page.tsx`
  - `src/app/report/page.tsx`
- Create shared client entry:
  - `src/components/PreProApp.tsx` or `src/app/PreProClientApp.tsx`
- Modify root:
  - `src/app/page.tsx`

**Approach:**

Because most app state is client-side Zustand/localStorage, route pages can render the same client app with an initial workspace prop.

```tsx
export default function ShootPage() {
  return <PreProClientApp initialWorkspace="shoot" />;
}
```

**Important Next.js 16 note:**

Read local Next docs before writing route-specific code because repo AGENTS says this Next version has breaking changes.

**Verification:**

- `/plan`, `/shoot`, `/storyboard`, `/diagram`, `/report` load directly.
- Refreshing each route preserves data from localStorage.
- Workspace nav uses links once route stable.

---

### Phase 11: Optional Subdomain Mapping

**Objective:** Only after route split works, map subdomains if wanted.

**Possible mappings:**

```txt
plan.prepro-studio.com       -> /plan
shoot.prepro-studio.com      -> /shoot
storyboard.prepro-studio.com -> /storyboard
diagram.prepro-studio.com    -> /diagram
report.prepro-studio.com     -> /report
```

**Vercel options:**

- Add domains/subdomains in Vercel project.
- Use middleware or rewrites based on host.
- Keep canonical app paths for fallback.

**Do not do this before:**

- Route pages work.
- Project data loads correctly on refresh.
- Mobile QA passes.

---

## Verification Gates

Run after each phase that changes code:

```bash
npm run lint
npm run build
git diff --check
```

Browser smoke tests:

1. Desktop root
2. Mobile root
3. Plan workspace
4. Shoot workspace
5. Storyboard workspace
6. Diagram placeholder
7. Report workspace
8. Location modal + Kakao search fallback
9. JSON export/import still works

Existing focused checks worth preserving:

```bash
npm run check:storyboards
npm run check:report-ux
npm run check:first-success-loop
npm run check:backup-restore
```

Full final gate:

```bash
npm run release:check
```

---

## Suggested Commit Batches

### Commit 1

```bash
git add docs/plans/2026-06-02-workspace-split-ux-improvement-plan.md
git commit -m "docs: plan PrePro workspace split UX"
```

### Commit 2

Workspace model only.

```bash
git add src/lib/workspaces.ts
git commit -m "feat: define PrePro workspace model"
```

### Commit 3

Shell nav and state mapping.

```bash
git add src/components/layout/WorkspaceShellNav.tsx src/app/page.tsx src/components/header/AppHeader.tsx
git commit -m "feat: add PrePro workspace shell navigation"
```

### Commit 4

Hub workspace.

```bash
git add src/components/workspaces/HubWorkspace.tsx src/app/page.tsx
git commit -m "feat: add project hub workspace"
```

### Commit 5

Shoot workspace focus.

```bash
git add src/components/workspaces/ShootWorkspace.tsx src/app/page.tsx
git commit -m "feat: focus shoot workspace layout"
```

Continue similarly for Plan, Storyboard, Diagram, Report, routes.

---

## Risks and Mitigations

### Risk: `page.tsx` refactor becomes too large

Mitigation:

- First wrap existing render blocks; do not extract every hook/calculation at once.
- Move one workspace at a time.

### Risk: Route split breaks localStorage/state hydration

Mitigation:

- Keep one shared client component.
- Route pages only pass `initialWorkspace`.
- Test direct refresh on every route.

### Risk: User gets more navigation complexity, not less

Mitigation:

- Hub recommends next action.
- Keep Shoot as primary field workspace.
- Hide secondary workspaces on mobile behind compact nav if needed.

### Risk: Diagram distracts before core is stable

Mitigation:

- Placeholder only until Plan/Shoot/Storyboard/Report split is usable.
- Do not implement canvas in this plan.

---

## Immediate Next Batch Recommendation

1. Finish/commit current Kakao place search change separately.
2. Commit this workspace split plan.
3. Implement Phase 1 + Phase 2 only.
4. Browser-verify that the app feels like separate workspaces without deep refactor.
5. Then decide whether to proceed to Hub/Shoot extraction.

This keeps the first improvement visible but low-risk.
