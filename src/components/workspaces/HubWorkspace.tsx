'use client';

import type { PreProWorkspaceId } from '@/lib/workspaces';

type HubMetric = {
  label: string;
  value: string;
  detail?: string;
};

type HubAction = {
  workspace: PreProWorkspaceId;
  title: string;
  detail: string;
  badge?: string;
};

type HubWorkspaceProps = {
  templateLabel: string;
  sampleNotice?: string;
  metrics: HubMetric[];
  actions: HubAction[];
  nextRecommendation: {
    label: string;
    detail: string;
    workspace: PreProWorkspaceId;
  };
  onWorkspaceChange: (workspace: PreProWorkspaceId) => void;
};

export default function HubWorkspace({
  templateLabel,
  sampleNotice,
  metrics,
  actions,
  nextRecommendation,
  onWorkspaceChange,
}: HubWorkspaceProps) {
  return (
    <section className="scroll-mt-24 rounded-3xl border border-neutral-800 bg-neutral-950/80 p-4 md:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div className="rounded-3xl border border-neutral-800 bg-black/45 p-5 md:p-6">
          <div className="inline-flex rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-100">
            Project hub
          </div>
          <h2 className="mt-4 text-2xl font-black text-white md:text-4xl">오늘 할 일을 작업공간으로 나눠서 시작하세요.</h2>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed text-neutral-500">
            현재 프로젝트는 <span className="text-neutral-200">{templateLabel}</span> 기준입니다. 기획, 촬영표, 콘티, 조명도, 마무리를 한 프로젝트 데이터로 연결합니다.
          </p>
          {sampleNotice && (
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs font-bold leading-relaxed text-amber-100">
              샘플 보기 중: {sampleNotice}. 실제 프로젝트로 쓰려면 상단에서 내 프로젝트로 사용하거나 새로 시작하세요.
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">{metric.label}</div>
                <div className="mt-2 text-xl font-black text-neutral-100">{metric.value}</div>
                {metric.detail && <div className="mt-1 text-[11px] font-bold text-neutral-600">{metric.detail}</div>}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-5">
          <div className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-100">Recommended next</div>
            <h3 className="mt-2 text-lg font-black text-white">{nextRecommendation.label}</h3>
            <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-400">{nextRecommendation.detail}</p>
            <button
              type="button"
              onClick={() => onWorkspaceChange(nextRecommendation.workspace)}
              className="mt-4 min-h-11 w-full rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-black transition-transform hover:-translate-y-0.5"
            >
              바로 이동
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {actions.map((action) => (
              <button
                key={action.workspace}
                type="button"
                onClick={() => onWorkspaceChange(action.workspace)}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-left transition-colors hover:border-teal-300/40 hover:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-black text-neutral-100">{action.title}</div>
                  {action.badge && <span className="shrink-0 rounded-full border border-neutral-800 px-2 py-0.5 text-[9px] font-black text-neutral-500">{action.badge}</span>}
                </div>
                <div className="mt-1 text-xs font-bold text-neutral-600">{action.detail}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
