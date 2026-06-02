'use client';

import { preproWorkspaces, type PreProWorkspace, type PreProWorkspaceId } from '@/lib/workspaces';

type WorkspaceShellNavProps = {
  activeWorkspace: PreProWorkspaceId;
  onWorkspaceChange: (workspace: PreProWorkspaceId) => void;
};

const mobilePriorityRank: Record<PreProWorkspace['mobilePriority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function WorkspaceShellNav({
  activeWorkspace,
  onWorkspaceChange,
}: WorkspaceShellNavProps) {
  const mobileWorkspaces = [...preproWorkspaces].sort((a, b) => (
    mobilePriorityRank[a.mobilePriority] - mobilePriorityRank[b.mobilePriority] || a.order - b.order
  ));

  return (
    <nav
      aria-label="PrePro 작업공간"
      className="rounded-3xl border border-neutral-800/90 bg-neutral-950/90 p-2 shadow-2xl shadow-black/25 backdrop-blur"
      data-html2canvas-ignore="true"
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-900 px-2 pb-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">PrePro workspace</div>
          <p className="mt-0.5 text-xs font-bold text-neutral-400">같은 프로젝트를 목적별 작업공간으로 봅니다.</p>
        </div>
        <span className="hidden rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-[10px] font-black text-teal-100 sm:inline-flex">
          작업공간 미리보기
        </span>
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 custom-scrollbar md:hidden">
        {mobileWorkspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspace;

          return (
            <button
              key={workspace.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              data-workspace-path={workspace.path}
              onClick={() => onWorkspaceChange(workspace.id)}
              className={`min-h-11 shrink-0 rounded-2xl border px-3.5 py-2 text-left transition-all ${
                isActive
                  ? 'border-teal-300/50 bg-teal-300 text-black shadow-lg shadow-teal-950/30'
                  : 'border-neutral-800 bg-black/45 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <span className="block text-sm font-black leading-none">{workspace.shortLabel}</span>
              <span className={`mt-1 block text-[10px] font-black ${isActive ? 'text-black/55' : 'text-neutral-600'}`}>
                {workspace.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 hidden grid-cols-6 gap-2 md:grid">
        {preproWorkspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspace;

          return (
            <button
              key={workspace.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              data-workspace-path={workspace.path}
              onClick={() => onWorkspaceChange(workspace.id)}
              className={`group min-h-[104px] rounded-2xl border p-3 text-left transition-all ${
                isActive
                  ? 'border-teal-300/55 bg-gradient-to-br from-teal-300 to-indigo-200 text-black shadow-xl shadow-teal-950/30'
                  : 'border-neutral-800 bg-black/45 text-neutral-300 hover:-translate-y-0.5 hover:border-neutral-700 hover:bg-neutral-900/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${isActive ? 'text-black/55' : 'text-neutral-600'}`}>
                  {workspace.path}
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${
                  isActive ? 'border-black/10 bg-black/10 text-black/70' : 'border-neutral-800 bg-neutral-950 text-neutral-600 group-hover:text-neutral-400'
                }`}>{workspace.shortLabel}</span>
              </div>
              <div className="mt-3 text-base font-black leading-none">{workspace.label}</div>
              <div className={`mt-2 text-[11px] font-bold leading-relaxed ${isActive ? 'text-black/60' : 'text-neutral-500'}`}>
                {workspace.description}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
