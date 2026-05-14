'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import type { BreakItem, Scene, TemplateType } from '@/types/schedule';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock, GripVertical, Image as ImageIcon, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableRow({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const setStatus = (status: 'done' | 'ng' | 'pending') => {
    updateScene(scene.id, { status });
  };
  const isMusicTimelineRow = template === 'dance' || template === 'musicvideo';
  const musicSubjectLabel = template === 'musicvideo' ? '아티스트' : '포커스';
  const musicReferenceAlt = template === 'musicvideo' ? 'MV 레퍼런스' : '댄스 레퍼런스';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b transition-colors group ${
        isMusicTimelineRow
          ? 'border-teal-400/10 bg-teal-400/[0.018] hover:bg-teal-400/[0.045]'
          : 'border-neutral-900 hover:bg-neutral-950'
      } ${scene.status === 'done' ? 'opacity-50 grayscale-[0.35]' : ''}`}
    >
      <td className="px-4 py-3 text-center">
        <span className="pdf-order-index inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 px-1 text-[10px] font-black text-neutral-400">{rowNumber}</span>
        {isReportMode ? (
          <div className="flex flex-col gap-1 items-center" data-pdf-ignore="true" data-html2canvas-ignore="true">
            <button onClick={() => setStatus('done')} className={`p-1 rounded ${scene.status === 'done' ? 'text-green-500 bg-green-500/10' : 'text-neutral-600 hover:text-neutral-400'}`} title="완료">
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => setStatus('ng')} className={`p-1 rounded ${scene.status === 'ng' ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-neutral-400'}`} title="NG">
              <XCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setStatus('pending')} className={`p-1 rounded ${!scene.status || scene.status === 'pending' ? 'text-neutral-300 bg-neutral-700/60' : 'text-neutral-600 hover:text-neutral-400'}`} title="대기">
              <Circle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div {...attributes} {...listeners} data-pdf-ignore="true" data-html2canvas-ignore="true" className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-700 rounded transition-colors inline-block">
            <GripVertical className="w-4 h-4 text-neutral-600" />
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-mono">
        <div className="text-base font-black text-neutral-100">{scene.startTime ? format(scene.startTime, 'HH:mm') : '--:--'}</div>
        <div className="mt-0.5 text-xs font-bold text-neutral-600">{scene.endTime ? format(scene.endTime, 'HH:mm') : '--:--'} 종료</div>
      </td>

      {/* 템플릿별 동적 컬럼 렌더링 */}
      {template === 'film' && (
        <>
          <td className="px-4 py-3 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-[10px] mr-2 text-neutral-300">{scene.sceneNumber || '-'}</span>
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wide">{scene.intExt} / {scene.dayNight}</span>
              </div>
              {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-1">인원 · {scene.cast}</div>}
              {(scene.cutCount || scene.pageCount) && (
                <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                  {scene.cutCount ? `${scene.cutCount}컷 ` : ''} 
                  {scene.pageCount ? `(${scene.pageCount}p)` : ''}
                </div>
              )}
            </div>
          </td>
          <td className="px-4 py-3 font-medium">
            {scene.visualRef ? (
              <Image src={scene.visualRef} alt="콘티" width={64} height={36} priority unoptimized className="pdf-shot-frame w-16 aspect-video object-contain bg-white rounded border border-neutral-700" />
            ) : (
              <div className="pdf-shot-frame w-16 aspect-video bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
          </td>
        </>
      )}
      {template === 'event' && (
        <>
          <td className="px-4 py-3 font-medium">
            <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-xs">
              {scene.eventSection || '공통'}
            </span>
            {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-2">담당 · {scene.cast}</div>}
          </td>
          <td className="px-4 py-3 font-medium">
            {scene.visualRef ? (
              <Image src={scene.visualRef} alt="촬영 컷 이미지" width={64} height={36} priority unoptimized className="pdf-shot-frame w-16 aspect-video object-contain bg-white rounded border border-neutral-700" />
            ) : (
              <div className="pdf-shot-frame w-16 aspect-video bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
          </td>
        </>
      )}
      {isMusicTimelineRow && (
        <>
          <td className="px-4 py-3 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="mr-2 rounded border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 text-[10px] font-black text-teal-100">{scene.sceneNumber || '-'}</span>
                <span className="font-mono text-xs font-black text-teal-200">{scene.musicCue || '--:--'}</span>
              </div>
              {scene.lyrics && <div className="mt-1 max-w-[180px] truncate text-[10px] font-bold text-amber-300" title={scene.lyrics}>가사 · {scene.lyrics}</div>}
              {scene.focusMember && <div className="text-[10px] font-black text-teal-200">{musicSubjectLabel} · {scene.focusMember}</div>}
            </div>
          </td>
          <td className="px-4 py-3 font-medium">
            {scene.visualRef ? (
              <Image src={scene.visualRef} alt={musicReferenceAlt} width={80} height={45} priority unoptimized className="pdf-shot-frame w-20 aspect-video object-contain bg-white rounded border border-neutral-700" />
            ) : (
              <div className="pdf-shot-frame w-20 aspect-video bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
            <div className="mt-1 text-[10px] font-black text-neutral-400">{scene.shotSize || 'FS'} {scene.formation ? `· ${scene.formation}` : ''}</div>
          </td>
        </>
      )}
      {template === 'ad' && (
        <>
          <td className="px-4 py-3 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-[10px] mr-2 text-neutral-300">{scene.sceneNumber || '-'}</span>
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wide">{scene.intExt} / {scene.dayNight}</span>
              </div>
              {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-1">모델 · {scene.cast}</div>}
              {scene.cutCount && <div className="text-[10px] text-neutral-500 font-medium mt-0.5">{scene.cutCount}컷</div>}
            </div>
          </td>
          <td className="px-4 py-3 font-medium">
            {scene.visualRef ? (
              <Image src={scene.visualRef} alt="콘티" width={64} height={36} priority unoptimized className="pdf-shot-frame w-16 aspect-video object-contain bg-white rounded border border-neutral-700" />
            ) : (
              <div className="pdf-shot-frame w-16 aspect-video bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
            {scene.clientMemo && <div className="text-[10px] text-amber-500/80 mt-1 max-w-[120px] truncate" title={scene.clientMemo}>메모 · {scene.clientMemo}</div>}
          </td>
        </>
      )}

      <td className="px-4 py-3 font-bold text-neutral-300">{scene.location}</td>
      <td className="px-4 py-3 text-neutral-400">
        <div className="text-sm font-medium leading-relaxed text-neutral-300">{scene.description}</div>
        {template === 'event' && scene.cameraGear && (
          <div className="mt-1 text-xs font-bold text-neutral-500">장비 · {scene.cameraGear}</div>
        )}
        {isMusicTimelineRow && (
          <div className="mt-1 space-y-0.5 text-xs font-bold text-neutral-500">
            {scene.choreoNote && <div>{template === 'musicvideo' ? '연출' : '안무'} · {scene.choreoNote}</div>}
            {scene.cameraGear && <div>카메라 · {scene.cameraGear}</div>}
          </div>
        )}
        {template === 'ad' && scene.lightingNote && (
          <div className="mt-1 text-xs font-bold text-amber-500/70">톤 · {scene.lightingNote}</div>
        )}
        {template === 'film' && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              scene.props && ['소품', scene.props],
              scene.costume && ['의상', scene.costume],
              scene.soundNote && ['사운드', scene.soundNote],
              scene.specialInstruction && ['지시', scene.specialInstruction],
              scene.insertNote && ['인서트', scene.insertNote],
            ].filter(Boolean).map((item) => {
              const [label, value] = item as string[];
              return (
                <span key={`${label}-${value}`} className="max-w-[180px] truncate rounded-full border border-teal-400/15 bg-teal-400/5 px-2 py-1 text-[10px] font-bold text-teal-100/70" title={value}>
                  {label} · {value}
                </span>
              );
            })}
          </div>
        )}
        {isReportMode && (
          <div className="mt-3 grid gap-2 rounded-xl border border-neutral-800 bg-black/40 p-3" data-pdf-ignore="true" data-html2canvas-ignore="true">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                placeholder="테이크 메모"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.takeNote || ''}
                onChange={(e) => updateScene(scene.id, { takeNote: e.target.value })}
              />
              <input
                placeholder="렌즈/필터/노출"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.lensNote || ''}
                onChange={(e) => updateScene(scene.id, { lensNote: e.target.value })}
              />
              <input
                placeholder="슬레이트/연결/기술 이슈"
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-[11px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.slateNote || ''}
                onChange={(e) => updateScene(scene.id, { slateNote: e.target.value })}
              />
            </div>
          </div>
        )}
        {!isReportMode && (
          <div className="mt-2 flex gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
            <button onClick={onEdit} className="rounded border border-neutral-700 px-2 py-1 text-[10px] font-bold text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300">편집</button>
            <button onClick={onDuplicate} className="rounded border border-neutral-700 px-2 py-1 text-[10px] font-bold text-neutral-400 hover:border-neutral-500 hover:text-neutral-200">복제</button>
            <button onClick={onDelete} className="rounded border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10">삭제</button>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-neutral-500">{scene.estimatedMinutes}분</td>
    </tr>
  );
}

export function SortableBreakRow({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeLabel: Record<BreakItem['type'], string> = {
    meal: '식사',
    move: '이동',
    setup: '세팅',
    rest: '휴식',
    custom: '기타',
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-amber-500/20 bg-amber-500/5 text-amber-200/90 group hover:bg-amber-500/10">
      <td className="px-4 py-3 text-center">
        <span className="pdf-order-index inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1 text-[10px] font-black text-amber-300">{rowNumber}</span>
        <div {...attributes} {...listeners} data-pdf-ignore="true" data-html2canvas-ignore="true" className="inline-flex cursor-grab items-center justify-center rounded p-1 transition-colors hover:bg-amber-500/10 active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-amber-400" />
        </div>
      </td>
      <td className="px-4 py-3 font-mono">
        <div className="text-base font-black text-amber-300">{item.startTime ? format(item.startTime, 'HH:mm') : '--:--'}</div>
        <div className="mt-0.5 text-xs font-bold text-amber-200/50">{item.endTime ? format(item.endTime, 'HH:mm') : '--:--'} 종료</div>
      </td>
      <td className="px-4 py-3 font-bold" colSpan={2}>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-300">
          <Clock className="w-3 h-3" />
          {typeLabel[item.type]}
        </span>
      </td>
      <td className="px-4 py-3 font-bold text-neutral-300">{locationName || '-'}</td>
      <td className="px-4 py-3">
        <div className="font-bold">{item.label}</div>
        <div className="mt-2 flex gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
          <button onClick={onEdit} className="rounded border border-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/10">편집</button>
          <button onClick={onDelete} className="rounded border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10">삭제</button>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-amber-300">{item.estimatedMinutes}분</td>
    </tr>
  );

}
