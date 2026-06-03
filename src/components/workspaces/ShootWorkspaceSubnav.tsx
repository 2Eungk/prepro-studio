'use client';

import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

type ShootWorkspaceTabId = 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget';

type ShootWorkspaceTab = {
  id: ShootWorkspaceTabId;
  label: string;
  caption: string;
  metric: string;
  Icon: ComponentType<LucideProps>;
};

type ShootWorkspaceSubnavProps = {
  tabs: ShootWorkspaceTab[];
  activeTab: ShootWorkspaceTabId;
  dayLabel: string;
  progressLabel: string;
  onTabChange: (tab: ShootWorkspaceTabId) => void;
};

export default function ShootWorkspaceSubnav({
  tabs,
  activeTab,
  dayLabel,
  progressLabel,
  onTabChange,
}: ShootWorkspaceSubnavProps) {
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || '촬영표';

  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-3 md:p-4" data-html2canvas-ignore="true">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 px-1">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">Shoot workspace</div>
          <h2 className="mt-1 text-lg font-black text-white md:text-xl">{activeTabLabel} 중심으로 현장 정보를 정리합니다.</h2>
          <p className="mt-1 text-xs font-bold text-neutral-500">
            {dayLabel} · {progressLabel}
          </p>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 custom-scrollbar lg:mx-0 lg:grid lg:w-[760px] lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {tabs.map(({ id, label, caption, metric, Icon }) => {
            const isActive = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`min-h-20 min-w-[148px] rounded-2xl border p-3 text-left transition-all lg:min-w-0 ${
                  isActive
                    ? 'border-teal-300/55 bg-teal-300 text-black shadow-lg shadow-teal-950/25'
                    : 'border-neutral-800 bg-black/45 text-neutral-100 hover:border-neutral-700 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black/75' : 'text-neutral-500'}`} />
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${isActive ? 'bg-black/10 text-black/65' : 'border border-neutral-800 text-neutral-500'}`}>
                    {metric}
                  </span>
                </div>
                <div className="mt-2 text-sm font-black">{label}</div>
                <div className={`mt-0.5 text-[10px] font-bold leading-snug ${isActive ? 'text-black/55' : 'text-neutral-600'}`}>{caption}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type { ShootWorkspaceTabId };
