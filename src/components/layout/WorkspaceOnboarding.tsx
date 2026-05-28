import type { TemplateType } from '@/types/schedule';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';

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
  detail?: string;
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
    <section className="rounded-2xl border border-neutral-900 bg-neutral-950/75 p-2.5 md:p-3">
      <div className="grid gap-2 md:gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-200 md:h-10 md:w-10">
            <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-neutral-200 md:gap-2 md:text-xs">
              <span>현재: {currentLabel || '작업'}</span>
              <ArrowRight className="h-3 w-3 text-neutral-700" />
              <span className="text-teal-200">다음: {nextFlowTarget}</span>
            </div>
            <p className="mt-1 hidden text-[11px] font-bold text-neutral-600 sm:block">
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:shrink-0 sm:flex-wrap lg:justify-end">
          {primaryAction && (
            <button
              type="button"
              onClick={() => onPrimaryAction(primaryAction.id)}
              disabled={primaryAction.disabled}
              className="group flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-2xl border border-teal-300/35 bg-teal-300 px-3 py-2 text-left text-black shadow-lg shadow-teal-950/20 transition-all hover:bg-teal-200 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600 disabled:shadow-none sm:min-h-16 sm:min-w-[220px] sm:gap-3 sm:px-4 sm:py-3"
            >
              <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/10 text-black group-disabled:bg-black/20 group-disabled:text-neutral-600 sm:h-10 sm:w-10">
                  {PrimaryQuickActionIcon && <PrimaryQuickActionIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-black uppercase tracking-[0.16em] opacity-70 sm:text-[10px]">다음 할 일</span>
                  <span className="mt-0.5 block truncate text-xs font-black sm:text-sm">{primaryAction.label}</span>
                  {primaryAction.detail && <span className="mt-0.5 hidden truncate text-[10px] font-bold opacity-70 sm:block">{primaryAction.detail}</span>}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onToggleProjectSetup}
            className="prepro-btn prepro-btn--secondary min-h-12 shrink-0 px-3"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">날짜/날씨</span>
            <span className="sm:hidden">날씨</span>
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
  onSelectTemplate,
}: {
  addItemLabel: string;
  cards: QuickStartProjectCard[];
  currentTemplate: TemplateType;
  gettingStartedCards: GettingStartedCard[];
  workspaceLanguage: WorkspaceLanguage;
  onSelectTemplate: (template: TemplateType) => void;
}) {
  const currentTemplateCard = cards.find((item) => item.template === currentTemplate);
  const [step, setStep] = useState<1 | 2>(1);
  const [isDismissed, setIsDismissed] = useState(false);
  const actionChoices: GettingStartedCard[] = gettingStartedCards;

  if (isDismissed) return null;

  const moveToAction = (item: GettingStartedCard) => {
    setIsDismissed(true);
    requestAnimationFrame(() => item.action());
  };

  return (
    <div className="scroll-mt-24">
      <section
        role="region"
        aria-labelledby="first-run-title"
        className="overflow-hidden rounded-2xl border border-teal-300/25 bg-neutral-950 shadow-2xl shadow-teal-950/25"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-900 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_32%),linear-gradient(135deg,rgba(242,161,75,0.08),transparent_44%)] p-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
              <Sparkles className="h-3 w-3" />
              첫 시작 설정
            </div>
            <h2 id="first-run-title" className="mt-3 text-2xl font-black leading-tight text-white">
              {workspaceLanguage.firstRunTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-neutral-500">
              {workspaceLanguage.firstRunDetail} 선택이 끝나면 필요한 화면이 열리고, 첫 {addItemLabel}이 생기면 이 안내는 사라집니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-black/50 text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-200"
            aria-label="시작 안내 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-900 px-5 py-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 1, label: '제작 분야' },
              { id: 2, label: '자료 상태' },
            ].map((item) => {
              const isActive = step === item.id;
              const isDone = step > item.id;

              return (
                <div key={item.id} className={`rounded-xl border px-3 py-2 ${
                  isActive
                    ? 'border-teal-300/35 bg-teal-300/10 text-teal-50'
                    : isDone
                      ? 'border-teal-400/20 bg-teal-400/5 text-teal-200'
                      : 'border-neutral-900 bg-black/35 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : <span>{item.id}</span>}
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5">
          {step === 1 && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Step 1</span>
                <h3 className="mt-1 text-xl font-black text-white">어떤 제작물인가요?</h3>
                <p className="mt-1 text-sm font-bold text-neutral-600">여기서 고른 분야에 맞춰 컬럼, 예시, 콘티 흐름이 바뀝니다.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {cards.map((item) => {
                  const Icon = item.Icon;
                  const selected = currentTemplate === item.template;

                  return (
                    <button
                      key={item.template}
                      type="button"
                      onClick={() => {
                        onSelectTemplate(item.template);
                        setStep(2);
                      }}
                      className={`group min-h-32 rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-teal-300/45 bg-teal-300/10 text-teal-50'
                          : 'border-neutral-800 bg-black/45 text-neutral-400 hover:border-teal-400/30 hover:bg-teal-400/5 hover:text-neutral-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="rounded-full border border-neutral-800 px-2 py-1 text-[9px] font-black text-neutral-500">{item.metric}</span>
                      </div>
                      <div className="mt-4 text-base font-black">{item.title}</div>
                      <div className="mt-1 text-xs font-bold text-neutral-600">{item.subtitle}</div>
                      <p className="mt-3 line-clamp-3 text-[11px] font-bold leading-relaxed text-neutral-500">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Step 2</span>
                  <h3 className="mt-1 text-xl font-black text-white">{currentTemplateCard?.title || '현재 분야'}에서 뭘 먼저 할까요?</h3>
                  <p className="mt-1 text-sm font-bold text-neutral-600">가진 자료 상태를 고르면 바로 이동할 화면을 정합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-400 hover:border-neutral-700 hover:text-neutral-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  분야 다시 선택
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {actionChoices.map((item) => {
                  const Icon = item.Icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => moveToAction(item)}
                      className={`prepro-action-card group rounded-xl border p-5 text-left transition-all ${item.tone === 'primary' ? 'is-primary text-neutral-100' : 'text-neutral-300'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${
                          item.tone === 'primary'
                            ? 'border-teal-300/30 bg-teal-300/10 text-teal-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 group-hover:text-neutral-200'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-neutral-700 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-300" />
                      </div>
                      <div className="mt-5 text-lg font-black text-white">{item.label}</div>
                      <p className="mt-2 min-h-12 text-sm font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
