'use client';

import type { Scene, ProductionLocation, TemplateType } from '@/types/schedule';
import { Camera, Download, Lightbulb, MapPin, RefreshCw, Sun, Video } from 'lucide-react';
import { useState } from 'react';

type DiagramTemplateId = 'interview' | 'restaurant' | 'product' | 'dance' | 'event';

type DiagramItem = {
  id: string;
  label: string;
  x: number;
  y: number;
  tone: 'camera' | 'light' | 'subject' | 'practical' | 'negative';
  note: string;
};

type DiagramTemplate = {
  id: DiagramTemplateId;
  title: string;
  subtitle: string;
  bestFor: string;
  roomLabel: string;
  cameraPlan: string;
  lightingPlan: string;
  checklist: string[];
  items: DiagramItem[];
};

const diagramTemplates: DiagramTemplate[] = [
  {
    id: 'interview',
    title: '1인 인터뷰',
    subtitle: '키라이트 + 백라이트 + 안전 와이드',
    bestFor: '인터뷰, 대표님 메시지, 강의형 콘텐츠',
    roomLabel: '실내 인터뷰 룸',
    cameraPlan: 'A캠은 아이레벨 35-45도 방향, 필요하면 B캠은 70도 클로즈업.',
    lightingPlan: '창/실내등 방향을 보고 키라이트를 45도에 두고, 배경 분리용 백라이트를 약하게 둡니다.',
    checklist: ['안경 반사 확인', '마이크 그림자 확인', '배경 로고/소품 정리', '에어컨/냉장고 소음 체크'],
    items: [
      { id: 'camera-a', label: 'A CAM', x: 50, y: 82, tone: 'camera', note: '아이레벨 메인 카메라' },
      { id: 'subject', label: 'SUBJ', x: 50, y: 46, tone: 'subject', note: '인터뷰이' },
      { id: 'key', label: 'KEY', x: 25, y: 34, tone: 'light', note: '소프트 키라이트' },
      { id: 'fill', label: 'FILL', x: 76, y: 52, tone: 'negative', note: '반사판/네거티브 필' },
      { id: 'back', label: 'BACK', x: 68, y: 28, tone: 'practical', note: '헤어/백라이트' },
    ],
  },
  {
    id: 'restaurant',
    title: '카페/식당 테이블',
    subtitle: '창가 방향 + 테이블 동선 + 음식 인서트',
    bestFor: '식당 홍보, 로컬 매장, 인터뷰+스케치',
    roomLabel: '테이블/창가 존',
    cameraPlan: 'A캠은 인물 투샷, B-roll은 음식/손/동선 인서트 위주로 분리합니다.',
    lightingPlan: '창을 키로 쓰고, 실내등 플리커를 확인한 뒤 소형 LED로 음식 면만 살립니다.',
    checklist: ['손님 동선 방해 금지', '반사되는 메뉴판/유리 체크', '음식 김/윤기 타이밍', '매장 음악 저작권 확인'],
    items: [
      { id: 'camera-a', label: 'A CAM', x: 24, y: 72, tone: 'camera', note: '테이블 투샷' },
      { id: 'camera-b', label: 'B ROLL', x: 76, y: 66, tone: 'camera', note: '음식/손 인서트' },
      { id: 'table', label: 'TABLE', x: 50, y: 47, tone: 'subject', note: '테이블/음식' },
      { id: 'window', label: 'WINDOW', x: 16, y: 42, tone: 'practical', note: '창 자연광' },
      { id: 'led', label: 'LED', x: 72, y: 36, tone: 'light', note: '음식 보강 소형 LED' },
    ],
  },
  {
    id: 'product',
    title: '제품 테이블탑',
    subtitle: '탑라이트 + 반사판 + 매크로 카메라',
    bestFor: '제품컷, 상세페이지, 광고 인서트',
    roomLabel: '테이블탑 세트',
    cameraPlan: '카메라는 제품 정면/45도로 두고, 매크로 인서트는 삼각대 고정 후 제품만 회전합니다.',
    lightingPlan: '상부 확산광으로 기본 면을 만들고, 흰/검 반사판으로 라인과 반사를 조절합니다.',
    checklist: ['먼지/지문 제거', '패키지 흠집 확인', '반사판 위치 기록', '로고 정면/수평 확인'],
    items: [
      { id: 'camera-a', label: 'MACRO', x: 50, y: 78, tone: 'camera', note: '매크로 카메라' },
      { id: 'product', label: 'PRODUCT', x: 50, y: 48, tone: 'subject', note: '제품/턴테이블' },
      { id: 'top', label: 'TOP', x: 50, y: 24, tone: 'light', note: '탑 소프트박스' },
      { id: 'white', label: 'WHITE', x: 24, y: 48, tone: 'practical', note: '흰 반사판' },
      { id: 'black', label: 'BLACK', x: 76, y: 48, tone: 'negative', note: '검 플래그' },
    ],
  },
  {
    id: 'dance',
    title: '댄스/퍼포먼스',
    subtitle: '풀샷 안전본 + 센터 클로즈업 + 대형 마킹',
    bestFor: '댄스커버, 퍼포먼스, MV 군무',
    roomLabel: '스튜디오 플로어',
    cameraPlan: 'A캠 풀샷은 고정 안전본, B캠은 센터/파트별 클로즈업 또는 사선 이동으로 분리합니다.',
    lightingPlan: '정면 키를 넓게 깔고, 사이드/백으로 실루엣을 분리합니다. 플리커와 바닥 반사를 먼저 봅니다.',
    checklist: ['바닥 미끄럼 확인', '센터/대형 마킹', '거울 반사 체크', '음원 싱크 기준 박수/슬레이트'],
    items: [
      { id: 'camera-a', label: 'FULL', x: 50, y: 84, tone: 'camera', note: '풀샷 안전본' },
      { id: 'camera-b', label: 'B CAM', x: 72, y: 70, tone: 'camera', note: '사선/센터 클로즈업' },
      { id: 'formation', label: 'MARK', x: 50, y: 46, tone: 'subject', note: '대형 마킹' },
      { id: 'key', label: 'WIDE KEY', x: 50, y: 27, tone: 'light', note: '넓은 정면 키' },
      { id: 'back', label: 'BACK', x: 50, y: 16, tone: 'practical', note: '백/사이드 분리광' },
    ],
  },
  {
    id: 'event',
    title: '행사/무대 커버리지',
    subtitle: 'A캠 고정 + B캠 리액션 + 오디오 라인',
    bestFor: '컨퍼런스, 세미나, 무대 행사',
    roomLabel: '무대/객석',
    cameraPlan: 'A캠은 무대 와이드 고정, B캠은 연사/객석 리액션, 오디오는 믹서 라인+백업 레코더.',
    lightingPlan: '행사장 조명은 건드리지 않고 노출 기준만 잠급니다. LED월/프로젝터 플리커를 테스트합니다.',
    checklist: ['라인아웃 사전 확인', 'VIP 동선/촬영 제한', '삼각대 통로 침범 금지', '발표자료 화면 노출 체크'],
    items: [
      { id: 'camera-a', label: 'A WIDE', x: 50, y: 86, tone: 'camera', note: '무대 와이드 고정' },
      { id: 'camera-b', label: 'B CU', x: 78, y: 62, tone: 'camera', note: '연사/객석 리액션' },
      { id: 'stage', label: 'STAGE', x: 50, y: 26, tone: 'subject', note: '무대/연사' },
      { id: 'audio', label: 'AUDIO', x: 20, y: 82, tone: 'practical', note: '믹서 라인/백업' },
      { id: 'screen', label: 'SCREEN', x: 50, y: 12, tone: 'light', note: 'LED/프로젝터' },
    ],
  },
];

const templateDefaults: Record<TemplateType, DiagramTemplateId> = {
  film: 'interview',
  ad: 'product',
  event: 'event',
  musicvideo: 'dance',
  dance: 'dance',
};

const toneClasses: Record<DiagramItem['tone'], { fill: string; stroke: string; text: string }> = {
  camera: { fill: '#2dd4bf', stroke: '#99f6e4', text: '#001412' },
  light: { fill: '#fde68a', stroke: '#fef3c7', text: '#1c1300' },
  subject: { fill: '#e5e7eb', stroke: '#ffffff', text: '#111827' },
  practical: { fill: '#c4b5fd', stroke: '#ddd6fe', text: '#160b38' },
  negative: { fill: '#525252', stroke: '#a3a3a3', text: '#f5f5f5' },
};

const escapeSvgText = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

type DiagramWorkspaceProps = {
  activeScene?: Scene;
  locations: ProductionLocation[];
  scenes: Scene[];
  template: TemplateType;
  templateLabel: string;
};

export default function DiagramWorkspace({ activeScene, locations, scenes, template, templateLabel }: DiagramWorkspaceProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<DiagramTemplateId>(templateDefaults[template]);
  const [selectedSceneId, setSelectedSceneId] = useState(activeScene?.id || scenes[0]?.id || '');
  const selectedTemplate = diagramTemplates.find((item) => item.id === selectedTemplateId) || diagramTemplates[0];
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || activeScene || scenes[0];
  const linkedLocation = selectedScene?.locationId ? locations.find((location) => location.id === selectedScene.locationId) : undefined;
  const sceneLightingNote = selectedScene?.lightingNote?.trim();
  const sceneCameraNote = selectedScene?.cameraGear?.trim() || selectedScene?.lensNote?.trim() || selectedScene?.shotSize?.trim();
  const filenameSafeTitle = (selectedScene?.sceneNumber || selectedScene?.eventSection || selectedTemplate.title)
    .replace(/[^a-zA-Z0-9가-힣_-]+/g, '-')
    .replace(/^-|-$/g, '') || 'diagram';
  const svgSceneLabel = selectedScene ? ` · ${selectedScene.description || selectedScene.location}` : '';
  const svgCameraPlan = escapeSvgText(sceneCameraNote || selectedTemplate.cameraPlan);
  const svgLightingPlan = escapeSvgText(sceneLightingNote || selectedTemplate.lightingPlan);

  const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#050505"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262626" stroke-width="1" opacity="0.8"/>
    </pattern>
  </defs>
  <rect width="960" height="640" fill="url(#bg)"/>
  <rect x="32" y="32" width="896" height="576" rx="28" fill="#0a0a0a" stroke="#404040" stroke-width="2"/>
  <rect x="64" y="108" width="832" height="420" rx="20" fill="url(#grid)" stroke="#525252" stroke-width="2"/>
  <text x="64" y="72" fill="#ffffff" font-size="28" font-family="Arial" font-weight="800">PrePro Diagram · ${escapeSvgText(selectedTemplate.title)}</text>
  <text x="64" y="94" fill="#a3a3a3" font-size="15" font-family="Arial">${escapeSvgText(`${selectedTemplate.roomLabel} · ${templateLabel}${svgSceneLabel}`)}</text>
  <rect x="94" y="138" width="772" height="360" rx="18" fill="#171717" stroke="#404040" stroke-dasharray="8 8"/>
  <text x="112" y="170" fill="#737373" font-size="13" font-family="Arial" font-weight="700">FLOOR / SET</text>
  ${selectedTemplate.items.map((item) => {
    const tone = toneClasses[item.tone];
    const cx = 94 + (item.x / 100) * 772;
    const cy = 138 + (item.y / 100) * 360;
    return `
  <circle cx="${cx}" cy="${cy}" r="34" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="3"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${tone.text}" font-size="13" font-family="Arial" font-weight="900">${escapeSvgText(item.label)}</text>
  <text x="${cx}" y="${cy + 58}" text-anchor="middle" fill="#d4d4d4" font-size="11" font-family="Arial" font-weight="700">${escapeSvgText(item.note)}</text>`;
  }).join('')}
  <text x="64" y="540" fill="#99f6e4" font-size="15" font-family="Arial" font-weight="800">CAMERA</text>
  <text x="64" y="565" fill="#d4d4d4" font-size="14" font-family="Arial">${svgCameraPlan}</text>
  <text x="64" y="590" fill="#fde68a" font-size="15" font-family="Arial" font-weight="800">LIGHT</text>
  <text x="130" y="590" fill="#d4d4d4" font-size="14" font-family="Arial">${svgLightingPlan}</text>
</svg>`;

  const exportSvg = () => {
    if (typeof window === 'undefined') return;
    const normalized = svgMarkup.trim();
    const blob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prepro-${filenameSafeTitle}-diagram.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="scroll-mt-24 rounded-3xl border border-violet-300/20 bg-violet-300/5 p-4 md:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100">
                Diagram MVP
              </div>
              <h2 className="mt-4 text-2xl font-black text-white md:text-4xl">조명도 / 카메라 배치 초안</h2>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-neutral-500">
                템플릿을 고르면 현장용 평면 배치와 체크리스트가 바로 나옵니다. 씬의 조명 메모/카메라 메모가 있으면 아래 플랜에 우선 반영합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={exportSvg}
              className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-200 px-4 py-3 text-sm font-black text-black transition-colors hover:bg-white"
            >
              <Download className="h-4 w-4" />
              SVG 다운로드
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {diagramTemplates.map((item) => {
              const isActive = item.id === selectedTemplateId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(item.id)}
                  className={`min-h-28 rounded-2xl border p-4 text-left transition-all ${isActive ? 'border-violet-300/60 bg-violet-300 text-black' : 'border-neutral-800 bg-neutral-950 text-neutral-100 hover:border-violet-300/40 hover:bg-neutral-900'}`}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`h-4 w-4 ${isActive ? 'text-black/70' : 'text-violet-200'}`} />
                    <div className="text-sm font-black">{item.title}</div>
                  </div>
                  <p className={`mt-2 text-[11px] font-bold leading-relaxed ${isActive ? 'text-black/60' : 'text-neutral-600'}`}>{item.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
            <div className="grid gap-4 border-b border-neutral-800 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">Selected setup</div>
                <h3 className="mt-1 text-xl font-black text-white">{selectedTemplate.title}</h3>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{selectedTemplate.bestFor}</p>
              </div>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600">씬/컷 연결</span>
                <select
                  value={selectedScene?.id || selectedSceneId}
                  onChange={(event) => setSelectedSceneId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-neutral-800 bg-black px-3 text-sm font-bold text-white outline-none focus:border-violet-300/60"
                >
                  {scenes.length === 0 && <option value="">촬영표 없음 · 템플릿 기준</option>}
                  {scenes.map((scene, index) => (
                    <option key={scene.id} value={scene.id}>
                      {index + 1}. {scene.sceneNumber || scene.eventSection || scene.description || scene.location || '무제 씬'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="overflow-x-auto p-3 custom-scrollbar">
              <div className="mx-auto min-w-[720px] max-w-[960px]" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100">
              <Camera className="h-4 w-4" />
              Camera plan
            </div>
            <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-300">{sceneCameraNote || selectedTemplate.cameraPlan}</p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
              <Sun className="h-4 w-4" />
              Lighting plan
            </div>
            <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-300">{sceneLightingNote || selectedTemplate.lightingPlan}</p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-100">
              <MapPin className="h-4 w-4" />
              Location context
            </div>
            <div className="mt-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-sm font-black text-white">{linkedLocation?.name || selectedScene?.location || locations[0]?.name || '장소 미정'}</div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">{linkedLocation?.visualCheck || linkedLocation?.powerCheck || linkedLocation?.notes || '장소 체크가 없으면 조명 전원, 소음, 창 방향을 먼저 확인하세요.'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-black/45 p-4 md:p-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
              <RefreshCw className="h-4 w-4" />
              Field checklist
            </div>
            <div className="mt-3 grid gap-2">
              {selectedTemplate.checklist.map((item) => (
                <label key={item} className="flex min-h-11 items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold text-neutral-300">
                  <input type="checkbox" className="h-4 w-4 rounded border-neutral-700 bg-black accent-violet-300" />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-violet-300/20 bg-violet-300/10 p-4 text-xs font-bold leading-relaxed text-violet-100">
            <Video className="mb-2 h-4 w-4" />
            다음 단계에서는 이 배치를 드래그 가능한 캔버스로 바꾸고, 씬별로 저장되게 확장하면 됩니다.
          </div>
        </aside>
      </div>
    </section>
  );
}
