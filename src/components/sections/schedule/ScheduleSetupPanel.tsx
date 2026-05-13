'use client';

import type { ComponentType } from 'react';
import { format } from 'date-fns';
import { Camera, Clock } from 'lucide-react';

type WeatherTarget = {
  latitude: number;
  longitude: number;
  label: string;
};

type WeatherWidgetProps = {
  location: string;
  date: string;
  target?: WeatherTarget;
};

type ScheduleSetupPanelProps = {
  activeCallTime: Date | null;
  activeShootingDate: string;
  activeShootingStartTime: Date | null;
  hasFilmSampleInsideDance: boolean;
  location: string;
  locationWeatherButtonLabel: string;
  sceneLocation: string;
  weatherLabel?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  WeatherWidget: ComponentType<WeatherWidgetProps>;
  onLoadSampleData: () => void;
  onSetWeatherFromSceneLocation: () => void;
  onTimeChange: (type: 'call' | 'shoot', value: string) => void;
};

export default function ScheduleSetupPanel({
  activeCallTime,
  activeShootingDate,
  activeShootingStartTime,
  hasFilmSampleInsideDance,
  location,
  locationWeatherButtonLabel,
  sceneLocation,
  weatherLabel,
  weatherLatitude,
  weatherLongitude,
  WeatherWidget,
  onLoadSampleData,
  onSetWeatherFromSceneLocation,
  onTimeChange,
}: ScheduleSetupPanelProps) {
  return (
    <>
      {hasFilmSampleInsideDance && (
        <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-teal-400/30 bg-teal-400/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-black text-teal-100">현재 일정이 영화 샘플 형식입니다.</div>
            <p className="mt-1 text-xs font-bold leading-relaxed text-teal-100/60">
              댄스커버는 씬/대사 대신 타임코드, 가사, 포커스 멤버, 안무/카메라 기준으로 보는 편이 맞습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadSampleData}
            className="prepro-btn prepro-btn--primary h-11 shrink-0"
          >
            댄스 샘플로 교체
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">날씨 조회 기준</p>
            <p className="text-sm font-bold text-neutral-300">{location || '상단 날씨 위치를 입력하세요'} · {activeShootingDate}</p>
          </div>
          <button
            onClick={onSetWeatherFromSceneLocation}
            disabled={!sceneLocation}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-bold text-neutral-500 transition-all hover:border-indigo-500/40 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {locationWeatherButtonLabel}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1.5 rounded-[2.5rem] bg-neutral-900/30 border border-neutral-900/50 backdrop-blur-md">
        <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">콜 타임</label>
            <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" value={activeCallTime ? format(activeCallTime, 'HH:mm') : ''} onChange={(e) => onTimeChange('call', e.target.value)} />
          </div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-neutral-700 transition-all">
          <div className="w-14 h-14 bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-300 group-hover:text-indigo-300 transition-colors">
            <Camera className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">촬영 시작</label>
            <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" value={activeShootingStartTime ? format(activeShootingStartTime, 'HH:mm') : ''} onChange={(e) => onTimeChange('shoot', e.target.value)} />
          </div>
        </div>
      </div>
    </>
  );
}
