'use client';

import type { ProductionLocation, TemplateType } from '@/types/schedule';
import { Search } from 'lucide-react';

type ScheduleStatusFilter = 'all' | 'pending' | 'done' | 'ng';
type ScheduleIssueFilter = 'all' | 'missingLocation' | 'missingStoryboard' | 'missingPeople' | 'missingDuration';

type OptimizationMetric = {
  before: number;
  after: number;
};

type OptimizationSummary = {
  locationMoves: OptimizationMetric;
  setupChanges: OptimizationMetric;
  castChanges: OptimizationMetric;
  preservedBreaks: number;
};

type ScheduleIssueOption = {
  id: ScheduleIssueFilter;
  label: string;
  count: number;
};

type ScheduleControlsPanelProps = {
  activeDayIndex: number;
  activeDaySceneCount: number;
  activeShootingDate: string;
  filteredSceneCount: number;
  isScheduleFiltered: boolean;
  issueOptions: ScheduleIssueOption[];
  itemPluralLabel: string;
  locations: ProductionLocation[];
  locationFilter: string;
  optimizationSummary: OptimizationSummary | null;
  scheduleIssueFilter: ScheduleIssueFilter;
  scheduleSearch: string;
  scheduleStatusFilter: ScheduleStatusFilter;
  scheduleTitle: string;
  searchPlaceholder: string;
  template: TemplateType;
  totalMinutes: number;
  wrapTimeLabel: string;
  onChangeIssueFilter: (value: ScheduleIssueFilter) => void;
  onChangeLocationFilter: (value: string) => void;
  onChangeSearch: (value: string) => void;
  onChangeStatusFilter: (value: ScheduleStatusFilter) => void;
  onResetFilters: () => void;
  onUndoOptimization: () => void;
};

const statusOptions = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '대기' },
  { id: 'done', label: '완료' },
  { id: 'ng', label: 'NG' },
] satisfies { id: ScheduleStatusFilter; label: string }[];

const getCastChangeLabel = (template: TemplateType) => {
  if (template === 'event') return '담당자 전환';
  if (template === 'ad') return '모델/스태프 전환';
  if (template === 'musicvideo') return '아티스트/세트 전환';
  if (template === 'dance') return '포커스 전환';
  return '출연진 전환';
};

export default function ScheduleControlsPanel({
  activeDayIndex,
  activeDaySceneCount,
  activeShootingDate,
  filteredSceneCount,
  isScheduleFiltered,
  issueOptions,
  itemPluralLabel,
  locations,
  locationFilter,
  optimizationSummary,
  scheduleIssueFilter,
  scheduleSearch,
  scheduleStatusFilter,
  scheduleTitle,
  searchPlaceholder,
  template,
  totalMinutes,
  wrapTimeLabel,
  onChangeIssueFilter,
  onChangeLocationFilter,
  onChangeSearch,
  onChangeStatusFilter,
  onResetFilters,
  onUndoOptimization,
}: ScheduleControlsPanelProps) {
  return (
    <>
      <div className="rounded-3xl border border-neutral-900 bg-neutral-950/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">Timeline</div>
            <h2 className="mt-1 text-2xl font-black text-neutral-100">{scheduleTitle}</h2>
            <p className="mt-1 text-sm font-bold text-neutral-600">
              Day {activeDayIndex + 1} · {activeShootingDate} · {activeDaySceneCount}개 {itemPluralLabel}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right text-xs">
            {[
              { label: '총 운영', value: `${totalMinutes}분` },
              { label: '종료', value: wrapTimeLabel },
              { label: '장소', value: `${locations.length}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-neutral-900 bg-neutral-950 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                <div className="mt-1 text-base font-black text-neutral-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-900 bg-black/35 p-3" data-html2canvas-ignore="true">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
              <input
                value={scheduleSearch}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-black pl-10 pr-4 text-sm font-bold text-neutral-200 outline-none transition-colors placeholder:text-neutral-700 focus:border-indigo-500"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => onChangeLocationFilter(e.target.value)}
              className="h-11 rounded-xl border border-neutral-800 bg-black px-4 text-sm font-bold text-neutral-300 outline-none transition-colors focus:border-indigo-500"
            >
              <option value="all">모든 장소</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeStatusFilter(item.id)}
                className={`h-11 rounded-xl border px-4 text-xs font-black transition-all ${
                  scheduleStatusFilter === item.id
                    ? 'border-indigo-400 bg-indigo-600 text-white'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isScheduleFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-11 rounded-xl border border-neutral-800 px-4 text-xs font-black text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
              >
                초기화
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 text-xs font-bold text-neutral-600">
          {isScheduleFiltered ? `${filteredSceneCount}/${activeDaySceneCount}개 ${itemPluralLabel} 표시 중` : `Day ${activeDayIndex + 1} 전체 ${activeDaySceneCount}개 ${itemPluralLabel} 표시 중`}
        </div>
        <div className="mt-3 border-t border-neutral-900 pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">제작 점검</p>
            <p className="text-[10px] font-bold text-neutral-700">클릭하면 해당 항목만 필터링됩니다</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {issueOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeIssueFilter(item.id)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition-all ${
                  scheduleIssueFilter === item.id
                    ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                    : item.count > 0 && item.id !== 'all'
                      ? 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-amber-500/40 hover:text-amber-200'
                      : 'border-neutral-900 bg-black text-neutral-600 hover:border-neutral-800 hover:text-neutral-400'
                }`}
              >
                <span>{item.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  item.count > 0 && item.id !== 'all'
                    ? 'bg-amber-500/15 text-amber-200'
                    : 'bg-neutral-800 text-neutral-500'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {optimizationSummary && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Optimization Applied</div>
              <div className="mt-1 text-sm font-bold text-neutral-300">최적화 전 순서를 저장했습니다.</div>
            </div>
            <button
              onClick={onUndoOptimization}
              className="inline-flex w-fit items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-black text-neutral-300 transition-colors hover:border-indigo-500/50 hover:text-white"
            >
              이전 순서로 되돌리기
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { label: '장소 이동', metric: optimizationSummary.locationMoves },
              { label: '세팅 전환', metric: optimizationSummary.setupChanges },
              { label: getCastChangeLabel(template), metric: optimizationSummary.castChanges },
            ].map((item) => {
              const diff = item.metric.before - item.metric.after;
              return (
                <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{item.label}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xl font-black text-neutral-100">{item.metric.after}</span>
                    <span className="text-xs text-neutral-500">이전 {item.metric.before}</span>
                  </div>
                  <div className={`mt-1 text-xs font-bold ${diff > 0 ? 'text-green-400' : diff === 0 ? 'text-neutral-500' : 'text-amber-300'}`}>
                    {diff > 0 ? `${diff}회 감소` : diff === 0 ? '변동 없음' : `${Math.abs(diff)}회 증가`}
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">시간 블록</div>
              <div className="mt-1 text-xl font-black text-amber-300">{optimizationSummary.preservedBreaks}</div>
              <div className="mt-1 text-xs font-bold text-neutral-500">식사/이동/휴식 위치 보존</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
