'use client';

import type { ComponentType, Dispatch, SetStateAction, ChangeEventHandler } from 'react';
import type { TemplateType } from '@/types/schedule';
import {
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  Database,
  FileText,
  Film,
  FolderOpen,
  KeyRound,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
} from 'lucide-react';

type MainWorkspaceTab = 'planning' | 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';
type MainWorkspaceGroup = '준비' | '촬영' | '정산';

type IconComponent = ComponentType<{ className?: string }>;

type WorkspaceLanguage = {
  setupLabel: string;
};

type WorkspaceTabItem = {
  id: MainWorkspaceTab;
  group: MainWorkspaceGroup;
  label: string;
  caption: string;
  metric: string;
  Icon: IconComponent;
};

type TemplateOption = {
  id: TemplateType;
  name: string;
  shortName: string;
  icon: IconComponent;
};

type WeatherQuickLocation = {
  label: string;
  value: string;
};

type WeatherLocationCandidate = {
  label: string;
  latitude: number;
  longitude: number;
  query: string;
};

type AppHeaderProps = {
  activeShootingDate: string;
  activeTab: MainWorkspaceTab;
  apiStorageLabel: string;
  autoSaveLabel: string;
  fileStatus: string;
  globalWeatherError: string;
  globalWeatherResults: WeatherLocationCandidate[];
  isReportMode: boolean;
  isSearchingGlobalWeather: boolean;
  location: string;
  mainWorkspaceGroups: MainWorkspaceGroup[];
  mainWorkspaceTabs: WorkspaceTabItem[];
  shareStatus: string;
  showProjectSetup: boolean;
  template: TemplateType;
  templateLabel: string;
  weatherLabel?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  weatherQuickLocations: WeatherQuickLocation[];
  workspaceLanguage: WorkspaceLanguage;
  onActiveDayDateChange: (date: string) => void;
  onCopyShareLink: () => void;
  onExportJSON: () => void;
  onImportJSON: ChangeEventHandler<HTMLInputElement>;
  onLoadSampleData: () => void;
  onResetProject: () => void;
  onSearchGlobalWeatherLocation: () => void;
  onSelectGlobalWeatherLocation: (candidate: WeatherLocationCandidate) => void;
  onSetActiveTab: (tab: MainWorkspaceTab) => void;
  onSetGlobalWeatherError: (value: string) => void;
  onSetGlobalWeatherResults: (value: WeatherLocationCandidate[]) => void;
  onSetIsReportMode: Dispatch<SetStateAction<boolean>>;
  onSetLocation: (value: string) => void;
  onSetShowAnalyzer: (value: boolean) => void;
  onSetShowProjectSetup: Dispatch<SetStateAction<boolean>>;
  onTemplateChange: (template: TemplateType) => void;
  productionTemplateOptions: TemplateOption[];
  sameText: (a?: string, b?: string) => boolean;
};

export default function AppHeader({
  activeShootingDate,
  activeTab,
  apiStorageLabel,
  autoSaveLabel,
  fileStatus,
  globalWeatherError,
  globalWeatherResults,
  isReportMode,
  isSearchingGlobalWeather,
  location,
  mainWorkspaceGroups,
  mainWorkspaceTabs,
  shareStatus,
  showProjectSetup,
  template,
  templateLabel,
  weatherLabel,
  weatherLatitude,
  weatherLongitude,
  weatherQuickLocations,
  workspaceLanguage,
  onActiveDayDateChange,
  onCopyShareLink,
  onExportJSON,
  onImportJSON,
  onLoadSampleData,
  onResetProject,
  onSearchGlobalWeatherLocation,
  onSelectGlobalWeatherLocation,
  onSetActiveTab,
  onSetGlobalWeatherError,
  onSetGlobalWeatherResults,
  onSetIsReportMode,
  onSetLocation,
  onSetShowAnalyzer,
  onSetShowProjectSetup,
  onTemplateChange,
  productionTemplateOptions,
  sameText,
}: AppHeaderProps) {
  return (
    <>
      <header className="flex flex-col gap-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pb-6 border-b border-neutral-900">
          <div className="flex items-center gap-5 min-w-0">
            <div className="shrink-0 rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-indigo-300">
              <Film className="w-8 h-8 text-current" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black uppercase leading-none text-neutral-100">PrePro Studio</h1>
                <span className="shrink-0 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[10px] font-black text-neutral-500 whitespace-nowrap">v1.3</span>
              </div>
              <p className="mt-1 text-xs font-bold text-neutral-500">
                기획서 · 촬영표 · 큐시트 · 콜시트 · 콘티 · 리포트 <span className="text-neutral-700">•</span> <span className="text-neutral-400">무로그인 BYOK 프로덕션 툴</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/20 bg-teal-400/10 px-2.5 py-1 text-[10px] font-black text-teal-100">
                  <CheckCircle2 className="h-3 w-3" />
                  {autoSaveLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500">
                  <Save className="h-3 w-3" />
                  이 브라우저에만 저장
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500">
                  <KeyRound className="h-3 w-3" />
                  {apiStorageLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 sm:flex sm:flex-wrap sm:items-center xl:justify-end">
            <button
              onClick={() => confirm('현재 프로젝트를 비우고 새로 시작할까요? 자동 저장된 데이터도 초기화됩니다.') && onResetProject()}
              className="prepro-btn prepro-btn--ghost"
              title="새 프로젝트"
            >
              <Plus className="h-4 w-4" />
              <span>새로</span>
            </button>
            <button
              onClick={onExportJSON}
              className={`prepro-btn ${fileStatus === '백업 저장됨' ? 'prepro-btn--secondary' : 'prepro-btn--ghost'}`}
              title="JSON 백업 파일로 내보내기"
            >
              <Save className="h-4 w-4" />
              <span>{fileStatus === '백업 저장됨' ? '백업됨' : '백업'}</span>
            </button>
            <label
              className={`prepro-btn cursor-pointer ${fileStatus && fileStatus !== '백업 저장됨' ? 'prepro-btn--secondary' : 'prepro-btn--ghost'}`}
              title="JSON 백업 파일 가져오기"
            >
              <FolderOpen className="h-4 w-4" />
              <span>{fileStatus && fileStatus !== '백업 저장됨' ? fileStatus : '가져오기'}</span>
              <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
            </label>
            <button
              onClick={onCopyShareLink}
              className={`prepro-btn ${shareStatus ? 'prepro-btn--secondary' : 'prepro-btn--ghost'}`}
              title="공유 링크 복사"
            >
              <Share2 className="h-4 w-4" />
              <span>{shareStatus || '공유'}</span>
            </button>
            <div className="mx-1 hidden h-5 w-px bg-neutral-800 sm:block"></div>
            <button
              onClick={() => onSetIsReportMode(!isReportMode)}
              className={`prepro-btn col-span-2 sm:col-span-1 ${isReportMode ? 'prepro-btn--secondary' : 'prepro-btn--quiet'}`}
            >
              <FileText className="w-4 h-4" />
              {isReportMode ? '리포트 모드 ON' : '리포트 모드 OFF'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-400/25 bg-[linear-gradient(135deg,rgba(94,215,207,0.12),rgba(242,161,75,0.055)_62%,rgba(255,255,255,0.025))] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-300/25 bg-black/35 text-teal-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-neutral-100">회원가입 없이, 작업 데이터는 이 브라우저에만 저장됩니다.</div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">
                  서버 DB에 프로젝트를 저장하지 않습니다. 다른 기기에서 열거나 공유하기 전에는 JSON 백업을 내려받아 보관하세요.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={onExportJSON}
                className="prepro-btn prepro-btn--secondary"
                title="현재 프로젝트를 JSON 백업 파일로 저장"
              >
                <Save className="h-4 w-4" />
                JSON 백업
              </button>
              <label
                className="prepro-btn prepro-btn--quiet cursor-pointer"
                title="저장해 둔 JSON 백업 파일 가져오기"
              >
                <FolderOpen className="h-4 w-4" />
                백업 복원
                <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
              </label>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 -mx-2 overflow-x-auto border-y border-neutral-900 bg-black/90 px-2 py-2 backdrop-blur custom-scrollbar">
        <div className="inline-flex min-w-max items-stretch gap-1.5">
          {mainWorkspaceGroups.map((group) => {
            const groupTabs = mainWorkspaceTabs.filter((tab) => tab.group === group);
            const groupIsActive = groupTabs.some((tab) => tab.id === activeTab);

            return (
              <div key={group} className="flex min-w-max items-stretch gap-1 rounded-xl border border-neutral-900 bg-neutral-950/45 p-1">
                <div className={`flex w-7 shrink-0 items-center justify-center rounded-lg border text-[9px] font-black ${
                  groupIsActive
                    ? 'border-teal-400/25 bg-teal-400/10 text-teal-100'
                    : 'border-transparent text-neutral-700'
                }`}>
                  {group}
                </div>
                {groupTabs.map((tab) => {
                  const Icon = tab.Icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSetActiveTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex min-h-11 min-w-[148px] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all lg:min-w-[164px] ${
                        isActive
                          ? 'border-teal-400/35 bg-neutral-900 text-white'
                          : 'border-transparent bg-transparent text-neutral-500 hover:bg-neutral-950 hover:text-neutral-200'
                      }`}
                    >
                      {isActive && <span className="absolute inset-y-2 left-0 w-px bg-teal-300/80" />}
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-200' : 'text-neutral-600'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block whitespace-nowrap text-sm font-black leading-none">{tab.label}</span>
                        <span className={`mt-1 hidden truncate text-[10px] font-bold 2xl:block ${isActive ? 'text-neutral-400' : 'text-neutral-700'}`}>
                          {tab.caption}
                        </span>
                      </span>
                      <span className={`ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                        isActive ? 'bg-black/50 text-teal-100' : 'bg-neutral-950 text-neutral-600'
                      }`}>
                        {tab.metric}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="space-y-5">
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.72fr)_minmax(420px,0.86fr)_auto] xl:items-center">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">{workspaceLanguage.setupLabel}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-300">
                <span>{templateLabel}</span>
                <span className="text-neutral-700">/</span>
                <span>{weatherLabel || location || '날씨 위치 미정'}</span>
                <span className="text-neutral-700">/</span>
                <span>{activeShootingDate}</span>
              </div>
            </div>
            <div className="prepro-segment grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 xl:max-w-[760px]">
              {productionTemplateOptions.map((option) => {
                const Icon = option.icon;
                const selected = template === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onTemplateChange(option.id)}
                    className={`prepro-segment__item ${selected ? 'is-active' : ''}`}
                    title={option.name}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{option.shortName}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onSetShowProjectSetup((value) => !value)}
              className="prepro-btn prepro-btn--secondary h-11"
            >
              {showProjectSetup ? '설정 접기' : '날짜/날씨 설정'}
              <RefreshCw className={`h-3.5 w-3.5 transition-transform ${showProjectSetup ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </section>

        {showProjectSetup && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(360px,1fr)_minmax(320px,0.55fr)]">
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
                      onChange={(event) => {
                        onSetLocation(event.target.value);
                        onSetGlobalWeatherResults([]);
                        onSetGlobalWeatherError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          onSearchGlobalWeatherLocation();
                        }
                      }}
                      placeholder="주소나 장소명 입력 후 Enter"
                    />
                    <button
                      type="button"
                      onClick={onSearchGlobalWeatherLocation}
                      disabled={isSearchingGlobalWeather || !location.trim()}
                      className="prepro-btn prepro-btn--quiet h-8 shrink-0 px-3 text-[10px]"
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
                          onClick={() => onSelectGlobalWeatherLocation(candidate)}
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
                          onSetLocation(city.value);
                          onSetGlobalWeatherResults([]);
                          onSetGlobalWeatherError('');
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black transition-all ${
                          sameText(location, city.value) || sameText(location, city.label)
                            ? 'border-teal-400/40 bg-teal-400/12 text-teal-100'
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
                  <input
                    type="date"
                    className="bg-transparent border-none text-sm focus:outline-none text-neutral-200 font-bold [color-scheme:dark] min-w-0"
                    value={activeShootingDate}
                    onChange={(event) => onActiveDayDateChange(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 grid grid-cols-1 gap-3 min-w-0">
              <button
                onClick={() => onSetShowAnalyzer(true)}
                className="prepro-btn prepro-btn--primary min-h-14 w-full text-sm group"
              >
                <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {template === 'event' ? 'AI 식순 정리 실행' : template === 'ad' ? 'AI 광고 구성 분석 실행' : template === 'musicvideo' ? 'AI MV 타임코드 콘티 실행' : template === 'dance' ? 'AI 타임코드 콘티 실행' : 'AI 시나리오 분석기 실행'}
              </button>
              <button
                onClick={onLoadSampleData}
                className="prepro-btn prepro-btn--secondary min-h-14 w-full"
              >
                <Database className="w-4 h-4" />
                {template === 'event' ? '행사 샘플 로드' : template === 'ad' ? '광고 샘플 로드' : template === 'musicvideo' ? 'MV 샘플 로드' : template === 'dance' ? '댄스 샘플 로드' : '단편 샘플 로드'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
