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

const postFirstSceneActions = [
  { id: 'permit', label: '장소 확정하기' },
  { id: 'storyboard', label: '콘티 연결하기' },
  { id: 'people', label: '출연/스태프 추가하기' },
] as const;

const readinessGroups = [
  { label: '지금 할 일', itemIds: ['schedule', 'metadata', 'duration'] },
  { label: '촬영 전 확인', itemIds: ['permit', 'people', 'storyboard', 'equipmentPlan', 'sceneBreakdown', 'locationScout', 'weather'] },
  { label: '제출/정산', itemIds: ['shortFilmPackage'] },
] as const;

export default function ReadinessChecklist({
  checks,
  summary,
  acknowledgedCheckIds = [],
  postFirstScenePrompt = false,
  onAction,
  onAcknowledge,
  onUnacknowledge,
}: {
  checks: ReadinessCheckItem[];
  summary: ReadinessSummary;
  acknowledgedCheckIds?: string[];
  postFirstScenePrompt?: boolean;
  onAction: (checkId: string) => void;
  onAcknowledge: (checkId: string) => void;
  onUnacknowledge: (checkId: string) => void;
}) {
  const acknowledgedCheckIdSet = new Set(acknowledgedCheckIds);
  const groupedCheckIds = new Set<string>(readinessGroups.flatMap((group) => [...group.itemIds]));
  const groupedChecks = readinessGroups.map((group) => ({
    ...group,
    items: group.itemIds
      .map((id) => checks.find((item) => item.id === id))
      .filter((item): item is ReadinessCheckItem => Boolean(item)),
  }));
  const ungroupedChecks = checks.filter((item) => !groupedCheckIds.has(item.id));
  const visibleGroups = [
    ...groupedChecks,
    ...(ungroupedChecks.length > 0 ? [{ label: '추가 확인', items: ungroupedChecks }] : []),
  ];
  const acknowledgedRiskItems = checks.filter((item) =>
    (item.status === 'critical' || item.status === 'warning') && acknowledgedCheckIdSet.has(item.id)
  );
  const topRiskItems = checks
    .filter((item) => (item.status === 'critical' || item.status === 'warning') && !acknowledgedCheckIdSet.has(item.id))
    .slice(0, 3);

  return (
    <div className={`rounded-2xl border p-5 ${
      summary.status === 'critical'
        ? 'border-red-500/30 bg-red-500/5'
        : summary.status === 'warning'
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-green-500/20 bg-green-500/5'
    }`}>
      {postFirstScenePrompt && (
        <div className="mb-4 rounded-xl border border-teal-400/20 bg-teal-400/10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-200/80">첫 씬 저장 완료</div>
              <p className="mt-1 text-sm font-black text-neutral-100">다음은 한 가지만 이어서 정리해도 충분합니다.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
              {postFirstSceneActions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onAction(item.id)}
                  className="group flex min-h-11 items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-black/45 px-3 py-2 text-left text-xs font-black text-neutral-200 transition-colors hover:border-teal-300/50 hover:bg-neutral-950"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-500 transition-colors group-hover:text-teal-200" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
      <div className="mb-4 rounded-xl border border-neutral-800 bg-black/35 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500">오늘 먼저 확인</div>
          {topRiskItems.length > 0 && (
            <div className="text-[10px] font-black text-neutral-600">{topRiskItems.length}개 우선</div>
          )}
        </div>
        {topRiskItems.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-3">
            {topRiskItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAction(item.id)}
                className={`group flex min-h-12 items-center justify-between gap-3 rounded-xl border bg-neutral-950/85 px-3 py-2 text-left transition-all hover:bg-neutral-900/85 ${
                  item.status === 'critical'
                    ? 'border-red-500/30 hover:border-red-400/50'
                    : 'border-amber-500/25 hover:border-amber-400/45'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-neutral-200">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-bold text-neutral-500">{item.detail}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-600 transition-colors group-hover:text-teal-200" />
              </button>
            ))}
          </div>
        ) : acknowledgedRiskItems.length > 0 ? (
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-teal-400/20 bg-teal-400/10 px-3 py-2 text-xs font-black text-teal-100">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>이번 촬영만 확인 완료 · 원본 준비 데이터는 유지됨</span>
          </div>
        ) : (
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-black text-green-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>오늘 출발 준비 양호</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {visibleGroups.map((group) => (
          group.items.length > 0 && (
            <section key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[11px] font-black text-neutral-300">{group.label}</div>
                <div className="h-px flex-1 bg-neutral-800/80" />
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const acknowledgeable = item.status === 'critical' || item.status === 'warning';
                  const isAcknowledged = acknowledgeable && acknowledgedCheckIdSet.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`group rounded-xl border bg-neutral-950/80 px-4 py-3 text-left transition-all hover:bg-neutral-900/80 ${
                        item.status === 'critical'
                          ? 'border-red-500/30 hover:border-red-400/50'
                          : item.status === 'warning'
                            ? 'border-amber-500/25 hover:border-amber-400/45'
                            : 'border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <button type="button" onClick={() => onAction(item.id)} className="block w-full text-left">
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
                      {acknowledgeable && (
                        <div className="mt-3 border-t border-neutral-800/80 pt-3">
                          {isAcknowledged ? (
                            <div className="rounded-lg border border-teal-400/25 bg-teal-400/10 px-3 py-2">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-teal-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>현장 확인 완료</span>
                              </div>
                              <p className="mt-1 text-[10px] font-bold leading-relaxed text-neutral-500">
                                이번 촬영만 확인한 표시입니다. 원본 준비 데이터는 바뀌지 않습니다.
                              </p>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onUnacknowledge(item.id);
                                }}
                                className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-teal-300/30 bg-black/30 px-3 py-1.5 text-[10px] font-black text-teal-100 transition-colors hover:border-amber-300/50 hover:text-amber-100"
                              >
                                <Circle className="h-3.5 w-3.5" />
                                <span>다시 확인 필요</span>
                              </button>
                              <p className="mt-1 text-[10px] font-bold leading-relaxed text-neutral-500">
                                이번 촬영 확인 표시만 해제합니다. 원본 준비 데이터는 바뀌지 않습니다.
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onAcknowledge(item.id);
                              }}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-neutral-700 bg-black/35 px-3 py-1.5 text-[10px] font-black text-neutral-300 transition-colors hover:border-teal-300/50 hover:text-teal-100"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>현장 확인 완료</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )
        ))}
      </div>
    </div>
  );
}
