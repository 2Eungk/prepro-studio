'use client';

type ShootCommandAction = {
  label: string;
  detail: string;
  onClick: () => void;
  tone?: 'primary' | 'neutral' | 'amber';
};

type ShootFieldCommandStripProps = {
  isFirstRun: boolean;
  activeDayLabel: string;
  locationLabel: string;
  totalItemsLabel: string;
  totalMinutesLabel: string;
  wrapTimeLabel: string;
  actions: ShootCommandAction[];
};

const toneClasses: Record<NonNullable<ShootCommandAction['tone']>, string> = {
  primary: 'border-teal-300/40 bg-teal-300 text-black hover:bg-teal-200',
  neutral: 'border-neutral-800 bg-neutral-950 text-neutral-100 hover:border-neutral-700 hover:bg-neutral-900',
  amber: 'border-amber-300/30 bg-amber-300/10 text-amber-100 hover:border-amber-300/50',
};

export default function ShootFieldCommandStrip({
  isFirstRun,
  activeDayLabel,
  locationLabel,
  totalItemsLabel,
  totalMinutesLabel,
  wrapTimeLabel,
  actions,
}: ShootFieldCommandStripProps) {
  return (
    <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-3 md:p-4" data-html2canvas-ignore="true">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-800 bg-black/50 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-600">Shoot day</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{activeDayLabel}</div>
            <div className="mt-0.5 truncate text-[11px] font-bold text-neutral-600">{locationLabel}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-black/50 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-600">촬영 항목</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{totalItemsLabel}</div>
            <div className="mt-0.5 text-[11px] font-bold text-neutral-600">{isFirstRun ? '첫 항목부터 만들기' : '오늘 운영 기준'}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-black/50 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-600">운영 시간</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{totalMinutesLabel}</div>
            <div className="mt-0.5 text-[11px] font-bold text-neutral-600">예상 종료 {wrapTimeLabel}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-black/50 p-3">
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-600">현장 모드</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{isFirstRun ? '시작 전' : '운영 중'}</div>
            <div className="mt-0.5 text-[11px] font-bold text-neutral-600">모바일 확인 우선</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`min-h-14 rounded-2xl border px-3 py-2 text-left text-xs font-black transition-all ${toneClasses[action.tone || 'neutral']}`}
            >
              <span className="block text-sm">{action.label}</span>
              <span className={`mt-0.5 block text-[10px] font-bold ${action.tone === 'primary' ? 'text-black/55' : 'text-neutral-500'}`}>{action.detail}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
