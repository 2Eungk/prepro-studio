'use client';

import type { RefObject } from 'react';
import type { TemplateType } from '@/types/schedule';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Download, FileText, RefreshCw } from 'lucide-react';

export type CueSheetRow = {
  id: string;
  orderLabel: string;
  sequenceLabel: string;
  timeLabel: string;
  durationLabel: string;
  location: string;
  content: string;
  reference?: string;
  section?: string;
  gear?: string;
  note?: string;
  timecode?: string;
  lyrics?: string;
  shotSize?: string;
  focus?: string;
  formation?: string;
  status?: string;
  estimatedMinutes: number;
  source: 'scene' | 'planning';
};

type CueSheetPanelProps = {
  activeDayLabel: string;
  canApplyDraft: boolean;
  isExportingPdf: boolean;
  pdfButtonText: string;
  pdfRef: RefObject<HTMLDivElement | null>;
  planningLineCount: number;
  rows: CueSheetRow[];
  scenesCount: number;
  sourceDetail: string;
  sourceLabel: string;
  status: string;
  storyboardFallback: (name: string) => string;
  template: TemplateType;
  templateLabel: string;
  totalMinutes: number;
  onApplyDraft: () => void;
  onExportPDF: () => void;
  onGoSchedule: () => void;
  onRefreshDraft: () => void;
};

const getCueSheetTitle = (template: TemplateType) => {
  if (template === 'event') return '행사 큐시트';
  if (template === 'musicvideo') return 'MV 타임코드 큐시트';
  if (template === 'dance') return '댄스커버 큐시트';
  if (template === 'ad') return '광고 컷 큐시트';
  return '촬영 큐시트';
};

const isMissingTime = (row: CueSheetRow) => !row.timecode && (!row.timeLabel || row.timeLabel === '--:--');
const isMissingLocation = (row: CueSheetRow) => !row.location || row.location === '장소 미정' || row.location === '-';
const isMissingContent = (row: CueSheetRow) => !row.content || row.content === '-';
const isMissingDuration = (row: CueSheetRow) => !row.estimatedMinutes || row.estimatedMinutes <= 0;

const getMissingReferenceCount = (rows: CueSheetRow[], template: TemplateType) => {
  if (template === 'event') return rows.filter((row) => !row.gear && !row.focus).length;
  if (template === 'dance' || template === 'musicvideo') {
    return rows.filter((row) => !row.reference || !row.shotSize || !row.focus).length;
  }
  return rows.filter((row) => !row.reference).length;
};

const getReferenceReadinessLabel = (template: TemplateType) => {
  if (template === 'event') return '담당/장비';
  if (template === 'dance' || template === 'musicvideo') return '샷/포커스/레퍼런스';
  return '콘티/레퍼런스';
};

export default function CueSheetPanel({
  activeDayLabel,
  canApplyDraft,
  isExportingPdf,
  pdfButtonText,
  pdfRef,
  planningLineCount,
  rows,
  scenesCount,
  sourceDetail,
  sourceLabel,
  status,
  storyboardFallback,
  template,
  templateLabel,
  totalMinutes,
  onApplyDraft,
  onExportPDF,
  onGoSchedule,
  onRefreshDraft,
}: CueSheetPanelProps) {
  const isMusicTemplate = template === 'dance' || template === 'musicvideo';
  const isEventTemplate = template === 'event';
  const pendingCount = rows.filter((row) => row.status !== 'done').length;
  const missingTimeCount = rows.filter(isMissingTime).length;
  const missingLocationCount = rows.filter(isMissingLocation).length;
  const missingContentCount = rows.filter(isMissingContent).length;
  const missingDurationCount = rows.filter(isMissingDuration).length;
  const missingReferenceCount = getMissingReferenceCount(rows, template);
  const missingCoreCount = missingTimeCount + missingLocationCount + missingContentCount + missingDurationCount + missingReferenceCount;
  const readyCueCount = Math.max(0, rows.length - rows.filter((row) => (
    isMissingTime(row) ||
    isMissingLocation(row) ||
    isMissingContent(row) ||
    isMissingDuration(row) ||
    (template === 'event'
      ? !row.gear && !row.focus
      : isMusicTemplate
        ? !row.reference || !row.shotSize || !row.focus
        : !row.reference)
  )).length);
  const referenceReadinessLabel = getReferenceReadinessLabel(template);
  const readinessItems = [
    { label: '시간', missing: missingTimeCount },
    { label: '장소', missing: missingLocationCount },
    { label: '내용', missing: missingContentCount + missingDurationCount },
    { label: referenceReadinessLabel, missing: missingReferenceCount },
  ];
  const nextFixLabel = missingReferenceCount > 0
    ? `${referenceReadinessLabel} ${missingReferenceCount}개 보강`
    : missingTimeCount > 0
      ? `시간 ${missingTimeCount}개 보강`
      : missingLocationCount > 0
        ? `장소 ${missingLocationCount}개 보강`
        : missingContentCount + missingDurationCount > 0
          ? `내용/분량 ${missingContentCount + missingDurationCount}개 보강`
          : rows.length > 0
            ? 'PDF 내보내기 가능'
            : '촬영표 먼저 만들기';

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-300">{templateLabel}</div>
            <h2 className="mt-1 text-3xl font-black text-neutral-100">{getCueSheetTitle(template)}</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-neutral-500">
              기획서와 촬영표를 같은 기준으로 읽어 실제 현장에서 볼 수 있는 큐시트로 정리합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
            {[
              { label: '총 큐', value: `${rows.length}` },
              { label: '예상 시간', value: `${totalMinutes}분` },
              { label: '미완성', value: `${pendingCount}` },
              { label: '소스', value: sourceLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/50 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                <div className="mt-1 text-base font-black text-neutral-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-neutral-900 bg-black/35 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-200">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-neutral-200">{sourceDetail}</div>
              <div className="mt-1 text-[11px] font-bold text-neutral-600">
                촬영표 {scenesCount}개 · 기획서 후보 {planningLineCount}줄 · {activeDayLabel}
              </div>
              {status && <div className="mt-1 text-[11px] font-black text-teal-200">{status}</div>}
            </div>
          </div>
          <div className="grid gap-2 sm:flex sm:shrink-0">
            <button type="button" onClick={onRefreshDraft} className="prepro-btn prepro-btn--secondary">
              <RefreshCw className="h-3.5 w-3.5" />
              자동 초안
            </button>
            <button
              type="button"
              onClick={onApplyDraft}
              disabled={!canApplyDraft}
              className="prepro-btn prepro-btn--primary"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              촬영표에 반영
            </button>
            <button
              type="button"
              onClick={onExportPDF}
              disabled={isExportingPdf || rows.length === 0}
              className="prepro-btn prepro-btn--quiet"
            >
              <Download className="h-3.5 w-3.5" />
              {pdfButtonText}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-900 bg-black/45 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  missingCoreCount === 0 && rows.length > 0
                    ? 'border-teal-300/25 bg-teal-300/10 text-teal-200'
                    : 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                }`}>
                  {missingCoreCount === 0 && rows.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-black text-neutral-100">큐시트 준비도</div>
                  <div className="mt-0.5 text-xs font-bold text-neutral-600">
                    바로 현장 공유 가능한 큐 {readyCueCount}/{rows.length}개 · 다음 액션: {nextFixLabel}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {readinessItems.map((item) => (
                  <div key={item.label} className={`rounded-xl border px-3 py-2 ${
                    item.missing === 0
                      ? 'border-neutral-800 bg-neutral-950 text-neutral-500'
                      : 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                  }`}>
                    <div className="font-black text-neutral-300">{item.label}</div>
                    <div className="mt-1 text-[11px] font-bold">
                      {item.missing === 0 ? '준비됨' : `${item.missing}개 누락`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" onClick={onGoSchedule} className="prepro-btn prepro-btn--secondary min-h-11 w-full justify-center px-5 text-sm lg:w-auto">
              <ArrowRight className="h-3.5 w-3.5" />
              촬영표에서 보강
            </button>
          </div>
        </div>
      </div>

      <div ref={pdfRef} className="pdf-export-root overflow-hidden rounded-2xl border border-neutral-900 bg-black lg:overflow-x-auto custom-scrollbar">
        <div className="border-b border-neutral-900 bg-neutral-950/90 px-5 py-5 lg:min-w-[1080px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-300">{templateLabel}</div>
              <h3 className="mt-1 text-2xl font-black text-neutral-100">{getCueSheetTitle(template)}</h3>
              <p className="mt-1 text-xs font-bold text-neutral-500">{activeDayLabel} · {sourceDetail}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right text-xs">
              {[
                { label: '큐', value: `${rows.length}` },
                { label: '예상', value: `${totalMinutes}분` },
                { label: '미완성', value: `${pendingCount}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/60 px-3 py-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                  <div className="mt-1 text-base font-black text-neutral-200">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12 text-center lg:min-w-[1080px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-500">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-lg font-black text-neutral-300">큐시트 후보가 아직 없습니다.</div>
            <p className="max-w-lg text-sm font-bold leading-relaxed text-neutral-600">
              기획서의 큐시트/식순 항목을 채우거나 촬영표에 {template === 'event' ? '프로그램' : '씬/컷'}을 추가하면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-neutral-900 bg-neutral-950 text-[11px] font-black text-neutral-500">
              {isMusicTemplate ? (
                <tr>
                  <th className="w-20 px-4 py-3">순서</th>
                  <th className="w-28 px-4 py-3">타임코드</th>
                  <th className="px-4 py-3">가사 / 구간</th>
                  <th className="w-28 px-4 py-3">샷</th>
                  <th className="w-36 px-4 py-3">포커스</th>
                  <th className="px-4 py-3">대형 / 안무</th>
                  <th className="w-36 px-4 py-3">레퍼런스</th>
                  <th className="w-24 px-4 py-3 text-right">분량</th>
                </tr>
              ) : isEventTemplate ? (
                <tr>
                  <th className="w-20 px-4 py-3">순서</th>
                  <th className="w-28 px-4 py-3">시간</th>
                  <th className="w-36 px-4 py-3">식순 구분</th>
                  <th className="w-44 px-4 py-3">장소</th>
                  <th className="px-4 py-3">진행 내용</th>
                  <th className="w-44 px-4 py-3">담당 / 장비</th>
                  <th className="w-36 px-4 py-3">비고</th>
                  <th className="w-24 px-4 py-3 text-right">분량</th>
                </tr>
              ) : (
                <tr>
                  <th className="w-20 px-4 py-3">순서</th>
                  <th className="w-32 px-4 py-3">시간</th>
                  <th className="w-32 px-4 py-3">씬 / 컷</th>
                  <th className="w-44 px-4 py-3">장소</th>
                  <th className="px-4 py-3">내용</th>
                  <th className="w-36 px-4 py-3">콘티 / 레퍼런스</th>
                  <th className="w-44 px-4 py-3">비고</th>
                  <th className="w-24 px-4 py-3 text-right">분량</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {rows.map((row) => (
                <tr key={row.id} className="bg-neutral-950/40 align-top text-neutral-300">
                  <td className="px-4 py-4 font-mono text-xs font-black text-neutral-500">{row.orderLabel}</td>
                  {isMusicTemplate ? (
                    <>
                      <td className="px-4 py-4 font-mono text-sm font-black text-teal-200">{row.timecode || row.timeLabel || '--:--'}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-neutral-100">{row.lyrics || row.content}</div>
                        {row.content !== row.lyrics && <div className="mt-1 text-xs font-bold text-neutral-600">{row.content}</div>}
                      </td>
                      <td className="px-4 py-4 text-xs font-black text-neutral-300">{row.shotSize || '-'}</td>
                      <td className="px-4 py-4 text-xs font-bold text-teal-200">{row.focus || '-'}</td>
                      <td className="px-4 py-4 text-xs font-bold leading-relaxed text-neutral-500">
                        {[row.formation, row.note].filter(Boolean).join(' · ') || '-'}
                      </td>
                      <td className="px-4 py-4">{row.reference ? <CueReferenceImage row={row} storyboardFallback={storyboardFallback} /> : <span className="text-xs font-bold text-neutral-700">없음</span>}</td>
                      <td className="px-4 py-4 text-right font-mono text-xs font-black text-neutral-500">{row.durationLabel}</td>
                    </>
                  ) : isEventTemplate ? (
                    <>
                      <td className="px-4 py-4 font-mono text-xs font-black text-neutral-400">{row.timeLabel}</td>
                      <td className="px-4 py-4 text-xs font-black text-amber-200">{row.section || row.sequenceLabel}</td>
                      <td className="px-4 py-4 text-sm font-bold text-neutral-200">{row.location}</td>
                      <td className="px-4 py-4 font-bold text-neutral-100">{row.content}</td>
                      <td className="px-4 py-4 text-xs font-bold leading-relaxed text-neutral-500">{row.gear || row.focus || '-'}</td>
                      <td className="px-4 py-4 text-xs font-bold leading-relaxed text-neutral-600">{row.note || '-'}</td>
                      <td className="px-4 py-4 text-right font-mono text-xs font-black text-neutral-500">{row.durationLabel}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 font-mono text-xs font-black text-neutral-400">{row.timeLabel}</td>
                      <td className="px-4 py-4 text-xs font-black text-neutral-200">{row.sequenceLabel}</td>
                      <td className="px-4 py-4 text-sm font-bold text-neutral-200">{row.location}</td>
                      <td className="px-4 py-4 font-bold text-neutral-100">{row.content}</td>
                      <td className="px-4 py-4">{row.reference ? <CueReferenceImage row={row} storyboardFallback={storyboardFallback} /> : <span className="text-xs font-bold text-neutral-700">없음</span>}</td>
                      <td className="px-4 py-4 text-xs font-bold leading-relaxed text-neutral-600">{row.note || '-'}</td>
                      <td className="px-4 py-4 text-right font-mono text-xs font-black text-neutral-500">{row.durationLabel}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function CueReferenceImage({
  row,
  storyboardFallback,
}: {
  row: CueSheetRow;
  storyboardFallback: (name: string) => string;
}) {
  const reference = row.reference || storyboardFallback(row.sequenceLabel);

  return (
    <div className="w-28 overflow-hidden rounded-lg border border-neutral-800 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reference}
        alt={row.sequenceLabel}
        className="aspect-video w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = storyboardFallback(reference);
        }}
      />
    </div>
  );
}
