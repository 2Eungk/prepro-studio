import type { LucideIcon } from 'lucide-react';

type CurrentWorkspace = {
  label: string;
  caption: string;
  metric: string;
};

export type QuickAction = {
  id: string;
  label: string;
  detail: string;
  Icon: LucideIcon;
  disabled?: boolean;
  tone?: 'primary' | 'amber' | 'green' | 'neutral';
};

export default function CurrentWorkBar({
  actions,
  currentWorkspace,
  onAction,
}: {
  actions: QuickAction[];
  currentWorkspace?: CurrentWorkspace;
  onAction: (actionId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-neutral-900 bg-neutral-950/45 p-4" data-html2canvas-ignore="true">
      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.62fr)_minmax(520px,1fr)] xl:items-center">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">현재 작업</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-neutral-100">
              {currentWorkspace?.label || '작업'}
            </h2>
            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500">
              {currentWorkspace?.metric || '-'}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-neutral-600">
            {currentWorkspace?.caption || '다음 작업을 선택하세요.'}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {actions.map(({ id, label, detail, Icon, disabled, tone = 'neutral' }) => {
            const toneClass = tone === 'primary'
              ? 'prepro-btn--primary'
              : tone === 'amber'
                ? 'prepro-btn--warm'
                : tone === 'green'
                  ? 'prepro-btn--primary'
                  : 'prepro-btn--secondary';

            return (
              <button
                key={id}
                type="button"
                onClick={() => onAction(id)}
                disabled={disabled}
                className={`prepro-btn h-11 justify-start text-left ${toneClass}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black">{label}</span>
                  <span className="mt-0.5 hidden truncate text-[9px] font-bold opacity-65 sm:block">{detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
