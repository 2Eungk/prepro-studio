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
  MoreHorizontal,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
} from 'lucide-react';

type MainWorkspaceTab = 'planning' | 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';
type MainWorkspaceGroup = '준비' | '촬영' | '마무리';

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
  showProjectSetupActions: boolean;
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
  showProjectSetupActions,
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
  const activeWorkspaceGroup = mainWorkspaceTabs.find((item) => item.id === activeTab)?.group;

  return (
    <>
      <header className="flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col gap-4 border-b border-neutral-900 pb-4 md:gap-5 md:pb-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            <div className="shrink-0 rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-indigo-300 md:p-3">
              <Film className="h-7 w-7 text-current md:h-8 md:w-8" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.7rem] font-black uppercase leading-none text-neutral-100 md:text-3xl">PrePro Studio</h1>
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
                <span className="hidden items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500 sm:inline-flex">
                  <Save className="h-3 w-3" />
                  이 브라우저에만 저장
                </span>
                <span className="hidden items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500 sm:inline-flex">
                  <KeyRound className="h-3 w-3" />
                  {apiStorageLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 custom-scrollbar sm:flex-wrap sm:items-center xl:justify-end">
            <button
              onClick={() => confirm('현재 프로젝트를 비우고 새로 시작할까요? 자동 저장된 데이터도 초기화됩니다.') && onResetProject()}
              className="prepro-btn prepro-btn--ghost shrink-0"
              title="새 프로젝트"
            >
              <Plus className="h-4 w-4" />
              <span>새 프로젝트</span>
            </button>
            <label
              className={`prepro-btn shrink-0 cursor-pointer ${fileStatus && fileStatus !== '백업 저장됨' ? 'prepro-btn--secondary' : 'prepro-btn--ghost'}`}
              title="프로젝트 파일 가져오기"
            >
              <FolderOpen className="h-4 w-4" />
              <span>{fileStatus && fileStatus !== '백업 저장됨' ? fileStatus : '파일 가져오기'}</span>
              <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
            </label>
            <button
              onClick={onCopyShareLink}
              className={`prepro-btn shrink-0 ${shareStatus ? 'prepro-btn--secondary' : 'prepro-btn--ghost'}`}
              title="공유 링크 복사"
            >
              <Share2 className="h-4 w-4" />
              <span>{shareStatus || '공유'}</span>
            </button>
            <details className="group/header-actions shrink-0">
              <summary className="prepro-btn prepro-btn--quiet cursor-pointer list-none [&::-webkit-details-marker]:hidden" title="관리 메뉴 열기">
                <MoreHorizontal className="h-4 w-4" />
                <span>관리</span>
              </summary>
              <div className="mt-2 w-[min(78vw,260px)] rounded-2xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl shadow-black/40">
                <button
                  type="button"
                  onClick={onExportJSON}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
                  title="현재 프로젝트를 백업 파일로 저장"
                >
                  <Save className="h-4 w-4 text-teal-200" />
                  {fileStatus === '백업 저장됨' ? '백업 완료' : '백업하기'}
                </button>
                <label
                  className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
                  title="저장해 둔 백업 파일 가져오기"
                >
                  <FolderOpen className="h-4 w-4 text-neutral-400" />
                  백업에서 복원
                  <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
                </label>
                <button
                  type="button"
                  onClick={() => onSetIsReportMode(!isReportMode)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black hover:bg-neutral-900 ${
                    isReportMode ? 'text-teal-100' : 'text-neutral-300 hover:text-neutral-100'
                  }`}
                >
                  <FileText className="h-4 w-4 text-neutral-400" />
                  {isReportMode ? '리포트 모드 끄기' : '리포트 모드 켜기'}
                </button>
              </div>
            </details>
          </div>
        </div>

        <details className="rounded-2xl border border-teal-400/25 bg-[linear-gradient(135deg,rgba(94,215,207,0.12),rgba(242,161,75,0.055)_62%,rgba(255,255,255,0.025))] p-3 md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-300/25 bg-black/35 text-teal-100">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-neutral-100">브라우저에만 저장 · 백업 필요</span>
              <span className="mt-0.5 block text-[11px] font-bold text-neutral-500">자세히 / 백업하기 열기</span>
            </span>
          </summary>
          <div className="mt-3 border-t border-teal-400/10 pt-3">
            <p className="text-xs font-bold leading-relaxed text-neutral-500">
              서버 DB에 프로젝트를 저장하지 않습니다. 다른 기기에서 열거나 공유하기 전에는 백업 파일을 내려받아 보관하세요.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportJSON}
                className="prepro-btn prepro-btn--secondary"
                title="현재 프로젝트를 백업 파일로 저장"
              >
                <Save className="h-4 w-4" />
                백업하기
              </button>
              <label
                className="prepro-btn prepro-btn--quiet cursor-pointer"
                title="저장해 둔 백업 파일 가져오기"
              >
                <FolderOpen className="h-4 w-4" />
                백업에서 복원
                <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
              </label>
            </div>
          </div>
        </details>

        <div className="hidden rounded-2xl border border-teal-400/25 bg-[linear-gradient(135deg,rgba(94,215,207,0.12),rgba(242,161,75,0.055)_62%,rgba(255,255,255,0.025))] p-4 md:block">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-300/25 bg-black/35 text-teal-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-neutral-100">회원가입 없이, 작업 데이터는 이 브라우저에만 저장됩니다.</div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">
                  서버 DB에 프로젝트를 저장하지 않습니다. 다른 기기에서 열거나 공유하기 전에는 백업 파일을 내려받아 보관하세요.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <button
                type="button"
                onClick={onExportJSON}
                className="prepro-btn prepro-btn--secondary"
                title="현재 프로젝트를 백업 파일로 저장"
              >
                <Save className="h-4 w-4" />
                백업하기
              </button>
              <label
                className="prepro-btn prepro-btn--quiet cursor-pointer"
                title="저장해 둔 백업 파일 가져오기"
              >
                <FolderOpen className="h-4 w-4" />
                백업에서 복원
                <input type="file" className="hidden" accept=".json" onChange={onImportJSON} />
              </label>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 -mx-2 border-y border-neutral-900 bg-black/90 px-2 py-1.5 backdrop-blur md:py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar md:gap-2">
          <div className="hidden min-w-max shrink-0 rounded-2xl border border-neutral-900 bg-neutral-950/60 p-1 md:flex">
            {mainWorkspaceGroups.map((group, index) => {
              const groupTabs = mainWorkspaceTabs.filter((tab) => tab.group === group);
              const groupIsActive = groupTabs.some((tab) => tab.id === activeTab);
              const firstTab = groupTabs[0];

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => firstTab && onSetActiveTab(firstTab.id)}
                  className={`flex min-h-11 min-w-[72px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-left transition-all md:min-w-[112px] md:gap-2 md:px-3 md:py-2 ${
                    groupIsActive
                      ? 'border-teal-400/30 bg-teal-400/10 text-teal-50'
                      : 'border-transparent text-neutral-500 hover:bg-neutral-900/80 hover:text-neutral-200'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black md:h-6 md:w-6 ${
                    groupIsActive ? 'bg-teal-300 text-black' : 'bg-neutral-900 text-neutral-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-black leading-none md:text-sm">{group}</span>
                    <span className="mt-1 hidden text-[10px] font-bold text-neutral-600 md:block">
                      {groupTabs.map((tab) => tab.label).join(' · ')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex min-w-max items-stretch gap-1 rounded-2xl border border-neutral-900 bg-neutral-950/45 p-1">
            {mainWorkspaceGroups.map((group, index) => {
              const groupTabs = mainWorkspaceTabs.filter((tab) => tab.group === group);
              const groupIsActive = group === activeWorkspaceGroup;
              const firstTab = groupTabs[0];

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => firstTab && onSetActiveTab(firstTab.id)}
                  className={`flex min-h-11 min-w-[64px] items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-center transition-all md:hidden ${
                    groupIsActive
                      ? 'border-teal-400/30 bg-teal-400/10 text-teal-50'
                      : 'border-transparent text-neutral-500 hover:bg-neutral-900/80 hover:text-neutral-200'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    groupIsActive ? 'bg-teal-300 text-black' : 'bg-neutral-900 text-neutral-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-xs font-black leading-none">{group}</span>
                </button>
              );
            })}
            <div className="mx-0.5 my-2 w-px shrink-0 bg-neutral-800 md:hidden" />
            {mainWorkspaceTabs
              .filter((tab) => tab.group === activeWorkspaceGroup)
              .map((tab) => {
                const Icon = tab.Icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onSetActiveTab(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex min-h-11 min-w-[112px] items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left transition-all md:min-w-[136px] md:gap-2 md:px-3 lg:min-w-[156px] ${
                      isActive
                        ? 'border-teal-400/35 bg-neutral-900 text-white'
                        : 'border-transparent bg-transparent text-neutral-500 hover:bg-neutral-950 hover:text-neutral-200'
                    }`}
                  >
                    {isActive && <span className="absolute inset-x-3 top-0 h-px bg-teal-300/80" />}
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-200' : 'text-neutral-600'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block whitespace-nowrap text-sm font-black leading-none">{tab.label}</span>
                      <span className={`mt-1 hidden truncate text-[10px] font-bold xl:block ${isActive ? 'text-neutral-400' : 'text-neutral-700'}`}>
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
        </div>
      </nav>

      <div className="space-y-5">
        <details className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-3 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">{workspaceLanguage.setupLabel}</span>
              <span className="mt-1 block truncate text-sm font-bold text-neutral-300" suppressHydrationWarning>
                {templateLabel} / {weatherLabel || location || '날씨 위치 미정'} / {activeShootingDate}
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-neutral-800 bg-black px-2.5 py-1 text-[10px] font-black text-neutral-500">설정</span>
          </summary>
          <div className="mt-3 border-t border-neutral-900 pt-3">
            <div className="prepro-segment grid-cols-2">
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
              className="prepro-btn prepro-btn--secondary mt-3 h-11 w-full"
            >
              {showProjectSetup ? '설정 접기' : '날짜/날씨 설정'}
              <RefreshCw className={`h-3.5 w-3.5 transition-transform ${showProjectSetup ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </details>

        <section className="hidden rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4 md:block">
          <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.72fr)_minmax(420px,0.86fr)_auto] xl:items-center">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">{workspaceLanguage.setupLabel}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-300">
                <span>{templateLabel}</span>
                <span className="text-neutral-700">/</span>
                <span>{weatherLabel || location || '날씨 위치 미정'}</span>
                <span className="text-neutral-700">/</span>
                <span suppressHydrationWarning>{activeShootingDate}</span>
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
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>

            {showProjectSetupActions && (
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
            )}
          </div>
        )}
      </div>
    </>
  );
}
