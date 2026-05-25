'use client';

import { Calculator, CheckCircle2 } from 'lucide-react';

type BudgetCategory = {
  label: string;
  value: number;
  note: string;
};

type BudgetStats = {
  total: number;
  subtotal: number;
  contingency: number;
  categories: BudgetCategory[];
  shootDays: number;
  cutCount: number;
  costPerDay: number;
  costPerCut: number;
};

type BudgetReportStats = {
  castCount: number;
  crewCount: number;
};

type BudgetPanelCopy = {
  itemPlural: string;
  totalItemLabel: string;
};

type BudgetPanelProps = {
  budgetStats: BudgetStats;
  copy: BudgetPanelCopy;
  formatKRW: (value: number) => string;
  locationsCount: number;
  peopleCount: number;
  planningScaleLabel: string;
  reportStats: BudgetReportStats;
  scenesCount: number;
  templateLabel: string;
  onGoLocations: () => void;
  onGoPeople: () => void;
};

export default function BudgetPanel({
  budgetStats,
  copy,
  formatKRW,
  locationsCount,
  peopleCount,
  planningScaleLabel,
  reportStats,
  scenesCount,
  templateLabel,
  onGoLocations,
  onGoPeople,
}: BudgetPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-300">Production Budget</p>
          <h2 className="mt-1 text-2xl font-black text-neutral-100">순제작비 예산 초안</h2>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            현재 기획 규모, 촬영일, {copy.itemPlural}, 장소, 인원 데이터를 기준으로 자동 산출합니다.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">제작 규모</div>
          <div className="mt-1 text-sm font-black text-neutral-100">{planningScaleLabel} · {templateLabel}</div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-teal-400/20 bg-neutral-950">
        <div className="grid gap-0 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.12),rgba(242,161,75,0.06)_62%,transparent)] p-6 xl:border-b-0 xl:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-100">
              <Calculator className="h-3 w-3" />
              Estimate
            </div>
            <div className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-600">예상 순제작비</div>
            <div className="mt-1 text-4xl font-black leading-none text-white md:text-5xl xl:text-4xl">{formatKRW(budgetStats.total)}</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">회차당</div>
                <div className="mt-1 text-lg font-black text-teal-200">{formatKRW(budgetStats.costPerDay)}</div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">컷/구간당</div>
                <div className="mt-1 text-lg font-black text-amber-200">{formatKRW(budgetStats.costPerCut)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {[
              { label: '촬영일', value: `${budgetStats.shootDays}일`, detail: '멀티데이 반영' },
              { label: copy.totalItemLabel, value: `${scenesCount}개`, detail: `${budgetStats.cutCount}컷 산정` },
              { label: '장소', value: `${locationsCount}곳`, detail: '대관/이동/허가' },
              { label: '인원', value: `${peopleCount}명`, detail: `${reportStats.castCount} 출연 · ${reportStats.crewCount} 스태프` },
              { label: '소계', value: formatKRW(budgetStats.subtotal), detail: '예비비 제외' },
              { label: '예비비', value: formatKRW(budgetStats.contingency), detail: '리스크 버퍼' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                <div className="mt-1 truncate text-lg font-black text-neutral-100">{item.value}</div>
                <div className="mt-1 truncate text-[10px] font-bold text-neutral-600">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-neutral-100">비목별 자동 배분</h3>
              <p className="mt-1 text-xs font-bold text-neutral-600">실제 견적 전, 프로젝트 규모를 잡기 위한 초안입니다.</p>
            </div>
            <span className="rounded-full border border-neutral-800 bg-black px-3 py-1 text-[10px] font-black text-neutral-500">순제작비</span>
          </div>
          <div className="space-y-3">
            {budgetStats.categories.map((item) => {
              const percent = budgetStats.total > 0 ? Math.round((item.value / budgetStats.total) * 100) : 0;

              return (
                <div key={item.label} className="rounded-xl border border-neutral-900 bg-black/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-black text-neutral-100">{item.label}</div>
                      <div className="mt-1 truncate text-xs font-bold text-neutral-600">{item.note}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-black text-neutral-100">{formatKRW(item.value)}</div>
                      <div className="mt-0.5 text-[10px] font-black text-teal-200">{percent}%</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-900">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5">
          <h3 className="text-lg font-black text-neutral-100">다음에 보강할 입력값</h3>
          <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">
            지금은 자동 초안입니다. 이후 단가표 입력, 세목 추가, CSV/PDF 예산서까지 확장하면 됩니다.
          </p>
          <div className="mt-4 space-y-2">
            {[
              '스태프/출연자별 일당과 회차',
              '장소별 대관료, 허가비, 주차/전기',
              '장비 패키지, 렌즈, 조명, 음향',
              '미술/의상/헤메/소품 세목',
              '후반 편집, 색보정, 사운드, 납품 포맷',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl border border-neutral-900 bg-black/45 px-3 py-2 text-xs font-bold text-neutral-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={onGoPeople} className="prepro-btn prepro-btn--secondary h-11">
              인원 확인
            </button>
            <button type="button" onClick={onGoLocations} className="prepro-btn prepro-btn--secondary h-11">
              장소 확인
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
