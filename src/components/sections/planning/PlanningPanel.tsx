'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { PlanningDocument, TemplateType } from '@/types/schedule';
import { Database, FileText, Wand2, type LucideIcon } from 'lucide-react';
import PlanningAiPanel, { type PlanningAiSettings } from './PlanningAiPanel';
import PlanningBriefPanel, {
  type PlanningCheckItem,
  type PlanningWorkspaceTab,
  type ShortFilmReadinessItem,
  type ShortFilmReadinessSummary,
} from './PlanningBriefPanel';
import PlanningDetailsPanel, { type PlanningSectionDefinition } from './PlanningDetailsPanel';

type PlanningApiGuideItem = {
  provider: string;
  url: string;
  note: string;
  actionLabel?: string;
};

type PlanningPanelProps = {
  activeWorkspaceTab: PlanningWorkspaceTab;
  aiDraftReady: boolean;
  guideItems: PlanningApiGuideItem[];
  isPlanningAiRunning: boolean;
  isPlanningAiTesting: boolean;
  isShortFilmMode: boolean;
  planning: PlanningDocument;
  planningAiSettings: PlanningAiSettings;
  planningAiStatus: string;
  planningCheckItems: PlanningCheckItem[];
  planningCompletedChecks: number;
  planningCompletion: number;
  planningFoundations: string[];
  planningPendingChecks: number;
  planningPlaybook: string[];
  planningProjectLabel: string;
  planningProjectFormatLabel: string;
  planningQualityScore: number;
  planningScaleLabel: string;
  planningScheduleLabel: string;
  planningScheduleLines: string[];
  sections: PlanningSectionDefinition[];
  shortFilmReadinessChecks: ShortFilmReadinessItem[];
  shortFilmReadinessSummary: ShortFilmReadinessSummary;
  template: TemplateType;
  templateLabel: string;
  getPlanningFieldValue: (sectionId: string, fieldId: string) => string;
  onChangePlanning: (values: Partial<PlanningDocument>) => void;
  onClearApiKey: () => void;
  onCopyPrompt: () => void;
  onFocusAnchor: (tab: PlanningWorkspaceTab, anchorId: string) => void;
  onGenerateAi: () => void;
  onPlanningToSchedule: () => void;
  onResetPlanning: () => void;
  onSetAiSettings: Dispatch<SetStateAction<PlanningAiSettings>>;
  onSetWorkspaceTab: (tab: PlanningWorkspaceTab) => void;
  onTestConnection: () => void;
  onUpdatePlanningField: (sectionId: string, fieldId: string, value: string) => void;
};

export default function PlanningPanel({
  activeWorkspaceTab,
  aiDraftReady,
  guideItems,
  isPlanningAiRunning,
  isPlanningAiTesting,
  isShortFilmMode,
  planning,
  planningAiSettings,
  planningAiStatus,
  planningCheckItems,
  planningCompletedChecks,
  planningCompletion,
  planningFoundations,
  planningPendingChecks,
  planningPlaybook,
  planningProjectLabel,
  planningProjectFormatLabel,
  planningQualityScore,
  planningScaleLabel,
  planningScheduleLabel,
  planningScheduleLines,
  sections,
  shortFilmReadinessChecks,
  shortFilmReadinessSummary,
  template,
  templateLabel,
  getPlanningFieldValue,
  onChangePlanning,
  onClearApiKey,
  onCopyPrompt,
  onFocusAnchor,
  onGenerateAi,
  onPlanningToSchedule,
  onResetPlanning,
  onSetAiSettings,
  onSetWorkspaceTab,
  onTestConnection,
  onUpdatePlanningField,
}: PlanningPanelProps) {
  const workspaceTabs: Array<{ id: PlanningWorkspaceTab; label: string; caption: string; metric: string; Icon: LucideIcon }> = [
    { id: 'brief', label: '1. 브리프', caption: '무엇을 왜 만드는지', metric: `${planningCompletion}%`, Icon: FileText },
    { id: 'details', label: '2. 제작 설계', caption: '씬, 컷, 장소, 리스크', metric: `${sections.length}섹션`, Icon: Database },
    { id: 'ai', label: '3. AI/API', caption: '선택 사용: 정리, 보완, 스케줄화', metric: aiDraftReady ? '완료' : '선택', Icon: Wand2 },
  ];

  const workflowSteps = [
    { label: '무료 작성', detail: '가입 없이 브리프와 상세 설계를 직접 작성합니다.', status: '항상 가능' },
    { label: 'BYOK 연결', detail: '사용자 API 키를 넣으면 앱 안에서 기획을 정리합니다.', status: '선택 기능' },
    { label: 'AI 자동 정리', detail: '기획서 초안, 누락 보완, 스케줄 후보를 내부 화면에서 생성합니다.', status: '앱 내 처리' },
    { label: '스케줄 변환', detail: '씬/식순/컷 리스트를 촬영표 초안으로 넘깁니다.', status: '작성 후 가능' },
  ];

  const metricCards = [
    { label: '기획 완성도', value: `${planningCompletion}%`, tone: 'text-indigo-300' },
    { label: '분야', value: planningProjectLabel, tone: 'text-white' },
    { label: '제작 규모', value: planningScaleLabel, tone: 'text-amber-200' },
    { label: '프로 체크', value: `${planningQualityScore}%`, tone: 'text-green-300' },
    { label: '스케줄 후보', value: `${planningScheduleLines.length}개`, tone: 'text-cyan-300' },
    { label: 'AI 정리', value: aiDraftReady ? '완료' : '대기', tone: aiDraftReady ? 'text-green-300' : 'text-neutral-400' },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">{item.label}</div>
            <div className={`mt-3 text-2xl font-black ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex overflow-x-auto rounded-2xl border border-neutral-900 bg-neutral-950/70 p-1 custom-scrollbar">
        {workspaceTabs.map((item) => {
          const isActive = activeWorkspaceTab === item.id;
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              onClick={() => onSetWorkspaceTab(item.id)}
              className={`min-w-[220px] flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-indigo-500/70 bg-indigo-600 text-white shadow-xl shadow-indigo-500/15'
                  : 'border-transparent text-neutral-500 hover:border-neutral-800 hover:bg-neutral-900 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isActive ? 'bg-white/15 text-white' : 'bg-black text-neutral-500'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className={`mt-0.5 block text-[10px] font-bold ${isActive ? 'text-indigo-100/70' : 'text-neutral-600'}`}>{item.caption}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-black ${isActive ? 'text-indigo-100' : 'text-neutral-600'}`}>{item.metric}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 rounded-2xl border border-neutral-900 bg-neutral-950/60 p-3 md:grid-cols-4">
        {workflowSteps.map((item, index) => (
          <div key={item.label} className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-black/35 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-black text-neutral-300">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-black text-neutral-100">{item.label}</div>
                <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-[9px] font-black text-neutral-500">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {activeWorkspaceTab === 'brief' && (
        <PlanningBriefPanel
          isShortFilmMode={isShortFilmMode}
          planning={planning}
          planningCheckItems={planningCheckItems}
          planningCompletedChecks={planningCompletedChecks}
          planningFoundations={planningFoundations}
          planningPendingChecks={planningPendingChecks}
          planningPlaybook={planningPlaybook}
          planningProjectFormatLabel={planningProjectFormatLabel}
          planningScaleLabel={planningScaleLabel}
          shortFilmReadinessChecks={shortFilmReadinessChecks}
          shortFilmReadinessSummary={shortFilmReadinessSummary}
          template={template}
          onFocusAnchor={onFocusAnchor}
          onResetPlanning={onResetPlanning}
          onSetWorkspaceTab={onSetWorkspaceTab}
          onUpdatePlanning={onChangePlanning}
        />
      )}

      {activeWorkspaceTab === 'details' && (
        <PlanningDetailsPanel
          sections={sections}
          templateLabel={templateLabel}
          getFieldValue={getPlanningFieldValue}
          onSetWorkspaceTab={onSetWorkspaceTab}
          onUpdateField={onUpdatePlanningField}
        />
      )}

      {activeWorkspaceTab === 'ai' && (
        <PlanningAiPanel
          guideItems={guideItems}
          isPlanningAiRunning={isPlanningAiRunning}
          isPlanningAiTesting={isPlanningAiTesting}
          planning={planning}
          planningAiSettings={planningAiSettings}
          planningAiStatus={planningAiStatus}
          planningScheduleLabel={planningScheduleLabel}
          planningScheduleLines={planningScheduleLines}
          onChangePlanning={onChangePlanning}
          onClearApiKey={onClearApiKey}
          onCopyPrompt={onCopyPrompt}
          onGenerateAi={onGenerateAi}
          onPlanningToSchedule={onPlanningToSchedule}
          onSetAiSettings={onSetAiSettings}
          onTestConnection={onTestConnection}
        />
      )}
    </section>
  );
}
