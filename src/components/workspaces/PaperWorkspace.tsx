'use client';

import { format } from 'date-fns';
import { ArrowRight, CheckCircle2, Clock, Download, FileText, Plus, RefreshCw, Users } from 'lucide-react';
import { useState, type RefObject } from 'react';
import type { BreakItem, Person, ProductionLocation, Scene, ShootDay, TemplateType } from '@/types/schedule';

type PaperTimelineRow =
  | { id: string; type: 'scene'; scene: Scene }
  | { id: string; type: 'break'; breakItem: BreakItem };

type PaperWorkspaceProps = {
  activeDay: ShootDay;
  activeDayIndex: number;
  activeShootingDate: string;
  activeCallTime: Date | null;
  activeShootingStartTime: Date | null;
  isExportingPdf: boolean;
  locations: ProductionLocation[];
  people: Person[];
  rows: PaperTimelineRow[];
  template: TemplateType;
  templateLabel: string;
  totalMinutes: number;
  wrapTimeLabel: string;
  weatherLabel?: string;
  projectLocation: string;
  pdfButtonText: string;
  pdfRef: RefObject<HTMLDivElement | null>;
  onAddBreak: () => void;
  onAddScene: () => void;
  onCreateScene: (scene: { description: string; location: string; estimatedMinutes: number }) => void;
  onEditScene: (scene: Scene) => void;
  onExportPDF: () => void;
  onLoadSampleData: () => void;
  onOptimize: () => void;
  onOpenPeople: () => void;
  onToggleSceneStatus: (scene: Scene) => void;
};

const templateShotLabel: Record<TemplateType, string> = {
  film: '씬',
  ad: '컷',
  musicvideo: '큐',
  dance: '구간',
  event: '식순',
};

const breakTypeLabel: Record<BreakItem['type'], string> = {
  meal: '식사',
  move: '이동',
  setup: '세팅',
  rest: '휴식',
  custom: '시간',
};

const statusLabel: Record<NonNullable<Scene['status']>, string> = {
  pending: '대기',
  done: '완료',
  ng: 'NG',
};

const formatTime = (value?: Date) => {
  if (!value) return '--:--';
  try {
    return format(new Date(value), 'HH:mm');
  } catch {
    return '--:--';
  }
};

const scenePeopleLabel = (scene: Scene, people: Person[]) => {
  const linked = [
    ...(scene.castIds || []),
    ...(scene.crewIds || []),
  ]
    .map((id) => people.find((person) => person.id === id)?.name)
    .filter(Boolean);

  return linked.length > 0 ? linked.join(', ') : scene.cast || scene.focusMember || '담당 미정';
};

const sceneCode = (scene: Scene, index: number, template: TemplateType) => {
  if (scene.sceneNumber) return scene.sceneNumber;
  if (scene.eventSection) return scene.eventSection;
  if (scene.musicCue) return scene.musicCue;
  return `${templateShotLabel[template]} ${index + 1}`;
};

export default function PaperWorkspace({
  activeDay,
  activeDayIndex,
  activeShootingDate,
  activeCallTime,
  activeShootingStartTime,
  isExportingPdf,
  locations,
  people,
  rows,
  template,
  templateLabel,
  totalMinutes,
  wrapTimeLabel,
  weatherLabel,
  projectLocation,
  pdfButtonText,
  pdfRef,
  onAddBreak,
  onAddScene,
  onCreateScene,
  onEditScene,
  onExportPDF,
  onLoadSampleData,
  onOptimize,
  onOpenPeople,
  onToggleSceneStatus,
}: PaperWorkspaceProps) {
  const [quickDescription, setQuickDescription] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickMinutes, setQuickMinutes] = useState(30);
  const completedScenes = rows.filter((row) => row.type === 'scene' && row.scene.status === 'done').length;
  const sceneRows = rows.filter((row): row is Extract<PaperTimelineRow, { type: 'scene' }> => row.type === 'scene');
  const progressRate = sceneRows.length > 0 ? Math.round((completedScenes / sceneRows.length) * 100) : 0;
  const dayLocationNames = activeDay.locationIds
    .map((id) => locations.find((location) => location.id === id)?.name)
    .filter(Boolean);
  const locationLabel = dayLocationNames.length > 0 ? dayLocationNames.join(' / ') : projectLocation || '장소 미정';
  const missingPeopleCount = sceneRows.filter((row) => scenePeopleLabel(row.scene, people) === '담당 미정').length;
  const missingStoryboardCount = sceneRows.filter((row) => !row.scene.visualRef).length;
  const missingDurationCount = sceneRows.filter((row) => !row.scene.estimatedMinutes || row.scene.estimatedMinutes <= 0).length;
  const canCreateQuickScene = quickDescription.trim().length > 0;
  const handleCreateQuickScene = () => {
    if (!canCreateQuickScene) return;
    onCreateScene({
      description: quickDescription.trim(),
      location: quickLocation.trim() || locationLabel || '장소 미정',
      estimatedMinutes: Math.max(1, Number(quickMinutes) || 30),
    });
    setQuickDescription('');
  };

  return (
    <section ref={pdfRef} className="space-y-5" data-workspace="paper-od">
      <div className="overflow-hidden rounded-[2rem] border border-sky-300/20 bg-gradient-to-br from-neutral-950 via-black to-sky-950/20">
        <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] md:p-6">
          <div className="min-w-0">
            <div className="inline-flex rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">
              Paper mode · OD / Call sheet only
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              촬영 순서표만 바로 쓰기
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-relaxed text-neutral-400 md:text-base">
              Paper처럼 <span className="text-sky-100">촬영표, 시간 자동계산, 진행 체크, PDF 공유</span>만 한 화면에 모았습니다. 기획/리포트까지 안 들어가도 현장 운영표로 바로 쓸 수 있습니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {[
                ['Day', `${activeDayIndex + 1}`],
                ['Call', formatTime(activeCallTime || undefined)],
                ['First shot', formatTime(activeShootingStartTime || undefined)],
                ['Wrap', wrapTimeLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-neutral-800 bg-black/45 p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">{label}</div>
                  <div className="mt-1 text-lg font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-neutral-800 bg-black/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">Live progress</div>
                <div className="mt-1 text-3xl font-black text-white">{progressRate}%</div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-xl font-black text-sky-100">
                {completedScenes}/{sceneRows.length}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-900">
              <div className="h-full rounded-full bg-sky-300 transition-all" style={{ width: `${progressRate}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
              <button type="button" onClick={onAddScene} className="rounded-2xl bg-white px-3 py-3 text-black transition-colors hover:bg-sky-100">
                <Plus className="mr-1 inline h-3.5 w-3.5" /> 항목 추가
              </button>
              <button type="button" onClick={onExportPDF} disabled={isExportingPdf} className="rounded-2xl border border-neutral-700 px-3 py-3 text-neutral-200 transition-colors hover:border-sky-300/40 disabled:opacity-50">
                <Download className="mr-1 inline h-3.5 w-3.5" /> {pdfButtonText}
              </button>
            </div>
          </aside>
        </div>

        <div className="grid border-t border-neutral-900 bg-black/30 text-xs font-bold text-neutral-400 md:grid-cols-4">
          <div className="border-neutral-900 p-4 md:border-r">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">Project</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{templateLabel} · {activeShootingDate}</div>
          </div>
          <div className="border-neutral-900 p-4 md:border-r">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">Location</div>
            <div className="mt-1 truncate text-sm font-black text-neutral-100">{locationLabel}</div>
          </div>
          <div className="border-neutral-900 p-4 md:border-r">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">Weather</div>
            <div className="mt-1 truncate text-sm font-black text-neutral-100">{weatherLabel || '날씨 위치 미정'}</div>
          </div>
          <div className="p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">Runtime</div>
            <div className="mt-1 text-sm font-black text-neutral-100">{totalMinutes || 0}분 · {rows.length}개 블록</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: '담당 미정', value: missingPeopleCount, tone: missingPeopleCount > 0 ? 'text-amber-200' : 'text-emerald-200' },
          { label: '콘티/레퍼런스 없음', value: missingStoryboardCount, tone: missingStoryboardCount > 0 ? 'text-amber-200' : 'text-emerald-200' },
          { label: '시간 미정', value: missingDurationCount, tone: missingDurationCount > 0 ? 'text-amber-200' : 'text-emerald-200' },
          { label: '인원 DB', value: people.length, tone: 'text-sky-200' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">{item.label}</div>
            <div className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <button type="button" onClick={onOptimize} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:border-sky-300/40">
          <RefreshCw className="h-5 w-5 text-sky-200" />
          <div className="mt-3 text-sm font-black text-white">시간 다시 계산</div>
          <p className="mt-1 text-xs font-bold text-neutral-500">순서/소요시간 기준 자동 갱신</p>
        </button>
        <button type="button" onClick={onAddBreak} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:border-amber-300/40">
          <Clock className="h-5 w-5 text-amber-200" />
          <div className="mt-3 text-sm font-black text-white">이동/식사/세팅 추가</div>
          <p className="mt-1 text-xs font-bold text-neutral-500">비촬영 블록도 종료시간에 반영</p>
        </button>
        <button type="button" onClick={onOpenPeople} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:border-violet-300/40">
          <Users className="h-5 w-5 text-violet-200" />
          <div className="mt-3 text-sm font-black text-white">콜시트 보강</div>
          <p className="mt-1 text-xs font-bold text-neutral-500">인원/연락처/콜타임 확인</p>
        </button>
        <button type="button" onClick={onLoadSampleData} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition-colors hover:border-neutral-500">
          <FileText className="h-5 w-5 text-neutral-300" />
          <div className="mt-3 text-sm font-black text-white">샘플로 보기</div>
          <p className="mt-1 text-xs font-bold text-neutral-500">데이터 없을 때 Paper 모드 체험</p>
        </button>
      </div>

      <div id="paper-quick-add" className="rounded-[1.75rem] border border-sky-300/20 bg-sky-300/[0.04] p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Quick add</div>
            <h2 className="mt-1 text-xl font-black text-white">이 화면에서 바로 촬영 항목 추가</h2>
            <p className="mt-1 text-xs font-bold text-neutral-500">장소·내용·시간만 넣으면 기존 자동 시간 계산에 들어갑니다. 상세 콘티/인원은 나중에 눌러 보강하면 됩니다.</p>
          </div>
          <button type="button" onClick={onAddScene} className="rounded-2xl border border-neutral-700 px-4 py-3 text-sm font-black text-neutral-200 transition-colors hover:border-sky-300/40">
            상세 입력 폼 열기
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-[1.2fr_minmax(160px,0.65fr)_120px_120px]">
          <input
            value={quickDescription}
            onChange={(event) => setQuickDescription(event.target.value)}
            placeholder="예: 제품 히어로샷 / 오프닝 멘트 / 인터뷰 B-roll"
            className="min-h-12 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none transition-colors placeholder:text-neutral-700 focus:border-sky-300/50"
          />
          <input
            value={quickLocation}
            onChange={(event) => setQuickLocation(event.target.value)}
            placeholder={locationLabel || '장소 미정'}
            className="min-h-12 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none transition-colors placeholder:text-neutral-700 focus:border-sky-300/50"
          />
          <input
            type="number"
            min={1}
            value={quickMinutes}
            onChange={(event) => setQuickMinutes(Number(event.target.value))}
            className="min-h-12 rounded-2xl border border-neutral-800 bg-black px-4 text-sm font-bold text-white outline-none transition-colors focus:border-sky-300/50"
            aria-label="예상 분량"
          />
          <button type="button" onClick={handleCreateQuickScene} disabled={!canCreateQuickScene} className="min-h-12 rounded-2xl bg-sky-300 px-4 text-sm font-black text-black transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500">
            바로 추가
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-neutral-900 bg-black">
        <div className="flex flex-col gap-2 border-b border-neutral-900 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Order of day</div>
            <h2 className="mt-1 text-xl font-black text-white">실시간 촬영 순서표</h2>
          </div>
          <div className="text-xs font-bold text-neutral-500">체크하면 진행률이 바로 바뀌고 로컬 저장됩니다.</div>
        </div>

        {rows.length === 0 ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6">
            <a href="#paper-quick-add" className="rounded-3xl border border-sky-300/30 bg-sky-300 p-5 text-left text-black transition-colors hover:bg-sky-200">
              <Plus className="h-6 w-6" />
              <div className="mt-4 text-2xl font-black">첫 촬영 항목 만들기</div>
              <p className="mt-2 text-sm font-bold text-black/60">장소, 내용, 예상 시간만 넣으면 종료시간까지 계산됩니다.</p>
            </a>
            <button type="button" onClick={onLoadSampleData} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-left transition-colors hover:border-neutral-600">
              <FileText className="h-6 w-6 text-neutral-300" />
              <div className="mt-4 text-2xl font-black text-white">샘플 순서표 불러오기</div>
              <p className="mt-2 text-sm font-bold text-neutral-500">Paper형 OD 화면을 먼저 체험합니다.</p>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {rows.map((row, index) => {
              if (row.type === 'break') {
                const locationName = locations.find((location) => location.id === row.breakItem.locationId)?.name;
                return (
                  <div key={row.id} className="grid gap-3 bg-amber-300/[0.04] p-4 md:grid-cols-[96px_minmax(0,1fr)_120px] md:items-center">
                    <div className="text-lg font-black text-amber-100">{formatTime(row.breakItem.startTime)}</div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">{breakTypeLabel[row.breakItem.type]}</div>
                      <div className="mt-1 text-base font-black text-white">{row.breakItem.label}</div>
                      <div className="mt-1 text-xs font-bold text-neutral-500">{locationName || '장소 미정'}</div>
                    </div>
                    <div className="rounded-full border border-amber-300/20 px-3 py-1.5 text-center text-xs font-black text-amber-100">{row.breakItem.estimatedMinutes}분</div>
                  </div>
                );
              }

              const scene = row.scene;
              const status = scene.status || 'pending';
              const done = status === 'done';
              const rowPeople = scenePeopleLabel(scene, people);
              return (
                <article key={row.id} className={`grid gap-3 p-4 transition-colors md:grid-cols-[96px_minmax(0,1fr)_160px] md:items-center ${done ? 'bg-emerald-300/[0.04]' : 'bg-black'}`}>
                  <div>
                    <div className="text-lg font-black text-white">{scene.startTime ? formatTime(scene.startTime) : '시간 미정'}</div>
                    <div className="mt-1 text-xs font-black text-neutral-600">{scene.endTime ? `${formatTime(scene.endTime)} 종료` : done ? '완료 · 시간 미입력' : '종료 미정'}</div>
                  </div>
                  <button type="button" onClick={() => onEditScene(scene)} className="min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-neutral-700 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-300">{sceneCode(scene, index, template)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${done ? 'bg-emerald-300 text-black' : status === 'ng' ? 'bg-red-400 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
                        {statusLabel[status]}
                      </span>
                      <span className="rounded-full border border-neutral-800 px-2.5 py-1 text-[10px] font-black text-neutral-500">{scene.estimatedMinutes || 0}분</span>
                    </div>
                    <h3 className={`mt-2 text-lg font-black leading-snug ${done ? 'text-neutral-400 line-through decoration-emerald-300/60' : 'text-white'}`}>
                      {scene.description}
                    </h3>
                    <div className="mt-2 grid gap-1 text-xs font-bold text-neutral-500 md:grid-cols-3">
                      <span className="truncate">장소: {scene.location || '미정'}</span>
                      <span className="truncate">담당: {rowPeople}</span>
                      <span className="truncate">메모: {scene.lightingNote || scene.clientMemo || scene.choreoNote || scene.specialInstruction || '없음'}</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => onToggleSceneStatus(scene)} className={`min-h-11 rounded-2xl border px-4 py-3 text-sm font-black transition-colors ${done ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15' : 'border-neutral-700 bg-neutral-950 text-neutral-200 hover:border-emerald-300/40'}`}>
                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                    {done ? '완료 취소' : '완료 체크'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-neutral-900 bg-neutral-950/70 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">Next</div>
            <div className="mt-1 text-lg font-black text-white">Paper 모드는 독립 OD로 쓰고, 필요할 때 PrePro 전체 작업공간으로 확장</div>
            <p className="mt-1 text-sm font-bold text-neutral-500">촬영표만 필요한 사용자는 이 화면에서 끝낼 수 있고, 콘티/조명도/리포트가 필요하면 기존 워크스페이스로 넘어갑니다.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-black text-sky-100">
            촬영표 → 현장 체크 → PDF <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
