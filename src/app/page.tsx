'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { BreakItem, Person, ProductionLocation, ScheduleState, Scene, ShootDay, TemplateType } from '@/types/schedule';
import { format, addMinutes, subMinutes } from 'date-fns';
import { Plus, GripVertical, Clock, Film, MonitorPlay, Camera, Image as ImageIcon, Download, Cloud, Sunrise, Sunset, MapPin, Calendar as CalendarIcon, CheckCircle2, XCircle, Circle, FileText, Umbrella, Wind, Sparkles, Upload, Database, Brain, Save, FolderOpen, Share2, Search } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { storyboardDb, recommendShots } from '@/data/storyboardDb';
import AdBanner from '@/components/AdBanner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const storyboardCategoryOptions = [
  { id: 'ALL', label: '전체' },
  { id: 'WIDE', label: '와이드' },
  { id: 'MEDIUM', label: '미디엄' },
  { id: 'CLOSEUP', label: '클로즈업' },
  { id: 'ANGLE', label: '앵글' },
  { id: 'LENS', label: '렌즈' },
  { id: 'COMPOSITION', label: '구도' },
  { id: 'SUBJECT', label: '피사체' },
  { id: 'LIGHTING', label: '조명' },
] as const;

const locationTypeLabels: Record<ProductionLocation['type'], string> = {
  studio: '스튜디오',
  indoor: '실내',
  outdoor: '실외',
};

const permitStatusLabels: Record<ProductionLocation['permitStatus'], string> = {
  ok: '완료',
  pending: '진행중',
  none: '미확인',
};

const personCategoryLabels: Record<Person['category'], string> = {
  cast: '출연진',
  crew: '스태프',
};

const weatherQuickLocations = [
  { label: '서울', value: '서울' },
  { label: '부산', value: '부산' },
  { label: '제주', value: '제주' },
  { label: '강릉', value: '강릉' },
  { label: '도쿄', value: 'Tokyo' },
  { label: '오사카', value: 'Osaka' },
];

const SortableRow = ({
  scene,
  template,
  isReportMode,
  rowNumber,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  scene: Scene;
  template: string;
  isReportMode: boolean;
  rowNumber: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
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

  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-neutral-800 group hover:bg-neutral-800/30 transition-colors ${scene.status === 'done' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
      <td className="px-4 py-4 text-center">
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
      <td className="px-4 py-4 font-mono text-cyan-400">
        {scene.startTime && format(scene.startTime, 'HH:mm')} - {scene.endTime && format(scene.endTime, 'HH:mm')}
      </td>

      {/* 템플릿별 동적 컬럼 렌더링 */}
      {template === 'film' && (
        <>
          <td className="px-4 py-4 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-[10px] mr-2 text-neutral-300">{scene.sceneNumber || '-'}</span>
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wide">{scene.intExt} / {scene.dayNight}</span>
              </div>
              {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-1">👤 {scene.cast}</div>}
              {(scene.cutCount || scene.pageCount) && (
                <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                  {scene.cutCount ? `${scene.cutCount}컷 ` : ''} 
                  {scene.pageCount ? `(${scene.pageCount}p)` : ''}
                </div>
              )}
            </div>
          </td>
          <td className="px-4 py-4 font-medium">
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
          <td className="px-4 py-4 font-medium">
            <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-xs">
              {scene.eventSection || '공통'}
            </span>
            {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-2">👤 {scene.cast}</div>}
          </td>
          <td className="px-4 py-4 font-medium">
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
      {template === 'ad' && (
        <>
          <td className="px-4 py-4 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-[10px] mr-2 text-neutral-300">{scene.sceneNumber || '-'}</span>
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wide">{scene.intExt} / {scene.dayNight}</span>
              </div>
              {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-1">👤 {scene.cast}</div>}
              {scene.cutCount && <div className="text-[10px] text-neutral-500 font-medium mt-0.5">{scene.cutCount}컷</div>}
            </div>
          </td>
          <td className="px-4 py-4 font-medium">
            {scene.visualRef ? (
              <Image src={scene.visualRef} alt="콘티" width={64} height={36} priority unoptimized className="pdf-shot-frame w-16 aspect-video object-contain bg-white rounded border border-neutral-700" />
            ) : (
              <div className="pdf-shot-frame w-16 aspect-video bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
            {scene.clientMemo && <div className="text-[10px] text-amber-500/80 mt-1 max-w-[120px] truncate" title={scene.clientMemo}>📝 {scene.clientMemo}</div>}
          </td>
        </>
      )}

      <td className="px-4 py-4 text-neutral-300">{scene.location}</td>
      <td className="px-4 py-4 text-neutral-400">
        <div className="text-sm">{scene.description}</div>
        {template === 'event' && scene.cameraGear && (
          <div className="text-xs text-neutral-500 mt-1 flex gap-1">🎥 {scene.cameraGear}</div>
        )}
        {template === 'ad' && scene.lightingNote && (
          <div className="text-xs text-amber-500/70 mt-1 flex gap-1">💡 {scene.lightingNote}</div>
        )}
        {!isReportMode && (
          <div className="mt-2 flex gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
            <button onClick={onEdit} className="rounded border border-neutral-700 px-2 py-1 text-[10px] font-bold text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300">편집</button>
            <button onClick={onDuplicate} className="rounded border border-neutral-700 px-2 py-1 text-[10px] font-bold text-neutral-400 hover:border-cyan-500/40 hover:text-cyan-300">복제</button>
            <button onClick={onDelete} className="rounded border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10">삭제</button>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-right text-neutral-500">{scene.estimatedMinutes}분</td>
    </tr>
  );
}

const SortableBreakRow = ({
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
}) => {
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
      <td className="px-4 py-4 text-center">
        <span className="pdf-order-index inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1 text-[10px] font-black text-amber-300">{rowNumber}</span>
        <div {...attributes} {...listeners} data-pdf-ignore="true" data-html2canvas-ignore="true" className="inline-flex cursor-grab items-center justify-center rounded p-1 transition-colors hover:bg-amber-500/10 active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-amber-400" />
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-amber-300">
        {item.startTime && format(item.startTime, 'HH:mm')} - {item.endTime && format(item.endTime, 'HH:mm')}
      </td>
      <td className="px-4 py-4 font-bold" colSpan={2}>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black text-amber-300">
          <Clock className="w-3 h-3" />
          {typeLabel[item.type]}
        </span>
      </td>
      <td className="px-4 py-4 text-neutral-400">{locationName || '-'}</td>
      <td className="px-4 py-4">
        <div className="font-bold">{item.label}</div>
        <div className="mt-2 flex gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
          <button onClick={onEdit} className="rounded border border-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/10">편집</button>
          <button onClick={onDelete} className="rounded border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/10">삭제</button>
        </div>
      </td>
      <td className="px-4 py-4 text-right text-amber-300">{item.estimatedMinutes}분</td>
    </tr>
  );
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sameText = (a?: string, b?: string) =>
  (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

const storyboardFallback = (name: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225">
      <rect width="400" height="225" fill="#ffffff"/>
      <rect x="18" y="18" width="364" height="189" rx="8" fill="none" stroke="#111111" stroke-width="8"/>
      <path d="M58 158 C96 102 122 126 154 84 C190 38 244 82 280 56 C314 32 342 62 356 86" fill="none" stroke="#111111" stroke-width="7" stroke-linecap="round"/>
      <circle cx="112" cy="94" r="22" fill="none" stroke="#111111" stroke-width="7"/>
      <path d="M74 174 L146 132 L204 174 L254 122 L332 174" fill="none" stroke="#111111" stroke-width="7" stroke-linejoin="round"/>
      <text x="200" y="202" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#111111">${escapeXml(name)}</text>
    </svg>
  `)}`;

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) {
      if ('decode' in image) {
        await image.decode().catch(() => undefined);
      }
      return;
    }

    await new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });

    if ('decode' in image) {
      await image.decode().catch(() => undefined);
    }
  }));
};

const unsupportedColorPattern = /(oklab|oklch|lab|lch|color-mix|color\()/i;

const isTransparentColor = (value: string) => {
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  return !normalized || normalized === 'transparent' || normalized === 'rgba(0,0,0,0)' || normalized === 'rgb(0 0 0 / 0)';
};

const toHtml2CanvasSafeColor = (value: string, fallback: string, doc: Document) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (isTransparentColor(trimmed)) return 'rgba(0, 0, 0, 0)';
  if (!unsupportedColorPattern.test(trimmed)) return trimmed;

  const canvas = doc.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#000000';
    context.fillStyle = trimmed;

    if (context.fillStyle && !unsupportedColorPattern.test(context.fillStyle)) {
      return context.fillStyle;
    }
  }

  return fallback;
};

const preparePdfCloneForHtml2Canvas = (clonedDoc: Document) => {
  const root = clonedDoc.querySelector('.pdf-export-root.is-pdf-export') as HTMLElement | null;
  const view = clonedDoc.defaultView;
  if (!root || !view) return;

  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  nodes.forEach((node) => {
    const computed = view.getComputedStyle(node);
    const isRoot = node === root;
    const isShotFrame = node.classList.contains('pdf-shot-frame') || Boolean(node.closest('.pdf-shot-frame'));
    const backgroundFallback = isRoot ? '#0a0a0a' : isShotFrame ? '#ffffff' : isTransparentColor(computed.backgroundColor) ? 'rgba(0, 0, 0, 0)' : '#171717';

    node.style.setProperty('color', toHtml2CanvasSafeColor(computed.color, '#e5e5e5', clonedDoc), 'important');
    node.style.setProperty('background-color', toHtml2CanvasSafeColor(computed.backgroundColor, backgroundFallback, clonedDoc), 'important');
    node.style.setProperty('border-top-color', toHtml2CanvasSafeColor(computed.borderTopColor, '#262626', clonedDoc), 'important');
    node.style.setProperty('border-right-color', toHtml2CanvasSafeColor(computed.borderRightColor, '#262626', clonedDoc), 'important');
    node.style.setProperty('border-bottom-color', toHtml2CanvasSafeColor(computed.borderBottomColor, '#262626', clonedDoc), 'important');
    node.style.setProperty('border-left-color', toHtml2CanvasSafeColor(computed.borderLeftColor, '#262626', clonedDoc), 'important');
    node.style.setProperty('outline-color', toHtml2CanvasSafeColor(computed.outlineColor, '#4f46e5', clonedDoc), 'important');
    node.style.setProperty('text-decoration-color', toHtml2CanvasSafeColor(computed.textDecorationColor, '#e5e5e5', clonedDoc), 'important');
    node.style.setProperty('background-image', 'none', 'important');
    node.style.setProperty('box-shadow', 'none', 'important');
    node.style.setProperty('text-shadow', 'none', 'important');
    node.style.setProperty('filter', 'none', 'important');
    node.style.setProperty('backdrop-filter', 'none', 'important');

    if (node instanceof SVGElement) {
      node.style.setProperty('fill', toHtml2CanvasSafeColor(computed.fill, 'currentColor', clonedDoc), 'important');
      node.style.setProperty('stroke', toHtml2CanvasSafeColor(computed.stroke, 'currentColor', clonedDoc), 'important');
    }
  });
};

type ProjectSnapshot = Pick<
  ScheduleState,
  'template' | 'shootingDate' | 'location' | 'callTime' | 'shootingStartTime' | 'days' | 'locations' | 'people' | 'breaks' | 'scenes' | 'timelineOrder'
>;

const SHARE_HASH_PREFIX = '#prepro=';

const encodeShareSnapshot = (snapshot: ProjectSnapshot) => {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeShareSnapshot = (encoded: string): ProjectSnapshot => {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes));
};

const readSnapshotFromHash = () => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith(SHARE_HASH_PREFIX)) return null;

  try {
    return decodeShareSnapshot(window.location.hash.slice(SHARE_HASH_PREFIX.length));
  } catch (error) {
    console.error('Invalid share snapshot:', error);
    return null;
  }
};

type WeatherDaily = {
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  windspeed_10m_max?: number[];
  sunrise?: string[];
  sunset?: string[];
};

type WeatherResult = {
  daily: WeatherDaily;
  resolvedName: string;
};

type WeatherTarget = {
  latitude: number;
  longitude: number;
  label: string;
};

type WeatherLocationCandidate = WeatherTarget & {
  query: string;
};

type AnalyzedScene = Omit<Scene, 'id' | 'startTime' | 'endTime'>;

type ParsedScriptScene = Omit<AnalyzedScene, 'cast'> & {
  cast: Set<string>;
  sceneNumber: string;
  location: string;
  description: string;
  estimatedMinutes: number;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
};

type SceneFormState = Omit<AnalyzedScene, 'cutCount' | 'pageCount'> & {
  cutCount: number | '';
  pageCount: number | '';
  sceneNumber: string;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
  cast: string;
  eventSection: string;
  cameraGear: string;
  visualRef: string;
  lightingNote: string;
  clientMemo: string;
};

type TimelineRow =
  | { id: string; type: 'scene'; scene: Scene }
  | { id: string; type: 'break'; breakItem: BreakItem };

type OptimizationMetric = {
  before: number;
  after: number;
};

type OptimizationSummary = {
  locationMoves: OptimizationMetric;
  setupChanges: OptimizationMetric;
  castChanges: OptimizationMetric;
  preservedBreaks: number;
  previousOrder: string[];
};

type ScheduleStatusFilter = 'all' | 'pending' | 'done' | 'ng';

const getSceneLocationKey = (scene: Scene) =>
  scene.locationId || scene.location.trim().toLowerCase() || 'unknown-location';

const getSceneCastKey = (scene: Scene) =>
  (scene.cast || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .sort()
    .join('|');

const analyzeSceneFlow = (orderedScenes: Scene[]) => {
  return orderedScenes.reduce(
    (metrics, scene, index) => {
      if (index === 0) return metrics;
      const previous = orderedScenes[index - 1];

      return {
        locationMoves: metrics.locationMoves + (getSceneLocationKey(previous) === getSceneLocationKey(scene) ? 0 : 1),
        setupChanges: metrics.setupChanges + (previous.intExt === scene.intExt && previous.dayNight === scene.dayNight ? 0 : 1),
        castChanges: metrics.castChanges + (getSceneCastKey(previous) === getSceneCastKey(scene) ? 0 : 1),
      };
    },
    { locationMoves: 0, setupChanges: 0, castChanges: 0 },
  );
};

const orderedScenesFromState = (
  scenes: Scene[],
  breaks: BreakItem[],
  timelineOrder: string[],
) => {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const validIds = new Set([...scenes.map((scene) => scene.id), ...breaks.map((item) => item.id)]);
  const order = [
    ...timelineOrder.filter((id) => validIds.has(id)),
    ...scenes.map((scene) => scene.id).filter((id) => !timelineOrder.includes(id)),
  ];

  return order.flatMap((id) => {
    const scene = sceneById.get(id);
    return scene ? [scene] : [];
  });
};

const getWindSpeed = (daily: WeatherDaily) =>
  daily.wind_speed_10m_max?.[0] ?? daily.windspeed_10m_max?.[0] ?? 0;

const weatherNumber = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

const localWeatherTargets: { patterns: RegExp[]; target: WeatherTarget }[] = [
  { patterns: [/gangnam/i, /강남구?/, /강남역/], target: { latitude: 37.4979, longitude: 127.0276, label: 'Gangnam-gu, Seoul' } },
  { patterns: [/mapo/i, /마포구?/], target: { latitude: 37.5663, longitude: 126.9019, label: 'Mapo-gu, Seoul' } },
  { patterns: [/yeongdeungpo/i, /영등포구?/, /한강/], target: { latitude: 37.5263, longitude: 126.8963, label: 'Yeongdeungpo-gu, Seoul' } },
  { patterns: [/seoul/i, /서울/], target: { latitude: 37.5665, longitude: 126.9780, label: 'Seoul, KR' } },
];

const resolveLocalWeatherTarget = (query: string) =>
  localWeatherTargets.find((item) => item.patterns.some((pattern) => pattern.test(query)))?.target;

const isGenericSeoulQuery = (query?: string) =>
  /^(seoul|서울|서울시|서울특별시)$/i.test((query || '').trim());

const getLocationWeatherQuery = (locationItem: ProductionLocation) => {
  if (locationItem.weatherQuery && !isGenericSeoulQuery(locationItem.weatherQuery)) return locationItem.weatherQuery;
  return [locationItem.address, locationItem.name, locationItem.weatherQuery].filter(Boolean).join(' ');
};

const getProductionLocationWeatherTarget = (locationItem: ProductionLocation): WeatherTarget | undefined => {
  if (typeof locationItem.weatherLatitude !== 'number' || typeof locationItem.weatherLongitude !== 'number') return undefined;
  return {
    latitude: locationItem.weatherLatitude,
    longitude: locationItem.weatherLongitude,
    label: locationItem.weatherLabel || locationItem.weatherQuery || locationItem.name,
  };
};

const normalizedLocationToken = (value?: string) => (value || '').trim().toLowerCase();

const getPreferredWeatherLocationValue = (locationItem: Partial<ProductionLocation>) =>
  [
    locationItem.weatherQuery,
    locationItem.weatherLabel,
    locationItem.address,
    locationItem.name,
  ].find((value) => value?.trim())?.trim() || '';

const matchesWeatherLocationSelection = (currentLocation: string, locationItem?: Partial<ProductionLocation> | null) => {
  if (!locationItem) return false;
  const current = normalizedLocationToken(currentLocation);
  if (!current) return false;

  return [
    locationItem.weatherQuery,
    locationItem.weatherLabel,
    locationItem.address,
    locationItem.name,
  ].some((value) => normalizedLocationToken(value) === current);
};

const searchWeatherLocationCandidates = async (query: string): Promise<WeatherLocationCandidate[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const local = resolveLocalWeatherTarget(trimmed);
  const localCandidates: WeatherLocationCandidate[] = local ? [{ ...local, query: trimmed }] : [];

  const openMeteoSearch = fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=ko&format=json`)
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results || []).map((geo: { latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }) => ({
        latitude: geo.latitude,
        longitude: geo.longitude,
        label: [geo.name, geo.admin1, geo.country_code].filter(Boolean).join(', '),
        query: trimmed,
      }));
    })
    .catch(() => [] as WeatherLocationCandidate[]);

  const nominatimSearch = fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&q=${encodeURIComponent(trimmed)}`)
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return (data || []).map((place: { lat: string; lon: string; display_name: string; name?: string }) => ({
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        label: place.display_name || place.name || trimmed,
        query: trimmed,
      })).filter((candidate: WeatherLocationCandidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
    })
    .catch(() => [] as WeatherLocationCandidate[]);

  const [openMeteoCandidates, nominatimCandidates] = await Promise.all([openMeteoSearch, nominatimSearch]);

  const seen = new Set<string>();
  return [...localCandidates, ...openMeteoCandidates, ...nominatimCandidates].filter((candidate) => {
    const key = `${candidate.latitude.toFixed(3)}:${candidate.longitude.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchWeatherDaily = async (location: string, date: string, fixedTarget?: WeatherTarget): Promise<WeatherResult> => {
  const query = location.trim();
  if (!query && !fixedTarget) throw new Error('날씨 조회 위치가 비어 있습니다.');

  let target = fixedTarget || resolveLocalWeatherTarget(query);

  if (!target) {
    const [candidate] = await searchWeatherLocationCandidates(query);
    if (!candidate) throw new Error('위치를 찾지 못했습니다.');
    target = candidate;
  }

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${date}&end_date=${date}`,
  );
  if (!weatherRes.ok) throw new Error('날씨 데이터를 불러오지 못했습니다.');

  const weatherData = await weatherRes.json();
  if (!weatherData.daily?.sunrise?.[0]) throw new Error('해당 날짜의 날씨 데이터가 없습니다.');

  return {
    daily: weatherData.daily,
    resolvedName: target.label,
  };
};

const useWeatherDaily = (location: string, date: string, target?: WeatherTarget) => {
  const [data, setData] = useState<WeatherDaily | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const targetLatitude = target?.latitude;
  const targetLongitude = target?.longitude;
  const targetLabel = target?.label;

  useEffect(() => {
    let ignore = false;
    const fixedTarget = typeof targetLatitude === 'number' && typeof targetLongitude === 'number'
      ? { latitude: targetLatitude, longitude: targetLongitude, label: targetLabel || location }
      : undefined;

    const fetchWeather = async () => {
      if (!location.trim() && !fixedTarget) {
        setData(null);
        setResolvedName('');
        setError('');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await fetchWeatherDaily(location, date, fixedTarget);
        if (ignore) return;
        setData(result.daily);
        setResolvedName(result.resolvedName);
      } catch (e) {
        if (ignore) return;
        console.error(e);
        setData(null);
        setResolvedName('');
        setError(e instanceof Error ? e.message : '날씨 데이터를 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    const timer = setTimeout(fetchWeather, 800);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [location, date, targetLatitude, targetLongitude, targetLabel]);

  return { data, resolvedName, loading, error };
};

const WeatherWidget = ({ location, date, target }: { location: string, date: string, target?: WeatherTarget }) => {
  const { data, loading, error } = useWeatherDaily(location, date, target);

  if (loading) return <div className="bg-neutral-900 h-24 rounded-2xl border border-neutral-800 animate-pulse flex items-center justify-center text-neutral-600 text-sm italic">날씨 정보 불러오는 중...</div>;
  if (error) return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm font-bold text-red-300">{error}</div>;
  const sunriseAt = data?.sunrise?.[0];
  const sunsetAt = data?.sunset?.[0];
  if (!data || !sunriseAt || !sunsetAt) return null;

  const maxTemp = weatherNumber(data.temperature_2m_max?.[0]);
  const minTemp = weatherNumber(data.temperature_2m_min?.[0]);
  const precipitation = weatherNumber(data.precipitation_probability_max?.[0]);
  const windSpeed = weatherNumber(getWindSpeed(data));

  return (
    <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800/60 backdrop-blur-sm flex flex-wrap gap-6 items-center justify-between">
      <div className="flex flex-wrap gap-8 items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 border border-indigo-500/20">
             <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-0.5">Weather Intel</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-200">{maxTemp ?? '-'}°C</span>
              <span className="text-neutral-600">/</span>
              <span className="text-sm text-neutral-400">{minTemp ?? '-'}°C</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Umbrella className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">강수 확률</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{precipitation ?? '-'}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Wind className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">최대 풍속</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{windSpeed ?? '-'}km/h</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-10">
        <div className="flex items-center gap-3">
          <Sunrise className="w-5 h-5 text-amber-500/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunrise</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(sunriseAt), 'HH:mm')}</p>
            <p className="text-[10px] text-blue-400 mt-1">블루: {format(subMinutes(new Date(sunriseAt), 30), 'HH:mm')}~</p>
            <p className="text-[10px] text-amber-400">골든: {format(new Date(sunriseAt), 'HH:mm')}~{format(addMinutes(new Date(sunriseAt), 60), 'HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sunset className="w-5 h-5 text-indigo-400/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunset</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(sunsetAt), 'HH:mm')}</p>
            <p className="text-[10px] text-amber-400 mt-1">골든: {format(subMinutes(new Date(sunsetAt), 60), 'HH:mm')}~</p>
            <p className="text-[10px] text-blue-400">블루: {format(new Date(sunsetAt), 'HH:mm')}~{format(addMinutes(new Date(sunsetAt), 30), 'HH:mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LocationWeatherSummary = ({ query, date, target }: { query: string; date: string; target?: WeatherTarget }) => {
  const { data, resolvedName, loading, error } = useWeatherDaily(query, date, target);
  const maxTemp = weatherNumber(data?.temperature_2m_max?.[0]);
  const minTemp = weatherNumber(data?.temperature_2m_min?.[0]);
  const precipitation = weatherNumber(data?.precipitation_probability_max?.[0]);

  if (!query.trim() && !target) {
    return (
      <div className="mt-1 text-xs font-bold text-neutral-600">
        조회 위치 없음
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-800" />
    );
  }

  if (error || !data) {
    return (
      <div className="mt-1 truncate text-xs font-bold text-red-400" title={error || query}>
        조회 실패 · {query}
      </div>
    );
  }

  return (
    <div className="mt-1 min-w-0">
      <div className="flex items-center gap-2 font-bold text-neutral-200">
        <Cloud className="h-3.5 w-3.5 text-indigo-300" />
        <span>{maxTemp ?? '-'}° / {minTemp ?? '-'}°</span>
        <span className="text-neutral-600">·</span>
        <Umbrella className="h-3.5 w-3.5 text-blue-400" />
        <span>{precipitation ?? '-'}%</span>
      </div>
      <div className="mt-1 truncate text-[10px] font-bold text-neutral-600" title={resolvedName || query}>
        {resolvedName || query}
      </div>
    </div>
  );
};

const ScriptAnalyzer = ({ onExtract, onClose }: { onExtract: (scenes: AnalyzedScene[]) => void, onClose: () => void }) => {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    
    // 시나리오 분석 로직 (Regex 기반의 Intelligent Parser)
    setTimeout(() => {
      const extractedScenes: ParsedScriptScene[] = [];
      const lines = script.split('\n');
      let currentScene: ParsedScriptScene | null = null;

      lines.forEach(line => {
        // S# 패턴 매칭: S#1. 거실 (낮)
        const sceneMatch = line.match(/S#\s*(\d+)\.?\s*([^(]+)(?:\(([^)]+)\))?/);
        if (sceneMatch) {
          if (currentScene) extractedScenes.push(currentScene);
          
          const loc = sceneMatch[2].trim();
          const dn = sceneMatch[3]?.toLowerCase();
          
          currentScene = {
            sceneNumber: `S#${sceneMatch[1]}`,
            location: loc,
            dayNight: dn?.includes('밤') ? 'NIGHT' : dn?.includes('저녁') || dn?.includes('해질') ? 'SUNSET' : 'DAY',
            description: '',
            cast: new Set(),
            estimatedMinutes: 60,
            intExt: loc.includes('마당') || loc.includes('공원') || loc.includes('길') ? 'EXT' : 'INT'
          };
        } else if (currentScene) {
          // 대사 주체 추출: 철수: 안녕하세요
          const castMatch = line.match(/^([^:(\s]{1,10})\s*:/);
          if (castMatch) {
            currentScene.cast.add(castMatch[1].trim());
          } else if (line.trim() && !line.includes(':') && line.length > 5) {
            // 지문/설명을 description에 누적
            currentScene.description += line.trim() + ' ';
          }
        }
      });
      if (currentScene) extractedScenes.push(currentScene);

      const finalScenes: AnalyzedScene[] = extractedScenes.map(s => ({
        ...s,
        cast: Array.from(s.cast).join(', '),
        description: s.description.substring(0, 80).trim() + (s.description.length > 80 ? '...' : '')
      }));

      onExtract(finalScenes);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setScript(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-neutral-900 border border-indigo-500/30 rounded-2xl p-8 mb-10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-100">
            <Brain className="w-6 h-6 text-indigo-400" /> 시나리오 AI 분석기
          </h3>
          <p className="text-sm text-neutral-500 mt-1">텍스트를 붙여넣거나 시나리오 파일(.txt)을 업로드하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".txt,.json" 
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-neutral-700"
          >
            <Upload className="w-3.5 h-3.5" /> 파일 불러오기
          </button>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative group"
      >
        <textarea
          placeholder="여기에 시나리오를 붙여넣으세요. 또는 파일을 이곳에 끌어다 놓으세요. (예: S#1. 거실 (낮) ...)"
          className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono mb-4 custom-scrollbar group-hover:border-neutral-700"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/0 rounded-xl pointer-events-none group-hover:border-indigo-500/20 transition-all"></div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={analyze}
          disabled={isAnalyzing || !script.trim()}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              시나리오 분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> AI 분석 시작
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { 
    template, setTemplate, 
    shootingDate, setShootingDate,
    location, setLocation, setWeatherTarget,
    weatherLabel, weatherLatitude, weatherLongitude,
    callTime, setCallTime, 
    shootingStartTime, setShootingStartTime, 
    days, locations, people, breaks,
    addShootDay, updateShootDay, deleteShootDay,
    scenes, addScene, addScenes, reorderTimeline,
    updateScene, deleteScene, duplicateScene, addBreak, updateBreak, deleteBreak,
    addProductionLocation, updateProductionLocation, deleteProductionLocation,
    addPerson, updatePerson, deletePerson,
    restoreTimelineOrder,
    timelineOrder,
    loadSampleData, importData, resetProject
  } = useScheduleStore();
  const [isReportMode, setIsReportMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'locations' | 'people' | 'storyboard' | 'report'>('schedule');
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [extractedScenes, setExtractedScenes] = useState<AnalyzedScene[]>([]);
  const [showSceneForm, setShowSceneForm] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editingLocation, setEditingLocation] = useState<ProductionLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingBreak, setEditingBreak] = useState<BreakItem | null>(null);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [activeDayId, setActiveDayId] = useState('');
  const [optimizationSummary, setOptimizationSummary] = useState<OptimizationSummary | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [pdfStatus, setPdfStatus] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<ScheduleStatusFilter>('all');
  const [scheduleLocationFilter, setScheduleLocationFilter] = useState('all');
  const pdfRef = useRef<HTMLDivElement>(null);
  const reportPdfRef = useRef<HTMLDivElement>(null);
  const callSheetPdfRef = useRef<HTMLDivElement>(null);
  const shareImportCheckedRef = useRef(false);

  const emptyLocationForm: Omit<ProductionLocation, 'id'> = {
    name: '',
    address: '',
    type: 'indoor' as ProductionLocation['type'],
    permitStatus: 'pending' as ProductionLocation['permitStatus'],
    contact: '',
    notes: '',
    weatherQuery: '',
    weatherLabel: '',
    weatherLatitude: undefined,
    weatherLongitude: undefined,
  };

  const emptyPersonForm = {
    name: '',
    category: 'cast' as Person['category'],
    role: '',
    phone: '',
    callTime: '',
    notes: '',
  };

  const emptyBreakForm = {
    type: 'meal' as BreakItem['type'],
    label: '식사 / 휴식',
    estimatedMinutes: 60,
    locationId: '',
  };

  const [locationForm, setLocationForm] = useState(emptyLocationForm);
  const [weatherLocationResults, setWeatherLocationResults] = useState<WeatherLocationCandidate[]>([]);
  const [isSearchingWeatherLocation, setIsSearchingWeatherLocation] = useState(false);
  const [weatherLocationError, setWeatherLocationError] = useState('');
  const [globalWeatherResults, setGlobalWeatherResults] = useState<WeatherLocationCandidate[]>([]);
  const [isSearchingGlobalWeather, setIsSearchingGlobalWeather] = useState(false);
  const [globalWeatherError, setGlobalWeatherError] = useState('');
  const [personForm, setPersonForm] = useState(emptyPersonForm);
  const [breakForm, setBreakForm] = useState(emptyBreakForm);

  const emptySceneForm: SceneFormState = {
    location: '', locationId: '', description: '', estimatedMinutes: 30,
    sceneNumber: '', intExt: 'INT', dayNight: 'DAY', cast: '', cutCount: '', pageCount: '',
    eventSection: '', cameraGear: '',
    visualRef: '', lightingNote: '', clientMemo: ''
  };

  const [newSceneParams, setNewSceneParams] = useState<SceneFormState>(emptySceneForm);

  const fallbackDay: ShootDay = useMemo(() => ({
    id: 'default-day',
    date: shootingDate,
    callTime,
    firstShotTime: shootingStartTime,
    locationIds: [],
  }), [callTime, shootingDate, shootingStartTime]);
  const projectDays = useMemo(() => days.length ? days : [fallbackDay], [days, fallbackDay]);
  const selectedDayId = activeDayId && projectDays.some((day) => day.id === activeDayId) ? activeDayId : projectDays[0]?.id;
  const activeDay = projectDays.find((day) => day.id === selectedDayId) || projectDays[0];
  const activeDayIndex = Math.max(0, projectDays.findIndex((day) => day.id === activeDay.id));
  const activeDayScenes = useMemo(
    () => scenes.filter((scene) => (scene.dayId || projectDays[0]?.id) === activeDay.id),
    [activeDay.id, projectDays, scenes],
  );
  const activeDayBreaks = useMemo(
    () => breaks.filter((item) => (item.dayId || projectDays[0]?.id) === activeDay.id),
    [activeDay.id, breaks, projectDays],
  );
  const activeShootingDate = activeDay.date || shootingDate;
  const activeCallTime = activeDay.callTime ?? (activeDayIndex === 0 ? callTime : null);
  const activeShootingStartTime = activeDay.firstShotTime ?? (activeDayIndex === 0 ? shootingStartTime : null);

  const recommendations = useMemo(() => recommendShots(newSceneParams.description), [newSceneParams.description]);
  const [sbCategory, setSbCategory] = useState('ALL');
  const [sbSearch, setSbSearch] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const reportStats = useMemo(() => {
    const done = scenes.filter((scene) => scene.status === 'done').length;
    const ng = scenes.filter((scene) => scene.status === 'ng').length;
    const pending = scenes.length - done - ng;
    const totalMinutes = scenes.reduce((sum, scene) => sum + Number(scene.estimatedMinutes || 0), 0);
    const doneMinutes = scenes
      .filter((scene) => scene.status === 'done')
      .reduce((sum, scene) => sum + Number(scene.estimatedMinutes || 0), 0);
    const ngMinutes = scenes
      .filter((scene) => scene.status === 'ng')
      .reduce((sum, scene) => sum + Number(scene.estimatedMinutes || 0), 0);
    const pendingMinutes = totalMinutes - doneMinutes - ngMinutes;
    const completionRate = scenes.length ? Math.round((done / scenes.length) * 100) : 0;
    const castCount = people.filter((person) => person.category === 'cast').length;
    const crewCount = people.filter((person) => person.category === 'crew').length;
    const pageCount = scenes.reduce((sum, scene) => sum + Number(scene.pageCount || 0), 0);
    const cutCount = scenes.reduce((sum, scene) => sum + Number(scene.cutCount || 0), 0);

    return { done, ng, pending, totalMinutes, doneMinutes, ngMinutes, pendingMinutes, completionRate, castCount, crewCount, pageCount, cutCount };
  }, [people, scenes]);

  const reportLocationStats = useMemo(() => {
    const grouped = new Map<string, {
      name: string;
      total: number;
      done: number;
      ng: number;
      pending: number;
      minutes: number;
    }>();

    scenes.forEach((scene) => {
      const name = scene.location || '장소 미정';
      const current = grouped.get(name) || { name, total: 0, done: 0, ng: 0, pending: 0, minutes: 0 };
      current.total += 1;
      current.minutes += Number(scene.estimatedMinutes || 0);
      if (scene.status === 'done') current.done += 1;
      else if (scene.status === 'ng') current.ng += 1;
      else current.pending += 1;
      grouped.set(name, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        completionRate: item.total ? Math.round((item.done / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.ng - a.ng || b.pending - a.pending || b.total - a.total);
  }, [scenes]);

  const reportActionItems = useMemo(() => {
    return scenes
      .filter((scene) => scene.status === 'ng' || !scene.status || scene.status === 'pending')
      .map((scene) => ({
        scene,
        priority: scene.status === 'ng' ? '필수' : '확인',
        action: scene.status === 'ng'
          ? (template === 'event' ? '현장 확인 / 보충 촬영 검토' : template === 'ad' ? '재촬영 또는 대체 컷 확보' : '재촬영 필요 여부 확인')
          : (template === 'event' ? '미진행 프로그램 확인' : template === 'ad' ? '미촬영 컷 확인' : '미촬영 씬 확인'),
      }));
  }, [scenes, template]);

  const callSheetPeople = useMemo(() => {
    return [...people]
      .map((person) => {
        const assignedScenes = scenes.filter((scene) => scene.castIds?.includes(person.id) || scene.crewIds?.includes(person.id));
        const firstScene = assignedScenes
          .filter((scene) => scene.startTime)
          .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0))[0];
        const firstLocation = firstScene?.location || assignedScenes[0]?.location || locations[0]?.name || '';

        return {
          person,
          assignedCount: assignedScenes.length,
          firstLocation,
          firstStartTime: firstScene?.startTime,
          missingContact: !person.phone?.trim(),
          missingCallTime: !person.callTime?.trim(),
        };
      })
      .sort((a, b) => {
        const callA = a.person.callTime || '99:99';
        const callB = b.person.callTime || '99:99';
        return callA.localeCompare(callB) || a.person.category.localeCompare(b.person.category) || a.person.name.localeCompare(b.person.name);
      });
  }, [locations, people, scenes]);

  const callSheetStats = useMemo(() => {
    const missingCallTime = callSheetPeople.filter((item) => item.missingCallTime).length;
    const missingContact = callSheetPeople.filter((item) => item.missingContact).length;
    const earliestCall = callSheetPeople.find((item) => item.person.callTime)?.person.callTime || (callTime ? format(callTime, 'HH:mm') : '미정');

    return { missingCallTime, missingContact, earliestCall };
  }, [callSheetPeople, callTime]);

  const timelineStats = useMemo(() => {
    const sceneMinutes = activeDayScenes.reduce((sum, scene) => sum + Number(scene.estimatedMinutes || 0), 0);
    const breakMinutes = activeDayBreaks.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0);
    const totalMinutes = sceneMinutes + breakMinutes;
    const wrapTime = activeShootingStartTime && totalMinutes > 0 ? addMinutes(activeShootingStartTime, totalMinutes) : null;
    const callToWrapMinutes = activeCallTime && wrapTime
      ? Math.max(0, Math.round((wrapTime.getTime() - activeCallTime.getTime()) / 60000))
      : totalMinutes;
    const risk = callToWrapMinutes >= 720 ? 'critical' : callToWrapMinutes >= 600 ? 'warning' : 'normal';

    return {
      sceneMinutes,
      breakMinutes,
      totalMinutes,
      callToWrapMinutes,
      wrapTime,
      risk,
    };
  }, [activeCallTime, activeDayBreaks, activeDayScenes, activeShootingStartTime]);

  const copy = useMemo(() => {
    if (template === 'ad') {
      return {
        item: '컷',
        itemPlural: '컷',
        addItem: '컷 추가',
        addItemClose: '컷 추가 닫기',
        editItemClose: '컷 편집 닫기',
        scheduleTitle: '광고 촬영 플랜',
        infoColumn: '컷 정보',
        contentColumn: '키 메시지 / 액션',
        locationItemCount: '컷',
        emptyHint: '제품 컷, 모델 사용 컷, 인서트 컷을 직접 추가하세요.',
        totalItemLabel: '총 컷',
        pageLabel: '촬영 컷수',
        peopleLabel: '모델/출연',
        storyboardLabel: '콘티',
        storyboardDescription: `${storyboardDb.length}종 시네마틱 앵글 DB를 검색하고 광고 컷에 연결할 수 있습니다.`,
        formTitle: editingScene ? '컷 편집' : '새 컷 추가',
        modeLabel: '광고 모드',
        locationWeatherButton: '입력한 촬영 장소를 날씨 위치로 사용',
        descriptionLabel: '컷 내용 / 핵심 메시지',
        descriptionPlaceholder: '예: 제품 히어로 컷, 사용 장면, 디테일 인서트, CTA 엔드카드 등',
        eventSectionLabel: '구간',
        gearLabel: '촬영 장비',
        addResult: '전체 촬영 플랜에 추가하기',
        analyzerResult: 'AI 분석 결과',
      };
    }

    if (template === 'event') {
      return {
        item: '프로그램',
        itemPlural: '프로그램',
        addItem: '프로그램 추가',
        addItemClose: '프로그램 추가 닫기',
        editItemClose: '프로그램 편집 닫기',
        scheduleTitle: '행사 운영표',
        infoColumn: '구간 정보',
        contentColumn: '진행 내용',
        locationItemCount: '프로그램',
        emptyHint: '프로그램을 직접 추가하거나 행사 식순을 정리해 넣으세요.',
        totalItemLabel: '총 프로그램',
        pageLabel: '운영 시간',
        peopleLabel: '진행/참석자',
        storyboardLabel: '샷 플랜',
        storyboardDescription: `${storyboardDb.length}종 촬영 앵글 DB를 검색하고 프로그램 커버리지에 연결할 수 있습니다.`,
        formTitle: editingScene ? '프로그램 편집' : '새 프로그램 추가',
        modeLabel: '행사 모드',
        locationWeatherButton: '입력한 행사 장소를 날씨 위치로 사용',
        descriptionLabel: '진행 내용 / 촬영 커버리지',
        descriptionPlaceholder: '예: VIP 입장, 오프닝 멘트, 포토월 스케치, 객석 리액션 등',
        eventSectionLabel: '식순 구분',
        gearLabel: '촬영 장비',
        addResult: '전체 운영표에 추가하기',
        analyzerResult: 'AI 분석 결과',
      };
    }

    return {
      item: '씬',
      itemPlural: '씬',
      addItem: '씬 추가',
      addItemClose: '씬 추가 닫기',
      editItemClose: '씬 편집 닫기',
      scheduleTitle: '오늘의 일정표',
      infoColumn: '씬 정보',
      contentColumn: '상세 내용',
      locationItemCount: '씬',
      emptyHint: '씬을 직접 추가하거나 시나리오에서 자동 추출하세요.',
      totalItemLabel: '총 씬',
      pageLabel: '총 페이지',
      peopleLabel: '출연진',
      storyboardLabel: '콘티',
      storyboardDescription: `${storyboardDb.length}종 시네마틱 앵글 DB를 검색하고 씬 추가 시 선택할 수 있습니다.`,
      formTitle: editingScene ? '씬 편집' : '새 씬 추가',
      modeLabel: '영화 모드',
      locationWeatherButton: '입력한 씬 장소를 날씨 위치로 사용',
      descriptionLabel: '내용 / 촬영 설명',
      descriptionPlaceholder: '해당 장면에 대한 상세 촬영 내용을 입력하세요.',
      eventSectionLabel: '구간',
      gearLabel: '촬영 장비',
      addResult: '전체 일정에 추가하기',
      analyzerResult: 'AI 분석 결과',
    };
  }, [editingScene, template]);

  const readinessChecks = useMemo(() => {
    const pendingPermits = locations.filter((item) => item.permitStatus === 'pending' || item.permitStatus === 'none').length;
    const outdoorWithoutWeather = locations.filter((item) => item.type === 'outdoor' && (!item.weatherLatitude || !item.weatherLongitude)).length;
    const scenesWithoutStoryboard = scenes.filter((scene) => !scene.visualRef).length;
    const scenesWithoutLocation = scenes.filter((scene) => !scene.location?.trim()).length;
    const scenesWithoutPeople = scenes.filter((scene) => !scene.cast?.trim() && (!scene.castIds || scene.castIds.length === 0)).length;

    return [
      {
        id: 'schedule',
        label: `${copy.itemPlural} 등록`,
        detail: scenes.length > 0 ? `${scenes.length}개 ${copy.itemPlural} 준비됨` : `${copy.itemPlural}이 아직 없습니다`,
        status: scenes.length > 0 ? 'ok' : 'critical',
      },
      {
        id: 'permit',
        label: '장소 허가',
        detail: pendingPermits > 0 ? `${pendingPermits}개 장소 허가 확인 필요` : '허가 상태 확인 완료',
        status: pendingPermits > 0 ? 'warning' : 'ok',
      },
      {
        id: 'people',
        label: '콜타임 / 연락처',
        detail: callSheetStats.missingCallTime || callSheetStats.missingContact
          ? `콜 미정 ${callSheetStats.missingCallTime}명 · 연락처 누락 ${callSheetStats.missingContact}명`
          : '콜타임과 연락처 확인 완료',
        status: callSheetStats.missingCallTime || callSheetStats.missingContact ? 'warning' : 'ok',
      },
      {
        id: 'storyboard',
        label: copy.storyboardLabel,
        detail: scenesWithoutStoryboard > 0 ? `${scenesWithoutStoryboard}개 ${copy.itemPlural} 이미지 없음` : `${copy.storyboardLabel} 연결 완료`,
        status: scenesWithoutStoryboard > 0 ? 'warning' : 'ok',
      },
      {
        id: 'weather',
        label: '야외 날씨 위치',
        detail: outdoorWithoutWeather > 0 ? `야외 장소 ${outdoorWithoutWeather}개 위치 보정 필요` : '날씨 조회 위치 확인 완료',
        status: outdoorWithoutWeather > 0 ? 'warning' : 'ok',
      },
      {
        id: 'duration',
        label: '운영 시간',
        detail: timelineStats.totalMinutes > 0
          ? `${timelineStats.totalMinutes}분 · ${timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '종료 미정'} 종료 예상`
          : '운영 시간이 아직 없습니다',
        status: timelineStats.risk === 'critical' ? 'critical' : timelineStats.risk === 'warning' ? 'warning' : timelineStats.totalMinutes > 0 ? 'ok' : 'warning',
      },
      {
        id: 'metadata',
        label: '필수 입력',
        detail: scenesWithoutLocation || scenesWithoutPeople
          ? `장소 미입력 ${scenesWithoutLocation}개 · 인원 미연결 ${scenesWithoutPeople}개`
          : '필수 입력 확인 완료',
        status: scenesWithoutLocation > 0 ? 'critical' : scenesWithoutPeople > 0 ? 'warning' : 'ok',
      },
    ] satisfies { id: string; label: string; detail: string; status: 'ok' | 'warning' | 'critical' }[];
  }, [callSheetStats.missingCallTime, callSheetStats.missingContact, copy.itemPlural, copy.storyboardLabel, locations, scenes, timelineStats.risk, timelineStats.totalMinutes, timelineStats.wrapTime]);

  const readinessSummary = useMemo(() => {
    const critical = readinessChecks.filter((item) => item.status === 'critical').length;
    const warning = readinessChecks.filter((item) => item.status === 'warning').length;
    const ok = readinessChecks.length - critical - warning;
    const status = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'ok';

    return { critical, warning, ok, status };
  }, [readinessChecks]);

  const templateLabel = template === 'event' ? '행사/스케치' : template === 'ad' ? '광고/브랜디드' : '영화/드라마';
  const pdfKindLabel = activeTab === 'report' || isReportMode ? '결과 리포트' : copy.scheduleTitle;
  const pdfButtonText = (fallback: string) => isExportingPdf ? 'PDF 생성 중...' : pdfStatus || fallback;

  const reportSceneGroups = useMemo(() => ({
    done: scenes.filter((scene) => scene.status === 'done'),
    ng: scenes.filter((scene) => scene.status === 'ng'),
    pending: scenes.filter((scene) => !scene.status || scene.status === 'pending'),
  }), [scenes]);

  const filteredStoryboards = useMemo(() => {
    const normalizedSearch = sbSearch.trim().toLowerCase();

    return storyboardDb.filter(sb => {
      const matchesCategory = sbCategory === 'ALL' || sb.category === sbCategory;
      const haystack = [
        sb.name,
        sb.description,
        sb.category,
        ...sb.keywords,
      ].join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [sbCategory, sbSearch]);

  const selectedStoryboard = useMemo(
    () => storyboardDb.find((shot) => shot.url === newSceneParams.visualRef),
    [newSceneParams.visualRef],
  );

  const editorStoryboardOptions = useMemo(() => {
    const addUnique = (list: typeof storyboardDb, shot?: (typeof storyboardDb)[number]) => {
      if (shot && !list.some((item) => item.id === shot.id)) list.push(shot);
    };

    if (sbSearch.trim() || sbCategory !== 'ALL') {
      return filteredStoryboards.slice(0, 12);
    }

    const starterIds = template === 'event'
      ? ['sb_15', 'sb_69', 'sb_75', 'sb_76', 'sb_123', 'sb_127']
      : template === 'ad'
        ? ['sb_11', 'sb_47', 'sb_56', 'sb_76', 'sb_86', 'sb_130']
        : ['sb_06', 'sb_08', 'sb_15', 'sb_67', 'sb_70', 'sb_123'];

    const compactList: typeof storyboardDb = [];
    addUnique(compactList, selectedStoryboard);
    recommendations.forEach((shot) => addUnique(compactList, shot));
    starterIds.forEach((id) => addUnique(compactList, storyboardDb.find((shot) => shot.id === id)));

    return compactList.slice(0, 8);
  }, [filteredStoryboards, recommendations, sbCategory, sbSearch, selectedStoryboard, template]);

  const timelineRows = useMemo<TimelineRow[]>(() => {
    const sceneById = new Map(activeDayScenes.map((scene) => [scene.id, scene]));
    const breakById = new Map(activeDayBreaks.map((item) => [item.id, item]));
    const validIds = new Set([...sceneById.keys(), ...breakById.keys()]);
    const order = [
      ...timelineOrder.filter((id) => validIds.has(id)),
      ...activeDayScenes.map((scene) => scene.id).filter((id) => !timelineOrder.includes(id)),
      ...activeDayBreaks.map((item) => item.id).filter((id) => !timelineOrder.includes(id)),
    ];

    return order.reduce<TimelineRow[]>((rows, id) => {
      const scene = sceneById.get(id);
      if (scene) return [...rows, { id, type: 'scene', scene }];
      const breakItem = breakById.get(id);
      if (breakItem) return [...rows, { id, type: 'break', breakItem }];
      return rows;
    }, []);
  }, [activeDayBreaks, activeDayScenes, timelineOrder]);

  const isScheduleFiltered = Boolean(scheduleSearch.trim()) || scheduleStatusFilter !== 'all' || scheduleLocationFilter !== 'all';

  const filteredTimelineRows = useMemo(() => {
    const normalizedSearch = scheduleSearch.trim().toLowerCase();

    return timelineRows.filter((row) => {
      if (row.type === 'break') {
        const breakLocation = locations.find((item) => item.id === row.breakItem.locationId)?.name || '';
        const matchesLocation = scheduleLocationFilter === 'all' || row.breakItem.locationId === scheduleLocationFilter;
        const haystack = [row.breakItem.label, breakLocation, row.breakItem.type].join(' ').toLowerCase();
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

        return scheduleStatusFilter === 'all' && matchesLocation && matchesSearch;
      }

      const scene = row.scene;
      const status = scene.status || 'pending';
      const matchesStatus = scheduleStatusFilter === 'all' || status === scheduleStatusFilter;
      const matchesLocation = scheduleLocationFilter === 'all' || scene.locationId === scheduleLocationFilter || scene.location === locations.find((item) => item.id === scheduleLocationFilter)?.name;
      const haystack = [
        scene.sceneNumber,
        scene.eventSection,
        scene.location,
        scene.description,
        scene.cast,
        scene.cameraGear,
        scene.lightingNote,
        scene.clientMemo,
        scene.intExt,
        scene.dayNight,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

      return matchesStatus && matchesLocation && matchesSearch;
    });
  }, [locations, scheduleLocationFilter, scheduleSearch, scheduleStatusFilter, timelineRows]);

  const filteredSceneCount = filteredTimelineRows.filter((row) => row.type === 'scene').length;

  const resetScheduleFilters = () => {
    setScheduleSearch('');
    setScheduleStatusFilter('all');
    setScheduleLocationFilter('all');
  };

  const handleOptimizeSchedule = () => {
    const beforeState = useScheduleStore.getState();
    const previousOrder = [...beforeState.timelineOrder];
    const daySceneIds = new Set(beforeState.scenes.filter((scene) => (scene.dayId || projectDays[0]?.id) === activeDay.id).map((scene) => scene.id));
    const dayBreakIds = new Set(beforeState.breaks.filter((item) => (item.dayId || projectDays[0]?.id) === activeDay.id).map((item) => item.id));
    const beforeFlow = analyzeSceneFlow(orderedScenesFromState(
      beforeState.scenes.filter((scene) => daySceneIds.has(scene.id)),
      beforeState.breaks.filter((item) => dayBreakIds.has(item.id)),
      beforeState.timelineOrder.filter((id) => daySceneIds.has(id) || dayBreakIds.has(id)),
    ));

    beforeState.optimizeSchedule(activeDay.id);

    const afterState = useScheduleStore.getState();
    const afterFlow = analyzeSceneFlow(orderedScenesFromState(
      afterState.scenes.filter((scene) => (scene.dayId || projectDays[0]?.id) === activeDay.id),
      afterState.breaks.filter((item) => (item.dayId || projectDays[0]?.id) === activeDay.id),
      afterState.timelineOrder.filter((id) => daySceneIds.has(id) || dayBreakIds.has(id)),
    ));

    setOptimizationSummary({
      locationMoves: { before: beforeFlow.locationMoves, after: afterFlow.locationMoves },
      setupChanges: { before: beforeFlow.setupChanges, after: afterFlow.setupChanges },
      castChanges: { before: beforeFlow.castChanges, after: afterFlow.castChanges },
      preservedBreaks: afterState.breaks.length,
      previousOrder,
    });
  };

  const handleUndoOptimization = () => {
    if (!optimizationSummary) return;
    restoreTimelineOrder(optimizationSummary.previousOrder);
    setOptimizationSummary(null);
  };

  const handleTimelineDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;

    reorderTimeline(event.active.id as string, event.over.id as string);
    setOptimizationSummary(null);
  };

  const handleExportPDF = async () => {
    if (isExportingPdf) return;

    const target = activeTab === 'report'
      ? reportPdfRef.current
      : activeTab === 'people'
        ? callSheetPdfRef.current
        : pdfRef.current;
    if (!target) {
      setPdfStatus('PDF 대상 없음');
      window.setTimeout(() => setPdfStatus(''), 2200);
      return;
    }

    setIsExportingPdf(true);
    setPdfStatus('PDF 생성 중...');

    try {
      target.classList.add('is-pdf-export');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await waitForImages(target);

      const canvas = await html2canvas(target, {
        scale: 3,
        backgroundColor: '#0a0a0a',
        useCORS: true,
        logging: false,
        onclone: preparePdfCloneForHtml2Canvas,
        windowWidth: Math.max(1200, target.scrollWidth),
        width: target.scrollWidth,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const renderedHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = renderedHeight;
      let yOffset = 0;

      pdf.addImage(imgData, 'PNG', 0, yOffset, pageWidth, renderedHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        yOffset -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yOffset, pageWidth, renderedHeight, undefined, 'FAST');
        remainingHeight -= pageHeight;
      }

      const mode = activeTab === 'report' || isReportMode ? 'report' : activeTab === 'people' ? 'callsheet' : 'schedule';
      pdf.save(`PrePro_Studio_${template}_${mode}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      setPdfStatus('PDF 저장됨');
    } catch (error) {
      console.error('PDF Export Error:', error);
      setPdfStatus('PDF 생성 실패');
    } finally {
      target.classList.remove('is-pdf-export');
      setIsExportingPdf(false);
      window.setTimeout(() => setPdfStatus(''), 2200);
    }
  };

  const handleExportJSON = () => {
    const data = useScheduleStore.getState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrePro_Studio_${template}_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createProjectSnapshot = (): ProjectSnapshot => {
    const state = useScheduleStore.getState();

    return {
      template: state.template,
      shootingDate: state.shootingDate,
      location: state.location,
      callTime: state.callTime,
      shootingStartTime: state.shootingStartTime,
      days: state.days,
      locations: state.locations,
      people: state.people,
      breaks: state.breaks,
      scenes: state.scenes,
      timelineOrder: state.timelineOrder,
    };
  };

  const handleCopyShareLink = async () => {
    const snapshot = createProjectSnapshot();
    const encoded = encodeShareSnapshot(snapshot);
    const shareUrl = new URL(window.location.href);
    shareUrl.hash = `prepro=${encoded}`;

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareStatus(shareUrl.toString().length > 7000 ? '긴 링크 복사됨' : '링크 복사됨');
    } catch {
      window.prompt('공유 링크', shareUrl.toString());
      setShareStatus('링크 생성됨');
    }

    window.setTimeout(() => setShareStatus(''), 2200);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        importData(json);
        setOptimizationSummary(null);
      } catch {
        alert('올바른 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (shareImportCheckedRef.current) return;
    shareImportCheckedRef.current = true;

    const snapshot = readSnapshotFromHash();
    if (!snapshot) return;

    if (confirm('공유 스냅샷을 현재 프로젝트로 불러올까요?')) {
      window.setTimeout(() => {
        importData(snapshot);
        setActiveTab('schedule');
        setIsReportMode(false);
        setShareStatus('공유 스냅샷 불러옴');
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        window.setTimeout(() => setShareStatus(''), 2200);
      }, 0);
    }
  }, [importData]);



  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleTimeChange = (type: 'call' | 'shoot', value: string) => {
    if (!value) return;

    const [hours, minutes] = value.split(':').map(Number);
    const baseDate = new Date(activeShootingDate);
    baseDate.setHours(hours, minutes, 0, 0);

    if (activeDay.id !== 'default-day') {
      updateShootDay(activeDay.id, type === 'call' ? { callTime: baseDate } : { firstShotTime: baseDate });
    } else {
      if (type === 'call') setCallTime(baseDate);
      if (type === 'shoot') setShootingStartTime(baseDate);
    }
    setOptimizationSummary(null);
  };

  const handleActiveDayDateChange = (date: string) => {
    if (activeDay.id !== 'default-day') {
      updateShootDay(activeDay.id, { date });
    } else {
      setShootingDate(date);
    }
    setOptimizationSummary(null);
  };

  const handleAddShootDay = () => {
    const id = addShootDay();
    setActiveDayId(id);
    setOptimizationSummary(null);
  };

  const handleDeleteActiveDay = () => {
    if (projectDays.length <= 1 || activeDay.id === 'default-day') return;
    const activeItemCount = activeDayScenes.length + activeDayBreaks.length;
    const detail = activeItemCount > 0 ? ` 이 날짜의 일정 ${activeItemCount}개도 함께 삭제됩니다.` : '';
    if (!confirm(`Day ${activeDayIndex + 1}을 삭제할까요?${detail}`)) return;

    const nextDay = projectDays[activeDayIndex - 1] || projectDays[activeDayIndex + 1] || projectDays[0];
    deleteShootDay(activeDay.id);
    setActiveDayId(nextDay.id);
    setOptimizationSummary(null);
  };

  const resetSceneForm = () => {
    setEditingScene(null);
    setNewSceneParams(emptySceneForm);
    setShowSceneForm(false);
  };

  const handleLoadSampleData = () => {
    if (!confirm(`${template === 'event' ? '행사' : template === 'ad' ? '광고' : '영화'} 샘플 데이터를 로드하시겠습니까?`)) return;

    loadSampleData();
    setActiveTab('schedule');
    setIsReportMode(false);
    setShowAnalyzer(false);
    setExtractedScenes([]);
    setShowGallery(false);
    setOptimizationSummary(null);
    setShowBreakModal(false);
    setEditingBreak(null);
    setShowLocationModal(false);
    setEditingLocation(null);
    setShowPersonModal(false);
    setEditingPerson(null);
    resetSceneForm();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const openSceneEditor = (scene: Scene) => {
    setEditingScene(scene);
    setSbCategory('ALL');
    setSbSearch('');
    setNewSceneParams({
      location: scene.location || '',
      locationId: scene.locationId || locations.find((item) => item.name === scene.location)?.id || '',
      description: scene.description || '',
      estimatedMinutes: scene.estimatedMinutes || 30,
      sceneNumber: scene.sceneNumber || '',
      intExt: scene.intExt || 'INT',
      dayNight: scene.dayNight || 'DAY',
      cast: scene.cast || '',
      cutCount: scene.cutCount || '',
      pageCount: scene.pageCount || '',
      eventSection: scene.eventSection || '',
      cameraGear: scene.cameraGear || '',
      visualRef: scene.visualRef || '',
      lightingNote: scene.lightingNote || '',
      clientMemo: scene.clientMemo || '',
    });
    setShowSceneForm(true);
    setActiveTab('schedule');
    requestAnimationFrame(() => document.getElementById('scene-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleSaveScene = () => {
    if (!newSceneParams.description || !newSceneParams.location) return;
    if (!location || location === 'Seoul') {
      setLocation(newSceneParams.location);
    }
    const matchedLocation = locations.find((item) => item.id === newSceneParams.locationId || sameText(item.name, newSceneParams.location));
    const scenePayload: AnalyzedScene = {
      ...newSceneParams,
      dayId: editingScene?.dayId || activeDay.id,
      locationId: matchedLocation?.id || newSceneParams.locationId || undefined,
      cutCount: newSceneParams.cutCount === '' ? undefined : Number(newSceneParams.cutCount),
      pageCount: newSceneParams.pageCount === '' ? undefined : Number(newSceneParams.pageCount),
    };
    if (editingScene) {
      updateScene(editingScene.id, scenePayload);
      setEditingScene(null);
    } else {
      addScene(scenePayload);
    }
    setOptimizationSummary(null);
    setNewSceneParams(emptySceneForm);
    setShowSceneForm(false);
  };

  const handleDeleteScene = (scene: Scene) => {
    if (!confirm(`${scene.sceneNumber || `선택한 ${copy.item}`}을 삭제할까요?`)) return;
    deleteScene(scene.id);
    setOptimizationSummary(null);
    if (editingScene?.id === scene.id) resetSceneForm();
  };

  const handleDuplicateScene = (scene: Scene) => {
    duplicateScene(scene.id);
    setOptimizationSummary(null);
    setActiveTab('schedule');
  };

  const openBreakModal = (item?: BreakItem) => {
    setEditingBreak(item || null);
    setBreakForm(item ? {
      type: item.type,
      label: item.label,
      estimatedMinutes: item.estimatedMinutes,
      locationId: item.locationId || '',
    } : {
      ...emptyBreakForm,
      locationId: locations[0]?.id || '',
    });
    setShowBreakModal(true);
  };

  const saveBreak = () => {
    const payload = {
      dayId: editingBreak?.dayId || activeDay.id,
      type: breakForm.type,
      label: breakForm.label.trim() || '시간 추가',
      estimatedMinutes: Number(breakForm.estimatedMinutes || 0),
      locationId: breakForm.locationId || undefined,
    };
    if (editingBreak) {
      updateBreak(editingBreak.id, payload);
    } else {
      addBreak(payload);
    }
    setOptimizationSummary(null);
    setShowBreakModal(false);
    setEditingBreak(null);
  };

  const openLocationModal = (item?: ProductionLocation) => {
    setEditingLocation(item || null);
    setLocationForm(item ? {
      name: item.name,
      address: item.address || '',
      type: item.type,
      permitStatus: item.permitStatus,
      contact: item.contact || '',
      notes: item.notes || '',
      weatherQuery: item.weatherQuery || item.name,
      weatherLabel: item.weatherLabel || '',
      weatherLatitude: item.weatherLatitude,
      weatherLongitude: item.weatherLongitude,
    } : emptyLocationForm);
    setWeatherLocationResults([]);
    setWeatherLocationError('');
    setShowLocationModal(true);
  };

  const searchWeatherLocation = async () => {
    const query = locationForm.weatherQuery?.trim() || locationForm.address?.trim() || locationForm.name.trim();
    if (!query) return;

    setIsSearchingWeatherLocation(true);
    setWeatherLocationError('');
    try {
      const results = await searchWeatherLocationCandidates(query);
      setWeatherLocationResults(results);
      if (results.length === 0) setWeatherLocationError('검색 결과가 없습니다.');
    } catch (error) {
      console.error(error);
      setWeatherLocationResults([]);
      setWeatherLocationError(error instanceof Error ? error.message : '위치 검색에 실패했습니다.');
    } finally {
      setIsSearchingWeatherLocation(false);
    }
  };

  const selectWeatherLocation = (candidate: WeatherLocationCandidate) => {
    setLocationForm({
      ...locationForm,
      weatherQuery: candidate.query,
      weatherLabel: candidate.label,
      weatherLatitude: candidate.latitude,
      weatherLongitude: candidate.longitude,
    });
    setWeatherLocationResults([]);
    setWeatherLocationError('');
  };

  const saveLocation = () => {
    if (!locationForm.name.trim()) return;
    const payload = {
      ...locationForm,
      name: locationForm.name.trim(),
      weatherQuery: locationForm.weatherQuery?.trim() || locationForm.address?.trim() || locationForm.name.trim(),
      weatherLabel: locationForm.weatherLabel?.trim() || undefined,
    };
    const nextWeatherLocation = getPreferredWeatherLocationValue(payload);
    const shouldSyncGlobalWeather =
      !location.trim() ||
      isGenericSeoulQuery(location) ||
      matchesWeatherLocationSelection(location, editingLocation);

    if (editingLocation) {
      updateProductionLocation(editingLocation.id, payload);
    } else {
      addProductionLocation(payload);
    }
    if (shouldSyncGlobalWeather && nextWeatherLocation) {
      setWeatherTarget({
        location: nextWeatherLocation,
        label: payload.weatherLabel,
        latitude: payload.weatherLatitude,
        longitude: payload.weatherLongitude,
      });
    }
    setShowLocationModal(false);
    setEditingLocation(null);
  };

  const handleDeleteLocation = (item: ProductionLocation) => {
    const linkedScenes = scenes.filter((scene) => scene.locationId === item.id || scene.location === item.name).length;
    const linkedBreaks = breaks.filter((breakItem) => breakItem.locationId === item.id).length;
    const detail = linkedScenes + linkedBreaks > 0
      ? ` 연결된 ${copy.itemPlural} ${linkedScenes}개와 시간 블록 ${linkedBreaks}개는 장소명은 유지하고 DB 연결만 해제됩니다.`
      : '';

    if (!confirm(`${item.name} 장소를 DB에서 삭제할까요?${detail}`)) return;

    deleteProductionLocation(item.id);
    if (editingLocation?.id === item.id) {
      setShowLocationModal(false);
      setEditingLocation(null);
    }
    if (scheduleLocationFilter === item.id) setScheduleLocationFilter('all');
  };

  const openPersonModal = (item?: Person) => {
    setEditingPerson(item || null);
    setPersonForm(item ? {
      name: item.name,
      category: item.category,
      role: item.role || '',
      phone: item.phone || '',
      callTime: item.callTime || '',
      notes: item.notes || '',
    } : emptyPersonForm);
    setShowPersonModal(true);
  };

  const savePerson = () => {
    if (!personForm.name.trim()) return;
    const payload = {
      ...personForm,
      name: personForm.name.trim(),
    };
    if (editingPerson) {
      updatePerson(editingPerson.id, payload);
    } else {
      addPerson(payload);
    }
    setShowPersonModal(false);
    setEditingPerson(null);
  };

  const handleDeletePerson = (person: Person) => {
    const linkedScenes = scenes.filter((scene) => scene.castIds?.includes(person.id) || scene.crewIds?.includes(person.id)).length;
    const detail = linkedScenes > 0 ? ` 연결된 ${copy.itemPlural} ${linkedScenes}개에서도 인원 연결을 해제합니다.` : '';

    if (!confirm(`${person.name} 인원을 삭제할까요?${detail}`)) return;

    deletePerson(person.id);
    if (editingPerson?.id === person.id) {
      setShowPersonModal(false);
      setEditingPerson(null);
    }
  };

  const searchGlobalWeatherLocation = async () => {
    const query = location.trim();
    if (!query) return;

    setIsSearchingGlobalWeather(true);
    setGlobalWeatherError('');
    try {
      const results = await searchWeatherLocationCandidates(query);
      setGlobalWeatherResults(results);
      if (results.length === 0) setGlobalWeatherError('검색 결과가 없습니다.');
    } catch (error) {
      console.error(error);
      setGlobalWeatherResults([]);
      setGlobalWeatherError(error instanceof Error ? error.message : '위치 검색에 실패했습니다.');
    } finally {
      setIsSearchingGlobalWeather(false);
    }
  };

  const selectGlobalWeatherLocation = (candidate: WeatherLocationCandidate) => {
    setWeatherTarget({
      location: candidate.query,
      label: candidate.label,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    });
    setGlobalWeatherResults([]);
    setGlobalWeatherError('');
  };

  const activeStep = useMemo(() => {
    if (scenes.length > 0) return 3;
    if (newSceneParams.location || newSceneParams.description || activeShootingStartTime) return 2;
    return 1;
  }, [activeShootingStartTime, newSceneParams.description, newSceneParams.location, scenes.length]);

  const workflowSteps = [
    { id: 1, label: '현장 설정', detail: location || '촬영지' },
    { id: 2, label: copy.addItem, detail: copy.modeLabel },
    { id: 3, label: '일정 확정', detail: `${scenes.length}개 ${copy.itemPlural}` },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* === HEADER SECTION (Vercel Deploy Sync Check v1.2) === */}
        <header className="flex flex-col gap-8">
          {/* Row 1: Brand & Global Actions */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pb-6 border-b border-neutral-900">
            <div className="flex items-center gap-5 min-w-0">
              <div className="shrink-0 bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-500/40 rotate-3 group-hover:rotate-0 transition-transform">
                <Film className="w-8 h-8 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent uppercase leading-none">PrePro Studio</h1>
                  <span className="shrink-0 text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md font-black border border-indigo-500/30 whitespace-nowrap">V1.2 LIVE</span>
                </div>
                <p className="text-xs text-neutral-500 font-bold tracking-tight mt-1">올인원 일촬표 & 콘티 매니저 • <span className="text-indigo-500/80">프로덕션 스튜디오 모드</span></p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-neutral-900/80 p-2 rounded-2xl border border-neutral-800 shadow-inner xl:justify-end">
              <button
                onClick={() => confirm('현재 프로젝트를 비우고 새로 시작할까요? 자동 저장된 데이터도 초기화됩니다.') && resetProject()}
                className="group relative flex h-12 w-12 shrink-0 items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all text-neutral-400 hover:text-white"
                title="새 프로젝트"
              >
                <Plus className="w-5 h-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">새 프로젝트</span>
              </button>
              <button onClick={handleExportJSON} className="group relative flex h-12 w-12 shrink-0 items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all text-neutral-400 hover:text-white" title="JSON 저장">
                <Save className="w-5 h-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">저장</span>
              </button>
              <label className="flex h-12 w-12 shrink-0 items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all text-neutral-400 hover:text-white cursor-pointer" title="열기">
                <FolderOpen className="w-5 h-5" />
                <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
              </label>
              <button
                onClick={handleCopyShareLink}
                className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                  shareStatus ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
                title="공유 링크 복사"
              >
                <Share2 className="w-5 h-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                  {shareStatus || '공유 링크'}
                </span>
              </button>
              <div className="w-[1px] h-6 bg-neutral-800 mx-1"></div>
              <button 
                onClick={() => setIsReportMode(!isReportMode)}
                className={`flex h-12 shrink-0 items-center gap-2 rounded-xl border px-5 text-xs font-black transition-all whitespace-nowrap [word-break:keep-all] ${isReportMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30' : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-200'}`}
              >
                <FileText className="w-4 h-4" />
                {isReportMode ? '리포트 모드 ON' : '리포트 모드 OFF'}
              </button>
            </div>
          </div>

          {/* Row 2: Production Settings Cards (3-Column Layout) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(320px,1.15fr)_minmax(300px,0.9fr)] xl:grid-cols-[minmax(360px,1.1fr)_minmax(320px,0.9fr)_minmax(360px,1fr)]">
            {/* 1. Location & Date Setting */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 flex flex-col gap-3 min-w-0">
              <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 group focus-within:border-indigo-500/50 transition-all">
                <MapPin className="w-5 h-5 shrink-0 text-neutral-600 group-focus-within:text-indigo-400" />
                <div className="flex flex-col flex-1 min-w-0">
                  <label htmlFor="weather-location" className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">날씨 위치</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-neutral-800 bg-black/40 px-3 py-2 transition-all group-focus-within:border-indigo-500/60">
                    <input
                      id="weather-location"
                      className="w-full min-w-0 bg-transparent text-sm font-black text-neutral-100 placeholder:text-neutral-700 focus:outline-none"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setGlobalWeatherResults([]);
                        setGlobalWeatherError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchGlobalWeatherLocation();
                        }
                      }}
                      placeholder="주소나 장소명 입력 후 Enter"
                    />
                    <button
                      type="button"
                      onClick={searchGlobalWeatherLocation}
                      disabled={isSearchingGlobalWeather || !location.trim()}
                      className="shrink-0 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-black text-indigo-200 transition-all hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600"
                    >
                      {isSearchingGlobalWeather ? '검색중' : '검색'}
                    </button>
                  </div>
                  <span className="mt-1 text-[10px] text-neutral-700">
                    {weatherLatitude && weatherLongitude
                      ? `선택됨: ${weatherLabel || location}`
                      : '예: 서울시 강남구, 부산 해운대, 제주 서귀포, Tokyo'}
                  </span>
                  {globalWeatherError && <span className="mt-1 text-[10px] font-bold text-red-400">{globalWeatherError}</span>}
                  {globalWeatherResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-neutral-800 bg-black/80 p-2 custom-scrollbar">
                      {globalWeatherResults.map((candidate) => (
                        <button
                          key={`${candidate.latitude}:${candidate.longitude}:${candidate.label}`}
                          type="button"
                          onClick={() => selectGlobalWeatherLocation(candidate)}
                          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-900"
                        >
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-black text-neutral-200">{candidate.label}</span>
                            <span className="mt-0.5 block font-mono text-[9px] text-neutral-600">{candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {weatherQuickLocations.map((city) => (
                      <button
                        key={city.value}
                        type="button"
                        onClick={() => {
                          setLocation(city.value);
                          setGlobalWeatherResults([]);
                          setGlobalWeatherError('');
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black transition-all ${
                          sameText(location, city.value) || sameText(location, city.label)
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                        }`}
                      >
                        {city.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 group focus-within:border-indigo-500/50 transition-all">
                <CalendarIcon className="w-5 h-5 shrink-0 text-neutral-600 group-focus-within:text-indigo-400" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">촬영일</span>
                  <input type="date" className="bg-transparent border-none text-sm focus:outline-none text-neutral-200 font-bold [color-scheme:dark] min-w-0" value={activeShootingDate} onChange={(e) => handleActiveDayDateChange(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 2. Template Selection (Horizontal Switch) */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 flex flex-col justify-between gap-3 min-w-0">
              <span className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] ml-4">제작 유형</span>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {([
                  { id: 'film', name: '영화', icon: Film },
                  { id: 'ad', name: '광고', icon: MonitorPlay },
                  { id: 'event', name: '행사', icon: Camera },
                ] satisfies { id: TemplateType; name: string; icon: typeof Film }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 transition-all [word-break:keep-all] ${template === t.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'}`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-[11px] font-black leading-none whitespace-nowrap">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. AI Analysis & Sample Loader */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 min-w-0 lg:col-span-2 xl:col-span-1">
              <button 
                onClick={() => setShowAnalyzer(true)}
                className="flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-indigo-500 px-4 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-400 whitespace-nowrap [word-break:keep-all] group"
              >
                <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {template === 'event' ? 'AI 식순 정리 실행' : template === 'ad' ? 'AI 광고 구성 분석 실행' : 'AI 시나리오 분석기 실행'}
              </button>
              <button 
                onClick={handleLoadSampleData}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-4 text-xs font-bold text-neutral-500 transition-all hover:border-neutral-700 hover:text-neutral-300 whitespace-nowrap [word-break:keep-all]"
              >
                <Database className="w-4 h-4" />
                {template === 'event' ? '행사 샘플 로드' : template === 'ad' ? '광고 샘플 로드' : '영화 샘플 로드'}
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">촬영일 구성</div>
              <div className="mt-1 text-sm font-bold text-neutral-300">
                Day {activeDayIndex + 1} · {activeShootingDate} · {activeDayScenes.length}개 {copy.itemPlural}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectDays.map((day, index) => {
                const isSelected = day.id === activeDay.id;
                const daySceneCount = scenes.filter((scene) => (scene.dayId || projectDays[0]?.id) === day.id).length;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'border-neutral-800 bg-black text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-widest">Day {index + 1}</div>
                    <div className="mt-1 text-xs font-bold">{day.date}</div>
                    <div className={`mt-1 text-[10px] font-bold ${isSelected ? 'text-indigo-100' : 'text-neutral-600'}`}>{daySceneCount}개</div>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleAddShootDay}
                className="inline-flex min-h-[72px] items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-xs font-black text-neutral-400 transition-all hover:border-indigo-500/40 hover:text-indigo-300"
              >
                <Plus className="h-4 w-4" /> 날짜 추가
              </button>
              {projectDays.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteActiveDay}
                  className="inline-flex min-h-[72px] items-center rounded-xl border border-red-500/20 px-4 text-xs font-black text-red-300 transition-all hover:bg-red-500/10"
                >
                  현재 날짜 삭제
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {workflowSteps.map((step) => {
            const isActive = activeStep === step.id;
            const isDone = activeStep > step.id;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
                  isActive
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : isDone
                      ? 'border-neutral-800 bg-neutral-900/70 text-neutral-300'
                      : 'border-neutral-900 bg-neutral-950/70 text-neutral-600'
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  isDone ? 'bg-green-500/15 text-green-400' : isActive ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-600'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black whitespace-nowrap [word-break:keep-all]">{step.label}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: copy.totalItemLabel, value: `${scenes.length}` },
            { label: '촬영일', value: `${Math.max(days.length, 1)}` },
            { label: copy.pageLabel, value: template === 'event' ? `${reportStats.totalMinutes}분` : template === 'ad' ? `${reportStats.cutCount || scenes.length}` : (reportStats.pageCount ? reportStats.pageCount.toFixed(1) : '-') },
            { label: `Day ${activeDayIndex + 1} 운영`, value: `${timelineStats.totalMinutes}분` },
            { label: '예상 종료', value: timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '-' },
            { label: '장소', value: `${locations.length}` },
            { label: copy.peopleLabel, value: `${reportStats.castCount}` },
            { label: '스태프', value: `${reportStats.crewCount}` },
          ].map((item) => (
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
                    순수 {copy.itemPlural} {timelineStats.sceneMinutes}분 · 시간 블록 {timelineStats.breakMinutes}분 · 총 운영 {timelineStats.totalMinutes}분
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

        <div className={`rounded-2xl border p-5 ${
          readinessSummary.status === 'critical'
            ? 'border-red-500/30 bg-red-500/5'
            : readinessSummary.status === 'warning'
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-green-500/20 bg-green-500/5'
        }`}>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500">현장 준비 체크</div>
              <h3 className="mt-1 text-lg font-black text-neutral-100">출발 전 체크리스트</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {readinessSummary.status === 'critical'
                  ? '즉시 확인해야 할 항목이 있습니다.'
                  : readinessSummary.status === 'warning'
                    ? '현장 전 한번 더 확인하면 좋습니다.'
                    : '현장 공유 준비가 좋아 보입니다.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right text-xs">
              {[
                { label: '정상', value: readinessSummary.ok, tone: 'text-green-300' },
                { label: '확인', value: readinessSummary.warning, tone: 'text-amber-300' },
                { label: '필수', value: readinessSummary.critical, tone: 'text-red-300' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/50 px-3 py-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                  <div className={`mt-1 text-base font-black ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {readinessChecks.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3">
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
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-neutral-900 pb-0 custom-scrollbar">
          {[
            { id: 'schedule', label: '스케줄' },
            { id: 'locations', label: '장소' },
            { id: 'people', label: '인원' },
            { id: 'storyboard', label: copy.storyboardLabel },
            { id: 'report', label: '리포트' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-black transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-neutral-600 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* === MAIN CONTENT === */}
        <main className="space-y-10">
          {/* Ad Slot */}
          <AdBanner placement="top_banner" format="auto" />

          {/* AI Script Analyzer Overlay */}
          {showAnalyzer && (
            <div className="animate-in fade-in zoom-in duration-300">
              <ScriptAnalyzer 
                onClose={() => setShowAnalyzer(false)}
                onExtract={(result) => setExtractedScenes(result)} 
              />
            </div>
          )}

          {/* AI Analysis Preview (Extracted Scenes) */}
          {extractedScenes.length > 0 && (
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-indigo-200 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> 
                  {copy.analyzerResult}: {extractedScenes.length}개의 {copy.itemPlural} 감지됨
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-h-64 overflow-y-auto custom-scrollbar pr-4">
                {extractedScenes.map((s, i) => (
                  <div key={i} className="bg-neutral-950/50 p-4 rounded-2xl border border-neutral-900 text-[11px] group hover:border-indigo-500/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-indigo-500">{s.sceneNumber}</span>
                      <span className="text-neutral-600 font-bold uppercase tracking-widest">{s.intExt} • {s.dayNight}</span>
                    </div>
                    <div className="text-neutral-200 font-bold mb-1 truncate">{s.location}</div>
                    <div className="text-neutral-600 truncate">{s.cast || '출연 없음'}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setExtractedScenes([])} className="px-6 py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-300 transition-colors">취소</button>
                <button 
                  onClick={() => { addScenes(extractedScenes.map((scene) => ({ ...scene, dayId: activeDay.id }))); setOptimizationSummary(null); setExtractedScenes([]); setShowAnalyzer(false); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-500/20"
                >
                  {copy.addResult}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
          <>
          {/* Weather & Sun Intel */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">날씨 조회 기준</p>
                <p className="text-sm font-bold text-neutral-300">{location || '상단 날씨 위치를 입력하세요'} · {activeShootingDate}</p>
              </div>
              <button
                onClick={() => newSceneParams.location && setLocation(newSceneParams.location)}
                disabled={!newSceneParams.location}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-neutral-500 transition-all hover:border-indigo-500/40 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copy.locationWeatherButton}
              </button>
            </div>
            <WeatherWidget
              location={location}
              date={activeShootingDate}
              target={typeof weatherLatitude === 'number' && typeof weatherLongitude === 'number'
                ? { latitude: weatherLatitude, longitude: weatherLongitude, label: weatherLabel || location }
                : undefined}
            />
          </div>

          {/* Time Settings Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1.5 rounded-[2.5rem] bg-neutral-900/30 border border-neutral-900/50 backdrop-blur-md">
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">콜 타임</label>
                <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" value={activeCallTime ? format(activeCallTime, 'HH:mm') : ''} onChange={(e) => handleTimeChange('call', e.target.value)} />
              </div>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-cyan-500/30 transition-all">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">촬영 시작</label>
                <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" value={activeShootingStartTime ? format(activeShootingStartTime, 'HH:mm') : ''} onChange={(e) => handleTimeChange('shoot', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Add Scene Form */}
          {showSceneForm && (
          <>
          <div id="scene-form" className="bg-neutral-900/40 border border-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group scroll-mt-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
              <h3 className="text-2xl font-black flex items-center gap-4">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                {copy.formTitle}
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-black tracking-widest">{copy.modeLabel}</span>
              </h3>
              <button
                onClick={resetSceneForm}
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-bold text-neutral-500 transition-all hover:border-neutral-700 hover:text-neutral-300"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">장소 <span className="text-indigo-500">*</span></label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                      value={newSceneParams.locationId || locations.find((item) => item.name === newSceneParams.location)?.id || ''}
                      onChange={(e) => {
                        const selected = locations.find((item) => item.id === e.target.value);
                        setNewSceneParams({ ...newSceneParams, location: selected?.name || '', locationId: selected?.id || '' });
                      }}
                    >
                      <option value="">장소 DB에서 선택</option>
                      {locations.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => openLocationModal()}
                      className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-xs font-black text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300"
                    >
                      추가
                    </button>
                  </div>
                  <input list="location-list" placeholder="직접 입력하면 저장 시 장소 DB에 자동 추가" className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all" value={newSceneParams.location} onChange={(e) => {
                    const matched = locations.find((item) => sameText(item.name, e.target.value));
                    setNewSceneParams({ ...newSceneParams, location: e.target.value, locationId: matched?.id || '' });
                  }} />
                </div>

                {template === 'film' && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">씬 번호</label>
                        <input placeholder="S#1" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.sceneNumber} onChange={(e) => setNewSceneParams({ ...newSceneParams, sceneNumber: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">INT/EXT</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.intExt} onChange={(e) => setNewSceneParams({ ...newSceneParams, intExt: e.target.value as NonNullable<Scene['intExt']> })}>
                          <option value="INT">INT</option><option value="EXT">EXT</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">시간대</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.dayNight} onChange={(e) => setNewSceneParams({ ...newSceneParams, dayNight: e.target.value as NonNullable<Scene['dayNight']> })}>
                          <option value="DAY">DAY</option><option value="NIGHT">NIGHT</option><option value="SUNSET">SUNSET</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">출연진</label>
                        <div className="min-h-[50px] rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                          {people.filter((person) => person.category === 'cast').length === 0 ? (
                            <button type="button" onClick={() => openPersonModal()} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">출연진 추가</button>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {people.filter((person) => person.category === 'cast').map((person) => {
                                const selectedNames = new Set((newSceneParams.cast || '').split(',').map((name) => name.trim()).filter(Boolean));
                                const checked = selectedNames.has(person.name);
                                return (
                                  <button
                                    type="button"
                                    key={person.id}
                                    onClick={() => {
                                      const nextNames = new Set(selectedNames);
                                      if (checked) nextNames.delete(person.name);
                                      else nextNames.add(person.name);
                                      setNewSceneParams({ ...newSceneParams, cast: Array.from(nextNames).join(', ') });
                                    }}
                                    className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${checked ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
                                  >
                                    {person.name}
                                  </button>
                                );
                              })}
                              <button type="button" onClick={() => openPersonModal()} className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-300">+ 인원</button>
                            </div>
                          )}
                        </div>
                        <input placeholder="예: 철수, 영희" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cast || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cast: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 수</label>
                          <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.cutCount || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cutCount: e.target.value === '' ? '' : Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">페이지</label>
                          <input type="number" step="0.1" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.pageCount || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, pageCount: e.target.value === '' ? '' : Number(e.target.value) })} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {template === 'event' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{copy.eventSectionLabel}</label>
                        <input placeholder="예: 1부 오프닝" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.eventSection} onChange={(e) => setNewSceneParams({ ...newSceneParams, eventSection: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{copy.gearLabel}</label>
                        <input placeholder="예: 짐벌, 삼각대" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cameraGear} onChange={(e) => setNewSceneParams({ ...newSceneParams, cameraGear: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">진행 / 연사 / 담당</label>
                      <div className="min-h-[50px] rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                        {people.length === 0 ? (
                          <button type="button" onClick={() => openPersonModal()} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">인원 추가</button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {people.map((person) => {
                              const selectedNames = new Set((newSceneParams.cast || '').split(',').map((name) => name.trim()).filter(Boolean));
                              const checked = selectedNames.has(person.name);
                              return (
                                <button
                                  type="button"
                                  key={person.id}
                                  onClick={() => {
                                    const nextNames = new Set(selectedNames);
                                    if (checked) nextNames.delete(person.name);
                                    else nextNames.add(person.name);
                                    setNewSceneParams({ ...newSceneParams, cast: Array.from(nextNames).join(', ') });
                                  }}
                                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${checked ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
                                >
                                  {person.name}
                                </button>
                              );
                            })}
                            <button type="button" onClick={() => openPersonModal()} className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-300">+ 인원</button>
                          </div>
                        )}
                      </div>
                      <input placeholder="예: 사회자, 대표 연사" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cast || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cast: e.target.value })} />
                    </div>
                  </div>
                )}

                {template === 'ad' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 번호</label>
                        <input placeholder="C#1" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.sceneNumber} onChange={(e) => setNewSceneParams({ ...newSceneParams, sceneNumber: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">INT/EXT</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.intExt} onChange={(e) => setNewSceneParams({ ...newSceneParams, intExt: e.target.value as NonNullable<Scene['intExt']> })}>
                          <option value="INT">INT</option><option value="EXT">EXT</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">시간대</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.dayNight} onChange={(e) => setNewSceneParams({ ...newSceneParams, dayNight: e.target.value as NonNullable<Scene['dayNight']> })}>
                          <option value="DAY">DAY</option><option value="NIGHT">NIGHT</option><option value="SUNSET">SUNSET</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 수</label>
                        <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.cutCount || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cutCount: e.target.value === '' ? '' : Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">모델 / 제품 출연</label>
                      <div className="min-h-[50px] rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                        {people.filter((person) => person.category === 'cast').length === 0 ? (
                          <button type="button" onClick={() => openPersonModal()} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">모델 추가</button>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {people.filter((person) => person.category === 'cast').map((person) => {
                              const selectedNames = new Set((newSceneParams.cast || '').split(',').map((name) => name.trim()).filter(Boolean));
                              const checked = selectedNames.has(person.name);
                              return (
                                <button
                                  type="button"
                                  key={person.id}
                                  onClick={() => {
                                    const nextNames = new Set(selectedNames);
                                    if (checked) nextNames.delete(person.name);
                                    else nextNames.add(person.name);
                                    setNewSceneParams({ ...newSceneParams, cast: Array.from(nextNames).join(', ') });
                                  }}
                                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${checked ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'}`}
                                >
                                  {person.name}
                                </button>
                              );
                            })}
                            <button type="button" onClick={() => openPersonModal()} className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-300">+ 모델</button>
                          </div>
                        )}
                      </div>
                      <input placeholder="예: 메인 모델" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cast || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cast: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">톤앤매너</label>
                        <input placeholder="예: 화사하게, 시네마틱" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.lightingNote} onChange={(e) => setNewSceneParams({ ...newSceneParams, lightingNote: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">클라이언트 메모</label>
                        <input placeholder="제품 로고 강조" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.clientMemo} onChange={(e) => setNewSceneParams({ ...newSceneParams, clientMemo: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 파트: 내용 & 시간 & 추가 버튼 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{copy.descriptionLabel} <span className="text-indigo-500">*</span></label>
                  <textarea 
                    placeholder={copy.descriptionPlaceholder}
                    className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none" 
                    value={newSceneParams.description} 
                    onChange={(e) => setNewSceneParams({ ...newSceneParams, description: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">예상 소요 시간</label>
                    <div className="relative">
                      <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.estimatedMinutes} onChange={(e) => setNewSceneParams({ ...newSceneParams, estimatedMinutes: Number(e.target.value) })} />
                      <span className="absolute right-4 top-3.5 text-[10px] font-black text-neutral-600 uppercase">분</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleSaveScene} 
                      disabled={!newSceneParams.description || !newSceneParams.location}
                      className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                    >
                      {editingScene ? '변경사항 저장' : '일정에 추가'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{copy.storyboardLabel}</div>
                      <div className="mt-1 text-sm font-bold text-neutral-200">
                        {selectedStoryboard?.name || `${copy.storyboardLabel} 없음`}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {newSceneParams.visualRef && (
                        <button
                          type="button"
                          onClick={() => setNewSceneParams({ ...newSceneParams, visualRef: '' })}
                          className="rounded-lg border border-neutral-700 px-3 py-2 text-xs font-bold text-neutral-400 hover:text-neutral-200"
                        >
                          해제
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowGallery(true)}
                        className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-black text-indigo-300 hover:bg-indigo-500/20"
                      >
                        {copy.storyboardLabel} 변경
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-white">
                      {newSceneParams.visualRef ? (
                        <Image
                          src={newSceneParams.visualRef}
                          alt={selectedStoryboard?.name || copy.storyboardLabel}
                          width={320}
                          height={180}
                          unoptimized
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = storyboardFallback(selectedStoryboard?.name || copy.storyboardLabel);
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                          <ImageIcon className="h-6 w-6 text-neutral-700" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-500">
                      추천 목록이나 전체 갤러리에서 선택하면 저장 시 이 {copy.item}에 바로 연결됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI 스토리보드 매칭 */}
          {(
            <div className="mt-8 p-5 bg-neutral-950 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <span className="bg-indigo-500 w-2 h-2 rounded-full animate-pulse"></span>
                  빠른 {copy.storyboardLabel} 선택
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowGallery(true)}
                    className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg font-bold border border-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> {storyboardDb.length}종 전체보기
                  </button>
                  <p className="text-xs text-neutral-500">추천과 자주 쓰는 앵글만 먼저 보여줍니다</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                    {storyboardCategoryOptions.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSbCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${sbCategory === cat.id ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text" 
                      placeholder="앵글 검색 (예: 웅장, 대화...)" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      value={sbSearch}
                      onChange={(e) => setSbSearch(e.target.value)}
                    />
                    <Sparkles className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(template === 'event'
                    ? ['마스터', '무대', '인터뷰', '객석', '와이드', '클로즈업']
                    : template === 'ad'
                      ? ['제품', '디테일', '모델', '투 샷', '매크로', '대칭']
                      : ['투 샷', '대화', '클로즈업', '와이드', '로우', '오버숄더']
                  ).map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => setSbSearch(keyword)}
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                        sbSearch === keyword
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[140px]">
                  {editorStoryboardOptions.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center text-neutral-600 py-10">
                      <p className="text-xs">검색 결과가 없습니다.</p>
                    </div>
                  ) : editorStoryboardOptions.map(sb => {
                    const isRecommended = recommendations.some(r => r.id === sb.id);
                    const isSelected = newSceneParams.visualRef === sb.url;
                    
                    return (
                      <div 
                        key={sb.id} 
                        onClick={() => setNewSceneParams({...newSceneParams, visualRef: sb.url})}
                        className={`relative cursor-pointer border-2 rounded-xl overflow-hidden transition-all shrink-0 w-40 h-[124px] ${isSelected ? 'border-indigo-500 scale-105 shadow-xl shadow-indigo-500/30 z-10' : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-700'}`}
                      >
                        {isRecommended && (
                          <div className="absolute top-2 left-2 bg-indigo-500 text-[9px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-2 h-2" /> AI 추천
                          </div>
                        )}
                        {/* 이미지 로딩 전 placeholder */}
                        <div className="w-full aspect-video bg-white flex items-center justify-center overflow-hidden">
                           <Image 
                            src={sb.url} 
                            alt={sb.name} 
                            width={160}
                            height={90}
                            loading="lazy"
                            unoptimized
                            className="h-full w-full object-contain transition-opacity duration-300" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = storyboardFallback(sb.name);
                            }}
                          />
                        </div>
                        <div className={`text-[10px] text-center py-2 font-bold px-1 h-10 flex items-center justify-center leading-tight ${isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
                          {sb.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredStoryboards.length > editorStoryboardOptions.length && (
                  <div className="flex items-center justify-between rounded-xl border border-neutral-900 bg-neutral-900/50 px-4 py-3">
                    <p className="text-xs font-bold text-neutral-500">
                      현재 조건에서 {filteredStoryboards.length}개 중 {editorStoryboardOptions.length}개만 빠르게 표시 중
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowGallery(true)}
                      className="text-xs font-black text-indigo-300 hover:text-indigo-200"
                    >
                      전체 갤러리에서 보기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          )}

        {/* Middle Ad Slot */}
          <AdBanner placement="middle_timeline" format="auto" />

        {/* Timeline View */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">{copy.scheduleTitle} <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-400 font-normal">Day {activeDayIndex + 1} · {activeDayScenes.length}개</span></h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (showSceneForm) {
                    resetSceneForm();
                  } else {
                    setEditingScene(null);
                    setNewSceneParams(emptySceneForm);
                    setShowSceneForm(true);
                  }
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
                  showSceneForm
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                <Plus className="w-4 h-4" /> {showSceneForm ? (editingScene ? copy.editItemClose : copy.addItemClose) : copy.addItem}
              </button>
              <button onClick={() => openBreakModal()} className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20 whitespace-nowrap">
                <Clock className="w-4 h-4" /> 시간 추가
              </button>
              <button onClick={handleOptimizeSchedule} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                <Sparkles className="w-4 h-4" /> AI 동선 최적화
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60 text-neutral-200 rounded-lg text-sm font-medium transition-colors border border-neutral-700 whitespace-nowrap"
              >
                <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-pulse' : ''}`} /> {pdfButtonText(isReportMode ? '결과 리포트 PDF' : 'PDF 다운로드')}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4" data-html2canvas-ignore="true">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
                  <input
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    placeholder={`${copy.item} 번호, 장소, 인물, 내용 검색`}
                    className="h-11 w-full rounded-xl border border-neutral-800 bg-black pl-10 pr-4 text-sm font-bold text-neutral-200 outline-none transition-colors placeholder:text-neutral-700 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={scheduleLocationFilter}
                  onChange={(e) => setScheduleLocationFilter(e.target.value)}
                  className="h-11 rounded-xl border border-neutral-800 bg-black px-4 text-sm font-bold text-neutral-300 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="all">모든 장소</option>
                  {locations.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { id: 'all', label: '전체' },
                  { id: 'pending', label: '대기' },
                  { id: 'done', label: '완료' },
                  { id: 'ng', label: 'NG' },
                ] satisfies { id: ScheduleStatusFilter; label: string }[]).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScheduleStatusFilter(item.id)}
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
                    onClick={resetScheduleFilters}
                    className="h-11 rounded-xl border border-neutral-800 px-4 text-xs font-black text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs font-bold text-neutral-600">
              {isScheduleFiltered ? `${filteredSceneCount}/${activeDayScenes.length}개 ${copy.itemPlural} 표시 중` : `Day ${activeDayIndex + 1} 전체 ${activeDayScenes.length}개 ${copy.itemPlural} 표시 중`}
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
                  onClick={handleUndoOptimization}
                  className="inline-flex w-fit items-center justify-center rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-black text-neutral-300 transition-colors hover:border-indigo-500/50 hover:text-white"
                >
                  이전 순서로 되돌리기
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { label: '장소 이동', metric: optimizationSummary.locationMoves },
                  { label: '세팅 전환', metric: optimizationSummary.setupChanges },
                  { label: template === 'event' ? '담당자 전환' : template === 'ad' ? '모델/스태프 전환' : '출연진 전환', metric: optimizationSummary.castChanges },
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

          <div ref={pdfRef} className="pdf-export-root bg-neutral-900 border border-neutral-800 rounded-2xl overflow-x-auto relative custom-scrollbar">
            <div className="flex min-w-[960px] flex-col gap-4 border-b border-neutral-800 bg-neutral-950 px-6 py-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">{templateLabel}</div>
                <h3 className="mt-1 text-2xl font-black text-neutral-100">{pdfKindLabel}</h3>
                <p className="mt-1 text-xs font-bold text-neutral-500">Day {activeDayIndex + 1} · {activeShootingDate} · {location || '촬영지 미정'}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-right text-xs">
                {[
                  { label: copy.totalItemLabel, value: `${activeDayScenes.length}` },
                  { label: '총 운영', value: `${timelineStats.totalMinutes}분` },
                  { label: '예상 종료', value: timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '-' },
                  { label: '장소', value: `${locations.length}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                    <div className="mt-1 text-base font-black text-neutral-200">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {isScheduleFiltered && (
              <div className="border-b border-neutral-800 bg-indigo-500/5 px-6 py-3 text-xs font-bold text-indigo-300">
                필터 적용됨 · {filteredSceneCount}/{activeDayScenes.length}개 {copy.itemPlural} 표시
              </div>
            )}
            {isReportMode && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-5 border-b border-neutral-800 bg-neutral-950/70">
                {[
                  { label: '완료', value: `${reportStats.done}개`, tone: 'text-green-400' },
                  { label: 'NG', value: `${reportStats.ng}개`, tone: 'text-red-400' },
                  { label: '대기', value: `${reportStats.pending}개`, tone: 'text-neutral-300' },
                  { label: template === 'event' ? '운영 시간' : '총 촬영', value: `${reportStats.totalMinutes}분`, tone: 'text-cyan-400' },
                  { label: '완료율', value: `${reportStats.completionRate}%`, tone: 'text-indigo-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">{item.label}</div>
                    <div className={`mt-1 text-xl font-black ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTimelineDragEnd}>
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-950/50 text-neutral-400 uppercase text-xs border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-medium w-12 text-center">순서</th>
                    <th className="px-4 py-4 font-medium w-32">예상 시간</th>

                    {/* 동적 테이블 헤더 */}
                    {template === 'film' && (
                      <>
                        <th className="px-4 py-4 font-medium w-24">{copy.infoColumn}</th>
                        <th className="px-4 py-4 font-medium w-24">콘티</th>
                      </>
                    )}
                    {template === 'event' && (
                      <>
                        <th className="px-4 py-4 font-medium w-24">식순 구분</th>
                        <th className="px-4 py-4 font-medium w-24">샷 플랜</th>
                      </>
                    )}
                    {template === 'ad' && (
                      <>
                        <th className="px-4 py-4 font-medium w-24">{copy.infoColumn}</th>
                        <th className="px-4 py-4 font-medium w-24">콘티</th>
                      </>
                    )}

                    <th className="px-4 py-4 font-medium w-48">장소</th>
                    <th className="px-4 py-4 font-medium">{copy.contentColumn}</th>
                    <th className="px-4 py-4 font-medium w-24 text-right">소요시간</th>
                  </tr>
                </thead>
                <SortableContext items={filteredTimelineRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredTimelineRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="max-w-md mx-auto space-y-6">
                            <div className="bg-neutral-900/50 p-8 rounded-3xl border border-dashed border-neutral-800">
                              <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-neutral-600" />
                              </div>
                              <h3 className="text-lg font-bold text-neutral-200">{isScheduleFiltered ? '필터 결과가 없습니다' : '아직 추가된 일정이 없습니다'}</h3>
                              <p className="text-sm text-neutral-500 mt-2">{isScheduleFiltered ? '검색어나 필터 조건을 조금 넓혀보세요.' : copy.emptyHint}</p>
                              <div className="flex flex-wrap gap-3 justify-center mt-6">
                                {isScheduleFiltered && (
                                  <button
                                    onClick={resetScheduleFilters}
                                    className="inline-flex items-center gap-2 text-xs bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-2 rounded-xl font-black transition-all"
                                  >
                                    필터 초기화
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingScene(null);
                                    setNewSceneParams(emptySceneForm);
                                    setShowSceneForm(true);
                                  }}
                                  className="inline-flex items-center gap-2 text-xs bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-2 rounded-xl font-black transition-all"
                                >
                                  <Plus className="w-3.5 h-3.5" /> 직접 추가
                                </button>
                                <button
                                  onClick={() => setShowAnalyzer(true)}
                                  className="inline-flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all"
                                >
                                  <Brain className="w-3.5 h-3.5" /> {template === 'event' ? '식순 정리' : template === 'ad' ? '구성 분석' : '시나리오 분석'}
                                </button>
                                <button 
                                  onClick={handleLoadSampleData}
                                  className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl transition-all"
                                >
                                  {template === 'event' ? '행사 샘플' : template === 'ad' ? '광고 샘플' : '샘플 데이터'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredTimelineRows.map((row, index) => {
                          if (row.type === 'scene') {
                            return (
                              <SortableRow
                                key={row.id}
                                scene={row.scene}
                                template={template}
                                isReportMode={isReportMode}
                                rowNumber={index + 1}
                                onEdit={() => openSceneEditor(row.scene)}
                                onDuplicate={() => handleDuplicateScene(row.scene)}
                                onDelete={() => handleDeleteScene(row.scene)}
                              />
                            );
                          }

                          return (
                            <SortableBreakRow
                              key={row.id}
                              item={row.breakItem}
                              locationName={locations.find((locationItem) => locationItem.id === row.breakItem.locationId)?.name || ''}
                              rowNumber={index + 1}
                              onEdit={() => openBreakModal(row.breakItem)}
                              onDelete={() => {
                                deleteBreak(row.breakItem.id);
                                setOptimizationSummary(null);
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>
          </>
          )}

          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-100">장소 DB</h2>
                  <p className="text-sm text-neutral-500">{template === 'event' ? '행사장, 구역, 담당자, 날씨 조회 위치를 관리합니다.' : '장소, 허가, 담당자, 날씨 조회 위치를 관리합니다.'}</p>
                </div>
                <button onClick={() => openLocationModal()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">
                  + 장소 추가
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {locations.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/70 p-10 text-center text-neutral-500">
                  아직 등록된 장소가 없습니다. {copy.item}을 추가하면 장소 DB가 자동으로 생성됩니다.
                </div>
              ) : locations.map((item) => {
                const sceneCount = scenes.filter((scene) => scene.locationId === item.id || scene.location === item.name).length;
                return (
                  <div key={item.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-neutral-100">{item.name}</h3>
                        <p className="mt-1 text-sm text-neutral-500">{item.address || item.weatherQuery || '주소 미입력'}</p>
                      </div>
                      <span className="rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-black text-neutral-500">{locationTypeLabels[item.type]}</span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-neutral-900 p-3">
                        <div className="text-neutral-600">허가</div>
                        <div className="mt-1 font-bold text-neutral-300">{permitStatusLabels[item.permitStatus]}</div>
                      </div>
                      <div className="rounded-xl bg-neutral-900 p-3">
                        <div className="text-neutral-600">{copy.locationItemCount}</div>
                        <div className="mt-1 font-bold text-neutral-300">{sceneCount}개</div>
                      </div>
                      <div className="rounded-xl bg-neutral-900 p-3">
                        <div className="text-neutral-600">날씨</div>
                        <LocationWeatherSummary query={getLocationWeatherQuery(item)} date={activeShootingDate} target={getProductionLocationWeatherTarget(item)} />
                      </div>
                    </div>
                    {item.contact && <p className="mt-4 text-sm text-neutral-500">담당: {item.contact}</p>}
                    {item.notes && <p className="mt-2 text-sm text-neutral-600">{item.notes}</p>}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button onClick={() => openLocationModal(item)} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-bold text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300">
                        편집
                      </button>
                      <button onClick={() => handleDeleteLocation(item)} className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10">
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-neutral-100">인원 DB</h2>
                  <p className="text-sm text-neutral-500">{template === 'event' ? '진행자, 연사, 운영 스태프를 등록하고 프로그램에 연결합니다.' : '출연진과 스태프를 등록하고 씬에 연결합니다.'}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPdf}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-black text-neutral-200 hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-pulse' : ''}`} /> {pdfButtonText('콜시트 PDF')}
                  </button>
                  <button onClick={() => openPersonModal()} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">
                    + 인원 추가
                  </button>
                </div>
              </div>

              <div ref={callSheetPdfRef} className="pdf-export-root rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">콜시트</div>
                    <h3 className="mt-1 text-lg font-black text-neutral-100">현장 콜타임 보드</h3>
                    <p className="mt-1 text-sm text-neutral-500">{shootingDate} · {location || '촬영지 미정'} · {templateLabel}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: '첫 콜', value: callSheetStats.earliestCall, tone: 'text-cyan-300' },
                      { label: '콜 미정', value: `${callSheetStats.missingCallTime}`, tone: callSheetStats.missingCallTime ? 'text-amber-300' : 'text-green-300' },
                      { label: '연락처 누락', value: `${callSheetStats.missingContact}`, tone: callSheetStats.missingContact ? 'text-red-300' : 'text-green-300' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-right">
                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                        <div className={`mt-1 text-base font-black ${item.tone}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {callSheetPeople.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-800 px-4 py-8 text-center text-sm text-neutral-500">
                    아직 콜시트에 표시할 인원이 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500">
                        <tr>
                          <th className="px-3 py-3 font-black">콜</th>
                          <th className="px-3 py-3 font-black">이름</th>
                          <th className="px-3 py-3 font-black">구분</th>
                          <th className="px-3 py-3 font-black">첫 투입</th>
                          <th className="px-3 py-3 font-black">연결</th>
                          <th className="px-3 py-3 font-black">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {callSheetPeople.map(({ person, assignedCount, firstLocation, firstStartTime, missingCallTime, missingContact }) => (
                          <tr key={person.id} className="hover:bg-neutral-900/60">
                            <td className="px-3 py-3 font-mono text-lg font-black text-cyan-300">{person.callTime || '미정'}</td>
                            <td className="px-3 py-3">
                              <div className="font-black text-neutral-100">{person.name}</div>
                              <div className="mt-0.5 text-xs text-neutral-500">{person.role || (person.category === 'cast' ? '출연진' : '스태프')}</div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${person.category === 'cast' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                {personCategoryLabels[person.category]}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-neutral-300">
                              <div className="font-bold">{firstLocation || '미정'}</div>
                              <div className="mt-0.5 text-xs text-neutral-600">{firstStartTime ? `${format(firstStartTime, 'HH:mm')} 첫 일정` : '시간 미정'}</div>
                            </td>
                            <td className="px-3 py-3 text-neutral-400">{assignedCount}개 {copy.itemPlural}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {missingCallTime && <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">콜 미정</span>}
                                {missingContact && <span className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300">연락처 없음</span>}
                                {!missingCallTime && !missingContact && <span className="rounded bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-300">확인 완료</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {people.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/70 p-10 text-center text-neutral-500">
                  아직 등록된 인원이 없습니다. {template === 'event' ? '프로그램 담당자와 스태프를 등록하세요.' : '씬의 출연진 입력값이 인원 DB로 자동 변환됩니다.'}
                </div>
              ) : people.map((person) => {
                const sceneCount = scenes.filter((scene) => scene.castIds?.includes(person.id) || scene.crewIds?.includes(person.id)).length;
                return (
                  <div key={person.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${person.category === 'cast' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {person.name.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-100">{person.name}</h3>
                        <p className="text-xs text-neutral-500">{person.role || (person.category === 'cast' ? '출연진' : '스태프')}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-900 px-3 py-2 text-xs">
                      <span className="font-bold text-neutral-500">{personCategoryLabels[person.category]}</span>
                      <span className="font-bold text-neutral-300">{sceneCount}개 {copy.itemPlural}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs">
                      <span className="font-bold uppercase text-neutral-500">콜</span>
                      <span className="font-black text-cyan-300">{person.callTime || '미정'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => openPersonModal(person)} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-bold text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300">
                        편집
                      </button>
                      <button onClick={() => handleDeletePerson(person)} className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10">
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {activeTab === 'storyboard' && (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-neutral-100">{copy.storyboardLabel} 라이브러리</h2>
                  <p className="text-sm text-neutral-500">{copy.storyboardDescription}</p>
                </div>
                <button onClick={() => setShowGallery(true)} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">
                  전체 갤러리 열기
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {storyboardDb.slice(0, 12).map((shot) => (
                  <div key={shot.id} className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                    <div className="aspect-video w-full bg-white">
                      <Image
                        src={shot.url}
                        alt={shot.name}
                        width={320}
                        height={180}
                        loading="lazy"
                        unoptimized
                        className="h-full w-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = storyboardFallback(shot.name); }}
                      />
                    </div>
                    <div className="p-3 text-[11px] font-bold text-neutral-300">{shot.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div ref={reportPdfRef} className="pdf-export-root rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-neutral-100">{template === 'event' ? '행사 결과 리포트' : template === 'ad' ? '광고 촬영 리포트' : '촬영 리포트'}</h2>
                  <p className="text-sm text-neutral-500">{shootingDate} · {location || '촬영지 미정'} · {templateLabel}</p>
                </div>
                <div data-html2canvas-ignore="true" className="flex flex-wrap gap-2">
                  <button onClick={() => setIsReportMode(true)} className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-black text-neutral-200 hover:bg-neutral-800">
                    리포트 모드 켜기
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPdf}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-pulse' : ''}`} /> {pdfButtonText('결과 PDF')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: '완료', value: `${reportStats.done}개`, tone: 'text-green-400' },
                  { label: 'NG', value: `${reportStats.ng}개`, tone: 'text-red-400' },
                  { label: '대기', value: `${reportStats.pending}개`, tone: 'text-neutral-300' },
                  { label: template === 'event' ? '운영 시간' : '총 촬영', value: `${reportStats.totalMinutes}분`, tone: 'text-cyan-400' },
                  { label: '완료율', value: `${reportStats.completionRate}%`, tone: 'text-indigo-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">{item.label}</div>
                    <div className={`mt-1 text-xl font-black ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-neutral-500">
                  <span>진행률</span>
                  <span className="text-neutral-300">{reportStats.doneMinutes}분 완료 / {reportStats.totalMinutes || 0}분</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${reportStats.completionRate}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-green-500/10 px-3 py-2 text-green-300">완료 {reportStats.doneMinutes}분</div>
                  <div className="rounded-lg bg-red-500/10 px-3 py-2 text-red-300">NG {reportStats.ngMinutes}분</div>
                  <div className="rounded-lg bg-neutral-800 px-3 py-2 text-neutral-300">대기 {reportStats.pendingMinutes}분</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-neutral-100">장소별 진행률</h3>
                      <p className="mt-1 text-xs text-neutral-500">어느 장소에 후속 확인이 남았는지 바로 봅니다.</p>
                    </div>
                    <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-black text-neutral-400">{reportLocationStats.length}곳</span>
                  </div>
                  <div className="space-y-3">
                    {reportLocationStats.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-700 px-3 py-8 text-center text-xs text-neutral-500">장소 데이터 없음</div>
                    ) : reportLocationStats.map((item) => (
                      <div key={item.name} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-neutral-100">{item.name}</div>
                            <div className="mt-0.5 text-[10px] font-bold text-neutral-500">{item.total}개 · {item.minutes}분</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-indigo-300">{item.completionRate}%</div>
                            <div className="text-[10px] font-bold text-neutral-600">완료율</div>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.completionRate}%` }} />
                        </div>
                        <div className="mt-2 flex gap-2 text-[10px] font-bold">
                          <span className="rounded bg-green-500/10 px-2 py-1 text-green-300">완료 {item.done}</span>
                          <span className="rounded bg-red-500/10 px-2 py-1 text-red-300">NG {item.ng}</span>
                          <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">대기 {item.pending}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-neutral-100">후속조치</h3>
                      <p className="mt-1 text-xs text-neutral-500">NG와 대기 항목만 모아봅니다.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black ${reportActionItems.length ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'}`}>
                      {reportActionItems.length ? `${reportActionItems.length}건` : '완료'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {reportActionItems.length === 0 ? (
                      <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-8 text-center text-xs font-bold text-green-300">후속조치 없음</div>
                    ) : reportActionItems.map(({ scene, priority, action }) => (
                      <div key={scene.id} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`mb-1 inline-flex rounded px-2 py-0.5 text-[9px] font-black ${priority === '필수' ? 'bg-red-500/15 text-red-300' : 'bg-neutral-800 text-neutral-300'}`}>{priority}</div>
                            <div className="text-sm font-bold text-neutral-100">{scene.sceneNumber || scene.eventSection || copy.item} · {scene.location || '장소 미정'}</div>
                            <div className="mt-1 text-xs text-neutral-500">{action}</div>
                          </div>
                          <div className="shrink-0 text-xs font-black text-neutral-500">{scene.estimatedMinutes}분</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {[
                  { title: template === 'event' ? 'NG / 재확인 필요' : 'NG / 재촬영 필요', scenes: reportSceneGroups.ng, tone: 'border-red-500/30 bg-red-500/5 text-red-300', empty: `NG ${copy.item} 없음` },
                  { title: `완료 ${copy.itemPlural}`, scenes: reportSceneGroups.done, tone: 'border-green-500/30 bg-green-500/5 text-green-300', empty: '완료 체크 없음' },
                  { title: `대기 ${copy.itemPlural}`, scenes: reportSceneGroups.pending, tone: 'border-neutral-700 bg-neutral-900 text-neutral-300', empty: `대기 ${copy.item} 없음` },
                ].map((group) => (
                  <div key={group.title} className={`rounded-2xl border p-4 ${group.tone}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-neutral-100">{group.title}</h3>
                      <span className="rounded-full bg-black/30 px-2 py-1 text-[10px] font-black">{group.scenes.length}개</span>
                    </div>
                    <div className="space-y-2">
                      {group.scenes.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-700 px-3 py-8 text-center text-xs text-neutral-500">{group.empty}</div>
                      ) : (
                        group.scenes.map((scene) => (
                          <div key={scene.id} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                            <div className="flex items-start gap-3">
                              <div className="pdf-shot-frame relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-white">
                                {scene.visualRef ? (
                                  <Image
                                    src={scene.visualRef}
                                    alt={scene.sceneNumber || scene.eventSection || copy.item}
                                    width={160}
                                    height={90}
                                    unoptimized
                                    className="h-full w-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = storyboardFallback(scene.sceneNumber || scene.eventSection || copy.item); }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                                    <ImageIcon className="h-4 w-4 text-neutral-700" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{scene.sceneNumber || (template === 'event' ? scene.eventSection : 'NO SCENE') || copy.item} · {scene.location || '장소 미정'}</div>
                                <div className="mt-1 text-sm font-bold text-neutral-100">{scene.description || '상세 내용 없음'}</div>
                                {(scene.cast || scene.clientMemo || scene.cameraGear || scene.lightingNote) && (
                                  <div className="mt-2 text-xs text-neutral-500">
                                    {scene.cast && <span>{template === 'event' ? '진행/참석: ' : template === 'ad' ? '모델/출연: ' : '출연: '}{scene.cast}</span>}
                                    {scene.cast && (scene.clientMemo || scene.cameraGear || scene.lightingNote) && <span> · </span>}
                                    {scene.clientMemo && <span>메모: {scene.clientMemo}</span>}
                                    {!scene.clientMemo && scene.cameraGear && <span>장비: {scene.cameraGear}</span>}
                                    {!scene.clientMemo && !scene.cameraGear && scene.lightingNote && <span>톤: {scene.lightingNote}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0 text-xs font-black text-neutral-400">{scene.estimatedMinutes}분</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Production Guide Section */}
        <details className="group mt-12 border-t border-neutral-900 pb-20 pt-6 text-neutral-400">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-neutral-900 bg-neutral-950/70 px-5 py-4 transition-all hover:border-neutral-800">
            <span className="text-sm font-black text-neutral-300">도움말 / 제작 가이드</span>
            <span className="text-neutral-600 transition-transform group-open:rotate-180">↓</span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200 flex items-center gap-2">
                <span className="bg-indigo-500 w-1 h-6 rounded-full"></span>
                효율적인 촬영 준비를 위한 가이드
              </h3>
              <div className="space-y-5">
                <div>
                  <h4 className="text-neutral-300 font-medium mb-1">1. 일촬표(Call Sheet)의 중요성</h4>
                  <p className="text-sm leading-relaxed">촬영 현장의 모든 스태프가 공유하는 단 하나의 지도입니다. 시작 시간, 장소, 촬영 순서를 명확히 기재하여 불필요한 대기 시간을 줄이는 것이 핵심입니다.</p>
                </div>
                <div>
                  <h4 className="text-neutral-300 font-medium mb-1">2. 씬(Scene) 배치 전략</h4>
                  <p className="text-sm leading-relaxed">보통 조명 세팅의 효율을 위해 같은 장소와 같은 시간대(Day/Night)를 묶어서 촬영하는 것이 제작비를 아끼는 지름길입니다.</p>
                </div>
                <div>
                  <h4 className="text-neutral-300 font-medium mb-1">3. AI 콘티 활용법</h4>
                  <p className="text-sm leading-relaxed">PrePro Studio의 AI 콘티는 감독의 머릿속에 있는 앵글을 빠르게 시각화해줍니다. 필요한 순간에만 콘티 갤러리를 열어 선택하세요.</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800/50">
              <h3 className="text-lg font-semibold text-neutral-200 mb-4">자주 묻는 질문 (FAQ)</h3>
              <div className="space-y-4 text-sm">
                <details className="group/faq cursor-pointer">
                  <summary className="list-none flex items-center justify-between font-medium text-neutral-300">
                    데이터는 어디에 저장되나요? <span className="transition-transform group-open/faq:rotate-180">↓</span>
                  </summary>
                  <p className="mt-2 text-neutral-500">현재 모든 데이터는 보안을 위해 브라우저의 로컬 스토리지에만 저장됩니다. 별도의 회원가입 없이도 안심하고 사용하세요.</p>
                </details>
                <details className="group/faq cursor-pointer">
                  <summary className="list-none flex items-center justify-between font-medium text-neutral-300">
                    PDF가 잘려서 나와요. <span className="transition-transform group-open/faq:rotate-180">↓</span>
                  </summary>
                  <p className="mt-2 text-neutral-500">일촬표 특성상 가로형 레이아웃에 최적화되어 있습니다. 내보내기 시 자동으로 A4 가로 사이즈로 조정됩니다.</p>
                </details>
              </div>
            </div>
          </div>
        </details>

        {showLocationModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLocationModal(false)}></div>
            <div className="relative w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{editingLocation ? '장소 편집' : '장소 추가'}</h2>
                  <p className="text-sm text-neutral-500">촬영 장소와 날씨 조회 기준을 관리합니다.</p>
                </div>
                <button onClick={() => setShowLocationModal(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">장소명</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">주소</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.address} onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">장소 유형</label>
                  <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.type} onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value as ProductionLocation['type'] })}>
                    <option value="studio">스튜디오</option>
                    <option value="indoor">실내</option>
                    <option value="outdoor">실외</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">허가 상태</label>
                  <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.permitStatus} onChange={(e) => setLocationForm({ ...locationForm, permitStatus: e.target.value as ProductionLocation['permitStatus'] })}>
                    <option value="ok">완료</option>
                    <option value="pending">진행중</option>
                    <option value="none">미확인</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">날씨 위치</label>
                  <div className="flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                      placeholder="장소명이나 주소로 검색"
                      value={locationForm.weatherQuery || ''}
                      onChange={(e) => {
                        setLocationForm({
                          ...locationForm,
                          weatherQuery: e.target.value,
                          weatherLabel: '',
                          weatherLatitude: undefined,
                          weatherLongitude: undefined,
                        });
                        setWeatherLocationResults([]);
                        setWeatherLocationError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchWeatherLocation();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={searchWeatherLocation}
                      disabled={isSearchingWeatherLocation || !(locationForm.weatherQuery || locationForm.address || locationForm.name)?.trim()}
                      className="shrink-0 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-xs font-black text-indigo-200 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-600"
                    >
                      {isSearchingWeatherLocation ? '검색중' : '검색'}
                    </button>
                  </div>
                  <div className="rounded-xl border border-neutral-900 bg-black/40 p-3">
                    {locationForm.weatherLatitude && locationForm.weatherLongitude ? (
                      <div className="flex items-start gap-2 text-xs font-bold text-indigo-200">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                        <div className="min-w-0">
                          <div className="truncate">{locationForm.weatherLabel || locationForm.weatherQuery}</div>
                          <div className="mt-1 font-mono text-[10px] text-neutral-600">
                            {locationForm.weatherLatitude.toFixed(4)}, {locationForm.weatherLongitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-neutral-600">위치 후보를 검색해서 선택하면 해당 좌표 기준으로 날씨를 조회합니다.</div>
                    )}
                    {weatherLocationError && <div className="mt-2 text-xs font-bold text-red-400">{weatherLocationError}</div>}
                    {weatherLocationResults.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {weatherLocationResults.map((candidate) => (
                          <button
                            key={`${candidate.latitude}:${candidate.longitude}:${candidate.label}`}
                            type="button"
                            onClick={() => selectWeatherLocation(candidate)}
                            className="flex w-full items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-left hover:border-indigo-500/40"
                          >
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black text-neutral-200">{candidate.label}</span>
                              <span className="mt-1 block font-mono text-[10px] text-neutral-600">{candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">담당자 / 연락처</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.contact} onChange={(e) => setLocationForm({ ...locationForm, contact: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">메모</label>
                  <textarea className="h-24 w-full resize-none rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={locationForm.notes} onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowLocationModal(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-300">취소</button>
                <button onClick={saveLocation} disabled={!locationForm.name.trim()} className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700">저장</button>
              </div>
            </div>
          </div>
        )}

        {showPersonModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPersonModal(false)}></div>
            <div className="relative w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{editingPerson ? '인원 편집' : '인원 추가'}</h2>
                  <p className="text-sm text-neutral-500">출연진과 스태프 정보를 관리합니다.</p>
                </div>
                <button onClick={() => setShowPersonModal(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">이름</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">구분</label>
                  <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={personForm.category} onChange={(e) => setPersonForm({ ...personForm, category: e.target.value as Person['category'] })}>
                    <option value="cast">출연진</option>
                    <option value="crew">스태프</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">역할 / 직책</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={personForm.role} onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">연락처</label>
                  <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={personForm.phone} onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">콜 타임</label>
                  <input
                    type="time"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
                    value={personForm.callTime}
                    onChange={(e) => setPersonForm({ ...personForm, callTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">메모</label>
                  <textarea className="h-24 w-full resize-none rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={personForm.notes} onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowPersonModal(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-300">취소</button>
                <button onClick={savePerson} disabled={!personForm.name.trim()} className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700">저장</button>
              </div>
            </div>
          </div>
        )}

        {showBreakModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBreakModal(false)}></div>
            <div className="relative w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{editingBreak ? '시간 편집' : '시간 추가'}</h2>
                  <p className="text-sm text-neutral-500">식사, 이동, 세팅, 휴식 시간을 일정표에 넣습니다.</p>
                </div>
                <button onClick={() => setShowBreakModal(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">종류</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    value={breakForm.type}
                    onChange={(e) => setBreakForm({ ...breakForm, type: e.target.value as BreakItem['type'] })}
                  >
                    <option value="meal">식사</option>
                    <option value="move">이동</option>
                    <option value="setup">세팅</option>
                    <option value="rest">휴식</option>
                    <option value="custom">기타</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">소요 시간</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 pr-14 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                      value={breakForm.estimatedMinutes}
                      onChange={(e) => setBreakForm({ ...breakForm, estimatedMinutes: Number(e.target.value) })}
                    />
                    <span className="absolute right-4 top-3.5 text-[10px] font-black uppercase text-neutral-600">분</span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">라벨</label>
                  <input
                    className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    value={breakForm.label}
                    onChange={(e) => setBreakForm({ ...breakForm, label: e.target.value })}
                    placeholder="예: 점심 식사, 이동, 조명 세팅"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">연결 장소</label>
                  <select
                    className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    value={breakForm.locationId}
                    onChange={(e) => setBreakForm({ ...breakForm, locationId: e.target.value })}
                  >
                    <option value="">장소 없음</option>
                    {locations.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                {editingBreak ? (
                  <button
                    onClick={() => {
                      deleteBreak(editingBreak.id);
                      setOptimizationSummary(null);
                      setShowBreakModal(false);
                      setEditingBreak(null);
                    }}
                    className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10"
                  >
                    삭제
                  </button>
                ) : (
                  <span></span>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowBreakModal(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-neutral-500 hover:text-neutral-300">취소</button>
                  <button
                    onClick={saveBreak}
                    disabled={!breakForm.label.trim() || Number(breakForm.estimatedMinutes || 0) < 1}
                    className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 스토리보드 갤러리 모달 */}
        {showGallery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowGallery(false)}></div>
            <div className="relative bg-neutral-900 w-full max-w-6xl h-full max-h-[85vh] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> 시네마틱 앵글 {storyboardDb.length}종 갤러리
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">{copy.storyboardDescription}</p>
                </div>
                <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-neutral-900 py-2 z-10">
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                    {storyboardCategoryOptions.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSbCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${sbCategory === cat.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-80">
                    <input 
                      type="text" 
                      placeholder="앵글 명칭 또는 키워드 검색..." 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={sbSearch}
                      onChange={(e) => setSbSearch(e.target.value)}
                    />
                    <Sparkles className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredStoryboards.map(sb => {
                    const isRecommended = recommendations.some(r => r.id === sb.id);
                    const isSelected = newSceneParams.visualRef === sb.url;
                    
                    return (
                      <div 
                        key={sb.id} 
                        onClick={() => {
                          setNewSceneParams({...newSceneParams, visualRef: sb.url});
                          setShowGallery(false);
                        }}
                        className={`group relative cursor-pointer border-2 rounded-2xl overflow-hidden transition-all h-full flex flex-col ${isSelected ? 'border-indigo-500 scale-[1.02] shadow-xl shadow-indigo-500/20' : 'border-neutral-800 hover:border-neutral-600'}`}
                      >
                        {isRecommended && (
                          <div className="absolute top-2 left-2 bg-indigo-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg border border-white/20">
                            <Sparkles className="w-2.5 h-2.5" /> 추천
                          </div>
                        )}
                        <div className="w-full aspect-video bg-white overflow-hidden relative">
                           <Image 
                            src={sb.url} 
                            alt={sb.name} 
                            width={320}
                            height={180}
                            loading="lazy"
                            unoptimized
                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = storyboardFallback(sb.name);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform" />
                          </div>
                        </div>
                        <div className={`p-3 text-center flex-1 flex flex-col items-center justify-center gap-1 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 group-hover:bg-neutral-800'}`}>
                          <p className="text-[11px] font-bold leading-tight">{sb.name}</p>
                          <p className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-neutral-500'} line-clamp-1`}>{sb.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <p className="text-xs text-neutral-500">전체 {storyboardDb.length}종 중 {filteredStoryboards.length}개 표시 중</p>
                <button 
                  onClick={() => setShowGallery(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  </div>
</div>
  );
}
