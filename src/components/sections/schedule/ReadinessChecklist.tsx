import { ArrowRight, CheckCircle2, Circle, XCircle } from 'lucide-react';

export type ReadinessCheckItem = {
  id: string;
  label: string;
  detail: string;
  status: 'ok' | 'warning' | 'critical';
  actionLabel: string;
};

export type ReadinessSummary = {
  ok: number;
  warning: number;
  critical: number;
  status: string;
};

export default function ReadinessChecklist({
  checks,
  summary,
  onAction,
}: {
  checks: ReadinessCheckItem[];
  summary: ReadinessSummary;
  onAction: (checkId: string) => void;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${
      summary.status === 'critical'
        ? 'border-red-500/30 bg-red-500/5'
        : summary.status === 'warning'
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-green-500/20 bg-green-500/5'
    }`}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500">현장 준비 체크</div>
          <h3 className="mt-1 text-lg font-black text-neutral-100">출발 전 체크리스트</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {summary.status === 'critical'
              ? '즉시 확인해야 할 항목이 있습니다.'
              : summary.status === 'warning'
                ? '현장 전 한번 더 확인하면 좋습니다.'
                : '현장 공유 준비가 좋아 보입니다.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-xs">
          {[
            { label: '정상', value: summary.ok, tone: 'text-green-300' },
            { label: '확인', value: summary.warning, tone: 'text-amber-300' },
            { label: '필수', value: summary.critical, tone: 'text-red-300' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/50 px-3 py-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
              <div className={`mt-1 text-base font-black ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {checks.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAction(item.id)}
            className={`group rounded-xl border bg-neutral-950/80 px-4 py-3 text-left transition-all hover:bg-neutral-900/80 ${
              item.status === 'critical'
                ? 'border-red-500/30 hover:border-red-400/50'
                : item.status === 'warning'
                  ? 'border-amber-500/25 hover:border-amber-400/45'
                  : 'border-neutral-800 hover:border-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2">
              {item.status === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : item.status === 'warning' ? (
                <Circle className="h-4 w-4 text-amber-300" />
              ) : (
                <XCircle className="h-4 w-4 text-red-300" />
              )}
              <div className="text-xs font-black text-neutral-200">{item.label}</div>
            </div>
            <div className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{item.detail}</div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-neutral-600 transition-colors group-hover:text-teal-200">
              <span>{item.actionLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
