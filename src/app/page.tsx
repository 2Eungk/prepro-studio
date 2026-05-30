'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import type { BreakItem, Person, PlanningDocument, ProductionLocation, ScheduleState, Scene, ShootDay, StoryboardCategory, TemplateType } from '@/types/schedule';
import { format, addMinutes } from 'date-fns';
import { Plus, Clock, Film, MonitorPlay, Camera, Image as ImageIcon, Download, Cloud, MapPin, FileText, Sparkles, Database, Brain, KeyRound, Wand2, ArrowRight, RefreshCw, Users, Music2, Calculator, ClipboardList } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { storyboardDb, recommendShots } from '@/data/storyboardDb';
import { storyboardQuickFilters, type StoryboardQuickFilter } from '@/data/storyboardQuickFilters';
import AdBanner from '@/components/AdBanner';
import AppHeader from '@/components/header/AppHeader';
import CurrentWorkBar from '@/components/layout/CurrentWorkBar';
import ProductionGuideFooter from '@/components/layout/ProductionGuideFooter';
import { FirstRunPanel, WorkspaceFlowBar } from '@/components/layout/WorkspaceOnboarding';
import BudgetPanel from '@/components/sections/BudgetPanel';
import CueSheetPanel, { type CueSheetRow } from '@/components/sections/CueSheetPanel';
import LocationsPanel from '@/components/sections/LocationsPanel';
import PeoplePanel from '@/components/sections/PeoplePanel';
import { defaultPlanningAiSettings, type PlanningAiSettings } from '@/components/sections/planning/PlanningAiPanel';
import PlanningPanel from '@/components/sections/planning/PlanningPanel';
import ReportPanel from '@/components/sections/ReportPanel';
import StoryboardPanel from '@/components/sections/StoryboardPanel';
import AnalyzerResultPreview from '@/components/sections/schedule/AnalyzerResultPreview';
import DanceCoverageBanner from '@/components/sections/schedule/DanceCoverageBanner';
import ReadinessChecklist from '@/components/sections/schedule/ReadinessChecklist';
import ScheduleSetupPanel from '@/components/sections/schedule/ScheduleSetupPanel';
import ShootDaySelector from '@/components/sections/schedule/ShootDaySelector';
import ScheduleExportHeader from '@/components/sections/schedule/ScheduleExportHeader';
import MobileScheduleList from '@/components/sections/schedule/MobileScheduleList';
import { MobileFieldControlBar, MobileTimelineBreakCard, MobileTimelineSceneCard } from '@/components/sections/schedule/MobileTimelineCards';
import DesktopScheduleTable from '@/components/sections/schedule/DesktopScheduleTable';
import { SortableBreakRow, SortableRow } from '@/components/sections/schedule/DesktopTimelineRows';
import ScheduleControlsPanel, { type QuickBreakPreset } from '@/components/sections/schedule/ScheduleControlsPanel';
import ScheduleDashboardSummary from '@/components/sections/schedule/ScheduleDashboardSummary';
import SceneFormPanel from '@/components/sections/schedule/SceneFormPanel';
import {
  getLocationWeatherQuery,
  getPreferredWeatherLocationValue,
  getProductionLocationWeatherTarget,
  isGenericSeoulQuery,
  LocationWeatherSummary,
  matchesWeatherLocationSelection,
  searchWeatherLocationCandidates,
  type WeatherLocationCandidate,
  WeatherWidget,
} from '@/components/sections/weather/WeatherIntel';
import StoryboardGalleryModal from '@/components/modals/StoryboardGalleryModal';
import { BreakModal, LocationModal, PersonModal } from '@/components/modals/ProductionModals';
import ScriptAnalyzer, { type AnalyzedScene } from '@/components/modals/ScriptAnalyzer';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

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

const productionTemplateOptions = [
  { id: 'film', name: '영화/단편', shortName: '영화', icon: Film },
  { id: 'ad', name: '광고', shortName: '광고', icon: MonitorPlay },
  { id: 'musicvideo', name: '뮤직비디오', shortName: 'MV', icon: Music2 },
  { id: 'dance', name: '댄스커버', shortName: '댄스커버', icon: Music2 },
  { id: 'event', name: '행사', shortName: '행사', icon: Camera },
] satisfies { id: TemplateType; name: string; shortName: string; icon: typeof Film }[];

const quickStartProjectCards = [
  {
    template: 'film',
    title: '단편영화',
    subtitle: '관계 드라마 예시',
    detail: '로그라인, 씬 아웃라인, 영화제 제출 패키지, 촬영표까지 확인합니다.',
    metric: '5씬 · 3장소',
    Icon: Film,
  },
  {
    template: 'ad',
    title: '광고',
    subtitle: '제품 캠페인 예시',
    detail: '브랜드 브리프, 컷 구성, 필수 노출, 납품 버전을 확인합니다.',
    metric: '6컷 · 3버전',
    Icon: MonitorPlay,
  },
  {
    template: 'musicvideo',
    title: '뮤직비디오',
    subtitle: '립싱크 + 퍼포먼스',
    detail: '곡 구조, 가사 큐, 퍼포먼스, B-roll 구간을 타임코드로 확인합니다.',
    metric: 'MV 큐시트',
    Icon: Music2,
  },
  {
    template: 'dance',
    title: '댄스커버',
    subtitle: '원테이크 + 인서트',
    detail: '포커스 멤버, 샷 사이즈, 가사 큐, 인서트 컷 흐름을 확인합니다.',
    metric: '5구간 · 420분',
    Icon: Music2,
  },
  {
    template: 'event',
    title: '행사 스케치',
    subtitle: '컨퍼런스 하이라이트',
    detail: '식순, VIP 동선, 인터뷰, 현장 리포트용 커버리지를 확인합니다.',
    metric: '5식순 · 3존',
    Icon: Camera,
  },
] satisfies Array<{
  template: TemplateType;
  title: string;
  subtitle: string;
  detail: string;
  metric: string;
  Icon: typeof Film;
}>;

type PlanningFieldKind = 'short' | 'long' | 'list';

type PlanningFieldDefinition = {
  id: string;
  label: string;
  placeholder: string;
  kind?: PlanningFieldKind;
};

type PlanningSectionDefinition = {
  id: string;
  title: string;
  caption: string;
  fields: PlanningFieldDefinition[];
};

type MainWorkspaceTab = 'planning' | 'schedule' | 'cueSheet' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';
type MainWorkspaceGroup = '준비' | '촬영' | '마무리';
type PlanningWorkspaceTab = 'brief' | 'details' | 'ai';

const mainWorkspaceTabIds = ['planning', 'schedule', 'cueSheet', 'locations', 'people', 'budget', 'storyboard', 'report'] as const;
const activeTabStorageKey = 'prepro-active-tab';
const isMainWorkspaceTab = (value: string | null): value is MainWorkspaceTab =>
  Boolean(value && mainWorkspaceTabIds.includes(value as MainWorkspaceTab));

type WorkspaceLanguage = {
  planningCaption: string;
  locationsLabel: string;
  locationsCaption: string;
  peopleLabel: string;
  peopleCaption: string;
  scheduleLabel: string;
  scheduleCaption: string;
  cueSheetLabel: string;
  cueSheetCaption: string;
  storyboardLabel: string;
  storyboardCaption: string;
  reportLabel: string;
  reportCaption: string;
  setupLabel: string;
  setupFallback: string;
  flowHint: string;
  flowPath: string[];
  workflowSetupLabel: string;
  workflowBuildLabel: string;
  workflowConfirmLabel: string;
  firstRunTitle: string;
  firstRunDetail: string;
  firstRunSteps: Array<{ label: string; detail: string }>;
  gettingStarted: {
    sample: string;
    manual: string;
    analyzer: string;
    planning: string;
  };
  nextTargets: Record<MainWorkspaceTab, string>;
};

const workspaceLanguageByTemplate: Record<TemplateType, WorkspaceLanguage> = {
  film: {
    planningCaption: '로그라인과 브레이크다운',
    locationsLabel: '장소',
    locationsCaption: '로케이션과 허가',
    peopleLabel: '출연/스태프',
    peopleCaption: '캐스팅과 콜타임',
    scheduleLabel: '촬영표',
    scheduleCaption: '씬 순서와 이동',
    cueSheetLabel: '큐시트',
    cueSheetCaption: '씬별 촬영 큐',
    storyboardLabel: '콘티/샷',
    storyboardCaption: '앵글과 레퍼런스',
    reportLabel: '결과 리포트',
    reportCaption: 'OK/NG와 후반 정리',
    setupLabel: '단편 제작 기준',
    setupFallback: '촬영지',
    flowHint: '로그라인을 씬으로 쪼개고, 장소/인원/콘티를 붙인 뒤 촬영표로 확정합니다.',
    flowPath: ['기획서', '로케이션', '출연/스태프', '촬영표', '큐시트', '콘티', '리포트'],
    workflowSetupLabel: '현장 설정',
    workflowBuildLabel: '씬 구성',
    workflowConfirmLabel: '촬영표 확정',
    firstRunTitle: '단편영화는 로그라인에서 촬영표까지 이어지게 시작하세요.',
    firstRunDetail: '씬 아웃라인, 장소, 출연진, 콘티가 같은 기준으로 묶이면 바로 현장표가 됩니다.',
    firstRunSteps: [
      { label: '1. 작품 기준 선택', detail: '단편/장편, 러닝타임, 제출 목표' },
      { label: '2. 씬 아웃라인', detail: '장소, 인물, 상황을 씬 단위로 분리' },
      { label: '3. 촬영표 확정', detail: '콜타임, 이동, 콘티, 리포트 연결' },
    ],
    gettingStarted: {
      sample: '단편영화 예시 데이터를 불러와 기획서, 씬, 콘티, 리포트 흐름을 먼저 확인합니다.',
      manual: '장소와 내용을 입력해 첫 씬을 바로 만듭니다.',
      analyzer: '시나리오 텍스트에서 씬, 장소, 인물을 추출합니다.',
      planning: '로그라인과 브레이크다운을 먼저 정리한 뒤 촬영표로 넘깁니다.',
    },
    nextTargets: {
      planning: '장소/인원 정리',
      locations: '출연/스태프 콜타임',
      people: '촬영표 구성',
      budget: '촬영표 확인',
      schedule: '콘티 연결',
      cueSheet: '콘티 연결',
      storyboard: '현장 리포트',
      report: 'PDF 정리',
    },
  },
  ad: {
    planningCaption: '브리프와 메시지',
    locationsLabel: '촬영지',
    locationsCaption: '제품/모델 세팅',
    peopleLabel: '모델/스태프',
    peopleCaption: '승인과 콜타임',
    scheduleLabel: '컷리스트',
    scheduleCaption: '제품 컷과 액션',
    cueSheetLabel: '큐시트',
    cueSheetCaption: '컷별 진행 큐',
    storyboardLabel: '콘티/레퍼런스',
    storyboardCaption: '무드와 필수 컷',
    reportLabel: '납품 리포트',
    reportCaption: '승인/NG와 버전',
    setupLabel: '광고 제작 기준',
    setupFallback: '촬영지',
    flowHint: '브랜드 메시지를 컷으로 나누고, 필수 노출/승인/납품 버전을 함께 잠급니다.',
    flowPath: ['브리프', '제품/장소', '모델/스태프', '컷리스트', '큐시트', '콘티', '납품'],
    workflowSetupLabel: '촬영 조건',
    workflowBuildLabel: '컷 구성',
    workflowConfirmLabel: '플랜 확정',
    firstRunTitle: '광고는 메시지와 필수 컷부터 잠그면 덜 흔들립니다.',
    firstRunDetail: '제품 히어로, 사용 장면, 인서트, 엔드카드를 컷 단위로 정리합니다.',
    firstRunSteps: [
      { label: '1. 브리프 확인', detail: '제품, 타깃, 싱글 메시지' },
      { label: '2. 컷 리스트', detail: '히어로, 사용 장면, 인서트, CTA' },
      { label: '3. 승인/납품', detail: '필수 노출, 버전, 리포트' },
    ],
    gettingStarted: {
      sample: '광고 예시 데이터를 불러와 브리프, 컷 리스트, 납품 체크를 먼저 봅니다.',
      manual: '제품 컷이나 모델 사용 컷을 바로 추가합니다.',
      analyzer: '광고 구성안을 컷 리스트로 정리합니다.',
      planning: '브랜드 브리프와 핵심 메시지를 먼저 정리합니다.',
    },
    nextTargets: {
      planning: '제품/장소 정리',
      locations: '모델/스태프 콜타임',
      people: '컷리스트 구성',
      budget: '컷리스트 확인',
      schedule: '콘티/레퍼런스 연결',
      cueSheet: '콘티/레퍼런스 연결',
      storyboard: '납품 리포트',
      report: 'PDF 정리',
    },
  },
  musicvideo: {
    planningCaption: '곡 구조와 비주얼 콘셉트',
    locationsLabel: '세트/로케',
    locationsCaption: '무드와 허가',
    peopleLabel: '아티스트/스태프',
    peopleCaption: '출연과 스타일링',
    scheduleLabel: 'MV 큐시트',
    scheduleCaption: '가사와 타임코드',
    cueSheetLabel: '큐시트',
    cueSheetCaption: '타임코드/가사',
    storyboardLabel: 'MV 레퍼런스',
    storyboardCaption: '립싱크/B-roll',
    reportLabel: '촬영 리포트',
    reportCaption: 'OK/NG와 후반',
    setupLabel: 'MV 제작 기준',
    setupFallback: '촬영지',
    flowHint: '곡 구조를 타임코드로 쪼개고 립싱크, 퍼포먼스, B-roll을 병렬로 설계합니다.',
    flowPath: ['곡 분석', '세트/로케', '아티스트', '촬영표', '큐시트', '레퍼런스', '리포트'],
    workflowSetupLabel: '곡/세트 설정',
    workflowBuildLabel: '큐 구성',
    workflowConfirmLabel: '콘티 확정',
    firstRunTitle: '뮤직비디오는 곡 구조가 곧 촬영표의 뼈대입니다.',
    firstRunDetail: '가사 큐, 립싱크, 퍼포먼스, B-roll을 같은 타임라인에서 관리합니다.',
    firstRunSteps: [
      { label: '1. 곡 구조 선택', detail: 'Intro, Verse, Hook, Bridge' },
      { label: '2. 큐시트 작성', detail: '립싱크, 퍼포먼스, B-roll 배치' },
      { label: '3. 촬영 콘티', detail: '세트, 스타일링, 후반 컷 연결' },
    ],
    gettingStarted: {
      sample: 'MV 예시 데이터를 불러와 곡 구조와 타임코드 콘티 흐름을 확인합니다.',
      manual: '가사 큐나 퍼포먼스 구간을 바로 추가합니다.',
      analyzer: '곡 구조와 가사 단위로 립싱크, 퍼포먼스, B-roll 콘티를 만듭니다.',
      planning: '곡 콘셉트와 비주얼 모티프를 먼저 정리합니다.',
    },
    nextTargets: {
      planning: '세트/아티스트 정리',
      locations: '아티스트/스태프 콜타임',
      people: 'MV 큐시트 구성',
      budget: 'MV 큐시트 확인',
      schedule: '레퍼런스 연결',
      cueSheet: '레퍼런스 연결',
      storyboard: '촬영 리포트',
      report: 'PDF 정리',
    },
  },
  dance: {
    planningCaption: '곡 구조와 포커스',
    locationsLabel: '스튜디오',
    locationsCaption: '바닥/거울/조명',
    peopleLabel: '멤버/스태프',
    peopleCaption: '포커스와 콜타임',
    scheduleLabel: '댄스 콘티',
    scheduleCaption: '타임코드와 안무',
    cueSheetLabel: '큐시트',
    cueSheetCaption: '가사/대형/포커스',
    storyboardLabel: '인서트/레퍼런스',
    storyboardCaption: '풀샷과 포커스 컷',
    reportLabel: '촬영 리포트',
    reportCaption: 'OK/NG와 재촬영',
    setupLabel: '댄스커버 기준',
    setupFallback: '스튜디오',
    flowHint: '원테이크 풀샷을 기준으로 잡고, 구간별 포커스 멤버와 인서트를 보강합니다.',
    flowPath: ['곡/안무', '스튜디오', '멤버', '촬영표', '큐시트', '인서트', '리포트'],
    workflowSetupLabel: '곡/공간 설정',
    workflowBuildLabel: '구간 구성',
    workflowConfirmLabel: '콘티 확정',
    firstRunTitle: '댄스커버는 원테이크 기준 컷과 인서트 컷을 분리하면 빨라집니다.',
    firstRunDetail: '가사/비트, 포커스 멤버, 샷 사이즈, 대형 변화를 한 줄씩 쌓습니다.',
    firstRunSteps: [
      { label: '1. 곡/안무 기준', detail: '원테이크, 가사, 비트, 대형' },
      { label: '2. 포커스 구간', detail: '센터, 멤버, 손동작, 표정 인서트' },
      { label: '3. 리허설/촬영', detail: '바닥, 거울, 조명, 재촬영 체크' },
    ],
    gettingStarted: {
      sample: '댄스커버 예시 데이터를 불러와 원테이크와 인서트 구성을 확인합니다.',
      manual: '타임코드, 가사, 포커스 멤버를 넣어 첫 구간을 만듭니다.',
      analyzer: '가사와 비트 단위로 댄스 콘티를 만듭니다.',
      planning: '곡 구조, 포커스 멤버, 리허설 계획을 먼저 정리합니다.',
    },
    nextTargets: {
      planning: '스튜디오/멤버 정리',
      locations: '멤버/스태프 콜타임',
      people: '댄스 콘티 구성',
      budget: '댄스 콘티 확인',
      schedule: '인서트/레퍼런스 연결',
      cueSheet: '인서트/레퍼런스 연결',
      storyboard: '촬영 리포트',
      report: 'PDF 정리',
    },
  },
  event: {
    planningCaption: '목적과 식순',
    locationsLabel: '행사장',
    locationsCaption: '구역/허가/날씨',
    peopleLabel: '운영진/참석자',
    peopleCaption: '담당과 연락처',
    scheduleLabel: '운영표',
    scheduleCaption: '식순과 커버리지',
    cueSheetLabel: '큐시트',
    cueSheetCaption: '식순/담당/장비',
    storyboardLabel: '커버리지',
    storyboardCaption: 'A/B캠과 스케치',
    reportLabel: '결과 리포트',
    reportCaption: '납품/누락 체크',
    setupLabel: '행사 촬영 기준',
    setupFallback: '행사장',
    flowHint: '식순을 시간 순서로 두고, 담당자/구역/촬영 커버리지를 프로그램마다 붙입니다.',
    flowPath: ['목적/식순', '행사장', '담당자', '운영표', '큐시트', '커버리지', '리포트'],
    workflowSetupLabel: '행사 설정',
    workflowBuildLabel: '식순 구성',
    workflowConfirmLabel: '운영표 확정',
    firstRunTitle: '행사는 씬이 아니라 식순과 커버리지로 보는 게 맞습니다.',
    firstRunDetail: '프로그램, 구역, 담당자, A/B캠 커버리지를 시간 순서로 정리합니다.',
    firstRunSteps: [
      { label: '1. 행사 목적', detail: '납품 대상, 핵심 장면, VIP' },
      { label: '2. 식순/구역', detail: '시간, 장소, 담당자, 커버리지' },
      { label: '3. 결과 리포트', detail: '누락, NG, 납품 컷 확인' },
    ],
    gettingStarted: {
      sample: '행사 예시 데이터를 불러와 식순, 장소, 담당자, 리포트 흐름을 확인합니다.',
      manual: '시간과 진행 내용을 넣어 첫 프로그램을 바로 만듭니다.',
      analyzer: '행사 식순을 붙여 넣고 운영표 초안을 만듭니다.',
      planning: '행사 목적과 납품 기준을 먼저 정리합니다.',
    },
    nextTargets: {
      planning: '행사장/담당자 정리',
      locations: '운영진 콜타임',
      people: '운영표 구성',
      budget: '운영표 확인',
      schedule: '커버리지 연결',
      cueSheet: '커버리지 연결',
      storyboard: '결과 리포트',
      report: 'PDF 정리',
    },
  },
};

const planningTemplateDefinitions: Record<TemplateType, PlanningSectionDefinition[]> = {
  film: [
    {
      id: 'brief',
      title: '개발 패키지',
      caption: '하이엔드 pitch deck / treatment의 첫 장에 들어갈 핵심입니다.',
      fields: [
        { id: 'logline', label: '로그라인', placeholder: '주인공, 목표, 장애물, 대가가 보이게 한 문장으로 정리하세요.', kind: 'long' },
        { id: 'synopsis', label: '시놉시스', placeholder: '시작, 전개, 전환점, 클라이맥스, 엔딩을 5-8문장으로 정리하세요.', kind: 'long' },
        { id: 'theme', label: '테마 / 명제', placeholder: '작품이 끝난 뒤 남아야 할 질문이나 문장을 적으세요.', kind: 'long' },
        { id: 'worldGenre', label: '장르 / 세계관', placeholder: '장르 관습, 시대, 공간, 룰, 현실감을 정의하세요.', kind: 'long' },
      ],
    },
    {
      id: 'audience',
      title: '관객 / 영화제 전략',
      caption: '단편은 러닝타임과 제출 패키지가 기획 단계부터 같이 정리되어야 합니다.',
      fields: [
        { id: 'targetViewer', label: '핵심 관객', placeholder: '나이/취향보다 관객이 이 작품을 선택할 이유를 적으세요.', kind: 'long' },
        { id: 'formatRuntime', label: '단편 포맷 / 러닝타임', placeholder: '예: 단편 12분, 크레딧 포함 15분 목표. 40분/50분 제한이 있는 영화제도 함께 고려하세요.', kind: 'long' },
        { id: 'distribution', label: '영화제 / 공개 전략', placeholder: '국내외 단편영화제, 학교/기관 상영, 온라인 공개 시점, 프리미어 전략을 적으세요.', kind: 'long' },
        { id: 'festivalFit', label: '출품 적합성', placeholder: '장르, 국가/지역, 학생작품 여부, 첫 연출, 완성 예정일, 목표 영화제 조건을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'character',
      title: '캐릭터 / 캐스팅',
      caption: '인물의 욕망과 관계를 캐스팅/콜시트로 옮길 수 있게 만듭니다.',
      fields: [
        { id: 'characters', label: '캐릭터 바이블', placeholder: '인물별 욕망, 결핍, 비밀, 변화, 말투를 적으세요.', kind: 'long' },
        { id: 'relationships', label: '관계 다이어그램', placeholder: '인물 간 권력, 애정, 거리, 갈등을 적으세요.', kind: 'long' },
        { id: 'castingNeeds', label: '캐스팅 조건', placeholder: '연령대, 이미지, 연기 톤, 특수 능력, 일정 제약을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'structure',
      title: '서사 구조',
      caption: '씬 아웃라인은 바로 촬영표 초안으로 변환됩니다.',
      fields: [
        { id: 'beatSheet', label: '비트 시트', placeholder: '오프닝 이미지, 사건, 전환점, 미드포인트, 클라이맥스, 엔딩을 적으세요.', kind: 'long' },
        { id: 'sceneOutline', label: '씬 아웃라인', placeholder: '한 줄에 한 씬씩 작성하세요.\n예: 주인공이 빈 작업실에 들어와 오래된 녹음기를 발견한다.', kind: 'list' },
        { id: 'emotionalBeat', label: '감정 비트', placeholder: '씬별 감정 변화, 정보 공개 순서, 관객이 느껴야 할 감정을 적으세요.', kind: 'long' },
        { id: 'setPieces', label: '키 시퀀스', placeholder: '예산과 시간이 집중될 핵심 장면, 액션, 롱테이크, 몽타주를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'creative',
      title: '연출 / 비주얼 트리트먼트',
      caption: '감독, 촬영, 미술, 편집, 사운드가 같은 방향을 보게 합니다.',
      fields: [
        { id: 'tone', label: '톤앤매너', placeholder: '정서, 속도, 밀도, 현실감, 거리감을 적으세요.', kind: 'long' },
        { id: 'references', label: '레퍼런스', placeholder: '작품, 장면, 사진, 회화, 음악 등 감각 기준을 적으세요.', kind: 'long' },
        { id: 'visualRules', label: '카메라 언어', placeholder: '렌즈, 앵글, 움직임, 구도, 커버리지 원칙을 적으세요.', kind: 'long' },
        { id: 'colorLighting', label: '색감 / 조명', placeholder: '색 온도, 대비, 자연광/인공광, 시간대, 룩업 기준을 적으세요.', kind: 'long' },
        { id: 'soundMusic', label: '사운드 / 음악', placeholder: '현장음, 침묵, 음악 장르, 사운드 모티프를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'production',
      title: '프로덕션 브레이크다운',
      caption: '하이엔드는 부서별 체크, 저예산은 우선순위와 대체안을 남깁니다.',
      fields: [
        { id: 'locations', label: '주요 장소', placeholder: '장소명, 실내/실외, 허가 필요 여부를 적으세요.', kind: 'long' },
        { id: 'artPropsCostume', label: '미술 / 소품 / 의상', placeholder: '키 소품, 의상 변화, 세트 드레싱, 구매/대여 필요 항목을 적으세요.', kind: 'long' },
        { id: 'technicalNeeds', label: '기술 요구', placeholder: '카메라, 렌즈, 조명, 그립, 특수장비, 동시녹음 요구와 자체 보유·렌탈·구매·대여처·픽업/반납 시간을 적으세요.', kind: 'long' },
        { id: 'mustHave', label: '필수 확보 컷', placeholder: '편집에서 반드시 필요한 안전 컷, 인서트, 리액션, 마스터를 적으세요.', kind: 'long' },
        { id: 'lowBudgetPlan', label: '저예산 압축안', placeholder: '장소 통합, 인원 축소, 장비 대체, 컷 우선순위, 포기 가능한 요소를 적으세요.', kind: 'long' },
        { id: 'risk', label: '촬영 리스크', placeholder: '날씨, 소음, 야간, 허가, 아역/차량/액션, 보험, 데이터 백업 리스크를 적으세요.', kind: 'long' },
        { id: 'rightsDeliverables', label: '권리 / 납품', placeholder: '음악, 초상권, 로케이션 릴리즈, 최종 포맷, 자막, 스틸컷을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'festivalPackage',
      title: '단편영화 제출 패키지',
      caption: 'FilmFreeway/영화제 제출에 필요한 메타데이터와 홍보 자료를 미리 잠급니다.',
      fields: [
        { id: 'projectSpecs', label: '프로젝트 스펙', placeholder: '런타임, 완성일, 제작국가/촬영국가, 언어, 장르, 촬영 포맷, 화면비, 컬러/흑백, 학생작품 여부를 적으세요.', kind: 'long' },
        { id: 'submissionAssets', label: '제출 자료', placeholder: '영문/국문 시놉시스, 감독 소개, 감독의 말, 포스터, 스틸컷, 트레일러, EPK, 크레딧 파일을 적으세요.', kind: 'long' },
        { id: 'screeningDeliverables', label: '상영 납품', placeholder: 'DCP, ProRes/H.264 screener, 자막 SRT, CC, 스테레오/5.1, QC 체크, 파일명 규칙을 적으세요.', kind: 'long' },
        { id: 'rightsClearance', label: '권리 클리어런스', placeholder: '음악, 초상권, 로케이션, 아카이브/사진, 폰트, 상표 노출, 미성년자 동의 등 증빙을 적으세요.', kind: 'long' },
        { id: 'festivalTracker', label: '출품 트래커', placeholder: '목표 영화제, 마감일, 출품비, 프리미어 조건, 결과 발표일, 제출 상태를 적으세요.', kind: 'long' },
      ],
    },
  ],
  ad: [
    {
      id: 'brief',
      title: '클라이언트 / 브랜드 브리프',
      caption: '대행사 오리엔테이션에서 받는 핵심 비즈니스 조건입니다.',
      fields: [
        { id: 'brandContext', label: '브랜드 상황', placeholder: '브랜드 포지션, 캠페인 배경, 경쟁 상황, 현재 문제를 적으세요.', kind: 'long' },
        { id: 'product', label: '제품 / 서비스', placeholder: '광고할 대상과 핵심 기능을 적으세요.', kind: 'long' },
        { id: 'usp', label: 'USP / 차별점', placeholder: '경쟁 제품과 다르게 보여줘야 하는 지점을 적으세요.', kind: 'long' },
        { id: 'objective', label: '캠페인 목표 / KPI', placeholder: '인지, 전환, 앱설치, 리드, 매장 방문 등 목표와 지표를 적으세요.', kind: 'long' },
        { id: 'painPoint', label: '타깃 페인포인트', placeholder: '타깃이 겪는 불편, 욕망, 구매 장벽을 적으세요.', kind: 'long' },
        { id: 'mandatory', label: '필수 조건', placeholder: '로고, 슬로건, 고지문구, 제품 컷, 가격/혜택 조건, 금지 표현을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'strategy',
      title: '전략 / 메시지',
      caption: '좋은 광고는 예쁜 그림 전에 한 문장 전략이 먼저 서야 합니다.',
      fields: [
        { id: 'consumerInsight', label: '소비자 인사이트', placeholder: '타깃이 실제로 느끼는 긴장, 욕망, 습관, 불만을 적으세요.', kind: 'long' },
        { id: 'singleMessage', label: '싱글 메시지', placeholder: '광고가 딱 하나만 기억시킨다면 무엇인지 적으세요.', kind: 'long' },
        { id: 'reasonToBelieve', label: 'RTB / 증거', placeholder: '메시지를 믿게 하는 기능, 리뷰, 수치, 시연, 상황을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'creative',
      title: '크리에이티브 컨셉',
      caption: '컨셉, 카피, 후킹, 엔드카드를 촬영 가능한 구성으로 정리합니다.',
      fields: [
        { id: 'concept', label: '빅 아이디어', placeholder: '캠페인을 관통하는 컨셉 문장과 장면적 은유를 적으세요.', kind: 'long' },
        { id: 'hook', label: '3초 훅', placeholder: '처음 3초에 시선을 잡는 장면이나 카피를 적으세요.', kind: 'long' },
        { id: 'tone', label: '비주얼 톤', placeholder: '색감, 조명, 배경, 모델 무드, 카메라 리듬을 적으세요.', kind: 'long' },
        { id: 'copy', label: '카피 / VO', placeholder: '헤드라인, 내레이션, 자막 톤, 엔드카드 문구를 적으세요.', kind: 'long' },
        { id: 'cta', label: 'CTA / 카피', placeholder: '구매, 문의, 예약 등 마지막 행동 유도 문구를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'structure',
      title: '콘텐츠 아키텍처',
      caption: '광고 구성은 바로 컷 리스트 초안으로 변환됩니다.',
      fields: [
        { id: 'contentFlow', label: '광고 구성', placeholder: '한 줄에 한 컷/블록씩 작성하세요.\n예: 제품 단독 히어로 컷\n모델 사용 라이프스타일 컷\n엔드카드 CTA', kind: 'list' },
        { id: 'variants', label: '매체별 변형', placeholder: '6초/15초/30초, 릴스, 쇼츠, 상세페이지, OOH 등 버전을 적으세요.', kind: 'long' },
        { id: 'aspectRatios', label: '화면비 / 납품 규격', placeholder: '16:9, 9:16, 1:1, 썸네일, 자막 안전영역을 적으세요.', kind: 'long' },
        { id: 'editRhythm', label: '편집 리듬', placeholder: '컷 길이, 자막 밀도, 음악 비트, 전환 방식, CTA 타이밍을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'production',
      title: '프로덕션 설계',
      caption: '하이엔드 광고 제작의 부서별 체크를 저예산에서도 축약해 씁니다.',
      fields: [
        { id: 'talentCasting', label: '모델 / 캐스팅', placeholder: '모델 이미지, 손 모델, 인터뷰 대상, 사용권 기간/매체를 적으세요.', kind: 'long' },
        { id: 'artDirection', label: '미술 / 스타일링', placeholder: '배경, 소품, 의상, 제품 컨디션, 컬러 팔레트를 적으세요.', kind: 'long' },
        { id: 'productHandling', label: '제품 핸들링', placeholder: '패키지 상태, 예비 제품, 반사/스크래치, 사용 시연 주의점을 적으세요.', kind: 'long' },
        { id: 'mustHave', label: '필수 노출', placeholder: '로고, 패키지, 사용법, 고지 문구, 가격/혜택 조건을 적으세요.', kind: 'long' },
        { id: 'lowBudgetPlan', label: '저예산 압축안', placeholder: '스튜디오/로케 통합, 모델 수, 조명 대체, 컷 우선순위, 포기 가능한 버전을 적으세요.', kind: 'long' },
        { id: 'risk', label: '검수 / 리스크', placeholder: '과장 표현, 법적 문구, 모델 사용권, 상표 노출, 음악/폰트 라이선스를 적으세요.', kind: 'long' },
        { id: 'deliverables', label: '납품 / 승인', placeholder: '초안일, 최종일, 수정 라운드, 승인자, 파일 포맷, 클린/자막본을 적으세요.', kind: 'long' },
      ],
    },
  ],
  event: [
    {
      id: 'brief',
      title: '행사 전략',
      caption: '단순 기록이 아니라 이해관계자와 목적을 먼저 고정합니다.',
      fields: [
        { id: 'stakeholders', label: '이해관계자', placeholder: '주최, 후원, VIP, PR, 내부 보고 대상, 최종 승인자를 적으세요.', kind: 'long' },
        { id: 'eventGoal', label: '행사 목표', placeholder: '브랜드 홍보, 투자자 설득, 내부 공유, 아카이브 등 목적을 적으세요.', kind: 'long' },
        { id: 'audienceMood', label: '보여줘야 할 분위기', placeholder: '성황, 전문성, 네트워킹, 감동, VIP 중심 등 원하는 인상을 적으세요.', kind: 'long' },
        { id: 'keyPeople', label: '주요 인물', placeholder: 'MC, 연사, VIP, 패널, 인터뷰 대상자를 적으세요.', kind: 'long' },
        { id: 'successCriteria', label: '성공 기준', placeholder: '반드시 남아야 할 장면, 보고용 지표, PR 활용 기준을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'program',
      title: '런오브쇼 / 큐시트',
      caption: '식순은 바로 행사 운영표 초안으로 변환됩니다.',
      fields: [
        { id: 'runOfShow', label: '식순 / 큐시트', placeholder: '한 줄에 한 프로그램씩 작성하세요.\n예: 게스트 등록 / 포토월\n오프닝\n키노트\n패널 토크\n네트워킹', kind: 'list' },
        { id: 'criticalMoments', label: '결정적 순간', placeholder: '컷 놓치면 안 되는 입장, 세리머니, 발표, 수상, 포토콜 타이밍을 적으세요.', kind: 'long' },
        { id: 'vipFlow', label: 'VIP / 동선', placeholder: '입장, 대기실, 포토콜, 인터뷰 등 민감 동선을 적으세요.', kind: 'long' },
        { id: 'accessWindows', label: '촬영 가능 시간', placeholder: '리허설, 입장 전, 무대 뒤, 클로징 후 등 접근 가능한 시간을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'coverage',
      title: '커버리지 플랜',
      caption: '하이엔드 행사는 A/B캠, 사진, 인터뷰, SNS 컷을 분리해서 설계합니다.',
      fields: [
        { id: 'mustShots', label: '필수 기록 컷', placeholder: '외관, 등록, 무대 와이드, 연사 클로즈업, 객석 리액션, 박수, 네트워킹 등', kind: 'long' },
        { id: 'cameraPlan', label: '카메라 배치', placeholder: 'A캠 고정, B캠 망원, 짐벌, 드론, 포토그래퍼 위치를 적으세요.', kind: 'long' },
        { id: 'interviewPlan', label: '인터뷰 플랜', placeholder: '대상자, 질문, 배경, 마이크, 허가, 릴리즈 필요 여부를 적으세요.', kind: 'long' },
        { id: 'audio', label: '오디오 / 인터뷰', placeholder: '라인 아웃, 무선 마이크, 인터뷰 질문, 주변 소음 리스크를 적으세요.', kind: 'long' },
        { id: 'socialCuts', label: 'SNS / 당일 컷', placeholder: '세로 릴스, 당일 스틸, 숏클립, 썸네일 후보를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'operation',
      title: '운영 / 기술',
      caption: '현장 접근, 통신, 데이터 백업까지 촬영팀 운영 기준으로 봅니다.',
      fields: [
        { id: 'venueZones', label: '장소 구역', placeholder: '무대, 객석, 로비, 대기실, 인터뷰존, 촬영 제한 구역을 적으세요.', kind: 'long' },
        { id: 'crewComms', label: '스태프 / 통신', placeholder: '무전, 단톡, 큐 담당, 현장 PD, 오디오 담당, 백업 담당을 적으세요.', kind: 'long' },
        { id: 'dataPlan', label: '데이터 백업', placeholder: '카드 교체, 백업 횟수, 파일명, 당일 전달, 원본 보관 기준을 적으세요.', kind: 'long' },
        { id: 'lowBudgetPlan', label: '저예산 압축안', placeholder: '원맨/투맨 운영, 카메라 수 축소, 필수 컷 우선순위, 포기 가능한 구간을 적으세요.', kind: 'long' },
        { id: 'risk', label: '현장 리스크', placeholder: '조명 변동, 동시 진행, 관객 이동, 저작권 음악, 촬영 제한 구역을 적으세요.', kind: 'long' },
        { id: 'deliverables', label: '납품물', placeholder: '하이라이트, 풀버전, 사진, 릴스, 당일 편집본 등 필요한 산출물을 적으세요.', kind: 'long' },
      ],
    },
  ],
  musicvideo: [
    {
      id: 'brief',
      title: '곡 / 아티스트 브리프',
      caption: '뮤직비디오는 노래의 감정, 아티스트 이미지, 공개 전략이 먼저 잠겨야 합니다.',
      fields: [
        { id: 'songInfo', label: '곡 정보', placeholder: '곡명, 아티스트, 장르, BPM, 러닝타임, 발매일, 버전을 적으세요.', kind: 'long' },
        { id: 'artistImage', label: '아티스트 이미지', placeholder: '보여줘야 할 태도, 표정, 스타일, 팬이 기대하는 이미지를 적으세요.', kind: 'long' },
        { id: 'concept', label: 'MV 콘셉트', placeholder: '한 문장 콘셉트, 감정선, 시각적 모티프, 상징 오브젝트를 적으세요.', kind: 'long' },
        { id: 'audienceRelease', label: '공개 / 팬덤 전략', placeholder: '유튜브 공개, 티저, 숏폼, 썸네일, 팬덤 포인트를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'structure',
      title: '곡 구조 / 타임코드',
      caption: '가사와 비트 단위로 립싱크, 퍼포먼스, 내러티브, B-roll을 나눕니다.',
      fields: [
        { id: 'cueSheet', label: '타임코드 큐시트', placeholder: '한 줄에 한 구간씩 작성하세요.\n예: 00:18 Verse 1 - 방 안 립싱크 CU, 네온 반사 / 손 인서트', kind: 'list' },
        { id: 'lyricsMap', label: '가사 / 감정 매핑', placeholder: '가사별 감정, 표정, 시선, 컷 전환 포인트를 적으세요.', kind: 'long' },
        { id: 'performanceMap', label: '퍼포먼스 구간', placeholder: '풀 퍼포먼스, 립싱크, 밴드/댄서, 솔로 컷 구간을 적으세요.', kind: 'long' },
        { id: 'narrativeBeat', label: '내러티브 / B-roll', placeholder: '스토리 장면, 상징 컷, 몽타주, 인서트, 로케이션 전환을 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'visual',
      title: '비주얼 디렉션',
      caption: 'MV는 기억나는 이미지와 반복 가능한 모티프가 핵심입니다.',
      fields: [
        { id: 'visualMotif', label: '비주얼 모티프', placeholder: '색, 빛, 물건, 공간, 반복되는 구도/동작을 적으세요.', kind: 'long' },
        { id: 'shotLanguage', label: '샷 언어', placeholder: '립싱크 CU, 퍼포먼스 FS, 핸드헬드, 슬로모션, 매크로 인서트 기준을 적으세요.', kind: 'long' },
        { id: 'colorLighting', label: '컬러 / 조명', placeholder: '키 컬러, 대비, 네온/자연광/무빙라이트, 장면별 룩을 적으세요.', kind: 'long' },
        { id: 'stylingArt', label: '스타일링 / 미술', placeholder: '의상 변화, 헤메, 소품, 세트 드레싱, 제품/브랜드 노출 여부를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'production',
      title: '촬영 / 납품 설계',
      caption: '저예산 MV도 립싱크 안전본, 퍼포먼스 커버리지, 숏폼 납품을 분리하면 완성도가 올라갑니다.',
      fields: [
        { id: 'locationPlan', label: '로케이션 / 세트', placeholder: '스튜디오, 야외, 차량, 옥상, 방 등 장소와 허가/전원/소음 조건을 적으세요.', kind: 'long' },
        { id: 'coveragePlan', label: '커버리지 플랜', placeholder: '립싱크 마스터, 퍼포먼스 와이드, 클로즈업, 인서트, B-roll 우선순위를 적으세요.', kind: 'long' },
        { id: 'lowBudgetPlan', label: '저예산 압축안', placeholder: '장소 통합, 의상 수, 조명 대체, 컷 포기선, 반나절/하루 촬영안을 적으세요.', kind: 'long' },
        { id: 'risk', label: '리스크', placeholder: '음원 권리, 립싱크 싱크, 야간/소음/허가, 데이터 백업, 스타일링 지연을 적으세요.', kind: 'long' },
        { id: 'deliverables', label: '납품 / 공개물', placeholder: '16:9 본편, 9:16 숏폼, 티저, 썸네일, 스틸, 클린본/크레딧 표기를 적으세요.', kind: 'long' },
      ],
    },
  ],
  dance: [
    {
      id: 'brief',
      title: '곡 / 콘셉트 브리프',
      caption: '댄스커버는 곡 구조와 멤버 포커스를 먼저 고정해야 콘티가 빨라집니다.',
      fields: [
        { id: 'songInfo', label: '곡 정보', placeholder: '곡명, 아티스트, 버전, BPM, 러닝타임, 커버 범위를 적으세요.', kind: 'long' },
        { id: 'concept', label: '커버 콘셉트', placeholder: '원곡 재현, 팀 색깔, 의상/무드, 표정 연기 방향을 적으세요.', kind: 'long' },
        { id: 'members', label: '멤버 / 파트', placeholder: '멤버별 담당 파트, 센터 구간, 솔로/듀오 포인트를 적으세요.', kind: 'long' },
        { id: 'reference', label: '레퍼런스 영상', placeholder: '원곡 MV, 안무 영상, 직캠, 참고할 카메라워크 링크/메모를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'structure',
      title: '타임코드 / 가사 콘티',
      caption: '한 줄이 촬영표의 한 구간으로 변환됩니다.',
      fields: [
        { id: 'cueSheet', label: '타임코드 큐시트', placeholder: '한 줄에 한 구간씩 작성하세요.\n예: 00:12 Verse 1 - It’s true true - CS, A멤버 포커스', kind: 'list' },
        { id: 'lyricsMap', label: '가사 / 비트 매핑', placeholder: '가사, 박자, 포인트 안무, 표정 포인트를 구간별로 적으세요.', kind: 'long' },
        { id: 'formationMap', label: '대형 변화', placeholder: '멤버 위치, 센터 이동, 좌우 이동, 레벨 변화, 엔딩 포즈를 적으세요.', kind: 'long' },
        { id: 'highlightMoments', label: '하이라이트 포인트', placeholder: '절대 놓치면 안 되는 킬링파트, 손동작, 점프, 턴, 시선 처리를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'camera',
      title: '카메라 / 샷 설계',
      caption: '원테이크, 멀티캠, 릴스 컷까지 촬영 가능한 언어로 바꿉니다.',
      fields: [
        { id: 'coverageMode', label: '촬영 방식', placeholder: '예: 원테이크는 안 하고 기본 사이즈별로 따고, 모자란 인서트를 추가 촬영. 또는 원테이크 안전본 + 인서트 보강.', kind: 'long' },
        { id: 'shotLanguage', label: '샷 언어', placeholder: 'FS/LS/MS/CS, 정면 고정, 사선, 사이드, 핸드헬드, 줌/푸시인 기준을 적으세요.', kind: 'long' },
        { id: 'cameraPlan', label: '카메라 플랜', placeholder: 'A캠 풀샷, B캠 클로즈업, 짐벌 이동, 세로 숏폼 컷 운용을 적으세요.', kind: 'long' },
        { id: 'coverageRules', label: '커버리지 룰', placeholder: '풀샷 유지 구간, 센터 클로즈업 구간, 멤버별 단독 컷, 안전 와이드 기준을 적으세요.', kind: 'long' },
        { id: 'insertPlan', label: '인서트 보강', placeholder: '원테이크 후 부족한 손동작, 표정, 센터 전환, 엔딩 포즈를 어떤 사이즈로 다시 딸지 적으세요.', kind: 'long' },
        { id: 'editPlan', label: '편집 플랜', placeholder: '원테이크 버전, 퍼포먼스 컷, 쇼츠/릴스, 썸네일 후보를 적으세요.', kind: 'long' },
      ],
    },
    {
      id: 'production',
      title: '스튜디오 / 리허설 운영',
      caption: '댄스커버는 리허설, 의상, 거울/바닥/조명 조건이 품질을 좌우합니다.',
      fields: [
        { id: 'locationSetup', label: '공간 / 바닥 / 거울', placeholder: '스튜디오 크기, 바닥 미끄럼, 거울 유무, 배경, 조명 위치를 적으세요.', kind: 'long' },
        { id: 'styling', label: '의상 / 헤메', placeholder: '멤버별 의상, 컬러 충돌, 신발, 헤어 움직임, 예비 의상을 적으세요.', kind: 'long' },
        { id: 'rehearsal', label: '리허설 계획', placeholder: '동선 체크, 카메라 리허설, 대형 마킹, NG 예상 구간을 적으세요.', kind: 'long' },
        { id: 'risk', label: '촬영 리스크', placeholder: '동선 충돌, 부상, 바닥 미끄럼, 저작권, 주변 소음, 조명 플리커를 적으세요.', kind: 'long' },
        { id: 'deliverables', label: '납품 / 공개', placeholder: '가로 풀버전, 세로 숏폼, 썸네일, 크레딧, 업로드 일정, 음원 권리 확인을 적으세요.', kind: 'long' },
      ],
    },
  ],
};

const planningScheduleSourceField: Record<TemplateType, { sectionId: string; fieldId: string }> = {
  film: { sectionId: 'structure', fieldId: 'sceneOutline' },
  ad: { sectionId: 'structure', fieldId: 'contentFlow' },
  event: { sectionId: 'program', fieldId: 'runOfShow' },
  musicvideo: { sectionId: 'structure', fieldId: 'cueSheet' },
  dance: { sectionId: 'structure', fieldId: 'cueSheet' },
};

const equipmentPlanningField: Record<TemplateType, { sectionId: string; fieldId: string }> = {
  film: { sectionId: 'production', fieldId: 'technicalNeeds' },
  ad: { sectionId: 'production', fieldId: 'lowBudgetPlan' },
  event: { sectionId: 'operation', fieldId: 'dataPlan' },
  musicvideo: { sectionId: 'production', fieldId: 'lowBudgetPlan' },
  dance: { sectionId: 'camera', fieldId: 'cameraPlan' },
};

const planningScheduleLabel: Record<TemplateType, string> = {
  film: '씬 아웃라인',
  ad: '광고 구성',
  event: '식순 / 큐시트',
  musicvideo: 'MV 타임코드 큐시트',
  dance: '타임코드 큐시트',
};

const productionScaleLabels: Record<PlanningDocument['productionScale'], string> = {
  premium: '하이엔드',
  standard: '스탠다드',
  lean: '저예산',
};

const projectFormatLabels: Record<NonNullable<PlanningDocument['projectFormat']>, string> = {
  short_film: '단편영화',
  feature_film: '장편영화',
  series: '시리즈/웹드라마',
};

const formatKRW = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`;

const planningFoundationByTemplate: Record<TemplateType, string[]> = {
  film: [
    'short film pitch deck / treatment',
    'script breakdown / beat sheet',
    'director + camera + art treatment',
    'festival submission / EPK package',
    'schedule, rights, risk package',
  ],
  ad: [
    'client brief / agency strategy',
    'single message / RTB / mandatory',
    'storyboard + shot list + deliverables',
    'approval, legal, usage rights',
  ],
  event: [
    'run of show / cue sheet',
    'coverage plan / camera positions',
    'stakeholder, VIP, access control',
    'data backup, same-day delivery',
  ],
  musicvideo: [
    'song structure / lyrics timecode',
    'lip sync + performance coverage',
    'narrative B-roll / visual motif',
    'styling, art, release deliverables',
  ],
  dance: [
    'song structure / timecode cue sheet',
    'lyrics + choreography breakdown',
    'member focus / formation map',
    'camera size, movement, vertical deliverables',
  ],
};

const planningScalePlaybook: Record<PlanningDocument['productionScale'], string[]> = {
  premium: [
    '부서별 의사결정 기준까지 남깁니다.',
    '권리, 검수, 납품, 리스크를 기획 단계에서 잠급니다.',
    '스케줄/장소/인원/콘티로 바로 내려갈 항목을 우선합니다.',
  ],
  standard: [
    '핵심 기획과 현장 운영 사이의 균형을 맞춥니다.',
    '필수 컷, 장소, 인원, 리스크를 빠짐없이 확인합니다.',
    '결정이 필요한 항목은 확인 필요로 남깁니다.',
  ],
  lean: [
    '목표는 유지하고 장소, 장비, 인원을 압축합니다.',
    '포기 가능한 컷과 반드시 지킬 컷을 분리합니다.',
    '대체 장비, 원맨/투맨 운용, 일정 단축안을 우선합니다.',
  ],
};

const planningQualityChecks: Record<TemplateType, Array<{ label: string; sectionId?: string; fieldId?: string; root?: keyof PlanningDocument }>> = {
  film: [
    { label: '로그라인', sectionId: 'brief', fieldId: 'logline' },
    { label: '러닝타임 / 포맷', sectionId: 'audience', fieldId: 'formatRuntime' },
    { label: '씬 아웃라인', sectionId: 'structure', fieldId: 'sceneOutline' },
    { label: '카메라 언어', sectionId: 'creative', fieldId: 'visualRules' },
    { label: '저예산 압축안', sectionId: 'production', fieldId: 'lowBudgetPlan' },
    { label: '제출 자료', sectionId: 'festivalPackage', fieldId: 'submissionAssets' },
    { label: '상영 납품', sectionId: 'festivalPackage', fieldId: 'screeningDeliverables' },
    { label: '권리 클리어런스', sectionId: 'festivalPackage', fieldId: 'rightsClearance' },
  ],
  ad: [
    { label: '싱글 메시지', sectionId: 'strategy', fieldId: 'singleMessage' },
    { label: '필수 조건', sectionId: 'brief', fieldId: 'mandatory' },
    { label: '광고 구성', sectionId: 'structure', fieldId: 'contentFlow' },
    { label: '검수 / 리스크', sectionId: 'production', fieldId: 'risk' },
    { label: '납품 / 승인', sectionId: 'production', fieldId: 'deliverables' },
  ],
  event: [
    { label: '식순 / 큐시트', sectionId: 'program', fieldId: 'runOfShow' },
    { label: '결정적 순간', sectionId: 'program', fieldId: 'criticalMoments' },
    { label: '카메라 배치', sectionId: 'coverage', fieldId: 'cameraPlan' },
    { label: '데이터 백업', sectionId: 'operation', fieldId: 'dataPlan' },
    { label: '납품물', sectionId: 'operation', fieldId: 'deliverables' },
  ],
  musicvideo: [
    { label: '곡 정보', sectionId: 'brief', fieldId: 'songInfo' },
    { label: 'MV 콘셉트', sectionId: 'brief', fieldId: 'concept' },
    { label: '타임코드 큐시트', sectionId: 'structure', fieldId: 'cueSheet' },
    { label: '립싱크 / 퍼포먼스', sectionId: 'structure', fieldId: 'performanceMap' },
    { label: '비주얼 모티프', sectionId: 'visual', fieldId: 'visualMotif' },
    { label: '커버리지 플랜', sectionId: 'production', fieldId: 'coveragePlan' },
    { label: '납품 / 공개물', sectionId: 'production', fieldId: 'deliverables' },
  ],
  dance: [
    { label: '곡 정보', sectionId: 'brief', fieldId: 'songInfo' },
    { label: '타임코드 큐시트', sectionId: 'structure', fieldId: 'cueSheet' },
    { label: '대형 변화', sectionId: 'structure', fieldId: 'formationMap' },
    { label: '촬영 방식', sectionId: 'camera', fieldId: 'coverageMode' },
    { label: '샷 언어', sectionId: 'camera', fieldId: 'shotLanguage' },
    { label: '인서트 보강', sectionId: 'camera', fieldId: 'insertPlan' },
    { label: '리허설 계획', sectionId: 'production', fieldId: 'rehearsal' },
    { label: '납품 / 공개', sectionId: 'production', fieldId: 'deliverables' },
  ],
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

const manualStoryboardUrls = Array.from({ length: 42 }, (_, index) =>
  `/manual-storyboards/manual_${String(index + 1).padStart(2, '0')}.png`
);

const manualScriptPattern = /더\s*매뉴얼|the\s*manual|카이로스|kairos|앤더슨|프린터|매뉴얼|타이란|다니엘|노숙자|종이\s*새|오리가미/i;

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
  const imageTimeoutMs = 2500;

  await Promise.all(images.map(async (image) => {
    const waitWithTimeout = () => new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => resolve(), imageTimeoutMs);
      const done = () => {
        window.clearTimeout(timeout);
        resolve();
      };

      image.addEventListener('load', done, { once: true });
      image.addEventListener('error', done, { once: true });
    });

    if (!(image.complete && image.naturalWidth > 0)) {
      await waitWithTimeout();
    }

    if ('decode' in image) {
      await Promise.race([
        image.decode().catch(() => undefined),
        new Promise((resolve) => window.setTimeout(resolve, imageTimeoutMs)),
      ]);
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
  'template' | 'shootingDate' | 'location' | 'weatherLabel' | 'weatherLatitude' | 'weatherLongitude' | 'callTime' | 'shootingStartTime' | 'days' | 'locations' | 'people' | 'breaks' | 'scenes' | 'timelineOrder' | 'planning' | 'sampleProjectNotice'
>;

type ProjectBackupFile = {
  schema: 'prepro-studio-backup';
  version: 1;
  exportedAt: string;
  project: ProjectSnapshot;
  meta: {
    isSampleProject: boolean;
    sampleProjectNotice: string;
  };
};

const SHARE_HASH_PREFIX = '#prepro=';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readImportedProject = (value: unknown): { project: Partial<ScheduleState>; sampleProjectNotice?: string } => {
  if (!isRecord(value)) {
    throw new Error('Invalid PrePro Studio backup');
  }

  if (value.schema === 'prepro-studio-backup' && isRecord(value.project)) {
    const meta = isRecord(value.meta) ? value.meta : {};
    const project = value.project as Partial<ScheduleState>;
    return {
      project,
      sampleProjectNotice: typeof meta.sampleProjectNotice === 'string'
        ? meta.sampleProjectNotice
        : project.sampleProjectNotice || '',
    };
  }

  if (isRecord(value.state)) {
    const project = value.state as Partial<ScheduleState>;
    return { project, sampleProjectNotice: project.sampleProjectNotice || '' };
  }

  const project = value as Partial<ScheduleState>;
  return { project, sampleProjectNotice: project.sampleProjectNotice || '' };
};

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
  musicCue: string;
  lyrics: string;
  choreoNote: string;
  focusMember: string;
  shotSize: string;
  formation: string;
  props: string;
  costume: string;
  soundNote: string;
  specialInstruction: string;
  insertNote: string;
  continuityNote: string;
  takeNote: string;
  lensNote: string;
  slateNote: string;
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
type ScheduleIssueFilter = 'all' | 'missingLocation' | 'missingStoryboard' | 'missingPeople' | 'missingDuration';

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
    planning, updatePlanning, updatePlanningField, resetPlanning,
    sampleProjectNotice, setSampleProjectNotice,
    loadSampleData, importData, resetProject
  } = useScheduleStore();
  const [isReportMode, setIsReportMode] = useState(false);
  const [activeTab, setActiveTab] = useState<MainWorkspaceTab>('schedule');
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
  const [fileStatus, setFileStatus] = useState('');
  const [pdfStatus, setPdfStatus] = useState('');
  const [cueSheetStatus, setCueSheetStatus] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<ScheduleStatusFilter>('all');
  const [scheduleIssueFilter, setScheduleIssueFilter] = useState<ScheduleIssueFilter>('all');
  const [scheduleLocationFilter, setScheduleLocationFilter] = useState('all');
  const [peopleIssueFilter, setPeopleIssueFilter] = useState(false);
  const [acknowledgedReadinessCheckIds, setAcknowledgedReadinessCheckIds] = useState<string[]>([]);
  const [isDepartureMode, setIsDepartureMode] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const cueSheetPdfRef = useRef<HTMLDivElement>(null);
  const reportPdfRef = useRef<HTMLDivElement>(null);
  const callSheetPdfRef = useRef<HTMLDivElement>(null);
  const shareImportCheckedRef = useRef(false);
  const activeTabRestoredRef = useRef(false);
  const planningAiSettingsLoadedRef = useRef(false);

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
    storyFit: '',
    visualCheck: '',
    soundCheck: '',
    powerCheck: '',
    accessCheck: '',
    weatherRisk: '',
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
  const [planningAiSettings, setPlanningAiSettings] = useState<PlanningAiSettings>(defaultPlanningAiSettings);
  const [planningAiStatus, setPlanningAiStatus] = useState('');
  const [isPlanningAiRunning, setIsPlanningAiRunning] = useState(false);
  const [isPlanningAiTesting, setIsPlanningAiTesting] = useState(false);
  const [planningWorkspaceTab, setPlanningWorkspaceTab] = useState<PlanningWorkspaceTab>('brief');
  const [planningFocusTarget, setPlanningFocusTarget] = useState('');
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [customImageStatus, setCustomImageStatus] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const emptySceneForm: SceneFormState = {
    location: '', locationId: '', description: '', estimatedMinutes: 30,
    sceneNumber: '', intExt: 'INT', dayNight: 'DAY', cast: '', cutCount: '', pageCount: '',
    eventSection: '', cameraGear: '',
    visualRef: '', lightingNote: '', clientMemo: '',
    musicCue: '', lyrics: '', choreoNote: '', focusMember: '', shotSize: '', formation: '',
    props: '', costume: '', soundNote: '', specialInstruction: '', insertNote: '',
    continuityNote: '', takeNote: '', lensNote: '', slateNote: '',
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
  const autoSaveLabel = lastSavedAt ? `${format(lastSavedAt, 'HH:mm')} 자동 저장` : '자동 저장 대기';
  const apiStorageLabel = planningAiSettings.rememberKey && planningAiSettings.apiKey.trim() ? 'API 키 로컬 저장' : 'API 키 저장 안 함';
  const departureChecklistAnchorId = 'departure-checklist';

  useEffect(() => {
    const timer = window.setTimeout(() => setLastSavedAt(new Date()), 450);

    return () => window.clearTimeout(timer);
  }, [
    breaks,
    callTime,
    days,
    locations,
    location,
    people,
    planning,
    scenes,
    shootingDate,
    shootingStartTime,
    template,
    timelineOrder,
    weatherLabel,
  ]);

  const getDefaultSceneFormState = (): SceneFormState => {
    const dayLocation = locations.find((item) => activeDay.locationIds.includes(item.id));
    const fallbackLocation = dayLocation || locations[0];
    const nextIndex = activeDayScenes.length + 1;
    const defaultLocation = fallbackLocation?.name || (location && location !== 'Seoul' ? location : '장소 미정');
    const isOutdoor = fallbackLocation?.type === 'outdoor';
    const base: SceneFormState = {
      ...emptySceneForm,
      location: defaultLocation,
      locationId: fallbackLocation?.id || '',
      intExt: isOutdoor ? 'EXT' : 'INT',
      dayNight: isOutdoor ? 'DAY' : 'DAY',
    };

    if (template === 'event') {
      return {
        ...base,
        estimatedMinutes: 30,
        eventSection: `프로그램 ${nextIndex}`,
        cameraGear: '메인 캠 / 현장 스케치',
      };
    }

    if (template === 'ad') {
      return {
        ...base,
        estimatedMinutes: 40,
        sceneNumber: `C#${nextIndex}`,
        cutCount: 3,
        lightingNote: '브랜드 톤앤매너 유지',
      };
    }

    if (template === 'musicvideo') {
      return {
        ...base,
        estimatedMinutes: 35,
        sceneNumber: `MV#${nextIndex}`,
        musicCue: '00:00',
        shotSize: 'CU',
        cameraGear: '립싱크 CU / 퍼포먼스 FS / B-roll',
        choreoNote: '립싱크, 무드, 인서트, 카메라 움직임',
        focusMember: '아티스트',
        visualRef: '/shot_10.png',
      };
    }

    if (template === 'dance') {
      return {
        ...base,
        estimatedMinutes: 12,
        sceneNumber: `D#${nextIndex}`,
        musicCue: '00:00',
        shotSize: 'FS',
        cameraGear: 'A캠 정면 풀샷',
        choreoNote: '포인트 안무 / 대형 변화',
        visualRef: '/shot_171.png',
      };
    }

    return {
      ...base,
      estimatedMinutes: 45,
      sceneNumber: `S#${nextIndex}`,
      cutCount: 4,
      pageCount: 1,
    };
  };
  const planningSections = planningTemplateDefinitions[template];
  const planningScaleLabel = productionScaleLabels[planning.productionScale];
  const planningProjectFormatLabel = planning.projectFormat ? projectFormatLabels[planning.projectFormat] : '프로젝트';
  const isShortFilmMode = template === 'film' && (planning.projectFormat || 'short_film') === 'short_film';
  const isMusicTimelineTemplate = template === 'dance' || template === 'musicvideo';
  const planningFoundations = planningFoundationByTemplate[template];
  const planningPlaybook = planningScalePlaybook[planning.productionScale];
  const planningQualityChecksForTemplate = planningQualityChecks[template];
  const getPlanningFieldValue = useCallback((sectionId: string, fieldId: string) => (
    planning.sections[sectionId]?.[fieldId] || ''
  ), [planning.sections]);
  const getPlanningCheckValue = (check: { sectionId?: string; fieldId?: string; root?: keyof PlanningDocument }) => {
    if (check.root) {
      const value = planning[check.root];
      return typeof value === 'string' ? value : '';
    }
    if (check.sectionId && check.fieldId) return getPlanningFieldValue(check.sectionId, check.fieldId);
    return '';
  };
  const planningCompletion = useMemo(() => {
    const requiredValues = [
      planning.projectTitle,
      planning.oneLiner,
      planning.audience,
      planning.coreMessage,
      ...planningSections.flatMap((section) => section.fields.map((field) => planning.sections[section.id]?.[field.id] || '')),
    ];
    const filled = requiredValues.filter((value) => value.trim()).length;
    return Math.round((filled / Math.max(1, requiredValues.length)) * 100);
  }, [planning, planningSections]);
  const planningQualityScore = Math.round((
    planningQualityChecksForTemplate.filter((check) => getPlanningCheckValue(check).trim()).length /
    Math.max(1, planningQualityChecksForTemplate.length)
  ) * 100);
  const planningCheckItems = [
    { label: '한 줄 기획', ok: Boolean(planning.oneLiner.trim()), tab: 'brief' as PlanningWorkspaceTab, anchorId: 'planning-root-one-liner' },
    { label: '타깃', ok: Boolean(planning.audience.trim()), tab: 'brief' as PlanningWorkspaceTab, anchorId: 'planning-root-audience' },
    { label: '핵심 메시지', ok: Boolean(planning.coreMessage.trim()), tab: 'brief' as PlanningWorkspaceTab, anchorId: 'planning-root-core-message' },
    ...planningQualityChecksForTemplate.map((check) => ({
      label: check.label,
      ok: Boolean(getPlanningCheckValue(check).trim()),
      tab: 'details' as PlanningWorkspaceTab,
      anchorId: `planning-field-${check.sectionId}-${check.fieldId}`,
    })),
  ];
  const planningCompletedChecks = planningCheckItems.filter((item) => item.ok).length;
  const planningPendingChecks = planningCheckItems.length - planningCompletedChecks;
  const planningApiGuide = [
    { provider: 'OpenAI 호환', url: 'https://platform.openai.com/api-keys', note: 'OpenAI 또는 호환 게이트웨이 키를 사용합니다.' },
    { provider: 'Gemini', url: 'https://aistudio.google.com/apikey', note: 'Google AI Studio에서 키를 발급합니다.' },
    { provider: 'Claude', url: 'https://console.anthropic.com/settings/keys', note: 'Anthropic Console에서 키를 발급합니다.' },
    { provider: 'Public APIs', url: 'https://github.com/public-apis/public-apis', note: '날씨, 위치, 이미지, 공공데이터 등 무료/공개 API 후보를 찾는 레퍼런스 목록입니다.', actionLabel: '목록 보기' },
  ];
  const planningScheduleSource = planningScheduleSourceField[template];
  const equipmentPlanningSource = equipmentPlanningField[template];
  const equipmentPlanningAnchor = `planning-field-${equipmentPlanningSource.sectionId}-${equipmentPlanningSource.fieldId}`;
  const planningScheduleLines = useMemo(() => {
    const source = planning.sections[planningScheduleSource.sectionId]?.[planningScheduleSource.fieldId] || '';
    return source
      .split('\n')
      .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
      .filter(Boolean);
  }, [planning.sections, planningScheduleSource.fieldId, planningScheduleSource.sectionId]);

  const cueSheetPlanningRows = useMemo<CueSheetRow[]>(() => {
    const fallbackLocation = locations[0];
    const defaultLocation = fallbackLocation?.name || location || '장소 미정';
    const defaultReference = template === 'event' ? '/shot_141.png' : template === 'ad' ? '/shot_136.png' : template === 'musicvideo' ? '/shot_10.png' : template === 'dance' ? '/shot_171.png' : '/shot_15.png';
    const defaultMinutes = template === 'event' ? 30 : template === 'ad' ? 45 : template === 'musicvideo' ? 35 : template === 'dance' ? 12 : 60;

    return planningScheduleLines.map((line, index) => {
      const timecode = line.match(/(\d{1,2}:\d{2})/)?.[1] || '';
      const content = line.replace(/^\s*\d{1,2}:\d{2}\s*/, '').trim() || line;
      const shotSize = line.match(/\b(ECU|CU|CS|MS|LS|FS|WS)\b/i)?.[1]?.toUpperCase() || (template === 'dance' ? 'FS' : template === 'musicvideo' ? 'CU' : '');

      return {
        id: `planning-${index}`,
        orderLabel: `${index + 1}`,
        sequenceLabel: template === 'event' ? `P#${index + 1}` : template === 'ad' ? `C#${index + 1}` : template === 'musicvideo' ? `MV#${index + 1}` : template === 'dance' ? `D#${index + 1}` : `S#${index + 1}`,
        timeLabel: timecode || '--:--',
        durationLabel: `${defaultMinutes}분`,
        location: defaultLocation,
        content,
        reference: defaultReference,
        section: template === 'event' ? (content.split(/[-:–—]/)[0]?.trim() || `프로그램 ${index + 1}`) : undefined,
        gear: template === 'event' ? '현장 스케치 / B-roll' : undefined,
        note: template === 'dance'
          ? getPlanningFieldValue('camera', 'coverageMode') || getPlanningFieldValue('camera', 'insertPlan')
          : template === 'musicvideo'
            ? getPlanningFieldValue('production', 'coveragePlan') || getPlanningFieldValue('visual', 'shotLanguage')
            : template === 'ad'
              ? getPlanningFieldValue('brief', 'mandatory') || getPlanningFieldValue('creative', 'tone')
              : undefined,
        timecode,
        lyrics: template === 'dance' || template === 'musicvideo' ? content.split(/[-–—]/)[0]?.trim() || content : undefined,
        shotSize,
        focus: template === 'musicvideo' ? '아티스트' : undefined,
        formation: template === 'dance' ? getPlanningFieldValue('structure', 'formationMap') : undefined,
        status: 'pending',
        estimatedMinutes: defaultMinutes,
        source: 'planning',
      };
    });
  }, [getPlanningFieldValue, location, locations, planningScheduleLines, template]);

  const cueSheetSceneRows = useMemo<CueSheetRow[]>(() => (
    activeDayScenes.map((scene, index) => {
      const start = scene.startTime ? format(new Date(scene.startTime), 'HH:mm') : '';
      const fallbackSequence = template === 'event' ? `P#${index + 1}` : template === 'ad' ? `C#${index + 1}` : template === 'musicvideo' ? `MV#${index + 1}` : template === 'dance' ? `D#${index + 1}` : `S#${index + 1}`;
      const note = [
        scene.choreoNote,
        scene.cameraGear,
        scene.lightingNote,
        scene.clientMemo,
        scene.props && `소품: ${scene.props}`,
        scene.costume && `의상: ${scene.costume}`,
        scene.specialInstruction,
      ].filter(Boolean).join(' · ');

      return {
        id: scene.id,
        orderLabel: `${index + 1}`,
        sequenceLabel: scene.sceneNumber || fallbackSequence,
        timeLabel: start || scene.musicCue || '--:--',
        durationLabel: `${scene.estimatedMinutes || 0}분`,
        location: scene.location || '장소 미정',
        content: scene.description || '-',
        reference: scene.visualRef,
        section: scene.eventSection,
        gear: scene.cameraGear || scene.cast,
        note,
        timecode: scene.musicCue,
        lyrics: scene.lyrics,
        shotSize: scene.shotSize,
        focus: scene.focusMember || scene.cast,
        formation: scene.formation,
        status: scene.status || 'pending',
        estimatedMinutes: scene.estimatedMinutes || 0,
        source: 'scene',
      };
    })
  ), [activeDayScenes, template]);

  const cueSheetRows = cueSheetSceneRows.length > 0 ? cueSheetSceneRows : cueSheetPlanningRows;
  const cueSheetTotalMinutes = cueSheetRows.reduce((sum, row) => sum + row.estimatedMinutes, 0);
  const cueSheetCanApplyDraft = cueSheetSceneRows.length === 0 && cueSheetPlanningRows.length > 0;
  const cueSheetSourceLabel = cueSheetSceneRows.length > 0 ? '촬영표' : cueSheetPlanningRows.length > 0 ? '기획서' : '없음';
  const cueSheetSourceDetail = cueSheetSceneRows.length > 0
    ? `Day ${activeDayIndex + 1} 촬영표 ${cueSheetSceneRows.length}개 기준`
    : cueSheetPlanningRows.length > 0
      ? `${planningScheduleLabel[template]} ${cueSheetPlanningRows.length}줄 초안`
      : `${planningScheduleLabel[template]} 입력 필요`;

  const recommendations = useMemo(() => recommendShots(newSceneParams.description), [newSceneParams.description]);
  const [sbCategory, setSbCategory] = useState<StoryboardCategory | 'ALL'>('ALL');
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
  const budgetStats = useMemo(() => {
    const budgetTemplateLabel = template === 'event' ? '행사/스케치' : template === 'ad' ? '광고/브랜디드' : template === 'musicvideo' ? '뮤직비디오' : template === 'dance' ? '댄스커버' : '영화/단편';
    const hasBudgetInputs = scenes.length > 0 || locations.length > 0 || people.length > 0 || breaks.length > 0;
    const emptyCategories = [
      { label: '인건비', value: 0, note: '출연진/스태프 등록 후 산정' },
      { label: '장소/진행비', value: 0, note: '장소 또는 시간블록 등록 후 산정' },
      { label: '기재비', value: 0, note: '촬영표 등록 후 산정' },
      { label: template === 'dance' ? '의상/헤메' : template === 'musicvideo' ? '미술/스타일링' : template === 'ad' ? '미술/제품' : '미술/소품', value: 0, note: `${budgetTemplateLabel} 제작 성격 반영 대기` },
      { label: '후반/납품', value: 0, note: '컷/구간 등록 후 산정' },
      { label: '예비비', value: 0, note: '리스크 버퍼 산정 대기' },
    ];

    if (!hasBudgetInputs) {
      return {
        total: 0,
        subtotal: 0,
        contingency: 0,
        categories: emptyCategories,
        shootDays: 0,
        cutCount: 0,
        costPerDay: 0,
        costPerCut: 0,
      };
    }

    const scaleMultiplier = planning.productionScale === 'premium' ? 1.55 : planning.productionScale === 'standard' ? 1 : 0.62;
    const shootDays = Math.max(1, days.length || 1);
    const sceneCount = Math.max(1, scenes.length);
    const cutCount = Math.max(sceneCount, reportStats.cutCount || scenes.reduce((sum, scene) => sum + Number(scene.cutCount || 1), 0));
    const castCount = people.filter((person) => person.category === 'cast').length;
    const crewCount = people.filter((person) => person.category === 'crew').length;
    const outdoorLocations = locations.filter((item) => item.type === 'outdoor').length;
    const studioLocations = locations.filter((item) => item.type === 'studio').length;

    const baseDayRate = template === 'film' ? 950000 : template === 'ad' ? 1250000 : template === 'musicvideo' ? 920000 : template === 'dance' ? 520000 : 680000;
    const crewDayRate = template === 'event' ? 180000 : template === 'musicvideo' ? 190000 : template === 'dance' ? 140000 : 220000;
    const castDayRate = template === 'musicvideo' ? 140000 : template === 'dance' ? 80000 : template === 'event' ? 90000 : 170000;
    const locationDayRate = template === 'musicvideo' ? 330000 : template === 'dance' ? 180000 : template === 'event' ? 260000 : template === 'ad' ? 420000 : 300000;
    const gearDayRate = template === 'ad' ? 520000 : template === 'musicvideo' ? 420000 : template === 'dance' ? 260000 : template === 'event' ? 360000 : 440000;
    const postPerCutRate = template === 'ad' ? 85000 : template === 'musicvideo' ? 70000 : template === 'dance' ? 45000 : template === 'event' ? 38000 : 55000;

    const labor = (crewCount * crewDayRate + castCount * castDayRate + baseDayRate) * shootDays * scaleMultiplier;
    const production = (locationDayRate * Math.max(1, locations.length) + outdoorLocations * 120000 + studioLocations * 90000 + breaks.length * 45000) * scaleMultiplier;
    const equipment = (gearDayRate * shootDays + cutCount * 7000) * scaleMultiplier;
    const art = (template === 'dance' ? 180000 + castCount * 70000 : template === 'musicvideo' ? 520000 + castCount * 90000 : template === 'ad' ? 650000 : template === 'event' ? 220000 : 380000) * scaleMultiplier;
    const post = (cutCount * postPerCutRate + shootDays * 180000) * scaleMultiplier;
    const subtotal = labor + production + equipment + art + post;
    const contingency = subtotal * (planning.productionScale === 'premium' ? 0.12 : planning.productionScale === 'standard' ? 0.1 : 0.08);
    const total = subtotal + contingency;
    const categories = [
      { label: '인건비', value: labor, note: `${crewCount} 스태프 · ${castCount} 출연/멤버 · ${shootDays}일` },
      { label: '장소/진행비', value: production, note: `${locations.length}곳 · 야외 ${outdoorLocations}곳 · 시간블록 ${breaks.length}개` },
      { label: '기재비', value: equipment, note: `${shootDays}일 장비 · ${cutCount}컷 기준` },
      { label: template === 'dance' ? '의상/헤메' : template === 'musicvideo' ? '미술/스타일링' : template === 'ad' ? '미술/제품' : '미술/소품', value: art, note: `${budgetTemplateLabel} 제작 성격 반영` },
      { label: '후반/납품', value: post, note: `${cutCount}컷 · 편집/출력 기준` },
      { label: '예비비', value: contingency, note: `${planning.productionScale === 'premium' ? '12' : planning.productionScale === 'standard' ? '10' : '8'}% 리스크 버퍼` },
    ];

    return {
      total,
      subtotal,
      contingency,
      categories,
      shootDays,
      cutCount,
      costPerDay: total / shootDays,
      costPerCut: total / Math.max(1, cutCount),
    };
  }, [breaks.length, days.length, locations, people, planning.productionScale, reportStats.cutCount, scenes, template]);

  const shortFilmReadinessChecks = useMemo(() => {
    if (!isShortFilmMode) return [];

    const formatRuntime = planning.sections.audience?.formatRuntime?.trim() || '';
    const distribution = planning.sections.audience?.distribution?.trim() || '';
    const festivalFit = planning.sections.audience?.festivalFit?.trim() || '';
    const projectSpecs = planning.sections.festivalPackage?.projectSpecs?.trim() || '';
    const submissionAssets = planning.sections.festivalPackage?.submissionAssets?.trim() || '';
    const screeningDeliverables = planning.sections.festivalPackage?.screeningDeliverables?.trim() || '';
    const rightsClearance = (
      planning.sections.festivalPackage?.rightsClearance ||
      planning.sections.production?.rightsDeliverables ||
      ''
    ).trim();
    const festivalTracker = planning.sections.festivalPackage?.festivalTracker?.trim() || '';
    const estimatedRuntime = reportStats.pageCount;
    const runtimeStatus: 'ok' | 'warning' | 'critical' = estimatedRuntime > 50 ? 'critical' : estimatedRuntime > 40 ? 'warning' : formatRuntime ? 'ok' : 'warning';

    return [
      {
        id: 'runtime',
        label: '러닝타임',
        detail: estimatedRuntime
          ? `스크립트 ${estimatedRuntime.toFixed(1)}p 기준, 목표 러닝타임과 크레딧 포함 제한을 확인`
          : '씬별 페이지 수 또는 목표 러닝타임 입력 필요',
        status: runtimeStatus,
      },
      {
        id: 'festivalStrategy',
        label: '영화제 전략',
        detail: distribution && festivalFit ? '목표 영화제와 출품 적합성 입력됨' : '프리미어 조건, 마감일, 출품 적합성 보강 필요',
        status: distribution && festivalFit ? 'ok' : 'warning',
      },
      {
        id: 'projectSpecs',
        label: '작품 메타',
        detail: projectSpecs ? '러닝타임, 완성일, 국가, 언어, 장르, 포맷 정리됨' : 'FilmFreeway/영화제 제출용 메타데이터 필요',
        status: projectSpecs ? 'ok' : 'warning',
      },
      {
        id: 'submissionAssets',
        label: '제출 자료',
        detail: submissionAssets ? '시놉시스, 감독 소개, 포스터, 스틸, EPK 목록 입력됨' : '시놉시스/스틸/포스터/감독 소개/EPK 목록 필요',
        status: submissionAssets ? 'ok' : 'warning',
      },
      {
        id: 'screeningDeliverables',
        label: '상영 납품',
        detail: screeningDeliverables ? 'DCP/ProRes/자막/QC 기준 입력됨' : '상영본, screener, 자막, QC 기준 필요',
        status: screeningDeliverables ? 'ok' : 'warning',
      },
      {
        id: 'rightsClearance',
        label: '권리 증빙',
        detail: rightsClearance ? '음악/초상권/로케이션 등 권리 항목 입력됨' : '음악, 초상권, 로케이션, 상표 노출 증빙 필요',
        status: rightsClearance ? 'ok' : 'critical',
      },
      {
        id: 'festivalTracker',
        label: '출품 트래커',
        detail: festivalTracker ? '마감일, 출품비, 결과 발표일, 상태 관리됨' : '목표 영화제별 마감일과 제출 상태 필요',
        status: festivalTracker ? 'ok' : 'warning',
      },
    ] satisfies { id: string; label: string; detail: string; status: 'ok' | 'warning' | 'critical' }[];
  }, [isShortFilmMode, planning.sections, reportStats.pageCount]);

  const shortFilmReadinessSummary = useMemo(() => {
    const critical = shortFilmReadinessChecks.filter((item) => item.status === 'critical').length;
    const warning = shortFilmReadinessChecks.filter((item) => item.status === 'warning').length;
    const ok = shortFilmReadinessChecks.length - critical - warning;
    const status: 'ok' | 'warning' | 'critical' = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'ok';

    return { critical, warning, ok, status };
  }, [shortFilmReadinessChecks]);

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
          ? (template === 'event' ? '현장 확인 / 보충 촬영 검토' : template === 'ad' ? '재촬영 또는 대체 컷 확보' : template === 'musicvideo' ? '립싱크/퍼포먼스 재촬영 검토' : template === 'dance' ? '안무/포커스 재촬영 검토' : '재촬영 필요 여부 확인')
          : (template === 'event' ? '미진행 프로그램 확인' : template === 'ad' ? '미촬영 컷 확인' : isMusicTimelineTemplate ? '미촬영 구간 확인' : '미촬영 씬 확인'),
      }));
  }, [isMusicTimelineTemplate, scenes, template]);

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
  const filteredCallSheetPeople = useMemo(() => {
    if (!peopleIssueFilter) return callSheetPeople;
    return callSheetPeople.filter((item) => item.missingCallTime || item.missingContact);
  }, [callSheetPeople, peopleIssueFilter]);
  const filteredPeople = useMemo(() => {
    if (!peopleIssueFilter) return people;
    const issuePeopleIds = new Set(filteredCallSheetPeople.map((item) => item.person.id));
    return people.filter((person) => issuePeopleIds.has(person.id));
  }, [filteredCallSheetPeople, people, peopleIssueFilter]);

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
  const danceCoverageStats = useMemo(() => {
    const dayDanceScenes = activeDayScenes;
    const oneTakeCount = dayDanceScenes.filter((scene) => {
      const shotSize = (scene.shotSize || '').toUpperCase();
      const cameraPlan = `${scene.cameraGear || ''} ${scene.description || ''}`;
      return shotSize.includes('FS') || shotSize.includes('WS') || cameraPlan.includes('원테이크') || cameraPlan.toLowerCase().includes('one take');
    }).length;
    const insertCount = dayDanceScenes.filter((scene) => {
      const shotSize = (scene.shotSize || '').toUpperCase();
      return shotSize.includes('CS') || shotSize.includes('CU') || shotSize.includes('MS') || shotSize.includes('LS');
    }).length;
    const focusMembers = Array.from(new Set(dayDanceScenes.map((scene) => scene.focusMember?.trim()).filter(Boolean)));
    const cueCount = dayDanceScenes.filter((scene) => scene.musicCue?.trim()).length;
    const lyricCount = dayDanceScenes.filter((scene) => scene.lyrics?.trim()).length;
    const shotSizes = Array.from(new Set(dayDanceScenes.flatMap((scene) => (scene.shotSize || '').split('/').map((item) => item.trim()).filter(Boolean))));

    return {
      cueCount,
      lyricCount,
      oneTakeCount,
      insertCount,
      focusMembers,
      shotSizes,
    };
  }, [activeDayScenes]);

  const workspaceLanguage = workspaceLanguageByTemplate[template];
  const mainWorkspaceTabs: Array<{ id: MainWorkspaceTab; group: MainWorkspaceGroup; label: string; caption: string; metric: string; Icon: typeof Brain }> = [
    { id: 'planning', group: '준비', label: '기획서', caption: workspaceLanguage.planningCaption, metric: `${planningCompletion}%`, Icon: Brain },
    { id: 'locations', group: '준비', label: workspaceLanguage.locationsLabel, caption: workspaceLanguage.locationsCaption, metric: `${locations.length}곳`, Icon: MapPin },
    { id: 'people', group: '준비', label: workspaceLanguage.peopleLabel, caption: workspaceLanguage.peopleCaption, metric: `${people.length}명`, Icon: Users },
    { id: 'budget', group: '준비', label: '예산', caption: '순제작비 초안', metric: budgetStats.total > 0 ? (budgetStats.total >= 1000000 ? `${Math.round(budgetStats.total / 10000)}만` : formatKRW(budgetStats.total)) : '준비 전', Icon: Calculator },
    { id: 'schedule', group: '촬영', label: workspaceLanguage.scheduleLabel, caption: workspaceLanguage.scheduleCaption, metric: isMusicTimelineTemplate ? `${danceCoverageStats.cueCount}큐` : `${timelineStats.totalMinutes || 0}분`, Icon: isMusicTimelineTemplate ? Music2 : Clock },
    { id: 'cueSheet', group: '촬영', label: workspaceLanguage.cueSheetLabel, caption: workspaceLanguage.cueSheetCaption, metric: `${cueSheetRows.length}큐`, Icon: ClipboardList },
    { id: 'storyboard', group: '촬영', label: workspaceLanguage.storyboardLabel, caption: workspaceLanguage.storyboardCaption, metric: `${storyboardDb.length}개`, Icon: ImageIcon },
    { id: 'report', group: '마무리', label: workspaceLanguage.reportLabel, caption: workspaceLanguage.reportCaption, metric: scenes.length > 0 ? `${reportStats.done}/${scenes.length}` : '준비 전', Icon: FileText },
  ];
  const mainWorkspaceGroups: MainWorkspaceGroup[] = ['준비', '촬영', '마무리'];

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

    if (template === 'musicvideo') {
      return {
        item: '구간',
        itemPlural: '구간',
        addItem: 'MV 구간 추가',
        addItemClose: 'MV 구간 추가 닫기',
        editItemClose: 'MV 구간 편집 닫기',
        scheduleTitle: '뮤직비디오 촬영 콘티',
        infoColumn: '타임코드 / 가사',
        contentColumn: '립싱크 / 퍼포먼스 / B-roll',
        locationItemCount: '구간',
        emptyHint: '곡 타임코드와 립싱크, 퍼포먼스, B-roll 구간을 추가하세요.',
        totalItemLabel: '총 구간',
        pageLabel: '총 컷',
        peopleLabel: '아티스트/출연',
        storyboardLabel: 'MV 레퍼런스',
        storyboardDescription: `${storyboardDb.length}종 샷 레퍼런스를 검색하고 MV 구간에 연결할 수 있습니다.`,
        formTitle: editingScene ? 'MV 구간 편집' : '새 MV 구간 추가',
        modeLabel: '뮤직비디오 모드',
        locationWeatherButton: 'MV 촬영지를 날씨 위치로 사용',
        descriptionLabel: '립싱크 / 퍼포먼스 / B-roll 설명',
        descriptionPlaceholder: '예: Verse 립싱크 CU, Hook 퍼포먼스 FS, 브릿지 B-roll 몽타주 등',
        eventSectionLabel: '파트',
        gearLabel: '카메라 플랜',
        addResult: 'MV 콘티에 추가하기',
        analyzerResult: 'AI 분석 결과',
      };
    }

    if (template === 'dance') {
      return {
        item: '구간',
        itemPlural: '구간',
        addItem: '구간 추가',
        addItemClose: '구간 추가 닫기',
        editItemClose: '구간 편집 닫기',
        scheduleTitle: '댄스커버 콘티',
        infoColumn: '타임코드 / 가사',
        contentColumn: '안무 / 카메라',
        locationItemCount: '구간',
        emptyHint: '곡 타임코드와 가사, 안무 포인트를 구간별로 추가하세요.',
        totalItemLabel: '총 구간',
        pageLabel: '총 컷',
        peopleLabel: '멤버',
        storyboardLabel: '레퍼런스',
        storyboardDescription: `${storyboardDb.length}종 샷 레퍼런스를 검색하고 댄스 구간에 연결할 수 있습니다.`,
        formTitle: editingScene ? '구간 편집' : '새 댄스 구간 추가',
        modeLabel: '댄스커버 모드',
        locationWeatherButton: '스튜디오 위치를 날씨 위치로 사용',
        descriptionLabel: '안무 / 카메라 설명',
        descriptionPlaceholder: '이 구간의 안무 포인트, 카메라 움직임, 포커스 멤버를 입력하세요.',
        eventSectionLabel: '파트',
        gearLabel: '카메라 플랜',
        addResult: '댄스 콘티에 추가하기',
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
      modeLabel: '영화/단편 모드',
      locationWeatherButton: '입력한 씬 장소를 날씨 위치로 사용',
      descriptionLabel: '내용 / 촬영 설명',
      descriptionPlaceholder: '해당 장면에 대한 상세 촬영 내용을 입력하세요.',
      eventSectionLabel: '구간',
      gearLabel: '촬영 장비',
      addResult: '전체 일정에 추가하기',
      analyzerResult: 'AI 분석 결과',
    };
  }, [editingScene, template]);

  const focusPlanningAnchor = (tab: PlanningWorkspaceTab, anchorId: string) => {
    setPlanningWorkspaceTab(tab);
    setPlanningFocusTarget(anchorId);
  };

  useEffect(() => {
    if (!planningFocusTarget) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(planningFocusTarget);
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = target.querySelector('input, textarea, select, button') as HTMLElement | null;
      focusable?.focus();
      setPlanningFocusTarget('');
    });

    return () => window.cancelAnimationFrame(frame);
  }, [planningFocusTarget, planningWorkspaceTab]);

  const readinessChecks = useMemo(() => {
    const pendingPermits = locations.filter((item) => item.permitStatus === 'pending' || item.permitStatus === 'none').length;
    const outdoorWithoutWeather = locations.filter((item) => item.type === 'outdoor' && (!item.weatherLatitude || !item.weatherLongitude)).length;
    const scenesWithoutStoryboard = scenes.filter((scene) => !scene.visualRef).length;
    const scenesWithoutLocation = scenes.filter((scene) => !scene.location?.trim()).length;
    const scenesWithoutPeople = scenes.filter((scene) => !scene.cast?.trim() && (!scene.castIds || scene.castIds.length === 0)).length;
    const scenesWithoutGear = scenes.filter((scene) => !scene.cameraGear?.trim()).length;
    const equipmentPlanningValue = planning.sections[equipmentPlanningSource.sectionId]?.[equipmentPlanningSource.fieldId] || '';
    const equipmentPlanningReady = scenes.some((scene) => scene.cameraGear?.trim()) || Boolean(equipmentPlanningValue.trim());
    const filmBreakdownMissing = template === 'film'
      ? scenes.filter((scene) => !scene.props && !scene.costume && !scene.soundNote && !scene.specialInstruction && !scene.insertNote).length
      : 0;
    const locationScoutMissing = locations.filter((item) => !item.storyFit && !item.visualCheck && !item.soundCheck && !item.powerCheck && !item.accessCheck && !item.weatherRisk).length;

    return [
      {
        id: 'schedule',
        label: `${copy.itemPlural} 등록`,
        detail: scenes.length > 0 ? `${scenes.length}개 ${copy.itemPlural} 준비됨` : `${copy.itemPlural}이 아직 없습니다`,
        status: scenes.length > 0 ? 'ok' : 'critical',
        actionLabel: scenes.length > 0 ? '촬영표 보기' : `${copy.item} 추가`,
      },
      {
        id: 'permit',
        label: '장소 허가',
        detail: locations.length === 0
          ? '장소가 아직 없습니다'
          : pendingPermits > 0
            ? `${pendingPermits}개 장소 허가 확인 필요`
            : '허가 상태 확인 완료',
        status: locations.length === 0 || pendingPermits > 0 ? 'warning' : 'ok',
        actionLabel: locations.length === 0 ? '장소 추가' : '장소 확인',
      },
      {
        id: 'people',
        label: '콜타임 / 연락처',
        detail: people.length === 0
          ? '출연진/스태프가 아직 없습니다'
          : callSheetStats.missingCallTime || callSheetStats.missingContact
            ? `콜 미정 ${callSheetStats.missingCallTime}명 · 연락처 누락 ${callSheetStats.missingContact}명`
            : '콜타임과 연락처 확인 완료',
        status: people.length === 0 || callSheetStats.missingCallTime || callSheetStats.missingContact ? 'warning' : 'ok',
        actionLabel: people.length === 0 ? '인원 추가' : '인원 확인',
      },
      {
        id: 'storyboard',
        label: copy.storyboardLabel,
        detail: scenes.length === 0
          ? `${copy.itemPlural} 등록 후 연결`
          : scenesWithoutStoryboard > 0
            ? `${scenesWithoutStoryboard}개 ${copy.itemPlural} 이미지 없음`
            : `${copy.storyboardLabel} 연결 완료`,
        status: scenes.length === 0 || scenesWithoutStoryboard > 0 ? 'warning' : 'ok',
        actionLabel: scenes.length === 0 ? `${copy.item} 추가` : `${copy.storyboardLabel} 보기`,
      },
      {
        id: 'equipmentPlan',
        label: '장비 / 렌탈',
        detail: !equipmentPlanningReady
          ? '자체 보유·렌탈·구매·대여처·픽업/반납 시간과 백업·미디어·전원 계획 필요'
          : scenesWithoutGear > 0
            ? `${scenesWithoutGear}개 ${copy.itemPlural} 장비 미작성 · 백업·미디어·전원 재확인`
            : '장비, 백업, 미디어, 전원 계획 확인 완료',
        status: equipmentPlanningReady ? 'ok' : 'warning',
        actionLabel: '기술/장비 입력',
      },
      ...(template === 'film' ? [{
        id: 'sceneBreakdown',
        label: '씬 브레이크다운',
        detail: filmBreakdownMissing > 0 ? `${filmBreakdownMissing}개 씬 소품/의상/사운드 미정리` : '소품, 의상, 사운드, 인서트 확인 완료',
        status: filmBreakdownMissing > 0 ? 'warning' : 'ok',
        actionLabel: '촬영표 확인',
      } as const] : []),
      {
        id: 'locationScout',
        label: '로케이션 체크',
        detail: locations.length === 0
          ? '장소 등록 후 체크'
          : locationScoutMissing > 0
            ? `${locationScoutMissing}개 장소 헌팅 체크 미작성`
            : '로케이션 헌팅 체크 완료',
        status: locations.length === 0 || locationScoutMissing > 0 ? 'warning' : 'ok',
        actionLabel: locations.length === 0 ? '장소 추가' : '장소 확인',
      },
      ...(isShortFilmMode ? [{
        id: 'shortFilmPackage',
        label: '단편 제출 패키지',
        detail: shortFilmReadinessSummary.status === 'ok'
          ? '영화제 제출 준비 항목 확인 완료'
          : `필수 ${shortFilmReadinessSummary.critical}개 · 확인 ${shortFilmReadinessSummary.warning}개`,
        status: shortFilmReadinessSummary.status,
        actionLabel: '기획서 확인',
      }] : []),
      {
        id: 'weather',
        label: '야외 날씨 위치',
        detail: locations.length === 0
          ? '야외 장소 등록 후 확인'
          : outdoorWithoutWeather > 0
            ? `야외 장소 ${outdoorWithoutWeather}개 위치 보정 필요`
            : '날씨 조회 위치 확인 완료',
        status: locations.length === 0 || outdoorWithoutWeather > 0 ? 'warning' : 'ok',
        actionLabel: locations.length === 0 ? '장소 추가' : '날씨 위치',
      },
      {
        id: 'duration',
        label: '운영 시간',
        detail: timelineStats.totalMinutes > 0
          ? `${timelineStats.totalMinutes}분 · ${timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '종료 미정'} 종료 예상`
          : '운영 시간이 아직 없습니다',
        status: timelineStats.risk === 'critical' ? 'critical' : timelineStats.risk === 'warning' ? 'warning' : timelineStats.totalMinutes > 0 ? 'ok' : 'warning',
        actionLabel: timelineStats.totalMinutes > 0 ? '촬영표 보기' : '시간 추가',
      },
      {
        id: 'metadata',
        label: '필수 입력',
        detail: scenes.length === 0
          ? `${copy.itemPlural} 등록 후 확인`
          : scenesWithoutLocation || scenesWithoutPeople
            ? `장소 미입력 ${scenesWithoutLocation}개 · 인원 미연결 ${scenesWithoutPeople}개`
            : '필수 입력 확인 완료',
        status: scenesWithoutLocation > 0 ? 'critical' : scenes.length === 0 || scenesWithoutPeople > 0 ? 'warning' : 'ok',
        actionLabel: scenes.length === 0 ? `${copy.item} 추가` : '입력 확인',
      },
    ] satisfies { id: string; label: string; detail: string; status: 'ok' | 'warning' | 'critical'; actionLabel: string }[];
  }, [callSheetStats.missingCallTime, callSheetStats.missingContact, copy.item, copy.itemPlural, copy.storyboardLabel, equipmentPlanningSource.fieldId, equipmentPlanningSource.sectionId, isShortFilmMode, locations, people.length, planning.sections, scenes, shortFilmReadinessSummary.critical, shortFilmReadinessSummary.status, shortFilmReadinessSummary.warning, template, timelineStats.risk, timelineStats.totalMinutes, timelineStats.wrapTime]);

  const readinessSummary = useMemo(() => {
    const critical = readinessChecks.filter((item) => item.status === 'critical').length;
    const warning = readinessChecks.filter((item) => item.status === 'warning').length;
    const ok = readinessChecks.length - critical - warning;
    const status = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'ok';

    return { critical, warning, ok, status };
  }, [readinessChecks]);

  const handleAcknowledgeReadinessCheck = (checkId: string) => {
    setAcknowledgedReadinessCheckIds((current) => current.includes(checkId) ? current : [...current, checkId]);
  };

  const handleUnacknowledgeReadinessCheck = (checkId: string) => {
    setAcknowledgedReadinessCheckIds((current) => current.filter((id) => id !== checkId));
  };

  const handleStartDepartureMode = () => {
    setIsDepartureMode(true);
    requestAnimationFrame(() => {
      const target = document.getElementById(departureChecklistAnchorId);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
    });
  };

  const templateLabel = template === 'event' ? '행사/스케치' : template === 'ad' ? '광고/브랜디드' : template === 'musicvideo' ? '뮤직비디오' : template === 'dance' ? '댄스커버' : '영화/단편';
  const pdfKindLabel = activeTab === 'report' || isReportMode ? '결과 리포트' : copy.scheduleTitle;
  const pdfButtonText = (fallback: string) => isExportingPdf ? 'PDF 생성 중...' : pdfStatus || fallback;
  const hasFilmSampleInsideDance = useMemo(() => (
    template === 'dance' && scenes.some((scene) => {
      const joined = [scene.sceneNumber, scene.location, scene.description, scene.cast].filter(Boolean).join(' ');
      return /S#\d|철수|영희|철수네 거실|아침 식사|강남역 11번 출구/.test(joined);
    })
  ), [scenes, template]);

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
  const applyStoryboardQuickFilter = useCallback((filter: StoryboardQuickFilter) => {
    setSbCategory(filter.category);
    setSbSearch(filter.search);
  }, []);
  const sceneFormMissingFields = [
    !newSceneParams.location.trim() ? '장소' : '',
    !newSceneParams.description.trim() ? copy.descriptionLabel : '',
  ].filter(Boolean);
  const canSaveScene = sceneFormMissingFields.length === 0;

  const editorStoryboardOptions = useMemo(() => {
    const addUnique = (list: typeof storyboardDb, shot?: (typeof storyboardDb)[number]) => {
      if (shot && !list.some((item) => item.id === shot.id)) list.push(shot);
    };

    if (sbSearch.trim() || sbCategory !== 'ALL') {
      return filteredStoryboards.slice(0, 12);
    }

    const starterIds = template === 'event'
      ? ['sb_191', 'sb_192', 'sb_193', 'sb_195', 'sb_197', 'sb_205']
      : template === 'ad'
        ? ['sb_151', 'sb_152', 'sb_155', 'sb_156', 'sb_160', 'sb_165']
        : template === 'musicvideo'
          ? ['sb_10', 'sb_75', 'sb_108', 'sb_151', 'sb_164', 'sb_171']
        : template === 'dance'
          ? ['sb_171', 'sb_172', 'sb_173', 'sb_177', 'sb_181', 'sb_190']
          : ['sb_06', 'sb_08', 'sb_15', 'sb_67', 'sb_70', 'sb_123'];

    const compactList: typeof storyboardDb = [];
    addUnique(compactList, selectedStoryboard);
    recommendations.forEach((shot) => addUnique(compactList, shot));
    starterIds.forEach((id) => addUnique(compactList, storyboardDb.find((shot) => shot.id === id)));

    return compactList.slice(0, 8);
  }, [filteredStoryboards, recommendations, sbCategory, sbSearch, selectedStoryboard, template]);

  const featuredStoryboards = useMemo(() => {
    const ids = template === 'event'
      ? ['sb_191', 'sb_192', 'sb_193', 'sb_195', 'sb_196', 'sb_197', 'sb_198', 'sb_200', 'sb_205', 'sb_206', 'sb_209', 'sb_210']
      : template === 'ad'
        ? ['sb_151', 'sb_152', 'sb_153', 'sb_154', 'sb_155', 'sb_156', 'sb_160', 'sb_162', 'sb_164', 'sb_165', 'sb_168', 'sb_170']
        : template === 'musicvideo'
          ? ['sb_10', 'sb_46', 'sb_75', 'sb_86', 'sb_108', 'sb_151', 'sb_152', 'sb_159', 'sb_164', 'sb_168', 'sb_171', 'sb_190']
        : template === 'dance'
          ? ['sb_171', 'sb_172', 'sb_173', 'sb_174', 'sb_175', 'sb_176', 'sb_177', 'sb_178', 'sb_181', 'sb_183', 'sb_188', 'sb_190']
          : ['sb_01', 'sb_06', 'sb_08', 'sb_10', 'sb_15', 'sb_46', 'sb_67', 'sb_70', 'sb_75', 'sb_76', 'sb_86', 'sb_123'];

    return ids
      .map((id) => storyboardDb.find((shot) => shot.id === id))
      .filter((shot): shot is (typeof storyboardDb)[number] => Boolean(shot));
  }, [template]);

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

  const scheduleIssueOptions: Array<{ id: ScheduleIssueFilter; label: string; count: number }> = [
    { id: 'all', label: '전체 점검', count: activeDayScenes.length },
    { id: 'missingLocation', label: '장소 미정', count: activeDayScenes.filter((scene) => !scene.location.trim() || scene.location === '장소 미정').length },
    { id: 'missingStoryboard', label: template === 'event' ? '샷 플랜 없음' : isMusicTimelineTemplate ? '레퍼런스 없음' : '콘티 없음', count: activeDayScenes.filter((scene) => !scene.visualRef).length },
    { id: 'missingPeople', label: template === 'event' ? '담당 미정' : template === 'ad' ? '모델/스태프 미정' : template === 'musicvideo' ? '아티스트/포커스 미정' : template === 'dance' ? '멤버/포커스 미정' : '출연진 미정', count: activeDayScenes.filter((scene) => !scene.cast?.trim() && !scene.focusMember?.trim()).length },
    { id: 'missingDuration', label: '시간 미정', count: activeDayScenes.filter((scene) => !scene.estimatedMinutes || scene.estimatedMinutes <= 0).length },
  ];

  const isScheduleFiltered = Boolean(scheduleSearch.trim()) || scheduleStatusFilter !== 'all' || scheduleLocationFilter !== 'all' || scheduleIssueFilter !== 'all';

  const filteredTimelineRows = useMemo(() => {
    const normalizedSearch = scheduleSearch.trim().toLowerCase();

    return timelineRows.filter((row) => {
      if (row.type === 'break') {
        const breakLocation = locations.find((item) => item.id === row.breakItem.locationId)?.name || '';
        const matchesLocation = scheduleLocationFilter === 'all' || row.breakItem.locationId === scheduleLocationFilter;
        const haystack = [row.breakItem.label, breakLocation, row.breakItem.type].join(' ').toLowerCase();
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

        return scheduleStatusFilter === 'all' && scheduleIssueFilter === 'all' && matchesLocation && matchesSearch;
      }

      const scene = row.scene;
      const status = scene.status || 'pending';
      const matchesStatus = scheduleStatusFilter === 'all' || status === scheduleStatusFilter;
      const matchesIssue = scheduleIssueFilter === 'all'
        || (scheduleIssueFilter === 'missingLocation' && (!scene.location.trim() || scene.location === '장소 미정'))
        || (scheduleIssueFilter === 'missingStoryboard' && !scene.visualRef)
        || (scheduleIssueFilter === 'missingPeople' && !scene.cast?.trim())
        || (scheduleIssueFilter === 'missingDuration' && (!scene.estimatedMinutes || scene.estimatedMinutes <= 0));
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

      return matchesStatus && matchesIssue && matchesLocation && matchesSearch;
    });
  }, [locations, scheduleIssueFilter, scheduleLocationFilter, scheduleSearch, scheduleStatusFilter, timelineRows]);

  const filteredSceneCount = filteredTimelineRows.filter((row) => row.type === 'scene').length;
  const mobileFieldFocus = useMemo(() => {
    const focusRow = timelineRows.find((row) => row.type === 'scene' && (row.scene.status || 'pending') !== 'done')
      || timelineRows.find((row) => row.type === 'scene');
    const focusRowIndex = focusRow ? timelineRows.findIndex((row) => row.id === focusRow.id) : -1;
    const nextBreak = focusRowIndex >= 0
      ? timelineRows.slice(focusRowIndex + 1).find((row) => row.type === 'break')
      : undefined;

    return {
      scene: focusRow?.type === 'scene' ? focusRow.scene : undefined,
      rowNumber: focusRowIndex >= 0 ? timelineRows.slice(0, focusRowIndex + 1).filter((row) => row.type === 'scene').length : undefined,
      nextBreakLabel: nextBreak?.type === 'break' ? `다음 시간 블록: ${nextBreak.breakItem.label}` : undefined,
    };
  }, [timelineRows]);

  const resetScheduleFilters = () => {
    setScheduleSearch('');
    setScheduleStatusFilter('all');
    setScheduleIssueFilter('all');
    setScheduleLocationFilter('all');
  };

  const handleEnableReportMode = () => {
    setIsReportMode(true);
    resetScheduleFilters();
    setActiveTab('schedule');
    requestAnimationFrame(() => {
      document.getElementById('schedule-report-checkpoint')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleGoSchedule = () => {
    resetScheduleFilters();
    setActiveTab('schedule');
  };

  const cueSheetNeedsReference = (row: CueSheetRow) => {
    if (template === 'event') return false;
    if (template === 'dance' || template === 'musicvideo') return !row.reference || !row.shotSize || !row.focus;
    return !row.reference;
  };

  const handleApplyCueSheetRecommendedReference = () => {
    const targetRow = cueSheetRows.find((row) => row.source === 'scene' && cueSheetNeedsReference(row));
    const targetScene = targetRow ? activeDayScenes.find((scene) => scene.id === targetRow.id) : undefined;
    if (!targetRow || !targetScene) {
      handleGoSchedule();
      return;
    }

    const query = [
      targetScene.description,
      targetScene.location,
      targetScene.cast,
      targetScene.focusMember,
      targetScene.shotSize,
      targetScene.choreoNote,
      targetScene.cameraGear,
      targetScene.lightingNote,
      targetScene.clientMemo,
      targetScene.props,
      targetScene.costume,
      targetScene.specialInstruction,
    ].filter(Boolean).join(' ');
    const recommendedShot = recommendShots(query)[0];
    const visualRef = targetScene.visualRef || recommendedShot?.url || getAutoStoryboardUrl(targetScene);

    updateScene(targetScene.id, {
      visualRef,
      ...(template === 'dance' || template === 'musicvideo' ? {
        shotSize: targetScene.shotSize || 'FS',
        focusMember: targetScene.focusMember || targetScene.cast || (template === 'musicvideo' ? '아티스트' : '센터'),
      } : {}),
    });
    setCueSheetStatus(`${targetRow.sequenceLabel}에 추천 ${copy.storyboardLabel}을 연결했습니다.`);
    window.setTimeout(() => setCueSheetStatus(''), 2600);
    setActiveTab('schedule');
    setScheduleIssueFilter('missingStoryboard');
    requestAnimationFrame(() => document.getElementById('schedule-timeline-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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

  const buildPlanningPrompt = () => {
    const sectionText = planningSections.map((section) => {
      const fields = section.fields
        .map((field) => `- ${field.label}: ${getPlanningFieldValue(section.id, field.id) || '(미입력)'}`)
        .join('\n');
      return `## ${section.title}\n${fields}`;
    }).join('\n\n');

    return [
      `프로젝트 유형: ${templateLabel}`,
      template === 'film' ? `작품 포맷: ${planningProjectFormatLabel}` : '',
      `제작 규모: ${planningScaleLabel}`,
      `기획 기준 문서: ${planningFoundations.join(', ')}`,
      `운용 원칙: ${planningPlaybook.join(' / ')}`,
      `프로젝트명: ${planning.projectTitle || '(미정)'}`,
      `목적: ${planning.purpose || '(미정)'}`,
      `한 줄 기획: ${planning.oneLiner || '(미정)'}`,
      `타깃: ${planning.audience || '(미정)'}`,
      `핵심 메시지: ${planning.coreMessage || '(미정)'}`,
      '',
      sectionText,
      '',
      template === 'film'
        ? '요청: 위 내용을 단편영화까지 대응 가능한 프로덕션 기획안으로 정리하고, 러닝타임/영화제 제출 패키지/권리 클리어런스/상영 납품/촬영 리스크/스케줄 변환 후보를 한국어로 제안해줘.'
        : '요청: 위 내용을 촬영 가능한 프로덕션 기획안으로 정리하고, 하이엔드 기준의 누락 항목/저예산 압축안/촬영 리스크/스케줄 변환 후보를 한국어로 제안해줘.',
    ].filter(Boolean).join('\n');
  };

  const handleCopyPlanningPrompt = async () => {
    const prompt = buildPlanningPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setPlanningAiStatus('프롬프트 복사됨');
    } catch {
      window.prompt('기획 프롬프트', prompt);
      setPlanningAiStatus('프롬프트 생성됨');
    }
    window.setTimeout(() => setPlanningAiStatus(''), 2200);
  };

  const handleClearPlanningApiKey = () => {
    try {
      window.localStorage.removeItem('prepro-planning-ai-settings');
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
    setPlanningAiSettings((current) => ({ ...current, apiKey: '', rememberKey: false }));
    setPlanningAiStatus('이 브라우저에 저장된 API 키를 삭제했습니다.');
    window.setTimeout(() => setPlanningAiStatus(''), 2600);
  };

  const handleTestPlanningAiConnection = async () => {
    if (!planningAiSettings.apiKey.trim()) {
      setPlanningAiStatus('API 키를 입력한 뒤 연결 테스트를 실행하세요.');
      window.setTimeout(() => setPlanningAiStatus(''), 2400);
      return;
    }

    setIsPlanningAiTesting(true);
    setPlanningAiStatus('연결 테스트 중... API 키는 이 요청에만 전달됩니다.');

    try {
      const response = await fetch('/api/planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          planning,
          prompt: '연결 테스트입니다. 한국어로 한 문장만 답하세요: 연결 확인 완료.',
          settings: {
            provider: planningAiSettings.provider,
            apiKey: planningAiSettings.apiKey,
            model: planningAiSettings.model,
            baseUrl: planningAiSettings.baseUrl,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '연결 테스트 실패');
      setPlanningAiStatus('연결 확인 완료. 이제 앱 안에서 AI 정리를 실행할 수 있습니다.');
    } catch (error) {
      console.error(error);
      setPlanningAiStatus(error instanceof Error ? error.message : '연결 테스트 실패');
    } finally {
      setIsPlanningAiTesting(false);
      window.setTimeout(() => setPlanningAiStatus(''), 3400);
    }
  };

  const handleGeneratePlanningAi = async () => {
    if (!planningAiSettings.apiKey.trim()) {
      setPlanningAiStatus('API 키 필요');
      window.setTimeout(() => setPlanningAiStatus(''), 2200);
      return;
    }

    setIsPlanningAiRunning(true);
    setPlanningAiStatus('AI 기획 정리 중... API 키는 이 요청에만 전달됩니다.');

    try {
      const response = await fetch('/api/planning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          planning,
          prompt: buildPlanningPrompt(),
          settings: {
            provider: planningAiSettings.provider,
            apiKey: planningAiSettings.apiKey,
            model: planningAiSettings.model,
            baseUrl: planningAiSettings.baseUrl,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI 기획 생성 실패');

      updatePlanning({
        aiDraft: result.content,
        aiUpdatedAt: new Date().toISOString(),
      });
      setPlanningAiStatus('AI 기획 정리 완료');
    } catch (error) {
      console.error(error);
      setPlanningAiStatus(error instanceof Error ? error.message : 'AI 요청 실패');
    } finally {
      setIsPlanningAiRunning(false);
      window.setTimeout(() => setPlanningAiStatus(''), 3200);
    }
  };

  const handlePlanningToSchedule = () => {
    if (planningScheduleLines.length === 0) {
      setPlanningAiStatus(`${planningScheduleLabel[template]} 입력 필요`);
      window.setTimeout(() => setPlanningAiStatus(''), 2200);
      return;
    }

    const fallbackLocation = locations[0];
    const sceneDrafts: AnalyzedScene[] = planningScheduleLines.map((line, index) => {
      const base = {
        dayId: activeDay.id,
        location: fallbackLocation?.name || location || '장소 미정',
        locationId: fallbackLocation?.id || undefined,
        description: line,
        estimatedMinutes: template === 'event' ? 30 : template === 'ad' ? 45 : template === 'musicvideo' ? 35 : template === 'dance' ? 12 : 60,
        cast: '',
        visualRef: template === 'event' ? '/shot_141.png' : template === 'ad' ? '/shot_136.png' : template === 'musicvideo' ? '/shot_10.png' : template === 'dance' ? '/shot_171.png' : '/shot_15.png',
      };

      if (template === 'event') {
        return {
          ...base,
          eventSection: line.split(/[-:]/)[0]?.trim() || `프로그램 ${index + 1}`,
          cameraGear: '현장 스케치 / B-roll',
        };
      }

      if (template === 'dance') {
        const coverageMode = getPlanningFieldValue('camera', 'coverageMode');
        const insertPlan = getPlanningFieldValue('camera', 'insertPlan');
        const timeMatch = line.match(/(\d{1,2}:\d{2})/);
        return {
          ...base,
          sceneNumber: `D#${index + 1}`,
          musicCue: timeMatch?.[1] || '',
          lyrics: line.replace(/^\s*\d{1,2}:\d{2}\s*/, '').split(/[-–—]/)[0]?.trim() || line,
          choreoNote: insertPlan ? `${line} / 인서트: ${insertPlan}` : line,
          shotSize: line.match(/\b(CS|FS|LS|MS|CU|WS)\b/i)?.[1]?.toUpperCase() || 'FS',
          focusMember: '',
          cameraGear: coverageMode || getPlanningFieldValue('camera', 'shotLanguage') || '기본 사이즈별 촬영 + 부족한 인서트 추가',
        };
      }

      if (template === 'musicvideo') {
        const coveragePlan = getPlanningFieldValue('production', 'coveragePlan');
        const shotLanguage = getPlanningFieldValue('visual', 'shotLanguage');
        const timeMatch = line.match(/(\d{1,2}:\d{2})/);
        return {
          ...base,
          sceneNumber: `MV#${index + 1}`,
          musicCue: timeMatch?.[1] || '',
          lyrics: line.replace(/^\s*\d{1,2}:\d{2}\s*/, '').split(/[-–—]/)[0]?.trim() || line,
          choreoNote: line,
          shotSize: line.match(/\b(CS|FS|LS|MS|CU|ECU|WS)\b/i)?.[1]?.toUpperCase() || 'CU',
          focusMember: '아티스트',
          cameraGear: coveragePlan || shotLanguage || '립싱크 안전본 + 퍼포먼스 + B-roll 인서트',
        };
      }

      return {
        ...base,
        sceneNumber: `${template === 'ad' ? 'C' : 'S'}#${index + 1}`,
        intExt: 'INT' as const,
        dayNight: 'DAY' as const,
        cutCount: template === 'ad' ? 6 : 4,
        pageCount: template === 'film' ? 1 : undefined,
        lightingNote: template === 'ad' ? getPlanningFieldValue('creative', 'tone') : undefined,
        clientMemo: template === 'ad' ? getPlanningFieldValue('brief', 'usp') : undefined,
      };
    });

    addScenes(sceneDrafts);
    setOptimizationSummary(null);
    setActiveTab('schedule');
    setPlanningAiStatus(`${sceneDrafts.length}개 항목을 스케줄에 추가`);
    window.setTimeout(() => setPlanningAiStatus(''), 2600);
  };

  const handleRefreshCueSheetDraft = () => {
    const message = cueSheetRows.length > 0
      ? `${cueSheetRows.length}개 큐를 ${cueSheetSourceLabel} 기준으로 정리했습니다.`
      : `${planningScheduleLabel[template]}를 먼저 입력하거나 촬영표에 항목을 추가하세요.`;
    setCueSheetStatus(message);
    window.setTimeout(() => setCueSheetStatus(''), 2600);
  };

  const handleApplyCueSheetDraft = () => {
    if (!cueSheetCanApplyDraft) {
      setCueSheetStatus(cueSheetSceneRows.length > 0 ? '이미 촬영표 기준 큐시트입니다.' : `${planningScheduleLabel[template]} 입력 필요`);
      window.setTimeout(() => setCueSheetStatus(''), 2400);
      return;
    }
    handlePlanningToSchedule();
  };

  const handleExportPDF = async () => {
    if (isExportingPdf) return;

    const target = activeTab === 'report'
      ? reportPdfRef.current
      : activeTab === 'people'
        ? callSheetPdfRef.current
        : activeTab === 'cueSheet'
          ? cueSheetPdfRef.current
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
        scale: 2,
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

      const pageCount = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setFontSize(7);
        pdf.setTextColor(130, 130, 130);
        pdf.text(
          `Created with PrePro Studio · ${format(new Date(), 'yyyy-MM-dd')}`,
          pageWidth - 6,
          pageHeight - 4,
          { align: 'right' },
        );
      }

      const mode = activeTab === 'report' || isReportMode ? 'report' : activeTab === 'people' ? 'callsheet' : activeTab === 'cueSheet' ? 'cue-sheet' : 'schedule';
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
    const backup: ProjectBackupFile = {
      schema: 'prepro-studio-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      project: createProjectSnapshot(),
      meta: {
        isSampleProject: Boolean(sampleProjectNotice),
        sampleProjectNotice,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrePro_Studio_${template}_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFileStatus('백업 저장됨');
    window.setTimeout(() => setFileStatus(''), 2200);
  };

  const createProjectSnapshot = (): ProjectSnapshot => {
    const state = useScheduleStore.getState();

    return {
      template: state.template,
      shootingDate: state.shootingDate,
      location: state.location,
      weatherLabel: state.weatherLabel,
      weatherLatitude: state.weatherLatitude,
      weatherLongitude: state.weatherLongitude,
      callTime: state.callTime,
      shootingStartTime: state.shootingStartTime,
      days: state.days,
      locations: state.locations,
      people: state.people,
      breaks: state.breaks,
      scenes: state.scenes,
      timelineOrder: state.timelineOrder,
      planning: state.planning,
      sampleProjectNotice: state.sampleProjectNotice,
    };
  };

  const handleCopyShareLink = async () => {
    const snapshot = createProjectSnapshot();
    const encoded = encodeShareSnapshot(snapshot);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('tab', activeTab);
    shareUrl.hash = `prepro=${encoded}`;
    const urlText = shareUrl.toString();
    const shareTitle = 'PrePro Studio';
    const shareSummary = `${templateLabel} 제작용 프리프로덕션 보드`;
    const shareCopy = [
      `${shareTitle} - ${shareSummary}`,
      '기획서, 촬영표, 콜시트, 장소/날씨, 콘티, 예산, 리포트까지 한 번에 정리합니다.',
      '무로그인 로컬 저장 + BYOK AI 방식이라 작은 팀도 바로 쓸 수 있습니다.',
      urlText,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(shareCopy);
      setShareStatus(urlText.length > 7000 ? '긴 공유문구 복사됨' : '공유문구 복사됨');
    } catch {
      window.prompt('공유 링크', shareCopy);
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
        const imported = readImportedProject(json);
        importData(imported.project);
        setOptimizationSummary(null);
        setSampleProjectNotice(imported.sampleProjectNotice || '');
        setAcknowledgedReadinessCheckIds([]);
        setFileStatus(imported.sampleProjectNotice ? '샘플 백업 복원됨' : '백업 복원됨');
        window.setTimeout(() => setFileStatus(''), 2200);
      } catch {
        setFileStatus('복원 실패 · JSON 백업 파일을 확인하세요');
        window.setTimeout(() => setFileStatus(''), 3200);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    let restoreTimer: number | null = null;

    try {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      const savedTab = window.localStorage.getItem(activeTabStorageKey);
      const nextTab = isMainWorkspaceTab(urlTab) ? urlTab : isMainWorkspaceTab(savedTab) ? savedTab : null;

      if (nextTab) {
        restoreTimer = window.setTimeout(() => {
          setActiveTab(nextTab);
          activeTabRestoredRef.current = true;
        }, 0);
      } else {
        activeTabRestoredRef.current = true;
      }
    } catch {
      // URLSearchParams/localStorage can be unavailable in restricted contexts.
      activeTabRestoredRef.current = true;
    }

    return () => {
      if (restoreTimer) window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    if (!activeTabRestoredRef.current) return;
    try {
      window.localStorage.setItem(activeTabStorageKey, activeTab);
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('prepro-planning-ai-settings');
      if (!saved) {
        planningAiSettingsLoadedRef.current = true;
        return;
      }
      const parsed = JSON.parse(saved) as Partial<PlanningAiSettings>;
      window.setTimeout(() => {
        setPlanningAiSettings({
          ...defaultPlanningAiSettings,
          ...parsed,
          apiKey: parsed.apiKey || '',
          rememberKey: Boolean(parsed.apiKey),
        });
        planningAiSettingsLoadedRef.current = true;
      }, 0);
    } catch {
      window.localStorage.removeItem('prepro-planning-ai-settings');
      planningAiSettingsLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!planningAiSettingsLoadedRef.current) return;
    try {
      if (planningAiSettings.rememberKey && planningAiSettings.apiKey.trim()) {
        window.localStorage.setItem('prepro-planning-ai-settings', JSON.stringify(planningAiSettings));
      } else {
        window.localStorage.removeItem('prepro-planning-ai-settings');
      }
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }, [planningAiSettings]);

  useEffect(() => {
    if (shareImportCheckedRef.current) return;
    shareImportCheckedRef.current = true;

    const snapshot = readSnapshotFromHash();
    if (!snapshot) return;

    if (confirm('공유 스냅샷을 현재 프로젝트로 불러올까요?')) {
      window.setTimeout(() => {
        const sharedTab = new URLSearchParams(window.location.search).get('tab');
        importData(snapshot);
        setActiveTab(isMainWorkspaceTab(sharedTab) ? sharedTab : 'schedule');
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

  const ensureScheduleStartTime = () => {
    if (activeShootingStartTime) return;

    const firstShotTime = new Date(activeShootingDate);
    firstShotTime.setHours(9, 0, 0, 0);

    if (activeDay.id !== 'default-day') {
      updateShootDay(activeDay.id, { firstShotTime });
    } else {
      setShootingStartTime(firstShotTime);
    }
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
    setCustomImageStatus('');
  };

  const openNewSceneForm = () => {
    setEditingScene(null);
    setNewSceneParams(getDefaultSceneFormState());
    setCustomImageStatus('');
    setShowSceneForm(true);
    setActiveTab('schedule');
    requestAnimationFrame(() => document.getElementById('scene-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const openScriptAnalyzer = () => {
    setActiveTab('schedule');
    setShowAnalyzer(true);
    requestAnimationFrame(() => document.getElementById('script-analyzer-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const applyStoryboardToSceneForm = (shot: (typeof storyboardDb)[number], shouldOpenForm = false) => {
    if (shouldOpenForm) {
      setEditingScene(null);
      setShowSceneForm(true);
      setActiveTab('schedule');
    }

    setNewSceneParams((current) => {
      const defaults = getDefaultSceneFormState();
      const hasDraft = Boolean(
        current.location.trim() ||
        current.description.trim() ||
        current.visualRef ||
        current.sceneNumber.trim() ||
        current.eventSection.trim(),
      );
      const base = hasDraft ? current : defaults;

      return {
        ...base,
        location: current.location || defaults.location,
        locationId: current.locationId || defaults.locationId,
        description: current.description || `${shot.name} 기반 ${template === 'event' ? '커버리지' : template === 'ad' ? '광고 컷' : template === 'musicvideo' ? 'MV 구간' : template === 'dance' ? '댄스 구간' : '씬'} 구성`,
        estimatedMinutes: current.estimatedMinutes || defaults.estimatedMinutes,
        visualRef: shot.url,
      };
    });

    if (shouldOpenForm) {
      requestAnimationFrame(() => document.getElementById('scene-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const getAutoStoryboardUrl = (scene: AnalyzedScene) => {
    if (scene.visualRef) return scene.visualRef;

    const storyboardQuery = [
      scene.description,
      scene.location,
      scene.cast,
      scene.props,
      scene.costume,
      scene.soundNote,
      scene.specialInstruction,
      scene.insertNote,
      scene.continuityNote,
    ].filter(Boolean).join(' ');
    const recommendedShot = recommendShots(storyboardQuery)[0];

    if (recommendedShot) return recommendedShot.url;
    if (/눈|손|시계|휴대폰|망치|프린터|꺼내|부수|소품|인서트|디테일/.test(storyboardQuery)) return '/shot_76.png';
    if (/얼굴|표정|눈물|분노|비명|감정|바라보/.test(storyboardQuery)) return '/shot_08.png';
    return '/shot_15.png';
  };

  const attachAutoStoryboards = (items: AnalyzedScene[]) => {
    const isManualScript = items.some((scene) => manualScriptPattern.test([
      scene.description,
      scene.location,
      scene.cast,
      scene.props,
      scene.costume,
      scene.soundNote,
      scene.specialInstruction,
      scene.insertNote,
      scene.continuityNote,
    ].filter(Boolean).join(' ')));

    return items.map((scene, index) => ({
      ...scene,
      visualRef: (isManualScript ? manualStoryboardUrls[Math.min(index, manualStoryboardUrls.length - 1)] : '')
        || scene.visualRef
        || getAutoStoryboardUrl(scene),
    }));
  };

  const handleCustomStoryboardUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCustomImageStatus('이미지 파일만 가능합니다.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCustomImageStatus('8MB 이하 이미지만 업로드할 수 있습니다.');
      return;
    }

    setCustomImageStatus('이미지 정리 중...');

    const reader = new FileReader();
    reader.onerror = () => setCustomImageStatus('이미지를 읽지 못했습니다.');
    reader.onload = () => {
      const source = String(reader.result || '');
      const img = new window.Image();

      img.onerror = () => setCustomImageStatus('지원하지 않는 이미지입니다.');
      img.onload = () => {
        const maxWidth = 1280;
        const maxHeight = 720;
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          setNewSceneParams((current) => ({ ...current, visualRef: source }));
          setCustomImageStatus('원본 이미지가 연결되었습니다.');
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setNewSceneParams((current) => ({ ...current, visualRef: dataUrl }));
        setCustomImageStatus('내 이미지가 연결되었습니다.');
      };

      img.src = source;
    };

    reader.readAsDataURL(file);
  };

  const finishSampleDataLoad = () => {
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
    setSampleProjectNotice(`${templateLabel} 샘플 데이터`);
    resetSceneForm();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const handleLoadSampleData = (askConfirm = true) => {
    if (askConfirm && !confirm(`${template === 'event' ? '행사' : template === 'ad' ? '광고' : template === 'musicvideo' ? '뮤직비디오' : template === 'dance' ? '댄스커버' : '단편영화'} 샘플 데이터를 로드하시겠습니까?`)) return;

    setAcknowledgedReadinessCheckIds([]);
    loadSampleData();
    finishSampleDataLoad();
  };

  const handleResetProject = () => {
    setSampleProjectNotice('');
    setAcknowledgedReadinessCheckIds([]);
    resetProject();
  };

  const promoteSampleProject = () => {
    setSampleProjectNotice('');
    setFileStatus('샘플을 내 프로젝트로 전환');
    window.setTimeout(() => setFileStatus(''), 2200);
  };

  const openSceneEditor = (scene: Scene) => {
    setEditingScene(scene);
    setCustomImageStatus('');
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
      musicCue: scene.musicCue || '',
      lyrics: scene.lyrics || '',
      choreoNote: scene.choreoNote || '',
      focusMember: scene.focusMember || '',
      shotSize: scene.shotSize || '',
      formation: scene.formation || '',
      props: scene.props || '',
      costume: scene.costume || '',
      soundNote: scene.soundNote || '',
      specialInstruction: scene.specialInstruction || '',
      insertNote: scene.insertNote || '',
      continuityNote: scene.continuityNote || '',
      takeNote: scene.takeNote || '',
      lensNote: scene.lensNote || '',
      slateNote: scene.slateNote || '',
    });
    setShowSceneForm(true);
    setActiveTab('schedule');
    requestAnimationFrame(() => document.getElementById('scene-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleSaveScene = () => {
    const trimmedDescription = newSceneParams.description.trim();
    const trimmedLocation = newSceneParams.location.trim();
    if (!trimmedDescription || !trimmedLocation) return;
    if (trimmedLocation !== '장소 미정' && (!location || location === 'Seoul')) {
      setLocation(trimmedLocation);
    }
    const matchedLocation = locations.find((item) => item.id === newSceneParams.locationId || sameText(item.name, trimmedLocation));
    const scenePayload: AnalyzedScene = {
      ...newSceneParams,
      location: trimmedLocation,
      description: trimmedDescription,
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

  const addQuickBreak = (preset: QuickBreakPreset) => {
    const fallbackLocationId = activeDayScenes[0]?.locationId || locations[0]?.id;
    const newBreakId = addBreak({
      dayId: activeDay.id,
      type: preset.type,
      label: preset.label,
      estimatedMinutes: preset.estimatedMinutes,
      locationId: fallbackLocationId,
    });

    if (preset.placement === 'before-first-scene') {
      const currentDayIds = timelineRows.map((row) => row.id);
      const firstSceneIndex = timelineRows.findIndex((row) => row.type === 'scene');
      const insertIndex = firstSceneIndex >= 0 ? firstSceneIndex : 0;
      const currentDayIdSet = new Set(currentDayIds);
      const nextDayIds = [
        ...currentDayIds.slice(0, insertIndex),
        newBreakId,
        ...currentDayIds.slice(insertIndex),
      ];
      const nextOrder: string[] = [];
      let insertedCurrentDay = false;

      timelineOrder.forEach((id) => {
        if (currentDayIdSet.has(id)) {
          if (!insertedCurrentDay) {
            nextOrder.push(...nextDayIds);
            insertedCurrentDay = true;
          }
          return;
        }
        nextOrder.push(id);
      });

      if (!insertedCurrentDay) nextOrder.push(...nextDayIds);
      restoreTimelineOrder(nextOrder);
    }

    setOptimizationSummary(null);
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

  const handleTemplateChange = (nextTemplate: TemplateType) => {
    if (nextTemplate === template) return;
    if (scenes.length > 0) {
      const keepGoing = confirm('제작 유형을 바꾸면 기존 일정 데이터는 유지되지만 입력 폼과 표시 컬럼이 해당 유형 기준으로 바뀝니다. 계속 바꿀까요?');
      if (!keepGoing) return;
    }
    setAcknowledgedReadinessCheckIds([]);
    setTemplate(nextTemplate);
  };

  const activeStep = useMemo(() => {
    if (scenes.length > 0) return 3;
    if (newSceneParams.location || newSceneParams.description || activeShootingStartTime) return 2;
    return 1;
  }, [activeShootingStartTime, newSceneParams.description, newSceneParams.location, scenes.length]);

  const workflowSteps = [
    { id: 1, label: workspaceLanguage.workflowSetupLabel, detail: location || workspaceLanguage.setupFallback },
    { id: 2, label: workspaceLanguage.workflowBuildLabel, detail: copy.modeLabel },
    { id: 3, label: workspaceLanguage.workflowConfirmLabel, detail: `${scenes.length}개 ${copy.itemPlural}` },
  ];
  const dashboardMetrics = [
    { label: copy.totalItemLabel, value: `${scenes.length}` },
    { label: '촬영일', value: `${Math.max(days.length, 1)}` },
    { label: copy.pageLabel, value: template === 'event' ? `${reportStats.totalMinutes}분` : template === 'ad' ? `${reportStats.cutCount || scenes.length}` : (reportStats.pageCount ? reportStats.pageCount.toFixed(1) : '-') },
    { label: `Day ${activeDayIndex + 1} 운영`, value: `${timelineStats.totalMinutes}분` },
    { label: '예상 종료', value: timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '-' },
    { label: '장소', value: `${locations.length}` },
    { label: copy.peopleLabel, value: `${reportStats.castCount}` },
    { label: '스태프', value: `${reportStats.crewCount}` },
  ];
  const gettingStartedCards = [
    {
      label: template === 'film' ? '대본이 있어요' : '자료가 있어요',
      detail: template === 'film' ? '시나리오, PDF, 샷리스트를 넣으면 씬·장소·인물 초안으로 바로 시작합니다.' : workspaceLanguage.gettingStarted.analyzer,
      Icon: Brain,
      action: openScriptAnalyzer,
      tone: 'primary',
    },
    {
      label: '직접 입력하기',
      detail: workspaceLanguage.gettingStarted.manual,
      Icon: Plus,
      action: openNewSceneForm,
      tone: 'neutral',
    },
    {
      label: '기획부터 정리하기',
      detail: workspaceLanguage.gettingStarted.planning,
      Icon: FileText,
      action: () => {
        setActiveTab('planning');
        requestAnimationFrame(() => document.getElementById('planning-workspace-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      },
      tone: 'neutral',
    },
    {
      label: '샘플로 둘러보기',
      detail: workspaceLanguage.gettingStarted.sample,
      Icon: Database,
      action: () => handleLoadSampleData(false),
      tone: 'neutral',
    },
  ];
  const isFirstRun = scenes.length === 0;
  const showOperationalDashboard = (activeTab === 'schedule' || activeTab === 'report') && !isFirstRun;
  const showEmptyScheduleGuide = activeTab === 'schedule' && isFirstRun && !showSceneForm && !showAnalyzer && extractedScenes.length === 0;
  const workspaceQuickActions: Array<{
    id: string;
    label: string;
    detail: string;
    Icon: typeof Plus;
    disabled?: boolean;
    tone?: 'primary' | 'neutral' | 'amber' | 'green';
  }> = activeTab === 'planning'
    ? [
        { id: 'planning-api-settings', label: 'AI/API 설정', detail: planningAiSettings.apiKey.trim() ? '키 입력됨' : 'BYOK 연결', Icon: KeyRound, tone: 'primary' },
        { id: 'planning-ai', label: 'AI 기획 정리', detail: planningAiSettings.apiKey.trim() ? '앱 안에서 처리' : 'API 키 필요', Icon: Wand2, disabled: isPlanningAiRunning || !planningAiSettings.apiKey.trim(), tone: 'neutral' },
        { id: 'planning-to-schedule', label: '스케줄 초안 추가', detail: `${planningScheduleLines.length}개 후보`, Icon: ArrowRight, disabled: planningScheduleLines.length === 0, tone: 'green' },
      ]
    : activeTab === 'schedule'
      ? [
          ...(scenes.length > 0 ? [{ id: 'go-storyboard', label: `${copy.storyboardLabel} 연결`, detail: '첫 다음 단계', Icon: ImageIcon, tone: 'primary' as const }] : []),
          { id: 'schedule-add', label: copy.addItem, detail: `Day ${activeDayIndex + 1}에 추가`, Icon: Plus, tone: scenes.length > 0 ? 'neutral' : 'primary' },
          { id: 'schedule-break', label: '시간 추가', detail: '식사, 이동, 리허설', Icon: Clock, tone: 'amber' },
          { id: 'schedule-optimize', label: 'AI 동선 최적화', detail: '장소와 인원 기준', Icon: Sparkles, disabled: activeDayScenes.length < 2, tone: 'neutral' },
          { id: 'export-pdf', label: 'PDF 다운로드', detail: pdfKindLabel, Icon: Download, disabled: isExportingPdf, tone: 'neutral' },
        ]
      : activeTab === 'cueSheet'
        ? [
            { id: 'cue-refresh', label: '자동 초안', detail: cueSheetSourceLabel, Icon: RefreshCw, tone: 'primary' },
            { id: 'cue-apply', label: '촬영표 반영', detail: cueSheetCanApplyDraft ? `${cueSheetRows.length}큐 추가` : '이미 반영됨', Icon: ArrowRight, disabled: !cueSheetCanApplyDraft, tone: 'green' },
            { id: 'export-pdf', label: '큐시트 PDF', detail: `${cueSheetRows.length}큐`, Icon: Download, disabled: isExportingPdf || cueSheetRows.length === 0, tone: 'neutral' },
          ]
      : activeTab === 'locations'
        ? [
            { id: 'location-add', label: '장소 추가', detail: '허가, 담당, 날씨', Icon: MapPin, tone: 'primary' },
            { id: 'project-setup', label: '촬영지 위치 설정', detail: weatherLabel || location || '위치 미정', Icon: Cloud, tone: 'neutral' },
            { id: 'go-schedule', label: '일정으로 이동', detail: `${activeDayScenes.length}개 연결`, Icon: ArrowRight, tone: 'neutral' },
          ]
        : activeTab === 'people'
          ? [
              { id: 'person-add', label: '인원 추가', detail: '출연진, 스태프', Icon: Users, tone: 'primary' },
              { id: 'export-pdf', label: '콜시트 PDF', detail: `${callSheetPeople.length}명`, Icon: Download, disabled: isExportingPdf, tone: 'neutral' },
              { id: 'people-filter-call', label: peopleIssueFilter ? '전체 인원 보기' : '누락 인원 보기', detail: `콜 ${callSheetStats.missingCallTime} · 연락 ${callSheetStats.missingContact}`, Icon: Clock, disabled: callSheetStats.missingCallTime + callSheetStats.missingContact === 0, tone: 'amber' },
            ]
          : activeTab === 'budget'
            ? [
                { id: 'go-schedule', label: '촬영표 확인', detail: `${budgetStats.cutCount}컷 기준`, Icon: Clock, tone: 'neutral' },
                { id: 'person-add', label: '인원 보강', detail: `${people.length}명 반영`, Icon: Users, tone: 'neutral' },
                { id: 'location-add', label: '장소 보강', detail: `${locations.length}곳 반영`, Icon: MapPin, tone: 'neutral' },
              ]
            : activeTab === 'storyboard'
              ? [
                  { id: 'storyboard-apply-featured', label: '추천 샷으로 추가', detail: `${copy.item} 폼에 연결`, Icon: Plus, disabled: featuredStoryboards.length === 0, tone: 'primary' },
                  { id: 'storyboard-gallery', label: '전체 갤러리', detail: `${storyboardDb.length}종`, Icon: ImageIcon, tone: 'primary' },
                  { id: 'schedule-add', label: copy.addItem, detail: `${copy.storyboardLabel} 연결`, Icon: Plus, tone: 'neutral' },
                  { id: 'storyboard-reset', label: '추천 검색 초기화', detail: `${filteredStoryboards.length}개 표시`, Icon: RefreshCw, disabled: sbCategory === 'ALL' && !sbSearch.trim(), tone: 'neutral' },
                ]
              : [
                  { id: 'report-mode', label: '리포트 모드', detail: isReportMode ? '현장 체크 중' : 'Done/NG 체크', Icon: FileText, tone: 'primary' },
                  { id: 'export-pdf', label: '결과 PDF', detail: `${reportStats.completionRate}% 완료`, Icon: Download, disabled: isExportingPdf, tone: 'green' },
                  { id: 'go-schedule', label: '촬영표로 이동', detail: `${reportActionItems.length}개 후속`, Icon: ArrowRight, tone: 'neutral' },
                ];
  const currentWorkspaceTab = mainWorkspaceTabs.find((tab) => tab.id === activeTab);
  const primaryQuickAction = workspaceQuickActions.find((action) => !action.disabled) || workspaceQuickActions[0];
  const secondaryQuickActions = workspaceQuickActions.filter((action) => action.id !== primaryQuickAction?.id);
  const nextFlowTarget = activeTab === 'schedule' && scenes.length === 0
    ? `${copy.item} 추가`
    : workspaceLanguage.nextTargets[activeTab];

  const handleWorkspaceQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'planning-api-settings':
        setPlanningWorkspaceTab('ai');
        break;
      case 'planning-ai':
        setPlanningWorkspaceTab('ai');
        void handleGeneratePlanningAi();
        break;
      case 'planning-to-schedule':
        handlePlanningToSchedule();
        break;
      case 'schedule-add':
        openNewSceneForm();
        break;
      case 'schedule-break':
        openBreakModal();
        break;
      case 'schedule-optimize':
        handleOptimizeSchedule();
        break;
      case 'cue-refresh':
        handleRefreshCueSheetDraft();
        break;
      case 'cue-apply':
        handleApplyCueSheetDraft();
        break;
      case 'location-add':
        openLocationModal();
        break;
      case 'project-setup':
        setShowProjectSetup(true);
        break;
      case 'go-schedule':
        handleGoSchedule();
        break;
      case 'person-add':
        openPersonModal();
        break;
      case 'people-filter-call':
        setPeopleIssueFilter((value) => !value);
        setActiveTab('people');
        break;
      case 'storyboard-apply-featured':
        if (featuredStoryboards[0]) applyStoryboardToSceneForm(featuredStoryboards[0], true);
        break;
      case 'go-storyboard':
        setActiveTab('storyboard');
        requestAnimationFrame(() => document.getElementById('storyboard-workspace-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        break;
      case 'storyboard-gallery':
        setShowGallery(true);
        break;
      case 'storyboard-reset':
        setSbCategory('ALL');
        setSbSearch('');
        break;
      case 'report-mode':
        handleEnableReportMode();
        break;
      case 'export-pdf':
        void handleExportPDF();
        break;
    }
  };

  const handleReadinessAction = (checkId: string) => {
    switch (checkId) {
      case 'schedule':
      case 'sceneBreakdown':
      case 'metadata':
        resetScheduleFilters();
        setActiveTab('schedule');
        if (scenes.length === 0) openNewSceneForm();
        break;
      case 'permit':
      case 'locationScout':
        setActiveTab('locations');
        if (locations.length === 0) openLocationModal();
        break;
      case 'people':
        setActiveTab('people');
        if (people.length === 0) openPersonModal();
        break;
      case 'storyboard':
        if (scenes.length === 0) {
          openNewSceneForm();
        } else {
          setActiveTab('storyboard');
        }
        break;
      case 'equipmentPlan':
        setActiveTab('planning');
        focusPlanningAnchor('details', equipmentPlanningAnchor);
        break;
      case 'shortFilmPackage':
        setActiveTab('planning');
        focusPlanningAnchor('details', 'planning-section-festivalPackage');
        break;
      case 'weather':
        if (locations.length === 0) {
          setActiveTab('locations');
          openLocationModal();
        } else {
          setActiveTab('locations');
          setShowProjectSetup(true);
        }
        break;
      case 'duration':
        resetScheduleFilters();
        setActiveTab('schedule');
        if (timelineStats.totalMinutes === 0) openBreakModal();
        break;
    }
  };

  return (
    <div className="prepro-shell min-h-screen bg-black p-4 font-sans text-white selection:bg-indigo-500/30 md:p-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        <AppHeader
          activeShootingDate={activeShootingDate}
          activeTab={activeTab}
          apiStorageLabel={apiStorageLabel}
          autoSaveLabel={autoSaveLabel}
          fileStatus={fileStatus}
          globalWeatherError={globalWeatherError}
          globalWeatherResults={globalWeatherResults}
          isReportMode={isReportMode}
          isFirstRun={isFirstRun}
          isSearchingGlobalWeather={isSearchingGlobalWeather}
          location={location}
          mainWorkspaceGroups={mainWorkspaceGroups}
          mainWorkspaceTabs={mainWorkspaceTabs}
          shareStatus={shareStatus}
          showProjectSetup={showProjectSetup}
          showProjectSetupActions={!isFirstRun}
          template={template}
          templateLabel={templateLabel}
          weatherLabel={weatherLabel}
          weatherLatitude={weatherLatitude}
          weatherLongitude={weatherLongitude}
          weatherQuickLocations={weatherQuickLocations}
          workspaceLanguage={workspaceLanguage}
          onActiveDayDateChange={handleActiveDayDateChange}
          onCopyShareLink={handleCopyShareLink}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onLoadSampleData={handleLoadSampleData}
          onResetProject={handleResetProject}
          onSearchGlobalWeatherLocation={searchGlobalWeatherLocation}
          onSelectGlobalWeatherLocation={selectGlobalWeatherLocation}
          onSetActiveTab={setActiveTab}
          onSetGlobalWeatherError={setGlobalWeatherError}
          onSetGlobalWeatherResults={setGlobalWeatherResults}
          onSetIsReportMode={setIsReportMode}
          onSetLocation={setLocation}
          onSetShowAnalyzer={setShowAnalyzer}
          onSetShowProjectSetup={setShowProjectSetup}
          onTemplateChange={handleTemplateChange}
          productionTemplateOptions={productionTemplateOptions}
          sameText={sameText}
        />

          {!isFirstRun && (
            <WorkspaceFlowBar
              activeTab={activeTab}
              currentLabel={currentWorkspaceTab?.label}
              nextFlowTarget={nextFlowTarget}
              primaryAction={primaryQuickAction}
              workspaceLanguage={workspaceLanguage}
              onPrimaryAction={handleWorkspaceQuickAction}
              onToggleProjectSetup={() => setShowProjectSetup((value) => !value)}
            />
          )}

          {isFirstRun && activeTab !== 'schedule' && (
            <FirstRunPanel
              addItemLabel={copy.item}
              cards={quickStartProjectCards}
              currentTemplate={template}
              gettingStartedCards={gettingStartedCards}
              workspaceLanguage={workspaceLanguage}
            />
          )}

          {sampleProjectNotice && !isFirstRun && (
            <section className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 md:p-4" data-html2canvas-ignore="true">
              <details className="md:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Sample project</span>
                    <span className="mt-1 block truncate text-sm font-black text-neutral-100">샘플 보기 중 · 내 프로젝트로 쓰기</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-amber-300/25 bg-black/20 px-2.5 py-1 text-[10px] font-black text-amber-100">열기</span>
                </summary>
                <div className="mt-3 border-t border-amber-300/10 pt-3">
                  <p className="text-xs font-bold leading-relaxed text-neutral-500">지금 보고 있는 내용은 {sampleProjectNotice}입니다. 실제 프로젝트로 쓰려면 표시를 지우거나 새로 시작하세요.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={promoteSampleProject} className="prepro-btn prepro-btn--secondary">내 프로젝트로 사용</button>
                    <button type="button" onClick={handleResetProject} className="prepro-btn prepro-btn--quiet">새로 시작</button>
                  </div>
                </div>
              </details>
              <div className="hidden flex-col gap-3 md:flex lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Sample project</div>
                  <p className="mt-1 text-sm font-black text-neutral-100">지금 보고 있는 내용은 {sampleProjectNotice}입니다.</p>
                  <p className="mt-1 text-xs font-bold text-neutral-500">구조를 둘러보는 예시라서 실제 프로젝트로 쓰려면 “내 프로젝트로 사용”을 눌러 표시를 지우거나, 새로 시작하세요.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <button type="button" onClick={promoteSampleProject} className="prepro-btn prepro-btn--secondary">내 프로젝트로 사용</button>
                  <button type="button" onClick={handleResetProject} className="prepro-btn prepro-btn--quiet">새로 시작</button>
                </div>
              </div>
            </section>
          )}
        {showOperationalDashboard && (
          <>
            {isMusicTimelineTemplate && activeTab === 'schedule' && (
              <DanceCoverageBanner stats={danceCoverageStats} template={template} />
            )}

            <ShootDaySelector
              activeDayId={activeDay.id}
              activeDayIndex={activeDayIndex}
              activeShootingDate={activeShootingDate}
              itemPluralLabel={copy.itemPlural}
              projectDays={projectDays}
              scenes={scenes}
              onAddDay={handleAddShootDay}
              onDeleteActiveDay={handleDeleteActiveDay}
              onSelectDay={setActiveDayId}
            />

            <ScheduleDashboardSummary
              activeStep={activeStep}
              activeShootingStartTime={activeShootingStartTime}
              itemPluralLabel={copy.itemPlural}
              metrics={dashboardMetrics}
              timelineStats={timelineStats}
              workflowSteps={workflowSteps}
            />

            <ReadinessChecklist
              checks={readinessChecks}
              acknowledgedCheckIds={acknowledgedReadinessCheckIds}
              departureAnchorId={departureChecklistAnchorId}
              isDepartureMode={isDepartureMode}
              postFirstScenePrompt={scenes.length > 0}
              summary={readinessSummary}
              onAction={handleReadinessAction}
              onAcknowledge={handleAcknowledgeReadinessCheck}
              onStartDepartureMode={handleStartDepartureMode}
              onUnacknowledge={handleUnacknowledgeReadinessCheck}
            />
          </>
        )}

        {/* === MAIN CONTENT === */}
        <main className="space-y-8">
          {!isFirstRun && (
            <CurrentWorkBar
              actions={secondaryQuickActions}
              currentWorkspace={currentWorkspaceTab}
              onAction={handleWorkspaceQuickAction}
            />
          )}

          {/* Ad Slot */}
          {showOperationalDashboard && <AdBanner placement="top_banner" format="auto" />}

          {/* AI Script Analyzer Overlay */}
          {showAnalyzer && (
            <div id="script-analyzer-panel" className="scroll-mt-24 animate-in fade-in zoom-in duration-300">
              <ScriptAnalyzer
                onClose={() => setShowAnalyzer(false)}
                onExtract={(result) => {
                  setExtractedScenes(attachAutoStoryboards(result));
                  requestAnimationFrame(() => document.getElementById('analyzer-result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }}
              />
            </div>
          )}

          <div id="analyzer-result-panel" className="scroll-mt-24">
            <AnalyzerResultPreview
              addResultLabel={copy.addResult}
              analyzerResultLabel={copy.analyzerResult}
              itemPluralLabel={copy.itemPlural}
              scenes={extractedScenes}
              onCancel={() => setExtractedScenes([])}
              onConfirm={() => {
                ensureScheduleStartTime();
                addScenes(extractedScenes.map((scene) => ({ ...scene, dayId: activeDay.id })));
                useScheduleStore.getState().optimizeSchedule(activeDay.id);
                setOptimizationSummary(null);
                resetScheduleFilters();
                setActiveTab('schedule');
                setExtractedScenes([]);
                setShowAnalyzer(false);
                requestAnimationFrame(() => document.getElementById('schedule-timeline-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              }}
            />
          </div>

          {activeTab === 'planning' && (
            <div id="planning-workspace-panel" className="scroll-mt-24">
            <PlanningPanel
              activeWorkspaceTab={planningWorkspaceTab}
              aiDraftReady={Boolean(planning.aiDraft)}
              guideItems={planningApiGuide}
              isPlanningAiRunning={isPlanningAiRunning}
              isPlanningAiTesting={isPlanningAiTesting}
              isShortFilmMode={isShortFilmMode}
              planning={planning}
              planningAiSettings={planningAiSettings}
              planningAiStatus={planningAiStatus}
              planningCheckItems={planningCheckItems}
              planningCompletedChecks={planningCompletedChecks}
              planningCompletion={planningCompletion}
              planningFoundations={planningFoundations}
              planningPendingChecks={planningPendingChecks}
              planningPlaybook={planningPlaybook}
              planningProjectLabel={template === 'film' ? planningProjectFormatLabel : templateLabel}
              planningProjectFormatLabel={planningProjectFormatLabel}
              planningQualityScore={planningQualityScore}
              planningScaleLabel={planningScaleLabel}
              planningScheduleLabel={planningScheduleLabel[template]}
              planningScheduleLines={planningScheduleLines}
              sections={planningSections}
              shortFilmReadinessChecks={shortFilmReadinessChecks}
              shortFilmReadinessSummary={shortFilmReadinessSummary}
              template={template}
              templateLabel={templateLabel}
              getPlanningFieldValue={getPlanningFieldValue}
              onChangePlanning={updatePlanning}
              onClearApiKey={handleClearPlanningApiKey}
              onCopyPrompt={handleCopyPlanningPrompt}
              onFocusAnchor={focusPlanningAnchor}
              onGenerateAi={handleGeneratePlanningAi}
              onPlanningToSchedule={handlePlanningToSchedule}
              onResetPlanning={() => {
                if (confirm('현재 분야 기준으로 기획 내용을 초기화할까요?')) resetPlanning(template);
              }}
              onSetAiSettings={setPlanningAiSettings}
              onSetWorkspaceTab={setPlanningWorkspaceTab}
              onTestConnection={handleTestPlanningAiConnection}
              onUpdatePlanningField={updatePlanningField}
            />
            </div>
          )}

          {activeTab === 'schedule' && showEmptyScheduleGuide && (
            <section className="scroll-mt-24 rounded-3xl border border-neutral-900 bg-neutral-950/80 p-3 md:p-5">
              <div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
                <div>
                  <div className="inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                    Start here
                  </div>
                  <h2 className="mt-2 max-w-2xl text-xl font-black leading-tight text-white md:mt-3 md:text-3xl">
                    지금은 하나만 고르면 돼요.
                  </h2>
                  <p className="mt-2 hidden max-w-2xl text-sm font-bold leading-relaxed text-neutral-500 sm:block">
                    첫 {copy.item}만 만들면 장소, 인원, 예산, 리포트는 자연스럽게 따라옵니다. 콜타임, 이동, 식사는 바로 다음 단계에서 시간 블록으로 붙이면 됩니다.
                  </p>
                  <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                    <button type="button" onClick={openScriptAnalyzer} data-first-action="recommended-analyzer" className="group rounded-2xl border border-teal-300/45 bg-teal-300 p-4 text-left text-black shadow-xl shadow-teal-950/25 transition-all hover:bg-teal-200 sm:col-span-2 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/10">
                          <Brain className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-black/10 bg-black/10 px-2 py-1 text-[9px] font-black">추천 빠른 시작</span>
                      </div>
                      <div className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] opacity-70 sm:mt-4">{template === 'film' ? '대본이 있어요' : '자료가 있어요'}</div>
                      <div className="mt-1 text-xl font-black">{template === 'film' ? '시나리오로 시작하기' : template === 'event' ? '식순으로 시작하기' : template === 'ad' ? '광고 구성으로 시작하기' : template === 'musicvideo' ? 'MV 콘티로 시작하기' : '타임코드 콘티로 시작하기'}</div>
                      <p className="mt-1.5 max-w-xl text-xs font-bold leading-relaxed text-black/65 sm:mt-2 sm:text-sm">{template === 'film' ? '대본/PDF/샷리스트를 넣으면 씬·장소·인물을 추출해 첫 촬영표를 만듭니다.' : workspaceLanguage.gettingStarted.analyzer}</p>
                      <span
                        aria-hidden="true"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-black px-3 py-1.5 text-xs font-black text-teal-100 shadow-lg shadow-teal-950/20 transition-colors group-hover:bg-neutral-950 sm:mt-5"
                      >
                        바로 시작하기
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                    <button type="button" onClick={openNewSceneForm} data-first-action="manual-entry" className="rounded-2xl border border-neutral-800 bg-black/45 p-4 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900/70 sm:p-5">
                      <Plus className="h-5 w-5 text-neutral-300" />
                      <div className="mt-3 text-lg font-black text-white sm:mt-4">직접 입력하기</div>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-neutral-500">장소와 내용만 넣어 첫 {copy.item}을 만듭니다.</p>
                    </button>
                    <button type="button" onClick={() => handleLoadSampleData(false)} className="rounded-2xl border border-neutral-800 bg-black/45 p-4 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900/70 sm:p-5">
                      <Database className="h-5 w-5 text-neutral-300" />
                      <div className="mt-3 text-lg font-black text-white sm:mt-4">샘플로 둘러보기</div>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-neutral-500">완성 예시로 전체 흐름을 봅니다.</p>
                    </button>
                    <button type="button" onClick={() => setActiveTab('planning')} className="rounded-2xl border border-neutral-800 bg-black/45 p-4 text-left transition-all hover:border-neutral-700 hover:bg-neutral-900/70 sm:p-5">
                      <FileText className="h-5 w-5 text-neutral-300" />
                      <div className="mt-3 text-lg font-black text-white sm:mt-4">기획부터 정리하기</div>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-neutral-500">로그라인/브리프를 먼저 정리합니다.</p>
                    </button>
                  </div>
                </div>
                <aside className="rounded-2xl border border-neutral-900 bg-black/45 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">Next flow</div>
                  <div className="mt-1 text-sm font-black text-neutral-200">현장 입력 순서</div>
                  {[
                    ['1', `${copy.item} 만들기`, '가장 먼저 필요한 최소 입력'],
                    ['2', '시간 블록 붙이기', '콜타임, 이동, 식사, 리허설'],
                    ['3', '장소/인원/콘티 확인', '필요한 준비만 보강하고 PDF 정리'],
                  ].map(([step, title, detail]) => (
                    <div key={step} className="mt-3 flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-[11px] font-black text-teal-200">{step}</div>
                      <div>
                        <div className="text-sm font-black text-neutral-100">{title}</div>
                        <div className="mt-0.5 text-xs font-bold text-neutral-600">{detail}</div>
                      </div>
                    </div>
                  ))}
                </aside>
              </div>
            </section>
          )}

          {activeTab === 'schedule' && !showEmptyScheduleGuide && (
          <>
          <ScheduleSetupPanel
            activeCallTime={activeCallTime}
            activeShootingDate={activeShootingDate}
            activeShootingStartTime={activeShootingStartTime}
            hasFilmSampleInsideDance={hasFilmSampleInsideDance}
            location={location}
            locationWeatherButtonLabel={copy.locationWeatherButton}
            sceneLocation={newSceneParams.location}
            weatherLabel={weatherLabel}
            weatherLatitude={weatherLatitude}
            weatherLongitude={weatherLongitude}
            WeatherWidget={WeatherWidget}
            onLoadSampleData={handleLoadSampleData}
            onSetWeatherFromSceneLocation={() => newSceneParams.location && setLocation(newSceneParams.location)}
            onTimeChange={handleTimeChange}
          />

          {/* Add Scene Form */}
          {showSceneForm && (
            <SceneFormPanel
              canSave={canSaveScene}
              categoryOptions={storyboardCategoryOptions}
              copy={{
                descriptionLabel: copy.descriptionLabel,
                descriptionPlaceholder: copy.descriptionPlaceholder,
                eventSectionLabel: copy.eventSectionLabel,
                formTitle: copy.formTitle,
                gearLabel: copy.gearLabel,
                item: copy.item,
                modeLabel: copy.modeLabel,
                storyboardLabel: copy.storyboardLabel,
              }}
              customImageStatus={customImageStatus}
              editorStoryboardOptions={editorStoryboardOptions}
              filteredStoryboardCount={filteredStoryboards.length}
              isEditing={Boolean(editingScene)}
              isMusicTimelineTemplate={isMusicTimelineTemplate}
              locations={locations}
              missingFields={sceneFormMissingFields}
              people={people}
              recommendedStoryboards={recommendations}
              sameText={sameText}
              sbCategory={sbCategory}
              sbSearch={sbSearch}
              selectedStoryboard={selectedStoryboard}
              storyboardCount={storyboardDb.length}
              template={template}
              values={{
                location: newSceneParams.location,
                locationId: newSceneParams.locationId,
                description: newSceneParams.description,
                estimatedMinutes: newSceneParams.estimatedMinutes,
                sceneNumber: newSceneParams.sceneNumber,
                intExt: newSceneParams.intExt,
                dayNight: newSceneParams.dayNight,
                cast: newSceneParams.cast || '',
                cutCount: newSceneParams.cutCount,
                pageCount: newSceneParams.pageCount,
                eventSection: newSceneParams.eventSection,
                cameraGear: newSceneParams.cameraGear,
                visualRef: newSceneParams.visualRef,
                lightingNote: newSceneParams.lightingNote,
                clientMemo: newSceneParams.clientMemo,
                musicCue: newSceneParams.musicCue,
                lyrics: newSceneParams.lyrics,
                choreoNote: newSceneParams.choreoNote,
                focusMember: newSceneParams.focusMember,
                shotSize: newSceneParams.shotSize,
                formation: newSceneParams.formation,
                props: newSceneParams.props,
                costume: newSceneParams.costume,
                soundNote: newSceneParams.soundNote,
                specialInstruction: newSceneParams.specialInstruction,
                insertNote: newSceneParams.insertNote,
                continuityNote: newSceneParams.continuityNote,
              }}
              onAddLocation={() => openLocationModal()}
              onAddPerson={() => openPersonModal()}
              onApplyStoryboard={applyStoryboardToSceneForm}
              onChange={(values) => setNewSceneParams({ ...newSceneParams, ...values })}
              onClearStoryboard={() => {
                setNewSceneParams({ ...newSceneParams, visualRef: '' });
                setCustomImageStatus('');
              }}
              onClose={resetSceneForm}
              onFallbackImage={storyboardFallback}
              onOpenGallery={() => setShowGallery(true)}
              onSetCategory={setSbCategory}
              onSetSearch={setSbSearch}
              onSave={handleSaveScene}
              onUploadStoryboard={handleCustomStoryboardUpload}
            />
          )}

        {/* Middle Ad Slot */}
          <AdBanner placement="middle_timeline" format="auto" />

        {/* Timeline View */}
        <div id="schedule-timeline-panel" className="scroll-mt-24">
        <ScheduleControlsPanel
          activeDayIndex={activeDayIndex}
          activeDaySceneCount={activeDayScenes.length}
          activeShootingDate={activeShootingDate}
          filteredSceneCount={filteredSceneCount}
          isScheduleFiltered={isScheduleFiltered}
          issueOptions={scheduleIssueOptions}
          itemPluralLabel={copy.itemPlural}
          locations={locations}
          locationFilter={scheduleLocationFilter}
          optimizationSummary={optimizationSummary}
          scheduleIssueFilter={scheduleIssueFilter}
          scheduleSearch={scheduleSearch}
          scheduleStatusFilter={scheduleStatusFilter}
          scheduleTitle={copy.scheduleTitle}
          searchPlaceholder={`${copy.item} 번호, 장소, 인물, 내용 검색`}
          template={template}
          totalMinutes={timelineStats.totalMinutes}
          wrapTimeLabel={timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '-'}
          onChangeIssueFilter={setScheduleIssueFilter}
          onChangeLocationFilter={setScheduleLocationFilter}
          onChangeSearch={setScheduleSearch}
          onChangeStatusFilter={setScheduleStatusFilter}
          onQuickAddBreak={addQuickBreak}
          onResetFilters={resetScheduleFilters}
          onUndoOptimization={handleUndoOptimization}
        />

          <div ref={pdfRef} className="pdf-export-root relative overflow-hidden rounded-2xl border border-neutral-900 bg-black lg:overflow-x-auto custom-scrollbar">
            <ScheduleExportHeader
              activeDayIndex={activeDayIndex}
              activeShootingDate={activeShootingDate}
              displayedSceneCount={activeDayScenes.length}
              filteredSceneCount={filteredSceneCount}
              isMusicTimelineTemplate={isMusicTimelineTemplate}
              isReportMode={isReportMode}
              isScheduleFiltered={isScheduleFiltered}
              itemPluralLabel={copy.itemPlural}
              location={location}
              locationsCount={locations.length}
              pdfKindLabel={pdfKindLabel}
              reportStats={reportStats}
              template={template}
              templateLabel={templateLabel}
              totalItemLabel={copy.totalItemLabel}
              totalMinutes={timelineStats.totalMinutes}
              wrapTimeLabel={timelineStats.wrapTime ? format(timelineStats.wrapTime, 'HH:mm') : '-'}
            />
            <MobileScheduleList
              activeDaySceneCount={activeDayScenes.length}
              copyEmptyHint={copy.emptyHint}
              copyItemPlural={copy.itemPlural}
              filteredTimelineRows={filteredTimelineRows}
              isReportMode={isReportMode}
              isScheduleFiltered={isScheduleFiltered}
              mobileFieldFocus={mobileFieldFocus}
              reportStats={reportStats}
              scheduleStatusFilter={scheduleStatusFilter}
              template={template}
              getBreakLocationName={(item) => locations.find((locationItem) => locationItem.id === item.locationId)?.name || ''}
              MobileFieldControlBar={MobileFieldControlBar}
              MobileTimelineBreakCard={MobileTimelineBreakCard}
              MobileTimelineSceneCard={MobileTimelineSceneCard}
              onDeleteBreak={(item) => {
                deleteBreak(item.id);
                setOptimizationSummary(null);
              }}
              onDeleteScene={handleDeleteScene}
              onDuplicateScene={handleDuplicateScene}
              onEditBreak={openBreakModal}
              onEditScene={openSceneEditor}
              onGoReport={() => setActiveTab('report')}
              onOpenAnalyzer={openScriptAnalyzer}
              onLoadSampleData={handleLoadSampleData}
              onNewScene={openNewSceneForm}
              onResetFilters={resetScheduleFilters}
              onSetStatusFilter={setScheduleStatusFilter}
              onToggleReportMode={() => setIsReportMode((value) => !value)}
            />
            <DesktopScheduleTable
              contentColumnLabel={copy.contentColumn}
              copyEmptyHint={copy.emptyHint}
              infoColumnLabel={copy.infoColumn}
              isMusicTimelineTemplate={isMusicTimelineTemplate}
              isReportMode={isReportMode}
              isScheduleFiltered={isScheduleFiltered}
              sensors={sensors}
              template={template}
              timelineRows={filteredTimelineRows}
              getBreakLocationName={(item) => locations.find((locationItem) => locationItem.id === item.locationId)?.name || ''}
              onDeleteBreak={(item) => {
                deleteBreak(item.id);
                setOptimizationSummary(null);
              }}
              onDeleteScene={handleDeleteScene}
              onDuplicateScene={handleDuplicateScene}
              onEditBreak={openBreakModal}
              onEditScene={openSceneEditor}
              onLoadSampleData={handleLoadSampleData}
              onNewScene={openNewSceneForm}
              onOpenAnalyzer={openScriptAnalyzer}
              onResetFilters={resetScheduleFilters}
              onTimelineDragEnd={handleTimelineDragEnd}
              SortableBreakRow={SortableBreakRow}
              SortableRow={SortableRow}
            />
          </div>
          </div>
          </>
          )}

          {activeTab === 'cueSheet' && (
            <CueSheetPanel
              activeDayLabel={`Day ${activeDayIndex + 1} · ${activeShootingDate}`}
              canApplyDraft={cueSheetCanApplyDraft}
              canApplyRecommendedReference={cueSheetRows.some((row) => row.source === 'scene' && cueSheetNeedsReference(row))}
              isExportingPdf={isExportingPdf}
              pdfButtonText={pdfButtonText('큐시트 PDF')}
              pdfRef={cueSheetPdfRef}
              planningLineCount={planningScheduleLines.length}
              rows={cueSheetRows}
              scenesCount={activeDayScenes.length}
              sourceDetail={cueSheetSourceDetail}
              sourceLabel={cueSheetSourceLabel}
              status={cueSheetStatus}
              storyboardFallback={storyboardFallback}
              template={template}
              templateLabel={templateLabel}
              totalMinutes={cueSheetTotalMinutes}
              onApplyDraft={handleApplyCueSheetDraft}
              onApplyRecommendedReference={handleApplyCueSheetRecommendedReference}
              onExportPDF={handleExportPDF}
              onGoSchedule={handleGoSchedule}
              onRefreshDraft={handleRefreshCueSheetDraft}
            />
          )}

          {activeTab === 'locations' && (
            <LocationsPanel
              activeShootingDate={activeShootingDate}
              copy={{ item: copy.item, locationItemCount: copy.locationItemCount }}
              locationTypeLabels={locationTypeLabels}
              locations={locations}
              permitStatusLabels={permitStatusLabels}
              scenes={scenes}
              template={template}
              templateLabel={templateLabel}
              LocationWeatherSummary={LocationWeatherSummary}
              getLocationWeatherQuery={getLocationWeatherQuery}
              getProductionLocationWeatherTarget={getProductionLocationWeatherTarget}
              onAddLocation={() => openLocationModal()}
              onDeleteLocation={handleDeleteLocation}
              onEditLocation={openLocationModal}
              onGoSchedule={handleGoSchedule}
              onLoadSampleData={handleLoadSampleData}
            />
          )}

          {activeTab === 'people' && (
            <PeoplePanel
              callSheetPdfRef={callSheetPdfRef}
              callSheetPeople={callSheetPeople}
              callSheetStats={callSheetStats}
              copy={{ item: copy.item, itemPlural: copy.itemPlural }}
              filteredCallSheetPeople={filteredCallSheetPeople}
              filteredPeople={filteredPeople}
              isExportingPdf={isExportingPdf}
              location={location}
              people={people}
              peopleIssueFilter={peopleIssueFilter}
              personCategoryLabels={personCategoryLabels}
              scenes={scenes}
              shootingDate={shootingDate}
              template={template}
              templateLabel={templateLabel}
              onDeletePerson={handleDeletePerson}
              onEditPerson={openPersonModal}
              onExportPDF={handleExportPDF}
              onGoSchedule={handleGoSchedule}
              onLoadSampleData={handleLoadSampleData}
              onNewPerson={() => openPersonModal()}
              onToggleIssueFilter={() => setPeopleIssueFilter((value) => !value)}
              pdfButtonText={pdfButtonText}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetPanel
              budgetStats={budgetStats}
              copy={{ itemPlural: copy.itemPlural, totalItemLabel: copy.totalItemLabel }}
              formatKRW={formatKRW}
              locationsCount={locations.length}
              peopleCount={people.length}
              planningScaleLabel={planningScaleLabel}
              reportStats={{ castCount: reportStats.castCount, crewCount: reportStats.crewCount }}
              scenesCount={scenes.length}
              templateLabel={templateLabel}
              onGoLocations={() => setActiveTab('locations')}
              onGoPeople={() => setActiveTab('people')}
            />
          )}

          {activeTab === 'storyboard' && (
            <div id="storyboard-workspace-panel" className="scroll-mt-24">
              <StoryboardPanel
                copy={{ storyboardLabel: copy.storyboardLabel, storyboardDescription: copy.storyboardDescription }}
                featuredStoryboards={featuredStoryboards}
                filteredCount={filteredStoryboards.length}
                quickFilters={storyboardQuickFilters}
                search={sbSearch}
                selectedCategory={sbCategory}
                onApplyStoryboard={applyStoryboardToSceneForm}
                onChooseQuickFilter={applyStoryboardQuickFilter}
                onFallbackImage={storyboardFallback}
                onOpenGallery={() => setShowGallery(true)}
              />
            </div>
          )}

          {activeTab === 'report' && (
            <ReportPanel
              callSheetStats={callSheetStats}
              copy={{ item: copy.item, itemPlural: copy.itemPlural }}
              isExportingPdf={isExportingPdf}
              isMusicTimelineTemplate={isMusicTimelineTemplate}
              location={location}
              peopleCount={people.length}
              reportActionItems={reportActionItems}
              reportLocationStats={reportLocationStats}
              reportPdfRef={reportPdfRef}
              reportSceneGroups={reportSceneGroups}
              reportStats={reportStats}
              scenes={scenes}
              shootingDate={shootingDate}
              template={template}
              templateLabel={templateLabel}
              onEnableReportMode={handleEnableReportMode}
              onExportJSON={handleExportJSON}
              onExportPDF={handleExportPDF}
              onGoSchedule={handleGoSchedule}
              onLoadSampleData={() => handleLoadSampleData(false)}
              onNewScene={openNewSceneForm}
              pdfButtonText={pdfButtonText}
              storyboardFallback={storyboardFallback}
            />
          )}

        <ProductionGuideFooter />

        <LocationModal
          editingLocation={editingLocation}
          form={locationForm}
          isOpen={showLocationModal}
          isSearchingWeatherLocation={isSearchingWeatherLocation}
          weatherLocationError={weatherLocationError}
          weatherLocationResults={weatherLocationResults}
          onClearWeatherSearch={() => {
            setWeatherLocationResults([]);
            setWeatherLocationError('');
          }}
          onClose={() => setShowLocationModal(false)}
          onFormChange={setLocationForm}
          onSave={saveLocation}
          onSearchWeatherLocation={searchWeatherLocation}
          onSelectWeatherLocation={selectWeatherLocation}
        />

        <PersonModal
          editingPerson={editingPerson}
          form={personForm}
          isOpen={showPersonModal}
          onClose={() => setShowPersonModal(false)}
          onFormChange={setPersonForm}
          onSave={savePerson}
        />

        <BreakModal
          editingBreak={editingBreak}
          form={breakForm}
          isOpen={showBreakModal}
          locations={locations}
          onClose={() => setShowBreakModal(false)}
          onDeleteEditingBreak={() => {
            if (!editingBreak) return;
            deleteBreak(editingBreak.id);
            setOptimizationSummary(null);
            setShowBreakModal(false);
            setEditingBreak(null);
          }}
          onFormChange={setBreakForm}
          onSave={saveBreak}
        />

        <StoryboardGalleryModal
          category={sbCategory}
          categoryOptions={storyboardCategoryOptions}
          copyDescription={copy.storyboardDescription}
          filteredStoryboards={filteredStoryboards}
          isOpen={showGallery}
          quickFilters={storyboardQuickFilters}
          recommendedStoryboards={recommendations}
          search={sbSearch}
          selectedVisualRef={newSceneParams.visualRef}
          showSceneForm={showSceneForm}
          totalCount={storyboardDb.length}
          onApplyStoryboard={applyStoryboardToSceneForm}
          onClose={() => setShowGallery(false)}
          onFallbackImage={storyboardFallback}
          onChooseQuickFilter={applyStoryboardQuickFilter}
          onSetCategory={setSbCategory}
          onSetSearch={setSbSearch}
        />
        </main>
      </div>
    </div>
  );
}
