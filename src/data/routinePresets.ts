import type { ScheduleState, Scene, TemplateType } from '@/types/schedule';

export type ProjectSnapshot = Pick<
  ScheduleState,
  'template' | 'shootingDate' | 'location' | 'weatherLabel' | 'weatherLatitude' | 'weatherLongitude' | 'callTime' | 'shootingStartTime' | 'days' | 'locations' | 'people' | 'breaks' | 'scenes' | 'timelineOrder' | 'planning' | 'sampleProjectNotice'
>;

export type RoutinePreset = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  badge: string;
  source: 'built-in' | 'local';
  template: TemplateType;
  project?: ProjectSnapshot;
  buildProject?: (shootingDate: string) => ProjectSnapshot;
  createdAt?: string;
};

export const routinePresetStorageKey = 'prepro-routine-presets-v1';

const uid = () => crypto.randomUUID();

const routineTime = (date: string, hour: number, minute = 0) => {
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value;
};

const createBuiltInRoutineProject = (kind: 'interview-sketch' | 'event-sketch' | 'product-ad', shootingDate: string): ProjectSnapshot => {
  const ids = {
    day: uid(),
    locationA: uid(),
    locationB: uid(),
    locationC: uid(),
    castA: uid(),
    castB: uid(),
    crewA: uid(),
    crewB: uid(),
    breakA: uid(),
    breakB: uid(),
  };

  if (kind === 'event-sketch') {
    const callTime = routineTime(shootingDate, 8, 30);
    const shootingStartTime = routineTime(shootingDate, 9, 20);
    const scenes: Scene[] = [
      { id: uid(), dayId: ids.day, locationId: ids.locationB, location: '로비 / 등록대', description: '참석자 입장, 등록, 명찰, 웰컴 사인과 현장 분위기 스케치.', estimatedMinutes: 45, eventSection: '입장 / 등록', cameraGear: '짐벌 + 핸드헬드', cast: '현장 MC', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], visualRef: '/shot_123.png' },
      { id: uid(), dayId: ids.day, locationId: ids.locationC, location: '메인 무대', description: '오프닝 멘트, 무대 와이드, 객석 리액션, 박수 컷 확보.', estimatedMinutes: 35, eventSection: '오프닝', cameraGear: 'A캠 고정 + B캠 망원', cast: '현장 MC', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], visualRef: '/shot_15.png' },
      { id: uid(), dayId: ids.day, locationId: ids.locationC, location: '메인 무대', description: '핵심 발표. 슬라이드, 발표자 CU, 청중 반응을 안전 컷으로 남긴다.', estimatedMinutes: 70, eventSection: '키노트', cameraGear: 'A캠 고정 + 망원 B캠', cast: '키노트 연사', castIds: [ids.castB], crewIds: [ids.crewA, ids.crewB], visualRef: '/shot_06.png' },
      { id: uid(), dayId: ids.day, locationId: ids.locationB, location: '로비 / 인터뷰존', description: '참석자 인터뷰 3명, 브랜드 담당자 코멘트, 네트워킹 스케치.', estimatedMinutes: 55, eventSection: '인터뷰 / 네트워킹', cameraGear: '무선 마이크 + 조명 1등', cast: '현장 MC, 키노트 연사', castIds: [ids.castA, ids.castB], crewIds: [ids.crewA], visualRef: '/shot_80.png' },
    ];

    return {
      template: 'event', shootingDate, location: '행사장', callTime, shootingStartTime,
      weatherLabel: undefined, weatherLatitude: undefined, weatherLongitude: undefined,
      days: [{ id: ids.day, date: shootingDate, callTime, firstShotTime: shootingStartTime, locationIds: [ids.locationA, ids.locationB, ids.locationC], notes: '식순 변경 시 운영팀 단톡 기준으로 업데이트' }],
      locations: [
        { id: ids.locationA, name: '행사장 전체', type: 'indoor', permitStatus: 'pending', notes: '촬영 가능 구역과 촬영 제한 구역 확인' },
        { id: ids.locationB, name: '로비 / 등록대', type: 'indoor', permitStatus: 'pending', notes: '포토월, 등록 데스크, 인터뷰존 동선 확인' },
        { id: ids.locationC, name: '메인 무대', type: 'indoor', permitStatus: 'pending', notes: 'A캠 고정 위치, 음향 라인아웃, 발표 자료 저작권 확인' },
      ],
      people: [
        { id: ids.castA, name: '현장 MC', category: 'cast', role: '진행 / 인터뷰', callTime: '09:00' },
        { id: ids.castB, name: '키노트 연사', category: 'cast', role: '발표 / 인터뷰 후보', callTime: '10:00' },
        { id: ids.crewA, name: '촬영감독', category: 'crew', role: 'A캠 / 조명', callTime: '08:30' },
        { id: ids.crewB, name: 'B캠 / 짐벌', category: 'crew', role: '스케치 / 리액션', callTime: '08:30' },
      ],
      breaks: [{ id: ids.breakA, dayId: ids.day, type: 'meal', label: '스태프 식사 / 카드 백업', estimatedMinutes: 45, locationId: ids.locationA }],
      scenes,
      timelineOrder: [scenes[0].id, scenes[1].id, ids.breakA, scenes[2].id, scenes[3].id],
      planning: { projectTitle: '행사 스케치 루틴', projectType: 'event', productionScale: 'standard', purpose: '행사 기록 / 하이라이트 제작', oneLiner: '식순과 커버리지를 기준으로 핵심 장면 누락을 막는 행사 스케치', audience: '주최사, 참석자, PR/SNS 시청자', coreMessage: '행사의 성황과 핵심 메시지를 짧고 명확하게 남긴다.', sections: { program: { runOfShow: '입장 / 등록\n오프닝\n키노트\n스태프 식사 / 카드 백업\n인터뷰 / 네트워킹' }, coverage: { mustShots: '외관, 등록, 무대 와이드, 발표자 CU, 객석 리액션, 인터뷰, 네트워킹', cameraPlan: 'A캠 고정, B캠 망원, 짐벌 로비, 인터뷰 무선 마이크' }, operation: { dataPlan: '세션 종료마다 카드 백업, 당일 전달 폴더 분리' } } },
      sampleProjectNotice: '',
    };
  }

  if (kind === 'product-ad') {
    const callTime = routineTime(shootingDate, 8, 0);
    const shootingStartTime = routineTime(shootingDate, 9, 0);
    const scenes: Scene[] = [
      { id: uid(), dayId: ids.day, locationId: ids.locationA, location: '제품 테이블 세트', description: '제품 히어로 컷. 로고, 패키지, 질감을 깨끗한 조명으로 확보한다.', estimatedMinutes: 45, sceneNumber: 'C#1', intExt: 'INT', dayNight: 'DAY', cast: '', castIds: [], crewIds: [ids.crewA, ids.crewB], cutCount: 6, visualRef: '/shot_56.png', lightingNote: '하이키 + 반사 플래그', clientMemo: '로고 가림 금지' },
      { id: uid(), dayId: ids.day, locationId: ids.locationB, location: '라이프스타일 세트', description: '모델 사용 장면. 실제 손동작, 표정 리액션, 사용 전후를 촬영한다.', estimatedMinutes: 70, sceneNumber: 'C#2', intExt: 'INT', dayNight: 'DAY', cast: '메인 모델', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], cutCount: 10, visualRef: '/shot_117.png', lightingNote: '부드러운 사이드 키', clientMemo: '과장 연기보다 자연스러운 사용감' },
      { id: uid(), dayId: ids.day, locationId: ids.locationA, location: '제품 테이블 세트', description: '디테일 인서트. 버튼, 질감, 패키지 오픈, 손 클로즈업을 매크로로 확보한다.', estimatedMinutes: 40, sceneNumber: 'C#3', intExt: 'INT', dayNight: 'DAY', cast: '메인 모델', castIds: [ids.castA], crewIds: [ids.crewB], cutCount: 8, visualRef: '/shot_11.png', lightingNote: '반사 컨트롤', clientMemo: '상세페이지 크롭 고려' },
      { id: uid(), dayId: ids.day, locationId: ids.locationC, location: '외부 무드 동선', description: '짧은 워킹/B-roll. 숏폼 전환 컷과 자연광 무드 컷을 확보한다.', estimatedMinutes: 55, sceneNumber: 'C#4', intExt: 'EXT', dayNight: 'DAY', cast: '메인 모델', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], cutCount: 8, visualRef: '/shot_108.png', lightingNote: '자연광 + 반사판', clientMemo: '9:16 숏폼 여백 확보' },
    ];

    return {
      template: 'ad', shootingDate, location: '제품 촬영지', callTime, shootingStartTime,
      weatherLabel: undefined, weatherLatitude: undefined, weatherLongitude: undefined,
      days: [{ id: ids.day, date: shootingDate, callTime, firstShotTime: shootingStartTime, locationIds: [ids.locationA, ids.locationB, ids.locationC], notes: '제품 컨디션과 승인 컷 우선' }],
      locations: [
        { id: ids.locationA, name: '제품 테이블 세트', type: 'studio', permitStatus: 'ok', notes: '반사, 로고 방향, 예비 제품 확인' },
        { id: ids.locationB, name: '라이프스타일 세트', type: 'indoor', permitStatus: 'pending', notes: '모델 동선, 소품, 배경 정리' },
        { id: ids.locationC, name: '외부 무드 동선', type: 'outdoor', permitStatus: 'pending', notes: '우천 대체 컷과 보행자 통제 확인' },
      ],
      people: [
        { id: ids.castA, name: '메인 모델', category: 'cast', role: '제품 사용 / 손 연기', callTime: '08:30' },
        { id: ids.crewA, name: '감독', category: 'crew', role: '연출 / 클라이언트 확인', callTime: '08:00' },
        { id: ids.crewB, name: '촬영감독', category: 'crew', role: '카메라 / 조명', callTime: '08:00' },
      ],
      breaks: [{ id: ids.breakA, dayId: ids.day, type: 'setup', label: '제품 세팅 리셋 / 점심', estimatedMinutes: 50, locationId: ids.locationA }],
      scenes,
      timelineOrder: [scenes[0].id, scenes[1].id, ids.breakA, scenes[2].id, scenes[3].id],
      planning: { projectTitle: '제품/광고 루틴', projectType: 'ad', productionScale: 'standard', purpose: '브랜드 메시지 전달 / 전환 유도', oneLiner: '제품 히어로, 사용 장면, 디테일, 숏폼 B-roll까지 하루 안에 확보하는 광고 루틴', audience: '제품 구매를 고민하는 온라인 시청자', coreMessage: '제품의 장점이 실제 사용 장면에서 바로 이해된다.', sections: { brief: { product: '제품명 / 주요 기능 / 필수 노출 입력', mandatory: '로고, 패키지, 사용법, 고지 문구, CTA 확인' }, structure: { contentFlow: '제품 히어로 컷\n모델 사용 장면\n디테일 인서트\n외부 무드 B-roll' }, production: { productHandling: '스크래치 없는 제품, 예비 패키지, 반사 체크', deliverables: '16:9 본편, 9:16 숏폼, 썸네일, 상세페이지 GIF' } } },
      sampleProjectNotice: '',
    };
  }

  const callTime = routineTime(shootingDate, 8, 30);
  const shootingStartTime = routineTime(shootingDate, 9, 30);
  const scenes: Scene[] = [
    { id: uid(), dayId: ids.day, locationId: ids.locationA, location: '인터뷰 공간', description: '인터뷰 세팅. 배경 정리, 조명, 마이크 테스트, 첫 질문 리허설.', estimatedMinutes: 35, sceneNumber: 'I#1', intExt: 'INT', dayNight: 'DAY', cast: '인터뷰이', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], visualRef: '/shot_67.png', cameraGear: 'A캠 MS + B캠 CU', soundNote: '무선 마이크 + 룸톤 30초' },
    { id: uid(), dayId: ids.day, locationId: ids.locationA, location: '인터뷰 공간', description: '메인 인터뷰. 핵심 질문 5개, 리액션, 손/표정 컷을 함께 확보한다.', estimatedMinutes: 75, sceneNumber: 'I#2', intExt: 'INT', dayNight: 'DAY', cast: '인터뷰이', castIds: [ids.castA], crewIds: [ids.crewA, ids.crewB], visualRef: '/shot_06.png', cameraGear: '투캠 고정 + 오디오 모니터링', soundNote: '답변 겹침 방지, 에어컨 소음 체크' },
    { id: uid(), dayId: ids.day, locationId: ids.locationB, location: '작업 / 활동 공간', description: '스케치 B-roll. 인터뷰 내용과 연결되는 행동, 손, 도구, 공간 디테일을 촬영한다.', estimatedMinutes: 55, sceneNumber: 'B#1', intExt: 'INT', dayNight: 'DAY', cast: '인터뷰이', castIds: [ids.castA], crewIds: [ids.crewA], visualRef: '/shot_76.png', cameraGear: '핸드헬드 / 짐벌', insertNote: '손, 도구, 간판, 표정 리액션' },
    { id: uid(), dayId: ids.day, locationId: ids.locationC, location: '외부 전경', description: '오프닝/엔딩용 외관, 이동, 간판, 주변 분위기 컷.', estimatedMinutes: 35, sceneNumber: 'B#2', intExt: 'EXT', dayNight: 'DAY', cast: '', castIds: [], crewIds: [ids.crewA], visualRef: '/shot_108.png', cameraGear: '와이드 + 디테일 인서트', insertNote: '편집 연결용 5초 이상 홀드' },
  ];

  return {
    template: 'film', shootingDate, location: '인터뷰 촬영지', callTime, shootingStartTime,
    weatherLabel: undefined, weatherLatitude: undefined, weatherLongitude: undefined,
    days: [{ id: ids.day, date: shootingDate, callTime, firstShotTime: shootingStartTime, locationIds: [ids.locationA, ids.locationB, ids.locationC], notes: '인터뷰 오디오는 가장 먼저 확인' }],
    locations: [
      { id: ids.locationA, name: '인터뷰 공간', type: 'indoor', permitStatus: 'pending', notes: '소음, 역광, 배경 정리, 콘센트 확인' },
      { id: ids.locationB, name: '작업 / 활동 공간', type: 'indoor', permitStatus: 'pending', notes: 'B-roll 동선과 촬영 허가 확인' },
      { id: ids.locationC, name: '외부 전경', type: 'outdoor', permitStatus: 'pending', notes: '우천 대체 컷, 보행자/간판 노출 확인' },
    ],
    people: [
      { id: ids.castA, name: '인터뷰이', category: 'cast', role: '메인 인터뷰', callTime: '09:00' },
      { id: ids.crewA, name: '감독 / 촬영', category: 'crew', role: '질문 / 카메라', callTime: '08:30' },
      { id: ids.crewB, name: '오디오 / 보조', category: 'crew', role: '마이크 / 데이터', callTime: '08:30' },
    ],
    breaks: [
      { id: ids.breakA, dayId: ids.day, type: 'setup', label: '조명 / 오디오 세팅', estimatedMinutes: 30, locationId: ids.locationA },
      { id: ids.breakB, dayId: ids.day, type: 'move', label: 'B-roll 공간 이동 / 데이터 백업', estimatedMinutes: 25, locationId: ids.locationB },
    ],
    scenes,
    timelineOrder: [ids.breakA, scenes[0].id, scenes[1].id, ids.breakB, scenes[2].id, scenes[3].id],
    planning: { projectTitle: '인터뷰 + 스케치 루틴', projectType: 'film', productionScale: 'lean', projectFormat: 'short_film', purpose: '인터뷰 기반 숏폼/브랜디드 다큐 제작', oneLiner: '핵심 인터뷰와 현장 스케치 컷을 하루 안에 안전하게 확보한다.', audience: '브랜드/기관 SNS 시청자와 내부 공유 대상', coreMessage: '사람의 말과 현장 디테일로 메시지를 설득한다.', sections: { brief: { logline: '한 명의 인터뷰이가 현장에서 경험과 메시지를 직접 전한다.' }, structure: { sceneOutline: '인터뷰 세팅\n메인 인터뷰\n작업/활동 B-roll\n외부 전경 / 엔딩 컷' }, production: { technicalNeeds: '투캠, 무선 마이크, 키라이트, 반사판, 백업 저장장치', mustHave: '명확한 답변, 룸톤, 손/공간 인서트, 외관 와이드' } } },
    sampleProjectNotice: '',
  };
};

export const builtInRoutinePresets: RoutinePreset[] = [
  { id: 'interview-sketch', title: '인터뷰 + 스케치', subtitle: '소규모 다큐 / 브랜드 인터뷰', detail: '투캠 인터뷰, 오디오 체크, 작업 B-roll, 외부 전경까지 바로 촬영표로 만듭니다.', badge: '4씬 · 2시간 40분', source: 'built-in', template: 'film', buildProject: (shootingDate) => createBuiltInRoutineProject('interview-sketch', shootingDate) },
  { id: 'event-sketch', title: '행사 스케치', subtitle: '컨퍼런스 / 발표 / 네트워킹', detail: '등록, 오프닝, 키노트, 인터뷰/네트워킹 커버리지를 식순 기준으로 배치합니다.', badge: '4프로그램 · 행사장 3존', source: 'built-in', template: 'event', buildProject: (shootingDate) => createBuiltInRoutineProject('event-sketch', shootingDate) },
  { id: 'product-ad', title: '제품 / 광고 촬영', subtitle: '히어로 컷 + 사용 컷 + 인서트', detail: '제품 단독, 모델 사용, 디테일, 숏폼 B-roll을 승인/납품 메모와 함께 구성합니다.', badge: '4컷 · 3세트', source: 'built-in', template: 'ad', buildProject: (shootingDate) => createBuiltInRoutineProject('product-ad', shootingDate) },
];
