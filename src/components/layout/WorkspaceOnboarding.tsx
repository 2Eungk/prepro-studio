import type { TemplateType } from '@/types/schedule';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Calendar as CalendarIcon, ShieldCheck, Sparkles } from 'lucide-react';

type MainWorkspaceTab = 'planning' | 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';

type WorkspaceLanguage = {
  firstRunDetail: string;
  firstRunSteps: Array<{ label: string; detail: string }>;
  firstRunTitle: string;
  flowHint: string;
  flowPath: string[];
};

type PrimaryAction = {
  id: string;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
};

type QuickStartProjectCard = {
  template: TemplateType;
  title: string;
  subtitle: string;
  detail: string;
  metric: string;
  Icon: LucideIcon;
};

type GettingStartedCard = {
  label: string;
  detail: string;
  Icon: LucideIcon;
  action: () => void;
  tone: string;
};

export function WorkspaceFlowBar({
  activeTab,
  currentLabel,
  nextFlowTarget,
  primaryAction,
  workspaceLanguage,
  onPrimaryAction,
  onToggleProjectSetup,
}: {
  activeTab: MainWorkspaceTab;
  currentLabel?: string;
  nextFlowTarget: string;
  primaryAction?: PrimaryAction;
  workspaceLanguage: WorkspaceLanguage;
  onPrimaryAction: (actionId: string) => void;
  onToggleProjectSetup: () => void;
}) {
  const PrimaryQuickActionIcon = primaryAction?.Icon;
  const flowTabOrder: MainWorkspaceTab[] = ['planning', 'locations', 'people', 'schedule', 'cueSheet', 'storyboard', 'report'];

  return (
    <section className="rounded-2xl border border-neutral-900 bg-neutral-950/75 p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-200">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-neutral-200">
              <span>현재: {currentLabel || '작업'}</span>
              <ArrowRight className="h-3 w-3 text-neutral-700" />
              <span className="text-teal-200">다음: {nextFlowTarget}</span>
            </div>
            <p className="mt-1 text-[11px] font-bold text-neutral-600">
              {workspaceLanguage.flowHint}
            </p>
            <div className="mt-2 hidden flex-wrap items-center gap-1.5 sm:flex">
              {workspaceLanguage.flowPath.map((step, index) => {
                const isFlowStepActive = flowTabOrder[index] === activeTab;

                return (
                  <span key={`${step}-${index}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${
                    isFlowStepActive
                      ? 'border-teal-400/30 bg-teal-400/10 text-teal-100'
                      : 'border-neutral-900 bg-black/40 text-neutral-600'
                  }`}>
                    {index > 0 && <ArrowRight className="h-2.5 w-2.5 text-neutral-700" />}
                    {step}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap lg:justify-end">
          {primaryAction && (
            <button
              type="button"
              onClick={() => onPrimaryAction(primaryAction.id)}
              disabled={primaryAction.disabled}
              className="prepro-btn prepro-btn--primary"
            >
              {PrimaryQuickActionIcon && <PrimaryQuickActionIcon className="h-3.5 w-3.5" />}
              {primaryAction.label}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleProjectSetup}
            className="prepro-btn prepro-btn--secondary"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            날짜/날씨
          </button>
        </div>
      </div>
    </section>
  );
}

export function FirstRunPanel({
  addItemLabel,
  cards,
  currentTemplate,
  gettingStartedCards,
  workspaceLanguage,
  onLoadTemplateSampleData,
}: {
  addItemLabel: string;
  cards: QuickStartProjectCard[];
  currentTemplate: TemplateType;
  gettingStartedCards: GettingStartedCard[];
  workspaceLanguage: WorkspaceLanguage;
  onLoadTemplateSampleData: (template: TemplateType) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/90">
      <div className="grid gap-0 lg:grid-cols-[minmax(300px,0.55fr)_minmax(560px,1.45fr)]">
        <div className="border-b border-neutral-900 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),linear-gradient(135deg,rgba(245,158,11,0.08),transparent_42%)] p-5 lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
            <Sparkles className="h-3 w-3" />
            1분 시작
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight text-white">{workspaceLanguage.firstRunTitle}</h2>
          <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-neutral-500">
            {workspaceLanguage.firstRunDetail}
          </p>
          <div className="mt-5 space-y-2">
            {workspaceLanguage.firstRunSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-black/45 px-3 py-2.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-teal-300" />
                <div className="min-w-0">
                  <div className="text-xs font-black text-neutral-200">{step.label}</div>
                  <div className="mt-0.5 truncate text-[10px] font-bold text-neutral-600">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-neutral-800/80 bg-black/45 px-4 py-3 text-xs font-bold leading-relaxed text-neutral-500">
            첫 화면에서는 하나만 고르면 됩니다. 선택한 작업 위치로 바로 이동하고, 첫 {addItemLabel}이 생기면 이 패널은 자동으로 사라집니다.
          </div>
        </div>
        <div className="p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Start Here</span>
              <div className="mt-1 text-lg font-black text-neutral-100">지금 하려는 작업을 고르세요</div>
            </div>
            <span className="text-[10px] font-bold text-neutral-700">선택하면 필요한 위치로 바로 이동합니다</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {gettingStartedCards.map((item) => {
              const Icon = item.Icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`prepro-action-card group rounded-xl border p-4 text-left transition-all ${item.tone === 'primary' ? 'is-primary text-neutral-100' : 'text-neutral-300'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                      item.tone === 'primary'
                        ? 'border-teal-300/30 bg-teal-300/10 text-teal-200'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 group-hover:text-neutral-200'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-700 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-300" />
                  </div>
                  <div className="mt-4 text-sm font-black text-white">{item.label}</div>
                  <p className="mt-1 min-h-10 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl border border-neutral-900 bg-black/35 p-3">
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">샘플 프로젝트</span>
                <div className="mt-1 text-xs font-black text-neutral-300">감 잡기용 예시는 여기서만 선택</div>
              </div>
              <span className="text-[10px] font-bold text-neutral-700">기획서와 현장표까지 같이 바뀝니다</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {cards.map((item) => {
                const Icon = item.Icon;
                const selected = currentTemplate === item.template;

                return (
                  <button
                    key={item.template}
                    type="button"
                    onClick={() => onLoadTemplateSampleData(item.template)}
                    className={`group min-h-16 rounded-xl border px-3 py-2 text-left transition-all ${
                      selected
                        ? 'border-teal-300/40 bg-teal-300/10 text-teal-50'
                        : 'border-neutral-900 bg-neutral-950/70 text-neutral-500 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="rounded bg-black/40 px-1.5 py-0.5 text-[8px] font-black text-neutral-500">{item.metric}</span>
                    </div>
                    <div className="mt-2 truncate text-xs font-black">{item.title}</div>
                    <div className="mt-0.5 truncate text-[9px] font-bold text-neutral-600">{item.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
