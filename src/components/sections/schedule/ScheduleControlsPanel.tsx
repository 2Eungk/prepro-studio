'use client';

import { useState } from 'react';
import type { BreakItem, ProductionLocation, TemplateType } from '@/types/schedule';
import { Clock, Search } from 'lucide-react';

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

export type QuickBreakPreset = {
  type: BreakItem['type'];
  label: string;
  estimatedMinutes: number;
  placement: 'before-first-scene' | 'after-current-order';
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
  onQuickAddBreak: (preset: QuickBreakPreset) => void;
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

const quickBreakPresets: QuickBreakPreset[] = [
  { type: 'setup', label: '콜타임 / 장비 하차', estimatedMinutes: 30, placement: 'before-first-scene' },
  { type: 'setup', label: '세팅 / 리허설', estimatedMinutes: 30, placement: 'before-first-scene' },
  { type: 'move', label: '이동 / 주차 확인', estimatedMinutes: 30, placement: 'after-current-order' },
  { type: 'meal', label: '식사 / 휴식', estimatedMinutes: 60, placement: 'after-current-order' },
  { type: 'custom', label: '철수 / 백업', estimatedMinutes: 30, placement: 'after-current-order' },
];

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
  onQuickAddBreak,
  onResetFilters,
  onUndoOptimization,
}: ScheduleControlsPanelProps) {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(isScheduleFiltered);

  return (
    <>
      <div id="schedule-report-checkpoint" className="rounded-3xl border border-neutral-900 bg-neutral-950/70 p-5">
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

      {activeDaySceneCount > 0 && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.055] p-3" data-html2canvas-ignore="true">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                <Clock className="h-3.5 w-3.5" />
                운영 블록 빠른 추가
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-amber-100/65">
                콜타임, 이동, 식사, 세팅/리허설, 철수/백업을 씬과 구분되는 시간 블록으로 바로 붙입니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
              {quickBreakPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onQuickAddBreak(preset)}
                  className="min-h-11 rounded-xl border border-amber-500/30 bg-black/45 px-3 py-2 text-left transition-colors hover:border-amber-300/50 hover:bg-amber-500/10"
                >
                  <span className="block text-xs font-black text-amber-100">{preset.label}</span>
                  <span className="mt-0.5 block text-[10px] font-bold text-amber-100/50">{preset.estimatedMinutes}분 · 시간 블록</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-neutral-900 bg-black/35 p-3" data-html2canvas-ignore="true">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
            <input
              value={scheduleSearch}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-neutral-800 bg-black pl-10 pr-4 text-sm font-bold text-neutral-200 outline-none transition-colors placeholder:text-neutral-700 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-neutral-600">
            <span>
              {isScheduleFiltered ? `${filteredSceneCount}/${activeDaySceneCount}개 ${itemPluralLabel} 표시 중` : `Day ${activeDayIndex + 1} 전체 ${activeDaySceneCount}개 ${itemPluralLabel}`}
            </span>
            {isScheduleFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        <details
          className="group mt-3 rounded-2xl border border-neutral-900 bg-neutral-950/50"
          open={isAdvancedFiltersOpen || isScheduleFiltered}
          onToggle={(event) => setIsAdvancedFiltersOpen(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-black text-neutral-300 [&::-webkit-details-marker]:hidden">
            <span>고급 필터 · 제작 점검</span>
            <span className="text-[10px] text-neutral-600 group-open:hidden">펼치기</span>
            <span className="hidden text-[10px] text-neutral-600 group-open:inline">접기</span>
          </summary>
          <div className="space-y-3 border-t border-neutral-900 p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
              <div className="flex flex-wrap items-center gap-2">
                {statusOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeStatusFilter(item.id)}
                    className={`h-10 rounded-xl border px-4 text-xs font-black transition-all ${
                      scheduleStatusFilter === item.id
                        ? 'border-indigo-400 bg-indigo-600 text-white'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-neutral-900 pt-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">제작 점검</p>
                <p className="text-[10px] font-bold text-neutral-700">누락 항목을 눌러 해당 컷만 보기</p>
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
        </details>
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
