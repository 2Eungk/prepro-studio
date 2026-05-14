'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import type { BreakItem, Person, PlanningDocument, ProductionLocation, ScheduleState, Scene, ShootDay, StoryboardCategory, TemplateType } from '@/types/schedule';
import { format, addMinutes, subMinutes } from 'date-fns';
import { Plus, GripVertical, Clock, Film, MonitorPlay, Camera, Image as ImageIcon, Download, Cloud, Sunrise, Sunset, MapPin, Calendar as CalendarIcon, CheckCircle2, XCircle, Circle, FileText, Umbrella, Wind, Sparkles, Upload, Database, Brain, KeyRound, Wand2, Clipboard, ArrowRight, ShieldCheck, RefreshCw, Users, Music2, Calculator } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { storyboardDb, recommendShots } from '@/data/storyboardDb';
import AdBanner from '@/components/AdBanner';
import AppHeader from '@/components/header/AppHeader';
import BudgetPanel from '@/components/sections/BudgetPanel';
import LocationsPanel from '@/components/sections/LocationsPanel';
import PeoplePanel from '@/components/sections/PeoplePanel';
import ReportPanel from '@/components/sections/ReportPanel';
import StoryboardPanel from '@/components/sections/StoryboardPanel';
import ScheduleSetupPanel from '@/components/sections/schedule/ScheduleSetupPanel';
import ScheduleExportHeader from '@/components/sections/schedule/ScheduleExportHeader';
import MobileScheduleList from '@/components/sections/schedule/MobileScheduleList';
import DesktopScheduleTable from '@/components/sections/schedule/DesktopScheduleTable';
import ScheduleControlsPanel from '@/components/sections/schedule/ScheduleControlsPanel';
import StoryboardGalleryModal from '@/components/modals/StoryboardGalleryModal';
import { BreakModal, LocationModal, PersonModal } from '@/components/modals/ProductionModals';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
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

type MainWorkspaceTab = 'planning' | 'schedule' | 'locations' | 'people' | 'budget' | 'storyboard' | 'report';
type MainWorkspaceGroup = '준비' | '촬영' | '정산';
type PlanningWorkspaceTab = 'brief' | 'details' | 'ai';

const mainWorkspaceTabIds = ['planning', 'schedule', 'locations', 'people', 'budget', 'storyboard', 'report'] as const;
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
    storyboardLabel: '콘티/샷',
    storyboardCaption: '앵글과 레퍼런스',
    reportLabel: '결과 리포트',
    reportCaption: 'Done/NG와 정산',
    setupLabel: '단편 제작 기준',
    setupFallback: '촬영지',
    flowHint: '로그라인을 씬으로 쪼개고, 장소/인원/콘티를 붙인 뒤 촬영표로 확정합니다.',
    flowPath: ['기획서', '로케이션', '출연/스태프', '촬영표', '콘티', '리포트'],
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
    storyboardLabel: '콘티/레퍼런스',
    storyboardCaption: '무드와 필수 컷',
    reportLabel: '납품 리포트',
    reportCaption: '승인/NG와 버전',
    setupLabel: '광고 제작 기준',
    setupFallback: '촬영지',
    flowHint: '브랜드 메시지를 컷으로 나누고, 필수 노출/승인/납품 버전을 함께 잠급니다.',
    flowPath: ['브리프', '제품/장소', '모델/스태프', '컷리스트', '콘티', '납품'],
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
    storyboardLabel: 'MV 레퍼런스',
    storyboardCaption: '립싱크/B-roll',
    reportLabel: '촬영 리포트',
    reportCaption: 'OK/NG와 후반',
    setupLabel: 'MV 제작 기준',
    setupFallback: '촬영지',
    flowHint: '곡 구조를 타임코드로 쪼개고 립싱크, 퍼포먼스, B-roll을 병렬로 설계합니다.',
    flowPath: ['곡 분석', '세트/로케', '아티스트', 'MV 큐시트', '레퍼런스', '리포트'],
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
    storyboardLabel: '인서트/레퍼런스',
    storyboardCaption: '풀샷과 포커스 컷',
    reportLabel: '촬영 리포트',
    reportCaption: 'OK/NG와 재촬영',
    setupLabel: '댄스커버 기준',
    setupFallback: '스튜디오',
    flowHint: '원테이크 풀샷을 기준으로 잡고, 구간별 포커스 멤버와 인서트를 보강합니다.',
    flowPath: ['곡/안무', '스튜디오', '멤버', '타임코드 콘티', '인서트', '리포트'],
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
    storyboardLabel: '커버리지',
    storyboardCaption: 'A/B캠과 스케치',
    reportLabel: '결과 리포트',
    reportCaption: '납품/누락 체크',
    setupLabel: '행사 촬영 기준',
    setupFallback: '행사장',
    flowHint: '식순을 시간 순서로 두고, 담당자/구역/촬영 커버리지를 프로그램마다 붙입니다.',
    flowPath: ['목적/식순', '행사장', '담당자', '운영표', '커버리지', '리포트'],
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
        { id: 'technicalNeeds', label: '기술 요구', placeholder: '카메라, 렌즈, 조명, 그립, 특수장비, 동시녹음 요구를 적으세요.', kind: 'long' },
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

type PlanningAiProvider = 'openai-compatible' | 'gemini' | 'anthropic';

type PlanningAiSettings = {
  provider: PlanningAiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  rememberKey: boolean;
};

const defaultPlanningAiSettings: PlanningAiSettings = {
  provider: 'openai-compatible',
  apiKey: '',
  model: 'gpt-4.1-mini',
  baseUrl: 'https://api.openai.com/v1',
  rememberKey: false,
};

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
};

const MobileTimelineSceneCard = ({
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
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setStatus('done')} className={`h-10 rounded-lg border text-[11px] font-black ${scene.status === 'done' ? 'border-green-400/40 bg-green-500/10 text-green-300' : 'border-neutral-800 bg-black text-neutral-500'}`}>Done</button>
            <button onClick={() => setStatus('ng')} className={`h-10 rounded-lg border text-[11px] font-black ${scene.status === 'ng' ? 'border-red-400/40 bg-red-500/10 text-red-300' : 'border-neutral-800 bg-black text-neutral-500'}`}>NG</button>
            <button onClick={() => setStatus('pending')} className={`h-10 rounded-lg border text-[11px] font-black ${!scene.status || scene.status === 'pending' ? 'border-neutral-600 bg-neutral-900 text-neutral-200' : 'border-neutral-800 bg-black text-neutral-500'}`}>대기</button>
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
                onChange={(e) => updateScene(scene.id, { takeNote: e.target.value })}
              />
              <input
                placeholder="렌즈 / 필터 / 노출"
                className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-[12px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.lensNote || ''}
                onChange={(e) => updateScene(scene.id, { lensNote: e.target.value })}
              />
              <input
                placeholder="슬레이트 / 연결 / 기술 이슈"
                className="h-10 rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-[12px] font-bold text-neutral-200 outline-none focus:border-teal-400/50"
                value={scene.slateNote || ''}
                onChange={(e) => updateScene(scene.id, { slateNote: e.target.value })}
              />
            </div>
          </details>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2" data-pdf-ignore="true" data-html2canvas-ignore="true">
          <button onClick={onEdit} className="prepro-btn prepro-btn--secondary h-9">편집</button>
          <button onClick={onDuplicate} className="prepro-btn prepro-btn--quiet h-9">복제</button>
          <button onClick={onDelete} className="prepro-btn prepro-btn--danger h-9">삭제</button>
        </div>
      )}
    </article>
  );
};

const MobileFieldControlBar = ({
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
  reportStats: {
    done: number;
    pending: number;
    ng: number;
    completionRate: number;
  };
  isReportMode: boolean;
  statusFilter: ScheduleStatusFilter;
  onToggleReportMode: () => void;
  onSetStatusFilter: (filter: ScheduleStatusFilter) => void;
  onGoReport: () => void;
}) => {
  const focusStatus = focusScene?.status || 'pending';
  const statusLabel = focusStatus === 'done' ? '완료' : focusStatus === 'ng' ? 'NG' : '대기';

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
      <div className="mt-3 grid grid-cols-3 gap-2">
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-neutral-900 bg-black/45 px-3 py-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">상태</div>
          <div className="mt-1 text-xs font-black text-neutral-300">{statusLabel}</div>
        </div>
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
};

const MobileTimelineBreakCard = ({
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
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-amber-500/30 bg-black text-[11px] font-black text-amber-300">
          {rowNumber}
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
        <button onClick={onEdit} className="prepro-btn prepro-btn--warm h-9">편집</button>
        <button onClick={onDelete} className="prepro-btn prepro-btn--danger h-9">삭제</button>
      </div>
    </article>
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
  'template' | 'shootingDate' | 'location' | 'callTime' | 'shootingStartTime' | 'days' | 'locations' | 'people' | 'breaks' | 'scenes' | 'timelineOrder' | 'planning'
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
          const trimmedLine = line.trim();
          // 대사 주체 추출: 철수: 안녕하세요
          const castMatch = line.match(/^([^:(\s]{1,10})\s*:/);
          if (castMatch) {
            currentScene.cast.add(castMatch[1].trim());
          } else if (/소품|들고|꺼내|시계|휴대폰|가방|컵|잔|문서|편지|담배|라이터|우산/.test(trimmedLine)) {
            currentScene.props = [currentScene.props, trimmedLine].filter(Boolean).join(' / ');
          } else if (/의상|입고|코트|셔츠|교복|정장|드레스|신발|모자|가디건|외투/.test(trimmedLine)) {
            currentScene.costume = [currentScene.costume, trimmedLine].filter(Boolean).join(' / ');
          } else if (/소리|음악|진동|벨소리|노크|발소리|차소리|사이렌|M\.?O\.?S|무음/.test(trimmedLine)) {
            currentScene.soundNote = [currentScene.soundNote, trimmedLine].filter(Boolean).join(' / ');
          } else if (/카메라|트래킹|패닝|틸트|핸드헬드|줌|슬로우|VFX|CG|특수|드론/.test(trimmedLine)) {
            currentScene.specialInstruction = [currentScene.specialInstruction, trimmedLine].filter(Boolean).join(' / ');
          } else if (/인서트|클로즈업|ECU|CU|손|눈|시계|문고리|발/.test(trimmedLine)) {
            currentScene.insertNote = [currentScene.insertNote, trimmedLine].filter(Boolean).join(' / ');
          } else if (trimmedLine && !line.includes(':') && line.length > 5) {
            // 지문/설명을 description에 누적
            currentScene.description += trimmedLine + ' ';
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
    planning, updatePlanning, updatePlanningField, resetPlanning,
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<ScheduleStatusFilter>('all');
  const [scheduleIssueFilter, setScheduleIssueFilter] = useState<ScheduleIssueFilter>('all');
  const [scheduleLocationFilter, setScheduleLocationFilter] = useState('all');
  const [peopleIssueFilter, setPeopleIssueFilter] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
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
  const getPlanningFieldValue = (sectionId: string, fieldId: string) => planning.sections[sectionId]?.[fieldId] || '';
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
  const planningWorkspaceTabs: Array<{ id: PlanningWorkspaceTab; label: string; caption: string; metric: string; Icon: typeof Brain }> = [
    { id: 'brief', label: '1. 브리프', caption: '무엇을 왜 만드는지', metric: `${planningCompletion}%`, Icon: FileText },
    { id: 'details', label: '2. 제작 설계', caption: '씬, 컷, 장소, 리스크', metric: `${planningSections.length}섹션`, Icon: Database },
    { id: 'ai', label: '3. AI/API', caption: '선택 사용: 정리, 보완, 스케줄화', metric: planning.aiDraft ? '완료' : '선택', Icon: Wand2 },
  ];
  const planningWorkflowSteps = [
    { label: '무료 작성', detail: '가입 없이 브리프와 상세 설계를 직접 작성합니다.', status: '항상 가능' },
    { label: 'BYOK 연결', detail: '사용자 API 키를 넣으면 앱 안에서 기획을 정리합니다.', status: '선택 기능' },
    { label: 'AI 자동 정리', detail: '기획서 초안, 누락 보완, 스케줄 후보를 내부 화면에서 생성합니다.', status: '앱 내 처리' },
    { label: '스케줄 변환', detail: '씬/식순/컷 리스트를 촬영표 초안으로 넘깁니다.', status: '작성 후 가능' },
  ];
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
  ];
  const planningScheduleSource = planningScheduleSourceField[template];
  const planningScheduleLines = useMemo(() => {
    const source = planning.sections[planningScheduleSource.sectionId]?.[planningScheduleSource.fieldId] || '';
    return source
      .split('\n')
      .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
      .filter(Boolean);
  }, [planning.sections, planningScheduleSource.fieldId, planningScheduleSource.sectionId]);

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
    { id: 'budget', group: '준비', label: '예산', caption: '순제작비 초안', metric: budgetStats.total >= 1000000 ? `${Math.round(budgetStats.total / 10000)}만` : formatKRW(budgetStats.total), Icon: Calculator },
    { id: 'schedule', group: '촬영', label: workspaceLanguage.scheduleLabel, caption: workspaceLanguage.scheduleCaption, metric: isMusicTimelineTemplate ? `${danceCoverageStats.cueCount}큐` : `${timelineStats.totalMinutes || 0}분`, Icon: isMusicTimelineTemplate ? Music2 : Clock },
    { id: 'storyboard', group: '촬영', label: workspaceLanguage.storyboardLabel, caption: workspaceLanguage.storyboardCaption, metric: `${storyboardDb.length}개`, Icon: ImageIcon },
    { id: 'report', group: '정산', label: workspaceLanguage.reportLabel, caption: workspaceLanguage.reportCaption, metric: `${reportStats.done}/${Math.max(1, scenes.length)}`, Icon: FileText },
  ];
  const mainWorkspaceGroups: MainWorkspaceGroup[] = ['준비', '촬영', '정산'];

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
  }, [callSheetStats.missingCallTime, callSheetStats.missingContact, copy.item, copy.itemPlural, copy.storyboardLabel, isShortFilmMode, locations, people.length, scenes, shortFilmReadinessSummary.critical, shortFilmReadinessSummary.status, shortFilmReadinessSummary.warning, template, timelineStats.risk, timelineStats.totalMinutes, timelineStats.wrapTime]);

  const readinessSummary = useMemo(() => {
    const critical = readinessChecks.filter((item) => item.status === 'critical').length;
    const warning = readinessChecks.filter((item) => item.status === 'warning').length;
    const ok = readinessChecks.length - critical - warning;
    const status = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'ok';

    return { critical, warning, ok, status };
  }, [readinessChecks]);

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
      rowNumber: focusRowIndex >= 0 ? focusRowIndex + 1 : undefined,
      nextBreakLabel: nextBreak?.type === 'break' ? `다음 시간 블록: ${nextBreak.breakItem.label}` : undefined,
    };
  }, [timelineRows]);

  const resetScheduleFilters = () => {
    setScheduleSearch('');
    setScheduleStatusFilter('all');
    setScheduleIssueFilter('all');
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
    setFileStatus('백업 저장됨');
    window.setTimeout(() => setFileStatus(''), 2200);
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
      planning: state.planning,
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
      if (navigator.share && urlText.length < 7000) {
        await navigator.share({
          title: shareTitle,
          text: `${shareSummary}\n기획서, 촬영표, 콜시트, 콘티, 예산, 리포트를 한 번에 정리합니다.`,
          url: urlText,
        });
        setShareStatus('공유 열림');
      } else {
        await navigator.clipboard.writeText(shareCopy);
        setShareStatus(urlText.length > 7000 ? '긴 공유문구 복사됨' : '공유문구 복사됨');
      }
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
        importData(json);
        setOptimizationSummary(null);
        setFileStatus('가져오기 완료');
        window.setTimeout(() => setFileStatus(''), 2200);
      } catch {
        alert('올바른 JSON 파일이 아닙니다.');
        setFileStatus('가져오기 실패');
        window.setTimeout(() => setFileStatus(''), 2200);
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

  const handleCustomStoryboardUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCustomImageStatus('이미지 파일만 가능합니다.');
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
    resetSceneForm();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const handleLoadSampleData = () => {
    if (!confirm(`${template === 'event' ? '행사' : template === 'ad' ? '광고' : template === 'musicvideo' ? '뮤직비디오' : template === 'dance' ? '댄스커버' : '단편영화'} 샘플 데이터를 로드하시겠습니까?`)) return;

    loadSampleData();
    finishSampleDataLoad();
  };

  const handleLoadTemplateSampleData = (nextTemplate: TemplateType) => {
    const sampleLabel = nextTemplate === 'event' ? '행사' : nextTemplate === 'ad' ? '광고' : nextTemplate === 'musicvideo' ? '뮤직비디오' : nextTemplate === 'dance' ? '댄스커버' : '단편영화';
    if (!confirm(`${sampleLabel} 샘플 데이터를 로드하시겠습니까? 현재 작업 데이터는 샘플로 교체됩니다.`)) return;

    setTemplate(nextTemplate);
    loadSampleData();
    finishSampleDataLoad();
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
  const gettingStartedCards = [
    {
      label: '샘플로 둘러보기',
      detail: workspaceLanguage.gettingStarted.sample,
      Icon: Database,
      action: handleLoadSampleData,
      tone: 'neutral',
    },
    {
      label: '직접 추가',
      detail: workspaceLanguage.gettingStarted.manual,
      Icon: Plus,
      action: openNewSceneForm,
      tone: 'primary',
    },
    {
      label: template === 'event' ? '식순 정리' : template === 'ad' ? '광고 구성 분석' : template === 'musicvideo' ? 'MV 타임코드 콘티' : template === 'dance' ? '타임코드 콘티' : '시나리오 분석',
      detail: workspaceLanguage.gettingStarted.analyzer,
      Icon: Brain,
      action: () => setShowAnalyzer(true),
      tone: 'primary',
    },
    {
      label: '기획부터 시작',
      detail: workspaceLanguage.gettingStarted.planning,
      Icon: FileText,
      action: () => setActiveTab('planning'),
      tone: 'neutral',
    },
  ];
  const firstRunSteps = workspaceLanguage.firstRunSteps;
  const showOperationalDashboard = activeTab === 'schedule' || activeTab === 'report';
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
          { id: 'schedule-add', label: copy.addItem, detail: `Day ${activeDayIndex + 1}에 추가`, Icon: Plus, tone: 'primary' },
          { id: 'schedule-break', label: '시간 추가', detail: '식사, 이동, 리허설', Icon: Clock, tone: 'amber' },
          { id: 'schedule-optimize', label: 'AI 동선 최적화', detail: '장소와 인원 기준', Icon: Sparkles, disabled: activeDayScenes.length < 2, tone: 'neutral' },
          { id: 'export-pdf', label: 'PDF 다운로드', detail: pdfKindLabel, Icon: Download, disabled: isExportingPdf, tone: 'neutral' },
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
  const PrimaryQuickActionIcon = primaryQuickAction?.Icon;
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
      case 'location-add':
        openLocationModal();
        break;
      case 'project-setup':
        setShowProjectSetup(true);
        break;
      case 'go-schedule':
        setActiveTab('schedule');
        break;
      case 'person-add':
        openPersonModal();
        break;
      case 'people-filter-call':
        setPeopleIssueFilter((value) => !value);
        setActiveTab('people');
        break;
      case 'storyboard-gallery':
        setShowGallery(true);
        break;
      case 'storyboard-reset':
        setSbCategory('ALL');
        setSbSearch('');
        break;
      case 'report-mode':
        setIsReportMode(true);
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
        setActiveTab('schedule');
        if (timelineStats.totalMinutes === 0) openBreakModal();
        break;
    }
  };

  return (
    <div className="prepro-shell min-h-screen bg-black text-white p-6 md:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
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
          isSearchingGlobalWeather={isSearchingGlobalWeather}
          location={location}
          mainWorkspaceGroups={mainWorkspaceGroups}
          mainWorkspaceTabs={mainWorkspaceTabs}
          shareStatus={shareStatus}
          showProjectSetup={showProjectSetup}
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
          onResetProject={resetProject}
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

          <section className="rounded-2xl border border-neutral-900 bg-neutral-950/75 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-200">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black text-neutral-200">
                    <span>현재: {currentWorkspaceTab?.label || '작업'}</span>
                    <ArrowRight className="h-3 w-3 text-neutral-700" />
                    <span className="text-teal-200">다음: {nextFlowTarget}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-neutral-600">
                    {workspaceLanguage.flowHint}
                  </p>
                  <div className="mt-2 hidden flex-wrap items-center gap-1.5 sm:flex">
                    {workspaceLanguage.flowPath.map((step, index) => {
                      const flowTabOrder: MainWorkspaceTab[] = ['planning', 'locations', 'people', 'schedule', 'storyboard', 'report'];
                      const isFlowStepActive = flowTabOrder[index] === activeTab;

                      return (
                      <span key={`${step}-${index}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${
                        isFlowStepActive
                          ? 'border-teal-400/30 bg-teal-400/10 text-teal-100'
                          : 'border-neutral-900 bg-black/40 text-neutral-600'
                      }`}>
                        {index > 0 && <ArrowRight className="h-2.5 w-2.5 text-neutral-700" />}
                        {step}
                      </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap lg:justify-end">
                {primaryQuickAction && (
                  <button
                    type="button"
                    onClick={() => handleWorkspaceQuickAction(primaryQuickAction.id)}
                    disabled={primaryQuickAction.disabled}
                    className="prepro-btn prepro-btn--primary"
                  >
                    {PrimaryQuickActionIcon && <PrimaryQuickActionIcon className="h-3.5 w-3.5" />}
                    {primaryQuickAction.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowProjectSetup((value) => !value)}
                  className="prepro-btn prepro-btn--secondary"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  날짜/날씨
                </button>
              </div>
            </div>
          </section>

          {activeTab === 'schedule' && scenes.length === 0 && (
            <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/90">
              <div className="grid gap-0 lg:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)]">
                <div className="border-b border-neutral-900 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),linear-gradient(135deg,rgba(245,158,11,0.08),transparent_42%)] p-5 lg:border-b-0 lg:border-r">
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-200">
                    <Sparkles className="h-3 w-3" />
                    1분 시작
                  </div>
                  <h2 className="mt-4 text-2xl font-black leading-tight text-white">{workspaceLanguage.firstRunTitle}</h2>
                  <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-neutral-500">
                    {workspaceLanguage.firstRunDetail}
                  </p>
                  <div className="mt-5 space-y-2">
                    {firstRunSteps.map((step) => (
                      <div key={step.label} className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-black/45 px-3 py-2.5">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-teal-300" />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-neutral-200">{step.label}</div>
                          <div className="mt-0.5 truncate text-[10px] font-bold text-neutral-600">{step.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 rounded-xl border border-neutral-900 bg-black/35 p-3">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-600">샘플 프로젝트</span>
                        <div className="mt-1 text-sm font-black text-neutral-200">내 작업과 가장 가까운 예시로 시작</div>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-700">기획서와 현장표까지 같이 바뀝니다</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      {quickStartProjectCards.map((item) => {
                        const Icon = item.Icon;
                        const selected = template === item.template;

                        return (
                          <button
                            key={item.template}
                            type="button"
                            onClick={() => handleLoadTemplateSampleData(item.template)}
                            className={`group min-h-[154px] rounded-xl border p-3 text-left transition-all ${
                              selected
                                ? 'border-teal-300/40 bg-teal-300/10 shadow-[0_0_0_1px_rgba(94,215,207,0.18)]'
                                : 'border-neutral-900 bg-neutral-950/80 hover:border-neutral-700 hover:bg-neutral-900/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                                selected
                                  ? 'border-teal-300/35 bg-teal-300/10 text-teal-100'
                                  : 'border-neutral-800 bg-black text-neutral-500 group-hover:text-neutral-200'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className={`rounded-md border px-2 py-1 text-[9px] font-black ${
                                selected
                                  ? 'border-teal-300/30 bg-black/30 text-teal-100'
                                  : 'border-neutral-800 bg-black text-neutral-600'
                              }`}>
                                {item.metric}
                              </span>
                            </div>
                            <div className="mt-4 text-sm font-black text-white">{item.title}</div>
                            <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-neutral-600">{item.subtitle}</div>
                            <p className="mt-2 text-[11px] font-bold leading-relaxed text-neutral-500">{item.detail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gettingStartedCards.map((item) => {
                      const Icon = item.Icon;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.action}
                          className={`prepro-action-card group rounded-xl border p-4 text-left transition-all ${item.tone === 'primary' ? 'is-primary text-neutral-100' : 'text-neutral-300'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                              item.tone === 'primary'
                                ? 'border-teal-300/30 bg-teal-300/10 text-teal-200'
                                : 'border-neutral-800 bg-neutral-950 text-neutral-400 group-hover:text-neutral-200'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-700 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-300" />
                          </div>
                          <div className="mt-4 text-sm font-black text-white">{item.label}</div>
                          <p className="mt-1 min-h-10 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 rounded-xl border border-neutral-900 bg-black/35 px-4 py-3 text-xs font-bold text-neutral-600">
                    첫 {copy.item}이 추가되면 이 시작 패널은 자동으로 사라집니다.
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {showOperationalDashboard && (
          <>
            {isMusicTimelineTemplate && activeTab === 'schedule' && (
              <section className="overflow-hidden rounded-2xl border border-teal-400/25 bg-neutral-950/85">
                <div className="grid gap-0 lg:grid-cols-[minmax(280px,0.7fr)_minmax(520px,1.3fr)]">
                  <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.16),rgba(242,161,75,0.07)_58%,transparent)] p-5 lg:border-b-0 lg:border-r">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-100">
                      <Music2 className="h-3 w-3" />
                      {template === 'musicvideo' ? 'Music Video Mode' : 'Dance Cover Mode'}
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-white">{template === 'musicvideo' ? '타임코드로 짜는 MV 콘티' : '타임코드로 짜는 댄스 콘티'}</h2>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-neutral-500">
                      {template === 'musicvideo' ? '곡 구조를 기준으로 립싱크, 퍼포먼스, B-roll, 인서트 컷을 구간별로 쌓아가는 방식입니다.' : '원테이크 풀샷을 기준으로, 포커스 멤버와 인서트 컷을 구간별로 쌓아가는 방식입니다.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(template === 'musicvideo' ? ['립싱크', '퍼포먼스', 'B-roll', '가사 큐'] : ['원테이크', '인서트', '포커스 멤버', '가사 큐']).map((label) => (
                        <span key={label} className="rounded-full border border-neutral-800 bg-black/45 px-3 py-1 text-[10px] font-black text-neutral-300">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: '타임코드 큐', value: `${danceCoverageStats.cueCount}개`, detail: `${danceCoverageStats.lyricCount}개 가사 연결`, tone: 'text-teal-200' },
                      {
                        label: template === 'musicvideo' ? '퍼포먼스 마스터' : '원테이크/풀샷',
                        value: `${danceCoverageStats.oneTakeCount}개`,
                        detail: template === 'musicvideo' ? '전체 동선 확인용 기준 컷' : '대형 확인용 기준 컷',
                        tone: 'text-white',
                      },
                      {
                        label: template === 'musicvideo' ? 'B-roll/인서트' : '인서트 컷',
                        value: `${danceCoverageStats.insertCount}개`,
                        detail: template === 'musicvideo' ? '소품, 무드, 디테일 보강' : '센터, 손동작, 표정 보강',
                        tone: 'text-amber-200',
                      },
                      {
                        label: template === 'musicvideo' ? '아티스트' : '포커스 멤버',
                        value: `${danceCoverageStats.focusMembers.length}명`,
                        detail: danceCoverageStats.focusMembers.slice(0, 3).join(', ') || '아직 미정',
                        tone: 'text-neutral-200',
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-600">{item.label}</div>
                        <div className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</div>
                        <div className="mt-1 truncate text-[10px] font-bold text-neutral-600">{item.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {danceCoverageStats.shotSizes.length > 0 && (
                  <div className="border-t border-neutral-900 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-neutral-600">
                      <span className="uppercase tracking-[0.18em]">Shot Sizes</span>
                      {danceCoverageStats.shotSizes.map((size) => (
                        <span key={size} className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-300">{size}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

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
                            ? 'border-neutral-600 bg-neutral-900 text-white'
                            : 'border-neutral-800 bg-black text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-widest">Day {index + 1}</div>
                        <div className="mt-1 text-xs font-bold">{day.date}</div>
                        <div className={`mt-1 text-[10px] font-bold ${isSelected ? 'text-neutral-400' : 'text-neutral-600'}`}>{daySceneCount}개</div>
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
                        ? 'border-neutral-700 bg-neutral-900 text-white'
                        : isDone
                          ? 'border-neutral-800 bg-neutral-900/70 text-neutral-300'
                          : 'border-neutral-900 bg-neutral-950/70 text-neutral-600'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      isDone ? 'bg-green-500/15 text-green-400' : isActive ? 'bg-neutral-800 text-indigo-300' : 'bg-neutral-900 text-neutral-600'
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
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleReadinessAction(item.id)}
                    className={`group rounded-xl border bg-neutral-950/80 px-4 py-3 text-left transition-all hover:bg-neutral-900/80 ${
                      item.status === 'critical'
                        ? 'border-red-500/30 hover:border-red-400/50'
                        : item.status === 'warning'
                          ? 'border-amber-500/25 hover:border-amber-400/45'
                          : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
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
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-neutral-600 transition-colors group-hover:text-teal-200">
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* === MAIN CONTENT === */}
        <main className="space-y-8">
          <section className="rounded-2xl border border-neutral-900 bg-neutral-950/45 p-4" data-html2canvas-ignore="true">
            <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.62fr)_minmax(520px,1fr)] xl:items-center">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">현재 작업</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-neutral-100">
                    {currentWorkspaceTab?.label || '작업'}
                  </h2>
                  <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-[10px] font-black text-neutral-500">
                    {currentWorkspaceTab?.metric || '-'}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-neutral-600">
                  {currentWorkspaceTab?.caption || '다음 작업을 선택하세요.'}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {secondaryQuickActions.map(({ id, label, detail, Icon, disabled, tone = 'neutral' }) => {
                  const toneClass = tone === 'primary'
                    ? 'prepro-btn--primary'
                    : tone === 'amber'
                      ? 'prepro-btn--warm'
                      : tone === 'green'
                        ? 'prepro-btn--primary'
                        : 'prepro-btn--secondary';

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleWorkspaceQuickAction(id)}
                      disabled={disabled}
                      className={`prepro-btn h-11 justify-start text-left ${toneClass}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black">{label}</span>
                        <span className="mt-0.5 hidden truncate text-[9px] font-bold opacity-65 sm:block">{detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Ad Slot */}
          {showOperationalDashboard && <AdBanner placement="top_banner" format="auto" />}

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
                  className="prepro-btn prepro-btn--primary h-12 px-8 text-sm"
                >
                  {copy.addResult}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <section className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: '기획 완성도', value: `${planningCompletion}%`, tone: 'text-indigo-300' },
                  { label: '분야', value: template === 'film' ? planningProjectFormatLabel : templateLabel, tone: 'text-white' },
                  { label: '제작 규모', value: planningScaleLabel, tone: 'text-amber-200' },
                  { label: '프로 체크', value: `${planningQualityScore}%`, tone: 'text-green-300' },
                  { label: '스케줄 후보', value: `${planningScheduleLines.length}개`, tone: 'text-cyan-300' },
                  { label: 'AI 정리', value: planning.aiDraft ? '완료' : '대기', tone: planning.aiDraft ? 'text-green-300' : 'text-neutral-400' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">{item.label}</div>
                    <div className={`mt-3 text-2xl font-black ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex overflow-x-auto rounded-2xl border border-neutral-900 bg-neutral-950/70 p-1 custom-scrollbar">
                {planningWorkspaceTabs.map((item) => {
                  const isActive = planningWorkspaceTab === item.id;
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPlanningWorkspaceTab(item.id)}
                      className={`min-w-[220px] flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                        isActive
                          ? 'border-indigo-500/70 bg-indigo-600 text-white shadow-xl shadow-indigo-500/15'
                          : 'border-transparent text-neutral-500 hover:border-neutral-800 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isActive ? 'bg-white/15 text-white' : 'bg-black text-neutral-500'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-sm font-black">{item.label}</span>
                            <span className={`mt-0.5 block text-[10px] font-bold ${isActive ? 'text-indigo-100/70' : 'text-neutral-600'}`}>{item.caption}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black ${isActive ? 'text-indigo-100' : 'text-neutral-600'}`}>{item.metric}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-2 rounded-2xl border border-neutral-900 bg-neutral-950/60 p-3 md:grid-cols-4">
                {planningWorkflowSteps.map((item, index) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl border border-neutral-900 bg-black/35 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-black text-neutral-300">
                        {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-black text-neutral-100">{item.label}</div>
                        <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-[9px] font-black text-neutral-500">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {planningWorkspaceTab === 'brief' && (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">Planning Brief</p>
                        <h2 className="mt-2 text-2xl font-black text-white">기획 개요</h2>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('현재 분야 기준으로 기획 내용을 초기화할까요?')) resetPlanning(template);
                        }}
                        className="prepro-btn prepro-btn--danger h-9"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> 초기화
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">프로젝트명</span>
                        <input
                          className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.projectTitle}
                          onChange={(e) => updatePlanning({ projectTitle: e.target.value })}
                          placeholder="예: 브랜드 컨퍼런스 하이라이트"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">목적</span>
                        <input
                          className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.purpose}
                          onChange={(e) => updatePlanning({ purpose: e.target.value })}
                          placeholder="홍보 / 기록 / 판매 / 투자유치"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">제작 규모 / 운용 기준</span>
                        <select
                          className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-black text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.productionScale}
                          onChange={(e) => updatePlanning({ productionScale: e.target.value as PlanningDocument['productionScale'] })}
                        >
                          <option value="premium">하이엔드: 부서별 treatment / 권리 / 납품 / 리스크까지 전체 관리</option>
                          <option value="standard">스탠다드: 필수 기획과 현장 운영을 균형 있게 관리</option>
                          <option value="lean">저예산: 핵심 컷, 장소 통합, 대체안 중심으로 압축 관리</option>
                        </select>
                      </label>
                      {template === 'film' && (
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">작품 포맷 / 제출 기준</span>
                          <select
                            className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-black text-white outline-none transition-all focus:border-indigo-500"
                            value={planning.projectFormat || 'short_film'}
                            onChange={(e) => updatePlanning({ projectFormat: e.target.value as NonNullable<PlanningDocument['projectFormat']> })}
                          >
                            <option value="short_film">단편영화: 러닝타임, 영화제 제출 패키지, EPK 중심</option>
                            <option value="feature_film">장편영화: 장편 treatment, 장기 일정, 배급/투자 패키지 중심</option>
                            <option value="series">시리즈/웹드라마: 에피소드 구조, 파일럿, 시즌 아크 중심</option>
                          </select>
                        </label>
                      )}
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">한 줄 기획</span>
                        <textarea
                          id="planning-root-one-liner"
                          className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.oneLiner}
                          onChange={(e) => updatePlanning({ oneLiner: e.target.value })}
                          placeholder="이 프로젝트를 한 문장으로 설명하세요."
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">타깃</span>
                        <textarea
                          id="planning-root-audience"
                          className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.audience}
                          onChange={(e) => updatePlanning({ audience: e.target.value })}
                          placeholder="누가 보고 무엇을 느껴야 하는지 적으세요."
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">핵심 메시지</span>
                        <textarea
                          id="planning-root-core-message"
                          className="min-h-24 w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500"
                          value={planning.coreMessage}
                          onChange={(e) => updatePlanning({ coreMessage: e.target.value })}
                          placeholder="관객/고객에게 남길 문장을 적으세요."
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setPlanningWorkspaceTab('details')}
                        className="prepro-btn prepro-btn--secondary h-12 text-sm"
                      >
                        상세 설계 열기 <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPlanningWorkspaceTab('ai')}
                        className="prepro-btn prepro-btn--primary h-12 text-sm"
                      >
                        AI 정리로 이동 <Wand2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {template === 'film' && (
                      <div className="rounded-[2rem] border border-indigo-500/25 bg-indigo-500/10 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/25 bg-black/40 text-indigo-300">
                            <Film className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white">{planningProjectFormatLabel} 워크플로우</h3>
                            <p className="mt-1 text-xs font-bold text-neutral-500">단편은 촬영 준비와 영화제 제출 패키지를 같은 문서에서 관리합니다.</p>
                          </div>
                        </div>
                        <div className="grid gap-2 text-xs font-bold leading-relaxed text-neutral-300">
                          <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">러닝타임: 목표 분량과 크레딧 포함 제한을 목표 영화제별로 확인</div>
                          <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">제출 메타: 시놉시스, 장르, 완성일, 예산, 국가, 언어, 촬영 포맷, 화면비</div>
                          <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">홍보/상영: 포스터, 스틸, 감독 소개/statement, EPK, DCP/ProRes, 자막, 권리 증빙</div>
                        </div>
                      </div>
                    )}

                    {isShortFilmMode && (
                      <div className={`rounded-[2rem] border p-6 ${
                        shortFilmReadinessSummary.status === 'critical'
                          ? 'border-red-500/25 bg-red-500/5'
                          : shortFilmReadinessSummary.status === 'warning'
                            ? 'border-amber-500/25 bg-amber-500/5'
                            : 'border-green-500/20 bg-green-500/5'
                      }`}>
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">Short Film Delivery</p>
                            <h3 className="mt-2 text-lg font-black text-white">단편 제출 체크</h3>
                            <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">
                              촬영 준비와 별개로 영화제 제출, 상영본, 권리 증빙까지 잠그는 항목입니다.
                            </p>
                          </div>
                          <div className="grid min-w-24 grid-cols-3 gap-1 text-center text-[10px] font-black">
                            <div className="rounded-lg border border-green-500/20 bg-black/40 px-2 py-2 text-green-300">{shortFilmReadinessSummary.ok}</div>
                            <div className="rounded-lg border border-amber-500/20 bg-black/40 px-2 py-2 text-amber-300">{shortFilmReadinessSummary.warning}</div>
                            <div className="rounded-lg border border-red-500/20 bg-black/40 px-2 py-2 text-red-300">{shortFilmReadinessSummary.critical}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {shortFilmReadinessChecks.map((item) => (
                            <div key={item.id} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">
                              <div className="flex items-center gap-2">
                                {item.status === 'ok' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                                ) : item.status === 'warning' ? (
                                  <Circle className="h-4 w-4 text-amber-300" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-300" />
                                )}
                                <span className="text-xs font-black text-neutral-100">{item.label}</span>
                              </div>
                              <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{item.detail}</p>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlanningWorkspaceTab('details')}
                          className="prepro-btn prepro-btn--warm mt-4 h-11 w-full"
                        >
                          제출 패키지 채우기 <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
                          <Clipboard className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white">등록 없이 가능한 범위</h3>
                          <p className="mt-1 text-xs font-bold text-neutral-500">기획 작성, 체크리스트, 스케줄 변환은 계정 없이 사용합니다. AI 정리는 BYOK로 앱 안에서 처리합니다.</p>
                        </div>
                      </div>
                      <div className="grid gap-2 text-xs font-bold text-neutral-400">
                        <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">간단한 프로젝트: 브리프만 채우고 바로 촬영표로 이동</div>
                        <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">디테일한 프로젝트: 제작 설계까지 채운 뒤 앱 안에서 AI/API로 정리</div>
                        <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3">API 키: 앱 서버에 저장하지 않고, 선택 시 브라우저 로컬 저장만 사용</div>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-400">Production Standard</p>
                        <h3 className="mt-2 text-lg font-black text-white">기획 기준</h3>
                        <p className="mt-1 text-xs font-bold text-neutral-500">
                          하이엔드 제작 문서 구조를 기준으로, 규모가 작으면 같은 목적을 압축 운용합니다.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-600">기반 문서</div>
                          <div className="space-y-2">
                            {planningFoundations.map((item) => (
                              <div key={item} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-xs font-black text-neutral-300">
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-600">{planningScaleLabel} 운용</div>
                          <div className="space-y-2">
                            {planningPlaybook.map((item) => (
                              <div key={item} className="flex gap-2 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-xs font-bold leading-relaxed text-amber-100/80">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-green-300" />
                          <div>
                            <h3 className="text-lg font-black text-white">기획 점검</h3>
                            <p className="mt-1 text-xs font-bold text-neutral-500">눌러서 바로 해당 입력칸으로 이동합니다.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
                          <div className="rounded-xl border border-neutral-900 bg-black/45 px-3 py-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-600">전체</div>
                            <div className="mt-1 text-lg font-black text-white">{planningCheckItems.length}</div>
                          </div>
                          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-green-300/70">완료</div>
                            <div className="mt-1 text-lg font-black text-green-300">{planningCompletedChecks}</div>
                          </div>
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-300/70">미완료</div>
                            <div className="mt-1 text-lg font-black text-amber-300">{planningPendingChecks}</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {planningCheckItems.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => focusPlanningAnchor(item.tab, item.anchorId)}
                            className="flex w-full items-center justify-between rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-left transition-all hover:border-teal-400/25 hover:bg-neutral-900/70"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-neutral-300">{item.label}</span>
                              <span className={`mt-1 block text-[10px] font-black uppercase tracking-[0.14em] ${item.ok ? 'text-green-300/80' : 'text-amber-300/80'}`}>
                                {item.ok ? '입력 완료' : '입력 필요'}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 pl-3">
                              {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-amber-300" />}
                              <ArrowRight className="h-3.5 w-3.5 text-neutral-700" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {planningWorkspaceTab === 'details' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">Detailed Planning</p>
                      <h2 className="mt-2 text-2xl font-black text-white">상세 설계</h2>
                      <p className="mt-1 text-sm font-bold text-neutral-600">{templateLabel} 기준으로 필요한 제작 항목만 모았습니다.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setPlanningWorkspaceTab('brief')}
                        className="prepro-btn prepro-btn--secondary h-12 text-sm"
                      >
                        개요로
                      </button>
                      <button
                        onClick={() => setPlanningWorkspaceTab('ai')}
                        className="prepro-btn prepro-btn--primary h-12 text-sm"
                      >
                        AI 정리 <Wand2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {planningSections.map((section) => (
                    <div key={section.id} id={`planning-section-${section.id}`} className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-5">
                        <h3 className="text-xl font-black text-white">{section.title}</h3>
                        <p className="mt-1 text-sm font-bold text-neutral-600">{section.caption}</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {section.fields.map((field) => {
                          const isWide = field.kind === 'long' || field.kind === 'list';
                          return (
                            <label
                              key={field.id}
                              id={`planning-field-${section.id}-${field.id}`}
                              className={`space-y-2 scroll-mt-28 ${isWide ? 'md:col-span-2' : ''}`}
                            >
                              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">{field.label}</span>
                              {field.kind === 'short' ? (
                                <input
                                  className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
                                  value={getPlanningFieldValue(section.id, field.id)}
                                  onChange={(e) => updatePlanningField(section.id, field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                />
                              ) : (
                                <textarea
                                  className={`${field.kind === 'list' ? 'min-h-44 font-mono' : 'min-h-32'} w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500`}
                                  value={getPlanningFieldValue(section.id, field.id)}
                                  onChange={(e) => updatePlanningField(section.id, field.id, e.target.value)}
                                  placeholder={field.placeholder}
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {planningWorkspaceTab === 'ai' && (
                <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                  <div className="rounded-[2rem] border border-indigo-500/30 bg-indigo-950/10 p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">AI 설정</h3>
                        <p className="text-xs font-bold text-neutral-500">사용자 API 키로만 실행</p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border border-neutral-800 bg-black/60 p-4">
                      <div className="text-sm font-black text-white">언제 API가 필요한가?</div>
                      <div className="mt-3 grid gap-2 text-xs font-bold leading-relaxed text-neutral-400">
                        <p>간단한 기획은 API 없이 브리프와 상세 설계를 직접 작성하면 됩니다.</p>
                        <p>기획서를 앱 안에서 자동 정리하거나 누락 보완, 스케줄 초안 생성을 반복하려면 API 키를 등록합니다.</p>
                        <p>프롬프트 복사는 외부 이동용 기본 흐름이 아니라, API 장애나 수동 검토가 필요할 때 쓰는 백업 기능입니다.</p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="text-sm font-black text-white">무로그인 BYOK 보안 기준</div>
                      <div className="mt-3 grid gap-2 text-xs font-bold leading-relaxed text-neutral-300">
                        <p>API 키는 계정이나 서버 DB에 저장하지 않습니다.</p>
                        <p>AI 정리 버튼을 누를 때만 이 브라우저에서 Next API 라우트를 거쳐 선택한 AI 제공사로 전달됩니다.</p>
                        <p>공용 PC에서는 브라우저 저장을 사용하지 마세요. 배포 환경에서는 HTTPS에서만 사용하세요.</p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-2xl border border-neutral-800 bg-black/60 p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-600">API Key 발급</div>
                      <div className="space-y-2">
                        {planningApiGuide.map((item) => (
                          <a
                            key={item.provider}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-3 transition-colors hover:border-indigo-500/35"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-black text-neutral-100">{item.provider}</span>
                              <span className="text-[10px] font-black text-indigo-300">등록 페이지</span>
                            </div>
                            <p className="mt-1 text-[11px] font-bold leading-relaxed text-neutral-600">{item.note}</p>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="space-y-2 block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Provider</span>
                        <select
                          className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-black text-white outline-none focus:border-indigo-500"
                          value={planningAiSettings.provider}
                          onChange={(e) => {
                            const provider = e.target.value as PlanningAiProvider;
                            setPlanningAiSettings((current) => ({
                              ...current,
                              provider,
                              model: provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : current.model || defaultPlanningAiSettings.model,
                              baseUrl: provider === 'openai-compatible' ? current.baseUrl || defaultPlanningAiSettings.baseUrl : '',
                            }));
                          }}
                        >
                          <option value="openai-compatible">OpenAI 호환</option>
                          <option value="gemini">Gemini</option>
                          <option value="anthropic">Claude</option>
                        </select>
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">API Key</span>
                        <input
                          type="password"
                          className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                          value={planningAiSettings.apiKey}
                          onChange={(e) => setPlanningAiSettings((current) => ({ ...current, apiKey: e.target.value }))}
                          placeholder="sk-..., AIza..., claude key"
                        />
                      </label>
                      <label className="space-y-2 block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Model</span>
                        <input
                          className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                          value={planningAiSettings.model}
                          onChange={(e) => setPlanningAiSettings((current) => ({ ...current, model: e.target.value }))}
                          placeholder="모델명"
                        />
                      </label>
                      {planningAiSettings.provider === 'openai-compatible' && (
                        <label className="space-y-2 block">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Base URL</span>
                          <input
                            className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                            value={planningAiSettings.baseUrl}
                            onChange={(e) => setPlanningAiSettings((current) => ({ ...current, baseUrl: e.target.value }))}
                            placeholder="https://api.openai.com/v1"
                          />
                        </label>
                      )}
                      <div className="rounded-xl border border-neutral-800 bg-black/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-3 text-xs font-bold text-neutral-400">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-indigo-500"
                              checked={planningAiSettings.rememberKey}
                              onChange={(e) => setPlanningAiSettings((current) => ({ ...current, rememberKey: e.target.checked }))}
                            />
                            이 브라우저에만 키 저장
                          </label>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${
                            planningAiSettings.rememberKey && planningAiSettings.apiKey.trim()
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-500'
                          }`}>
                            {planningAiSettings.rememberKey && planningAiSettings.apiKey.trim() ? '로컬 저장 ON' : '저장 안 함'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearPlanningApiKey}
                          disabled={!planningAiSettings.apiKey.trim()}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-400 transition-all hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:border-neutral-900 disabled:text-neutral-700"
                        >
                          <XCircle className="h-3.5 w-3.5" /> 입력/저장된 키 삭제
                        </button>
                      </div>
                      <p className="px-1 text-[11px] font-bold leading-relaxed text-neutral-600">
                        기본값은 저장 안 함입니다. 저장을 켜면 이 기기의 localStorage에만 보관되며, 공용 PC에서는 권장하지 않습니다.
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <button
                        onClick={handleGeneratePlanningAi}
                        disabled={isPlanningAiRunning || isPlanningAiTesting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
                      >
                        {isPlanningAiRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        AI 기획 정리
                      </button>
                      <button
                        onClick={handleTestPlanningAiConnection}
                        disabled={isPlanningAiRunning || isPlanningAiTesting || !planningAiSettings.apiKey.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-black px-5 py-3 text-sm font-black text-neutral-300 transition-all hover:border-indigo-500/40 hover:text-indigo-300 disabled:cursor-not-allowed disabled:border-neutral-900 disabled:text-neutral-700"
                      >
                        {isPlanningAiTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        연결 테스트
                      </button>
                      <button
                        onClick={handlePlanningToSchedule}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-200 transition-all hover:bg-cyan-500/15"
                      >
                        <ArrowRight className="h-4 w-4" /> 스케줄 초안 추가
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-neutral-900 bg-black/40 p-3">
                      <button
                        onClick={handleCopyPlanningPrompt}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-500 transition-all hover:border-neutral-700 hover:text-neutral-300"
                      >
                        <Clipboard className="h-3.5 w-3.5" /> 백업용 프롬프트 복사
                      </button>
                      <p className="mt-2 text-[11px] font-bold leading-relaxed text-neutral-700">
                        API 장애, 외부 검수, 수동 백업이 필요할 때만 사용합니다.
                      </p>
                    </div>

                    {planningAiStatus && (
                      <div className="mt-4 rounded-xl border border-neutral-800 bg-black/70 px-4 py-3 text-xs font-black text-neutral-300">
                        {planningAiStatus}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">Schedule Draft</p>
                          <h3 className="mt-2 text-lg font-black text-white">스케줄 변환 후보</h3>
                        </div>
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200">
                          {planningScheduleLines.length}개
                        </span>
                      </div>
                      <div className="space-y-2">
                        {planningScheduleLines.length > 0 ? planningScheduleLines.slice(0, 6).map((line, index) => (
                          <div key={`${line}-${index}`} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-sm font-bold text-neutral-300">
                            {index + 1}. {line}
                          </div>
                        )) : (
                          <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-5 text-sm font-bold text-neutral-600">
                            상세 설계 탭에서 {planningScheduleLabel[template]}을 입력하면 스케줄 초안으로 변환할 수 있습니다.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-white">AI 정리본</h3>
                        {planning.aiUpdatedAt && <span className="text-[10px] font-black text-neutral-600">{format(new Date(planning.aiUpdatedAt), 'MM.dd HH:mm')}</span>}
                      </div>
                      <textarea
                        className="min-h-96 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-4 text-xs font-bold leading-relaxed text-neutral-200 outline-none focus:border-indigo-500"
                        value={planning.aiDraft || ''}
                        onChange={(e) => updatePlanning({ aiDraft: e.target.value })}
                        placeholder="AI 기획 정리 결과가 여기에 저장됩니다."
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'schedule' && (
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
          <>
          <div id="scene-form" className="bg-neutral-900/40 border border-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group scroll-mt-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl font-black flex flex-wrap items-center gap-4">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  {copy.formTitle}
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-black tracking-widest">{copy.modeLabel}</span>
                  <span className={`text-[10px] px-3 py-1 rounded-full border font-black tracking-widest ${
                    canSaveScene
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}>
                    {canSaveScene ? '저장 가능' : `${sceneFormMissingFields.join(', ')} 필요`}
                  </span>
                </h3>
                <p className="text-xs font-bold text-neutral-600">
                  {canSaveScene ? '선택한 샷과 기본 제작값이 채워졌습니다.' : '장소와 진행 내용만 채우면 바로 일정에 넣을 수 있습니다.'}
                </p>
              </div>
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

                {isMusicTimelineTemplate && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-200">촬영 방식 프리셋</div>
                          <p className="mt-0.5 text-[11px] font-bold text-neutral-600">{template === 'musicvideo' ? 'MV에서 자주 쓰는 립싱크, 퍼포먼스, B-roll 구성을 먼저 잡고 세부만 수정하세요.' : '댄스커버에서 자주 쓰는 컷 구성을 먼저 잡고 세부만 수정하세요.'}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                          {[
                            ...(template === 'musicvideo'
                              ? [
                                  { label: '립싱크', shotSize: 'CU', focusMember: newSceneParams.focusMember || '아티스트', cameraGear: '립싱크 CU + 느린 푸시인', choreoNote: '입 모양 싱크 / 눈빛 / 표정', formation: '단독 립싱크' },
                                  { label: '퍼포먼스', shotSize: 'FS', focusMember: '아티스트', cameraGear: '퍼포먼스 와이드 + 핸드헬드 CU', choreoNote: '후렴 제스처 / 카메라 응시', formation: '메인 세트' },
                                  { label: 'B-roll', shotSize: 'MS', focusMember: newSceneParams.focusMember || '아티스트', cameraGear: '핸드헬드 무드 컷 / 이동 컷', choreoNote: '걷기 / 뒤돌아보기 / 공간 디테일', formation: '로케이션 이동' },
                                  { label: '인서트', shotSize: 'ECU', focusMember: '오브젝트', cameraGear: '손 / 소품 / 반사 매크로', choreoNote: '가사 모티프 디테일', formation: '인서트 컷' },
                                ]
                              : [
                                  { label: '원테이크', shotSize: 'FS', focusMember: '전체', cameraGear: 'A캠 정면 고정 풀샷', choreoNote: '전체 대형 / 동선 확인', formation: '전체 대형' },
                                  { label: '센터 포커스', shotSize: 'CS', focusMember: newSceneParams.focusMember || '센터', cameraGear: 'B캠 센터 CS 펀치인', choreoNote: '표정 / 손 포인트', formation: '센터 기준' },
                                  { label: '인서트', shotSize: 'CU', focusMember: newSceneParams.focusMember || '포인트 멤버', cameraGear: '손동작 / 표정 인서트', choreoNote: '킬링파트 디테일', formation: '인서트 컷' },
                                  { label: '엔딩', shotSize: 'LS', focusMember: '전체', cameraGear: '엔딩 포즈 와이드 + 세로 리캡', choreoNote: '엔딩 시선 / 포즈 고정', formation: '엔딩 대형' },
                                ]),
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setNewSceneParams({
                                ...newSceneParams,
                                shotSize: preset.shotSize,
                                focusMember: preset.focusMember,
                                cameraGear: preset.cameraGear,
                                choreoNote: preset.choreoNote,
                                formation: preset.formation,
                              })}
                              className="rounded-lg border border-neutral-800 bg-black/55 px-3 py-2 text-[10px] font-black text-neutral-300 transition-all hover:border-teal-300/40 hover:text-teal-100"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">구간 번호</label>
                        <input placeholder={template === 'musicvideo' ? 'MV#1' : 'D#1'} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.sceneNumber} onChange={(e) => setNewSceneParams({ ...newSceneParams, sceneNumber: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">타임코드</label>
                        <input placeholder="00:12" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.musicCue} onChange={(e) => setNewSceneParams({ ...newSceneParams, musicCue: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">샷 사이즈</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.shotSize} onChange={(e) => setNewSceneParams({ ...newSceneParams, shotSize: e.target.value })}>
                          <option value="">선택</option><option value="FS">FS</option><option value="LS">LS</option><option value="MS">MS</option><option value="CS">CS</option><option value="CU">CU</option><option value="SIDE">SIDE</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">포커스</label>
                        <input placeholder={template === 'musicvideo' ? '아티스트 / 오브젝트' : '센터 / 멤버명'} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.focusMember} onChange={(e) => setNewSceneParams({ ...newSceneParams, focusMember: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{template === 'musicvideo' ? '아티스트 / 출연' : '멤버'}</label>
                      <div className="min-h-[50px] rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                        {people.filter((person) => person.category === 'cast').length === 0 ? (
                          <button type="button" onClick={() => openPersonModal()} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">멤버 추가</button>
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
                            <button type="button" onClick={() => openPersonModal()} className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-300">+ 멤버</button>
                          </div>
                        )}
                      </div>
                      <input placeholder="예: A, B, C, D" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cast || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cast: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">가사 / 카운트</label>
                        <textarea className="h-24 w-full resize-none bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" placeholder="Do it do it Chu..." value={newSceneParams.lyrics} onChange={(e) => setNewSceneParams({ ...newSceneParams, lyrics: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">대형 / 동선</label>
                        <textarea className="h-24 w-full resize-none bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" placeholder="센터 이동, 좌우 벌림, 엔딩 포즈" value={newSceneParams.formation} onChange={(e) => setNewSceneParams({ ...newSceneParams, formation: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">안무 포인트</label>
                        <input placeholder="킬링파트 손동작, 점프, 턴" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.choreoNote} onChange={(e) => setNewSceneParams({ ...newSceneParams, choreoNote: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">카메라 플랜</label>
                        <input placeholder="정면 풀샷, CS 펀치인, 사이드 컷" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cameraGear} onChange={(e) => setNewSceneParams({ ...newSceneParams, cameraGear: e.target.value })} />
                      </div>
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

                {template === 'film' && (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">씬 브레이크다운</div>
                        <p className="mt-1 text-xs font-bold text-neutral-600">인물, 의상, 소품, 사운드, 인서트를 현장용 씬리스트로 남깁니다.</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-teal-300" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        ['props', '소품', '예: 시계, 휴대폰, 커피잔'],
                        ['costume', '의상', '예: 실내복 1, 외출복 2'],
                        ['soundNote', '사운드', '예: 차 소리, 핸드폰 진동, MOS'],
                        ['specialInstruction', '촬영지시', '예: 트래킹, 핸드헬드, VFX 필요'],
                        ['insertNote', '인서트', '예: 시계 ECU, 문고리, 손 클로즈업'],
                        ['continuityNote', '연결', '예: 가방 왼손, 컵 위치, 의상 오염'],
                      ].map(([field, label, placeholder]) => (
                        <div key={field} className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{label}</label>
                          <input
                            className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-3 text-xs font-bold text-white outline-none focus:border-teal-400/60"
                            placeholder={placeholder}
                            value={String(newSceneParams[field as keyof SceneFormState] || '')}
                            onChange={(e) => setNewSceneParams({ ...newSceneParams, [field]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      disabled={!canSaveScene}
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
                        {selectedStoryboard?.name || (newSceneParams.visualRef.startsWith('data:') ? '내 이미지' : `${copy.storyboardLabel} 없음`)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {newSceneParams.visualRef && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewSceneParams({ ...newSceneParams, visualRef: '' });
                            setCustomImageStatus('');
                          }}
                          className="prepro-btn prepro-btn--quiet h-9"
                        >
                          해제
                        </button>
                      )}
                      <label className="prepro-btn prepro-btn--secondary h-9 cursor-pointer">
                        <Upload className="h-3.5 w-3.5" />
                        내 이미지
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            handleCustomStoryboardUpload(event.target.files?.[0]);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowGallery(true)}
                        className="prepro-btn prepro-btn--primary h-9"
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
                    <div className="space-y-1 text-xs leading-relaxed text-neutral-500">
                      <p>갤러리에서 고르거나 직접 만든 이미지를 올리면 이 {copy.item}에 바로 연결됩니다.</p>
                      <p className="text-[10px] font-bold text-neutral-700">업로드 이미지는 브라우저/JSON 안에만 저장됩니다.</p>
                      {customImageStatus && <p className="text-[10px] font-black text-teal-200">{customImageStatus}</p>}
                    </div>
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
                      : template === 'musicvideo'
                        ? ['립싱크', '퍼포먼스', 'B-roll', '인서트', '네온', '클로즈업']
                      : template === 'dance'
                        ? ['풀샷', '센터', '포커스', '클로즈업', '사이드', '대형']
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
                        onClick={() => applyStoryboardToSceneForm(sb)}
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
              onOpenAnalyzer={() => setShowAnalyzer(true)}
              onResetFilters={resetScheduleFilters}
              onTimelineDragEnd={handleTimelineDragEnd}
              SortableBreakRow={SortableBreakRow}
              SortableRow={SortableRow}
            />
          </div>
          </>
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
              onGoSchedule={() => setActiveTab('schedule')}
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
              onGoSchedule={() => setActiveTab('schedule')}
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
            <StoryboardPanel
              copy={{ storyboardLabel: copy.storyboardLabel, storyboardDescription: copy.storyboardDescription }}
              featuredStoryboards={featuredStoryboards}
              onApplyStoryboard={applyStoryboardToSceneForm}
              onFallbackImage={storyboardFallback}
              onOpenGallery={() => setShowGallery(true)}
            />
          )}

          {activeTab === 'report' && (
            <ReportPanel
              copy={{ item: copy.item, itemPlural: copy.itemPlural }}
              isExportingPdf={isExportingPdf}
              isMusicTimelineTemplate={isMusicTimelineTemplate}
              location={location}
              reportActionItems={reportActionItems}
              reportLocationStats={reportLocationStats}
              reportPdfRef={reportPdfRef}
              reportSceneGroups={reportSceneGroups}
              reportStats={reportStats}
              scenes={scenes}
              shootingDate={shootingDate}
              template={template}
              templateLabel={templateLabel}
              onEnableReportMode={() => setIsReportMode(true)}
              onExportPDF={handleExportPDF}
              onGoSchedule={() => setActiveTab('schedule')}
              onLoadSampleData={handleLoadSampleData}
              onNewScene={openNewSceneForm}
              pdfButtonText={pdfButtonText}
              storyboardFallback={storyboardFallback}
            />
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
          recommendedStoryboards={recommendations}
          search={sbSearch}
          selectedVisualRef={newSceneParams.visualRef}
          showSceneForm={showSceneForm}
          totalCount={storyboardDb.length}
          onApplyStoryboard={applyStoryboardToSceneForm}
          onClose={() => setShowGallery(false)}
          onFallbackImage={storyboardFallback}
          onSetCategory={setSbCategory}
          onSetSearch={setSbSearch}
        />
        <footer className="mt-12 border-t border-neutral-900 pt-6 text-xs font-bold text-neutral-700">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>PrePro Studio © 2026. All rights reserved.</span>
            <span>Unauthorized copying, redistribution, or commercial reuse is prohibited.</span>
          </div>
        </footer>
    </main>
  </div>
  );
}
