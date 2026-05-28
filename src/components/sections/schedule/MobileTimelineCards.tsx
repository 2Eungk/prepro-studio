'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import type { BreakItem, Scene, TemplateType } from '@/types/schedule';
import { format } from 'date-fns';
import { Clock, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

type ScheduleStatusFilter = 'all' | 'pending' | 'done' | 'ng';

type ReportStats = {
  done: number;
  pending: number;
  ng: number;
  completionRate: number;
};

export function MobileTimelineSceneCard({
  scene,
  template,
  isReportMode,
  rowNumber,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  scene: Scene;
  template: TemplateType;
  isReportMode: boolean;
  rowNumber: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { updateScene } = useScheduleStore();
  const isMusicTimelineRow = template === 'dance' || template === 'musicvideo';
  const referenceAlt = template === 'musicvideo' ? 'MV 레퍼런스' : template === 'dance' ? '댄스 레퍼런스' : template === 'event' ? '촬영 컷 이미지' : '콘티';
  const primaryMeta = isMusicTimelineRow
    ? `${scene.sceneNumber || '-'} · ${scene.musicCue || '--:--'}`
    : template === 'event'
      ? scene.eventSection || '공통'
      : `${scene.sceneNumber || '-'} · ${scene.intExt || '-'} / ${scene.dayNight || '-'}`;
  const secondaryMeta = isMusicTimelineRow
    ? [scene.lyrics && `가사 · ${scene.lyrics}`, scene.focusMember && `${template === 'musicvideo' ? '아티스트' : '포커스'} · ${scene.focusMember}`].filter(Boolean).join(' · ')
    : template === 'ad'
      ? [scene.cast && `모델 · ${scene.cast}`, scene.clientMemo && `메모 · ${scene.clientMemo}`].filter(Boolean).join(' · ')
      : [scene.cast && `인원 · ${scene.cast}`, scene.cutCount && `${scene.cutCount}컷`, scene.pageCount && `${scene.pageCount}p`].filter(Boolean).join(' · ');

  const setStatus = (status: 'done' | 'ng' | 'pending') => {
    updateScene(scene.id, { status });
  };
  const statusLabel = scene.status === 'done' ? '완료' : scene.status === 'ng' ? 'NG' : '대기';
  const statusButtons = [
    { label: '완료', value: 'done' as const, helper: 'OK 컷', className: scene.status === 'done' ? 'border-green-400/60 bg-green-500/15 text-green-100 ring-2 ring-green-400/20' : 'border-neutral-800 bg-black text-neutral-500' },
    { label: 'NG', value: 'ng' as const, helper: '재확인', className: scene.status === 'ng' ? 'border-red-400/60 bg-red-500/15 text-red-100 ring-2 ring-red-400/20' : 'border-neutral-800 bg-black text-neutral-500' },
    { label: '대기', value: 'pending' as const, helper: '남김', className: !scene.status || scene.status === 'pending' ? 'border-neutral-500 bg-neutral-900 text-neutral-100 ring-2 ring-neutral-500/15' : 'border-neutral-800 bg-black text-neutral-500' },
  ];

  return (
    <article className={`rounded-xl border p-4 ${
      scene.status === 'done'
        ? 'border-green-500/20 bg-green-500/[0.03] opacity-70'
        : scene.status === 'ng'
          ? 'border-red-500/25 bg-red-500/[0.04]'
          : isMusicTimelineRow
            ? 'border-teal-400/18 bg-teal-400/[0.035]'
            : 'border-neutral-900 bg-neutral-950/80'
    }`}>
      <div className="flex items-start gap-3">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-neutral-700 bg-black text-[11px] font-black text-neutral-300">
          {rowNumber}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-black text-neutral-100">{scene.startTime ? format(scene.startTime, 'HH:mm') : '--:--'}</span>
            <span className="text-xs font-bold text-neutral-700">→</span>
            <span className="font-mono text-xs font-bold text-neutral-500">{scene.endTime ? format(scene.endTime, 'HH:mm') : '--:--'}</span>
            <span className="rounded-md border border-neutral-800 bg-black px-2 py-1 text-[10px] font-black text-neutral-500">{scene.estimatedMinutes}분</span>
          </div>
          <div className="mt-2 text-xs font-black text-teal-200">{primaryMeta}</div>
          {secondaryMeta && <div className="mt-1 line-clamp-2 text-[11px] font-bold leading-relaxed text-neutral-500">{secondaryMeta}</div>}
        </div>
        <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-white">
          {scene.visualRef ? (
            <Image
              src={scene.visualRef}
              alt={referenceAlt}
              width={192}
              height={108}
              priority
              unoptimized
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900">
              <ImageIcon className="h-5 w-5 text-neutral-700" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-neutral-900 bg-black/45 px-3 py-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">장소</div>
        <div className="mt-1 text-sm font-black text-neutral-200">{scene.location || '장소 미정'}</div>
      </div>

      <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-300">{scene.description}</p>

      {(scene.choreoNote || scene.cameraGear || scene.lightingNote || scene.props || scene.costume || scene.soundNote || scene.insertNote) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            isMusicTimelineRow && scene.choreoNote && [template === 'musicvideo' ? '연출' : '안무', scene.choreoNote],
            isMusicTimelineRow && scene.cameraGear && ['카메라', scene.cameraGear],
            template === 'ad' && scene.lightingNote && ['톤', scene.lightingNote],
            template === 'film' && scene.props && ['소품', scene.props],
            template === 'film' && scene.costume && ['의상', scene.costume],
            template === 'film' && scene.soundNote && ['사운드', scene.soundNote],
            template === 'film' && scene.insertNote && ['인서트', scene.insertNote],
          ].filter(Boolean).map((item) => {
            const [label, value] = item as string[];
            return (
              <span key={`${label}-${value}`} className="max-w-full truncate rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-neutral-400">
                {label} · {value}
              </span>
            );
          })}
        </div>
      )}

      {isReportMode ? (
        <div className="mt-4 space-y-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
          <div className="rounded-xl border border-neutral-900 bg-black/45 px-3 py-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">현재 상태</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{statusLabel}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {statusButtons.map((item) => {
              const selected = (scene.status || 'pending') === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value)}
                  className={`min-h-14 rounded-xl border px-2 text-left transition ${item.className}`}
                  aria-pressed={selected}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] font-bold opacity-70">{selected ? '선택됨' : item.helper}</span>
                </button>
              );
            })}
          </div>
          <details className="rounded-xl border border-neutral-900 bg-black/40">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-black text-neutral-400">
              현장 메모 / 렌즈 / 슬레이트
            </summary>
            <div className="grid gap-2 border-t border-neutral-900 p-3">
              <input
                placeholder="테이크 메모"
                className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-[12px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.takeNote || ''}
                onChange={(event) => updateScene(scene.id, { takeNote: event.target.value })}
              />
              <input
                placeholder="렌즈 / 필터 / 노출"
                className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-[12px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.lensNote || ''}
                onChange={(event) => updateScene(scene.id, { lensNote: event.target.value })}
              />
              <input
                placeholder="슬레이트 / 연결 / 기술 이슈"
                className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-[12px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.slateNote || ''}
                onChange={(event) => updateScene(scene.id, { slateNote: event.target.value })}
              />
            </div>
          </details>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
          <button onClick={onEdit} className="prepro-btn prepro-btn--secondary min-h-11">편집</button>
          <button onClick={onDuplicate} className="prepro-btn prepro-btn--quiet min-h-11">복제</button>
          <button onClick={onDelete} className="prepro-btn prepro-btn--danger min-h-11">삭제</button>
        </div>
      )}
    </article>
  );
}

export function MobileFieldControlBar({
  focusScene,
  focusRowNumber,
  nextBreakLabel,
  copyItemPlural,
  reportStats,
  isReportMode,
  statusFilter,
  onToggleReportMode,
  onSetStatusFilter,
  onGoReport,
}: {
  focusScene?: Scene;
  focusRowNumber?: number;
  nextBreakLabel?: string;
  copyItemPlural: string;
  reportStats: ReportStats;
  isReportMode: boolean;
  statusFilter: ScheduleStatusFilter;
  onToggleReportMode: () => void;
  onSetStatusFilter: (filter: ScheduleStatusFilter) => void;
  onGoReport: () => void;
}) {
  const focusStatus = focusScene?.status || 'pending';
  const statusLabel = focusStatus === 'done' ? '완료' : focusStatus === 'ng' ? 'NG' : '대기';
  const goFocusScene = () => {
    if (!focusScene) return;
    document.getElementById(`mobile-scene-${focusScene.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="sticky top-[4.75rem] z-20 rounded-2xl border border-teal-400/25 bg-neutral-950/95 p-3 shadow-2xl shadow-black/45 backdrop-blur lg:hidden" data-pdf-ignore="true" data-html2canvas-ignore="true">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-teal-200">
            <span>현장 모드</span>
            <span className="rounded-full border border-neutral-800 bg-black px-2 py-0.5 text-neutral-500">{reportStats.completionRate}%</span>
          </div>
          <div className="mt-1 text-sm font-black text-neutral-100">
            {focusScene
              ? `다음 확인: #${focusRowNumber} ${focusScene.startTime ? format(focusScene.startTime, 'HH:mm') : '--:--'}`
              : `등록된 ${copyItemPlural} 없음`}
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-relaxed text-neutral-500">
            {focusScene ? focusScene.description || focusScene.location || '내용 미정' : '일정을 추가하면 모바일 체크 보드가 활성화됩니다.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleReportMode}
          className={`h-10 shrink-0 rounded-xl border px-3 text-[11px] font-black ${
            isReportMode
              ? 'border-teal-300/50 bg-teal-400/15 text-teal-100'
              : 'border-neutral-800 bg-black text-neutral-400'
          }`}
        >
          {isReportMode ? '체크 ON' : '체크'}
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-900">
        <div className="h-full rounded-full bg-teal-300" style={{ width: `${reportStats.completionRate}%` }} />
      </div>
      <details className="group/mobile-field-filters mt-2 rounded-xl border border-neutral-900 bg-black/30" open={statusFilter !== 'all'}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[10px] font-black text-neutral-400 [&::-webkit-details-marker]:hidden">
          <span>상태 필터</span>
          <span className="truncate text-neutral-600 group-open/mobile-field-filters:hidden">
            대기 {reportStats.pending} · NG {reportStats.ng} · 완료 {reportStats.done}
          </span>
          <span className="hidden text-neutral-600 group-open/mobile-field-filters:inline">접기</span>
        </summary>
        <div className="space-y-2 border-t border-neutral-900 p-2">
          <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
            <span className="rounded-full border border-green-400/20 bg-green-500/10 px-2 py-1 text-green-200">완료 {reportStats.done}</span>
            <span className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-red-200">NG {reportStats.ng}</span>
            <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-300">대기 {reportStats.pending}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'pending', label: '대기', value: reportStats.pending, tone: statusFilter === 'pending' ? 'border-neutral-500 bg-neutral-900 text-white' : 'border-neutral-800 bg-black text-neutral-500' },
              { id: 'ng', label: 'NG', value: reportStats.ng, tone: statusFilter === 'ng' ? 'border-red-400/50 bg-red-500/10 text-red-200' : 'border-neutral-800 bg-black text-neutral-500' },
              { id: 'done', label: '완료', value: reportStats.done, tone: statusFilter === 'done' ? 'border-green-400/50 bg-green-500/10 text-green-200' : 'border-neutral-800 bg-black text-neutral-500' },
            ] satisfies Array<{ id: ScheduleStatusFilter; label: string; value: number; tone: string }>).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSetStatusFilter(statusFilter === item.id ? 'all' : item.id)}
                className={`min-h-11 rounded-xl border px-2 text-left transition-colors ${item.tone}`}
              >
                <span className="block text-[10px] font-black">{item.label}</span>
                <span className="mt-0.5 block text-lg font-black">{item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </details>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-900 bg-black/45 px-3 py-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">상태</div>
          <div className="mt-1 text-xs font-black text-neutral-300">{statusLabel}</div>
        </div>
        <button
          type="button"
          onClick={goFocusScene}
          disabled={!focusScene}
          className="rounded-xl border border-teal-400/25 bg-teal-400/10 px-3 py-2 text-left text-xs font-black text-teal-100 disabled:border-neutral-900 disabled:bg-black/45 disabled:text-neutral-600"
        >
          다음 확인으로 이동
          <span className="mt-1 block truncate text-[10px] font-bold text-teal-100/60">{focusScene ? `#${focusRowNumber} ${statusLabel}` : '확인할 항목 없음'}</span>
        </button>
        <button
          type="button"
          onClick={onGoReport}
          className="rounded-xl border border-neutral-800 bg-black px-3 py-2 text-left text-xs font-black text-neutral-300"
        >
          리포트 보기
          <span className="mt-1 block truncate text-[10px] font-bold text-neutral-600">{nextBreakLabel || '후속 조치 확인'}</span>
        </button>
      </div>
    </section>
  );
}

export function MobileTimelineBreakCard({
  item,
  locationName,
  rowNumber,
  onEdit,
  onDelete,
}: {
  item: BreakItem;
  locationName: string;
  rowNumber: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeLabel: Record<BreakItem['type'], string> = {
    meal: '식사',
    move: '이동',
    setup: '세팅',
    rest: '휴식',
    custom: '기타',
  };

  return (
    <article className="rounded-xl border border-amber-500/25 bg-amber-500/[0.055] p-4 text-amber-100">
      <div className="flex items-start gap-3">
        <span
          className="flex h-7 min-w-9 items-center justify-center rounded-full border border-amber-500/30 bg-black px-1.5 text-[10px] font-black text-amber-300"
          title={`타임라인 ${rowNumber}번째 시간 블록`}
        >
          시간
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-black text-amber-300">{item.startTime ? format(item.startTime, 'HH:mm') : '--:--'}</span>
            <span className="text-xs font-bold text-amber-200/40">→</span>
            <span className="font-mono text-xs font-bold text-amber-200/55">{item.endTime ? format(item.endTime, 'HH:mm') : '--:--'}</span>
            <span className="rounded-md border border-amber-500/25 bg-black px-2 py-1 text-[10px] font-black text-amber-300">{item.estimatedMinutes}분</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-300">
            <Clock className="h-3 w-3" />
            {typeLabel[item.type]}
          </div>
        </div>
      </div>
      <div className="mt-3 text-base font-black text-amber-100">{item.label}</div>
      <div className="mt-1 text-xs font-bold text-amber-100/50">{locationName || '장소 미정'}</div>
      <div className="mt-4 flex flex-wrap gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
        <button onClick={onEdit} className="prepro-btn prepro-btn--warm min-h-11">편집</button>
        <button onClick={onDelete} className="prepro-btn prepro-btn--danger min-h-11">삭제</button>
      </div>
    </article>
  );
}
