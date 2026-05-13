export type TemplateType = 'film' | 'event' | 'ad' | 'dance' | 'musicvideo';

export type StoryboardCategory = 'WIDE' | 'MEDIUM' | 'CLOSEUP' | 'ANGLE' | 'LENS' | 'COMPOSITION' | 'SUBJECT' | 'LIGHTING';

export interface StoryboardShot {
  id: string;
  name: string;
  category: StoryboardCategory;
  description: string;
  url: string;
  keywords: string[];
}

export interface Scene {
  id: string;
  dayId?: string;
  locationId?: string;
  castIds?: string[];
  crewIds?: string[];
  // [공통 필드]
  location: string;
  description: string;
  estimatedMinutes: number; 
  startTime?: Date; 
  endTime?: Date;   

  // [영화/드라마 모드 전용]
  sceneNumber?: string;
  intExt?: 'INT' | 'EXT';
  dayNight?: 'DAY' | 'NIGHT' | 'SUNSET';
  cast?: string;
  cutCount?: number;
  pageCount?: number;
  props?: string;
  costume?: string;
  soundNote?: string;
  specialInstruction?: string;
  insertNote?: string;
  continuityNote?: string;
  takeNote?: string;
  lensNote?: string;
  slateNote?: string;

  // [행사/스케치 모드 전용]
  eventSection?: string; // 예: 1부, 2부, 리허설 등
  cameraGear?: string;   // 예: A7S3, DJI Drone 등

  // [광고/스튜디오 모드 전용]
  visualRef?: string;    // 콘티 이미지 URL
  lightingNote?: string; // 조명 톤앤매너
  clientMemo?: string;   // 클라이언트/감독 코멘트

  // [댄스커버 모드 전용]
  musicCue?: string;     // 예: 00:12 / Verse 1
  lyrics?: string;       // 해당 구간 가사
  choreoNote?: string;   // 안무 포인트 / 동선
  focusMember?: string;  // 포커스 멤버
  shotSize?: string;     // FS / CS / LS / MS 등
  formation?: string;    // 대형 / 위치 변화
  status?: 'pending' | 'done' | 'ng'; // 촬영 상태 추가
}

export interface ShootDay {
  id: string;
  date: string;
  callTime?: Date | null;
  firstShotTime?: Date | null;
  locationIds: string[];
  notes?: string;
}

export interface ProductionLocation {
  id: string;
  name: string;
  address?: string;
  type: 'studio' | 'indoor' | 'outdoor';
  permitStatus: 'ok' | 'pending' | 'none';
  contact?: string;
  notes?: string;
  weatherQuery?: string;
  weatherLabel?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  storyFit?: string;
  visualCheck?: string;
  soundCheck?: string;
  powerCheck?: string;
  accessCheck?: string;
  weatherRisk?: string;
}

export interface Person {
  id: string;
  name: string;
  category: 'cast' | 'crew';
  role?: string;
  phone?: string;
  callTime?: string;
  notes?: string;
}

export interface BreakItem {
  id: string;
  dayId?: string;
  type: 'meal' | 'move' | 'setup' | 'rest' | 'custom';
  label: string;
  estimatedMinutes: number;
  locationId?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface PlanningDocument {
  projectTitle: string;
  projectType: TemplateType;
  productionScale: 'lean' | 'standard' | 'premium';
  projectFormat?: 'short_film' | 'feature_film' | 'series';
  purpose: string;
  oneLiner: string;
  audience: string;
  coreMessage: string;
  sections: Record<string, Record<string, string>>;
  aiDraft?: string;
  aiUpdatedAt?: string;
}

export interface ScheduleState {
  template: TemplateType;
  shootingDate: string; // YYYY-MM-DD
  location: string;    // 촬영지 주소/명칭
  weatherLabel?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  callTime: Date | null;
  shootingStartTime: Date | null;
  days: ShootDay[];
  locations: ProductionLocation[];
  people: Person[];
  breaks: BreakItem[];
  scenes: Scene[];
  timelineOrder: string[];
  planning: PlanningDocument;
  
  // Actions
  setTemplate: (template: TemplateType) => void;
  setShootingDate: (date: string) => void;
  setLocation: (location: string) => void;
  setWeatherTarget: (target: { location: string; label?: string; latitude?: number; longitude?: number }) => void;
  setCallTime: (time: Date | null) => void;
  setShootingStartTime: (time: Date | null) => void;
  addShootDay: (date?: string) => string;
  updateShootDay: (id: string, updates: Partial<ShootDay>) => void;
  deleteShootDay: (id: string) => void;
  addProductionLocation: (location: Omit<ProductionLocation, 'id'>) => string;
  updateProductionLocation: (id: string, updates: Partial<ProductionLocation>) => void;
  deleteProductionLocation: (id: string) => void;
  addPerson: (person: Omit<Person, 'id'>) => string;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addBreak: (item: Omit<BreakItem, 'id' | 'startTime' | 'endTime'>) => void;
  updateBreak: (id: string, updates: Partial<BreakItem>) => void;
  deleteBreak: (id: string) => void;
  addScene: (scene: Omit<Scene, 'id' | 'startTime' | 'endTime'>) => void;
  addScenes: (scenes: Omit<Scene, 'id' | 'startTime' | 'endTime'>[]) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  duplicateScene: (id: string) => void;
  reorderScenes: (activeId: string, overId: string) => void;
  reorderTimeline: (activeId: string, overId: string) => void;
  restoreTimelineOrder: (order: string[]) => void;
  calculateTimes: () => void;
  optimizeSchedule: (dayId?: string) => void;
  updatePlanning: (updates: Partial<PlanningDocument>) => void;
  updatePlanningField: (sectionId: string, fieldId: string, value: string) => void;
  resetPlanning: (template?: TemplateType) => void;
  loadSampleData: () => void;
  importData: (data: Partial<ScheduleState>) => void;
  resetProject: () => void;
}
