import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react';

export { FirstRunPanel } from './FirstRunPanel';

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
