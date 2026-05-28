import { CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

type WorkflowStep = {
  id: number;
  label: string;
  detail: string;
};

type SummaryMetric = {
  label: string;
  value: string;
};

type TimelineStats = {
  totalMinutes: number;
  sceneMinutes: number;
  breakMinutes: number;
  risk: string;
  wrapTime: Date | null;
};

export default function ScheduleDashboardSummary({
  activeStep,
  activeShootingStartTime,
  itemPluralLabel,
  metrics,
  timelineStats,
  workflowSteps,
}: {
  activeStep: number;
  activeShootingStartTime: Date | null;
  itemPluralLabel: string;
  metrics: SummaryMetric[];
  timelineStats: TimelineStats;
  workflowSteps: WorkflowStep[];
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {workflowSteps.map((step) => {
          const isActive = activeStep === step.id;
          const isDone = activeStep > step.id;

          return (
            <div
              key={step.id}
              className={`flex min-w-0 flex-col items-start gap-2 rounded-2xl border px-3 py-3 transition-all md:flex-row md:items-center md:gap-4 md:px-5 md:py-4 ${
                isActive
                  ? 'border-neutral-700 bg-neutral-900 text-white'
                  : isDone
                    ? 'border-neutral-800 bg-neutral-900/70 text-neutral-300'
                    : 'border-neutral-900 bg-neutral-950/70 text-neutral-600'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                isDone ? 'bg-green-500/15 text-green-400' : isActive ? 'bg-neutral-800 text-indigo-300' : 'bg-neutral-900 text-neutral-600'
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
              </div>
              <div className="min-w-0">
                <div className="whitespace-nowrap text-xs font-black [word-break:keep-all] md:text-sm">{step.label}</div>
                <div className="hidden truncate text-[11px] text-neutral-500 md:block">{step.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map((item) => (
          <div key={item.label} className="rounded-2xl border border-neutral-900 bg-neutral-950/80 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">{item.label}</div>
            <div className="mt-1 text-2xl font-black text-neutral-100">{item.value}</div>
          </div>
        ))}
      </div>

      {timelineStats.totalMinutes > 0 && (
        <div className={`rounded-2xl border px-5 py-4 ${
          timelineStats.risk === 'critical'
            ? 'border-red-500/30 bg-red-500/5'
            : timelineStats.risk === 'warning'
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-neutral-900 bg-neutral-950/70'
        }`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                timelineStats.risk === 'critical'
                  ? 'bg-red-500/10 text-red-300'
                  : timelineStats.risk === 'warning'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-cyan-500/10 text-cyan-300'
              }`}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500">운영 시간 분석</div>
                <div className="mt-0.5 text-sm font-bold text-neutral-200">
                  순수 {itemPluralLabel} {timelineStats.sceneMinutes}분 · 시간 블록 {timelineStats.breakMinutes}분 · 총 운영 {timelineStats.totalMinutes}분
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-xl border border-neutral-800 bg-black px-3 py-2 text-neutral-300">
                시작 {activeShootingStartTime ? format(activeShootingStartTime, 'HH:mm') : '미정'}
              </span>
              <span className="rounded-xl border border-neutral-800 bg-black px-3 py-2 text-neutral-300">
                종료 {timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '미정'}
              </span>
              <span className={`rounded-xl px-3 py-2 ${
                timelineStats.risk === 'critical'
                  ? 'bg-red-500/15 text-red-300'
                  : timelineStats.risk === 'warning'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-green-500/10 text-green-300'
              }`}>
                {timelineStats.risk === 'critical' ? '장시간 운영' : timelineStats.risk === 'warning' ? '긴 일정' : '정상 범위'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
