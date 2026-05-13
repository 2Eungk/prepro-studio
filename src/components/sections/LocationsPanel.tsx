'use client';

import type { ComponentType } from 'react';
import type { ProductionLocation, Scene, TemplateType } from '@/types/schedule';
import { Clock, Database, MapPin, Plus } from 'lucide-react';

type WeatherTarget = {
  latitude: number;
  longitude: number;
  label: string;
};

type LocationsPanelCopy = {
  item: string;
  locationItemCount: string;
};

type LocationWeatherSummaryProps = {
  query: string;
  date: string;
  target?: WeatherTarget;
};

type LocationsPanelProps = {
  activeShootingDate: string;
  copy: LocationsPanelCopy;
  locationTypeLabels: Record<ProductionLocation['type'], string>;
  locations: ProductionLocation[];
  permitStatusLabels: Record<ProductionLocation['permitStatus'], string>;
  scenes: Scene[];
  template: TemplateType;
  templateLabel: string;
  LocationWeatherSummary: ComponentType<LocationWeatherSummaryProps>;
  getLocationWeatherQuery: (location: ProductionLocation) => string;
  getProductionLocationWeatherTarget: (location: ProductionLocation) => WeatherTarget | undefined;
  onAddLocation: () => void;
  onDeleteLocation: (location: ProductionLocation) => void;
  onEditLocation: (location: ProductionLocation) => void;
  onGoSchedule: () => void;
  onLoadSampleData: () => void;
};

const descriptionByTemplate: Record<TemplateType, string> = {
  event: '행사장, 구역, 담당자와 촬영 기준 위치를 관리합니다.',
  musicvideo: '스튜디오, 로케이션, 야간 허가, 날씨 기준 위치를 관리합니다.',
  dance: '댄스 스튜디오, 바닥, 거울, 조명, 날씨 기준 위치를 관리합니다.',
  film: '장소, 허가, 담당자와 촬영 기준 위치를 관리합니다.',
  ad: '장소, 허가, 담당자와 촬영 기준 위치를 관리합니다.',
};

export default function LocationsPanel({
  activeShootingDate,
  copy,
  locationTypeLabels,
  locations,
  permitStatusLabels,
  scenes,
  template,
  templateLabel,
  LocationWeatherSummary,
  getLocationWeatherQuery,
  getProductionLocationWeatherTarget,
  onAddLocation,
  onDeleteLocation,
  onEditLocation,
  onGoSchedule,
  onLoadSampleData,
}: LocationsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-neutral-100">장소 DB</h2>
          <p className="text-sm text-neutral-500">{descriptionByTemplate[template]}</p>
        </div>
        <button onClick={onAddLocation} className="prepro-btn prepro-btn--primary h-12 px-5 text-sm">
          + 장소 추가
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {locations.length === 0 ? (
          <div className="col-span-full overflow-hidden rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/70">
            <div className="grid gap-0 lg:grid-cols-[minmax(260px,0.7fr)_minmax(420px,1fr)]">
              <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.13),rgba(242,161,75,0.05)_62%,transparent)] p-6 lg:border-b-0 lg:border-r">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-100">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-black text-neutral-100">첫 장소를 등록하세요.</h3>
                <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-neutral-500">
                  장소 DB는 허가, 담당자, 날씨 위치, 로케이션 체크를 묶어 관리합니다. {copy.item}을 추가해도 자동으로 만들어집니다.
                </p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { label: '장소 직접 추가', detail: '주소, 허가, 날씨 기준 입력', Icon: Plus, action: onAddLocation, tone: 'primary' },
                  { label: '촬영표에서 시작', detail: `${copy.item} 추가 시 장소 자동 생성`, Icon: Clock, action: onGoSchedule, tone: 'neutral' },
                  { label: '샘플로 확인', detail: `${templateLabel} 예시 장소 불러오기`, Icon: Database, action: onLoadSampleData, tone: 'neutral' },
                ].map((item) => {
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className={`prepro-action-card group rounded-xl border p-4 text-left transition-all ${item.tone === 'primary' ? 'is-primary' : ''}`}
                    >
                      <Icon className="h-4 w-4 text-teal-200" />
                      <div className="mt-4 text-sm font-black text-neutral-100">{item.label}</div>
                      <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
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
              {(item.storyFit || item.visualCheck || item.soundCheck || item.powerCheck || item.accessCheck || item.weatherRisk) && (
                <div className="mt-4 grid gap-2 rounded-2xl border border-neutral-900 bg-black/30 p-3">
                  {[
                    item.storyFit && ['스토리', item.storyFit],
                    item.visualCheck && ['비주얼', item.visualCheck],
                    item.soundCheck && ['사운드', item.soundCheck],
                    item.powerCheck && ['전력', item.powerCheck],
                    item.accessCheck && ['운영', item.accessCheck],
                    item.weatherRisk && ['날씨', item.weatherRisk],
                  ].filter(Boolean).slice(0, 3).map((entry) => {
                    const [label, value] = entry as string[];
                    return (
                      <div key={`${label}-${value}`} className="text-xs font-bold text-neutral-500">
                        <span className="text-teal-300/80">{label}</span> · <span className="text-neutral-400">{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {item.notes && <p className="mt-2 text-sm text-neutral-600">{item.notes}</p>}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => onEditLocation(item)} className="prepro-btn prepro-btn--secondary h-9">
                  편집
                </button>
                <button onClick={() => onDeleteLocation(item)} className="prepro-btn prepro-btn--danger h-9">
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
