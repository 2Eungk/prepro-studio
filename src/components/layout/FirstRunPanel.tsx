import type { TemplateType } from '@/types/schedule';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';

type WorkspaceLanguage = {
  firstRunDetail: string;
  firstRunTitle: string;
};

type QuickStartProjectCard = {
  template: TemplateType;
  title: string;
  subtitle: string;
  detail: string;
  metric: string;
  Icon: LucideIcon;
};

type GettingStartedCard = {
  label: string;
  detail: string;
  Icon: LucideIcon;
  action: () => void;
  tone: string;
};

const productionTypeTitle = (card: QuickStartProjectCard) =>
  card.template === 'dance' ? '유튜브/숏폼' : card.title;

const recommendedActionLabel = (template: TemplateType) => {
  switch (template) {
    case 'film':
      return '시나리오로 시작하기';
    case 'event':
      return '식순으로 시작하기';
    case 'ad':
      return '광고 구성으로 시작하기';
    case 'musicvideo':
      return 'MV 콘티로 시작하기';
    case 'dance':
      return '숏폼 타임코드로 시작하기';
  }
};

export function FirstRunPanel({
  addItemLabel,
  cards,
  currentTemplate,
  gettingStartedCards,
  workspaceLanguage,
  onSelectTemplate,
}: {
  addItemLabel: string;
  cards: QuickStartProjectCard[];
  currentTemplate: TemplateType;
  gettingStartedCards: GettingStartedCard[];
  workspaceLanguage: WorkspaceLanguage;
  onSelectTemplate: (template: TemplateType) => void;
}) {
  const selectedTemplateCard = cards.find((item) => item.template === currentTemplate) || cards[0];
  const selectedTypeLabel = selectedTemplateCard ? productionTypeTitle(selectedTemplateCard) : '제작 유형';
  const [step, setStep] = useState<1 | 2>(1);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const moveToAction = (item: GettingStartedCard) => {
    setIsDismissed(true);
    requestAnimationFrame(() => item.action());
  };

  return (
    <div className="scroll-mt-24">
      <section
        role="region"
        aria-labelledby="first-run-title"
        className="overflow-hidden rounded-2xl border border-teal-300/25 bg-neutral-950 shadow-2xl shadow-teal-950/25"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-900 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_32%),linear-gradient(135deg,rgba(242,161,75,0.08),transparent_44%)] p-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
              <Sparkles className="h-3 w-3" />
              첫 시작 설정
            </div>
            <h2 id="first-run-title" className="mt-3 text-2xl font-black leading-tight text-white">
              {workspaceLanguage.firstRunTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-neutral-500">
              {workspaceLanguage.firstRunDetail} 선택이 끝나면 필요한 화면이 열리고, 첫 {addItemLabel}이 생기면 이 안내는 사라집니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-black/50 text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-200"
            aria-label="시작 안내 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-neutral-900 px-5 py-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 1, label: '제작 유형' },
              { id: 2, label: '자료 상태' },
            ].map((item) => {
              const isActive = step === item.id;
              const isDone = step > item.id;

              return (
                <div key={item.id} className={`rounded-xl border px-3 py-2 ${
                  isActive
                    ? 'border-teal-300/35 bg-teal-300/10 text-teal-50'
                    : isDone
                      ? 'border-teal-400/20 bg-teal-400/5 text-teal-200'
                      : 'border-neutral-900 bg-black/35 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : <span>{item.id}</span>}
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5">
          {step === 1 && (
            <div>
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Step 1</span>
                <h3 className="mt-1 text-xl font-black text-white">어떤 제작물인가요?</h3>
                <p className="mt-1 text-sm font-bold text-neutral-600">제작 유형을 고르면 다음 단계의 추천 시작 방식과 작업 문구가 그 기준으로 바뀝니다.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {cards.map((item) => {
                  const Icon = item.Icon;
                  const isSelected = item.template === currentTemplate;

                  return (
                    <button
                      key={item.template}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectTemplate(item.template)}
                      className={`group flex min-h-44 flex-col rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-teal-300/45 bg-teal-300/10 text-teal-50 shadow-lg shadow-teal-950/20'
                          : 'border-neutral-900 bg-black/35 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? 'border-teal-300/25 bg-neutral-950/80 text-teal-100'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-500 group-hover:text-neutral-200'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {isSelected && (
                          <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-2 py-1 text-[9px] font-black text-teal-100">선택됨</span>
                        )}
                      </div>
                      <div className="mt-4 text-lg font-black text-white">{productionTypeTitle(item)}</div>
                      <p className="mt-1 text-xs font-black text-neutral-500">{item.subtitle} · {item.metric}</p>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-500">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-teal-300/35 bg-teal-300 px-4 py-3 text-left text-black transition-colors hover:bg-teal-200 sm:min-w-[220px]"
                >
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">다음</span>
                    <span className="mt-1 block text-base font-black">{selectedTypeLabel} 자료 상태 고르기</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Step 2</span>
                  <h3 className="mt-1 text-xl font-black text-white">{selectedTypeLabel}에서 뭘 먼저 할까요?</h3>
                  <p className="mt-1 text-sm font-bold text-neutral-600">선택한 {selectedTypeLabel} 기준으로 바로 이동할 화면을 정합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-400 hover:border-neutral-700 hover:text-neutral-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  제작 유형 다시 선택
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {gettingStartedCards.map((item, index) => {
                  const Icon = item.Icon;
                  const isRecommended = index === 0;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => moveToAction(item)}
                      className={`prepro-action-card group rounded-xl border p-5 text-left transition-all ${
                        isRecommended
                          ? 'is-primary text-neutral-100 sm:col-span-2'
                          : 'text-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${
                          isRecommended
                            ? 'border-teal-300/30 bg-teal-300/10 text-teal-200'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 group-hover:text-neutral-200'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {isRecommended && (
                          <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-2 py-1 text-[9px] font-black text-teal-100">추천</span>
                        )}
                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-neutral-700 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-300" />
                      </div>
                      {isRecommended && (
                        <div className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-teal-200">{item.label}</div>
                      )}
                      <div className={`${isRecommended ? 'mt-1 text-xl' : 'mt-5 text-lg'} font-black text-white`}>
                        {isRecommended ? recommendedActionLabel(currentTemplate) : item.label}
                      </div>
                      <p className={`${isRecommended ? 'max-w-2xl' : 'min-h-12'} mt-2 text-sm font-bold leading-relaxed text-neutral-600`}>{item.detail}</p>
                      {isRecommended && (
                        <span
                          aria-hidden="true"
                          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-300 px-3 py-1.5 text-xs font-black text-black shadow-lg shadow-teal-950/20 transition-colors group-hover:bg-teal-200"
                        >
                          바로 시작하기
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
