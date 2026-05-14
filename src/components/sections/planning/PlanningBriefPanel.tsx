'use client';

import type { PlanningDocument, TemplateType } from '@/types/schedule';
import { ArrowRight, CheckCircle2, Circle, Clipboard, Film, RefreshCw, ShieldCheck, Wand2, XCircle } from 'lucide-react';

export type PlanningWorkspaceTab = 'brief' | 'details' | 'ai';

export type PlanningCheckItem = {
  label: string;
  ok: boolean;
  tab: PlanningWorkspaceTab;
  anchorId: string;
};

export type ShortFilmReadinessItem = {
  id: string;
  label: string;
  detail: string;
  status: 'ok' | 'warning' | 'critical';
};

export type ShortFilmReadinessSummary = {
  critical: number;
  warning: number;
  ok: number;
  status: 'ok' | 'warning' | 'critical';
};

type PlanningBriefPanelProps = {
  isShortFilmMode: boolean;
  planning: PlanningDocument;
  planningCheckItems: PlanningCheckItem[];
  planningCompletedChecks: number;
  planningFoundations: string[];
  planningPendingChecks: number;
  planningPlaybook: string[];
  planningProjectFormatLabel: string;
  planningScaleLabel: string;
  shortFilmReadinessChecks: ShortFilmReadinessItem[];
  shortFilmReadinessSummary: ShortFilmReadinessSummary;
  template: TemplateType;
  onFocusAnchor: (tab: PlanningWorkspaceTab, anchorId: string) => void;
  onResetPlanning: () => void;
  onSetWorkspaceTab: (tab: PlanningWorkspaceTab) => void;
  onUpdatePlanning: (values: Partial<PlanningDocument>) => void;
};

export default function PlanningBriefPanel({
  isShortFilmMode,
  planning,
  planningCheckItems,
  planningCompletedChecks,
  planningFoundations,
  planningPendingChecks,
  planningPlaybook,
  planningProjectFormatLabel,
  planningScaleLabel,
  shortFilmReadinessChecks,
  shortFilmReadinessSummary,
  template,
  onFocusAnchor,
  onResetPlanning,
  onSetWorkspaceTab,
  onUpdatePlanning,
}: PlanningBriefPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">Planning Brief</p>
            <h2 className="mt-2 text-2xl font-black text-white">기획 개요</h2>
          </div>
          <button
            onClick={onResetPlanning}
            className="prepro-btn prepro-btn--danger h-9"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 초기화
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">프로젝트명</span>
            <input
              className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
              value={planning.projectTitle}
              onChange={(event) => onUpdatePlanning({ projectTitle: event.target.value })}
              placeholder="예: 브랜드 컨퍼런스 하이라이트"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">목적</span>
            <input
              className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
              value={planning.purpose}
              onChange={(event) => onUpdatePlanning({ purpose: event.target.value })}
              placeholder="홍보 / 기록 / 판매 / 투자유치"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">제작 규모 / 운용 기준</span>
            <select
              className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-black text-white outline-none transition-all focus:border-indigo-500"
              value={planning.productionScale}
              onChange={(event) => onUpdatePlanning({ productionScale: event.target.value as PlanningDocument['productionScale'] })}
            >
              <option value="premium">하이엔드: 부서별 treatment / 권리 / 납품 / 리스크까지 전체 관리</option>
              <option value="standard">스탠다드: 필수 기획과 현장 운영을 균형 있게 관리</option>
              <option value="lean">저예산: 핵심 컷, 장소 통합, 대체안 중심으로 압축 관리</option>
            </select>
          </label>
          {template === 'film' && (
            <label className="space-y-2 md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">작품 포맷 / 제출 기준</span>
              <select
                className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-black text-white outline-none transition-all focus:border-indigo-500"
                value={planning.projectFormat || 'short_film'}
                onChange={(event) => onUpdatePlanning({ projectFormat: event.target.value as NonNullable<PlanningDocument['projectFormat']> })}
              >
                <option value="short_film">단편영화: 러닝타임, 영화제 제출 패키지, EPK 중심</option>
                <option value="feature_film">장편영화: 장편 treatment, 장기 일정, 배급/투자 패키지 중심</option>
                <option value="series">시리즈/웹드라마: 에피소드 구조, 파일럿, 시즌 아크 중심</option>
              </select>
            </label>
          )}
          <label className="space-y-2 md:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">한 줄 기획</span>
            <textarea
              id="planning-root-one-liner"
              className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
              value={planning.oneLiner}
              onChange={(event) => onUpdatePlanning({ oneLiner: event.target.value })}
              placeholder="이 프로젝트를 한 문장으로 설명하세요."
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">타깃</span>
            <textarea
              id="planning-root-audience"
              className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
              value={planning.audience}
              onChange={(event) => onUpdatePlanning({ audience: event.target.value })}
              placeholder="누가 보고 무엇을 느껴야 하는지 적으세요."
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">핵심 메시지</span>
            <textarea
              id="planning-root-core-message"
              className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
              value={planning.coreMessage}
              onChange={(event) => onUpdatePlanning({ coreMessage: event.target.value })}
              placeholder="관객/고객에게 남길 문장을 적으세요."
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => onSetWorkspaceTab('details')}
            className="prepro-btn prepro-btn--secondary h-12 text-sm"
          >
            상세 설계 열기 <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onSetWorkspaceTab('ai')}
            className="prepro-btn prepro-btn--primary h-12 text-sm"
          >
            AI 정리로 이동 <Wand2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {template === 'film' && (
          <div className="rounded-[2rem] border border-indigo-500/25 bg-indigo-500/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/25 bg-black/40 text-indigo-300">
                <Film className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{planningProjectFormatLabel} 워크플로우</h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">단편은 촬영 준비와 영화제 제출 패키지를 같은 문서에서 관리합니다.</p>
              </div>
            </div>
            <div className="grid gap-2 text-xs font-bold leading-relaxed text-neutral-300">
              <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">러닝타임: 목표 분량과 크레딧 포함 제한을 목표 영화제별로 확인</div>
              <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">제출 메타: 시놉시스, 장르, 완성일, 예산, 국가, 언어, 촬영 포맷, 화면비</div>
              <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">홍보/상영: 포스터, 스틸, 감독 소개/statement, EPK, DCP/ProRes, 자막, 권리 증빙</div>
            </div>
          </div>
        )}

        {isShortFilmMode && (
          <div className={`rounded-[2rem] border p-6 ${
            shortFilmReadinessSummary.status === 'critical'
              ? 'border-red-500/25 bg-red-500/5'
              : shortFilmReadinessSummary.status === 'warning'
                ? 'border-amber-500/25 bg-amber-500/5'
                : 'border-green-500/20 bg-green-500/5'
          }`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Short Film Delivery</p>
                <h3 className="mt-2 text-lg font-black text-white">단편 제출 체크</h3>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">
                  촬영 준비와 별개로 영화제 제출, 상영본, 권리 증빙까지 잠그는 항목입니다.
                </p>
              </div>
              <div className="grid min-w-24 grid-cols-3 gap-1 text-center text-[10px] font-black">
                <div className="rounded-lg border border-green-500/20 bg-black/40 px-2 py-2 text-green-300">{shortFilmReadinessSummary.ok}</div>
                <div className="rounded-lg border border-amber-500/20 bg-black/40 px-2 py-2 text-amber-300">{shortFilmReadinessSummary.warning}</div>
                <div className="rounded-lg border border-red-500/20 bg-black/40 px-2 py-2 text-red-300">{shortFilmReadinessSummary.critical}</div>
              </div>
            </div>
            <div className="space-y-2">
              {shortFilmReadinessChecks.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.status === 'ok' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : item.status === 'warning' ? (
                      <Circle className="h-4 w-4 text-amber-300" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-300" />
                    )}
                    <span className="text-xs font-black text-neutral-100">{item.label}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{item.detail}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onSetWorkspaceTab('details')}
              className="prepro-btn prepro-btn--warm mt-4 h-11 w-full"
            >
              제출 패키지 채우기 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
              <Clipboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">등록 없이 가능한 범위</h3>
              <p className="mt-1 text-xs font-bold text-neutral-500">기획 작성, 체크리스트, 스케줄 변환은 계정 없이 사용합니다. AI 정리는 BYOK로 앱 안에서 처리합니다.</p>
            </div>
          </div>
          <div className="grid gap-2 text-xs font-bold text-neutral-400">
            <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">간단한 프로젝트: 브리프만 채우고 바로 촬영표로 이동</div>
            <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">디테일한 프로젝트: 제작 설계까지 채운 뒤 앱 안에서 AI/API로 정리</div>
            <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">API 키: 앱 서버에 저장하지 않고, 선택 시 브라우저 로컬 저장만 사용</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-400">Production Standard</p>
            <h3 className="mt-2 text-lg font-black text-white">기획 기준</h3>
            <p className="mt-1 text-xs font-bold text-neutral-500">
              하이엔드 제작 문서 구조를 기준으로, 규모가 작으면 같은 목적을 압축 운용합니다.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-600">기반 문서</div>
              <div className="space-y-2">
                {planningFoundations.map((item) => (
                  <div key={item} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-xs font-black text-neutral-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-600">{planningScaleLabel} 운용</div>
              <div className="space-y-2">
                {planningPlaybook.map((item) => (
                  <div key={item} className="flex gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-xs font-bold leading-relaxed text-amber-100/80">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-300" />
              <div>
                <h3 className="text-lg font-black text-white">기획 점검</h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">눌러서 바로 해당 입력칸으로 이동합니다.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
              <div className="rounded-xl border border-neutral-900 bg-black/45 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">전체</div>
                <div className="mt-1 text-lg font-black text-white">{planningCheckItems.length}</div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-green-300/70">완료</div>
                <div className="mt-1 text-lg font-black text-green-300">{planningCompletedChecks}</div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/70">미완료</div>
                <div className="mt-1 text-lg font-black text-amber-300">{planningPendingChecks}</div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {planningCheckItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onFocusAnchor(item.tab, item.anchorId)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-left transition-all hover:border-teal-400/25 hover:bg-neutral-900/70"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-neutral-300">{item.label}</span>
                  <span className={`mt-1 block text-[10px] font-black uppercase tracking-[0.14em] ${item.ok ? 'text-green-300/80' : 'text-amber-300/80'}`}>
                    {item.ok ? '입력 완료' : '입력 필요'}
                  </span>
                </span>
                <span className="flex items-center gap-2 pl-3">
                  {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-amber-300" />}
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-700" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
