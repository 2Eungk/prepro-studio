export type TemplateType = 'film' | 'event' | 'ad';

export interface Scene {
  id: string;
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

  // [행사/스케치 모드 전용]
  eventSection?: string; // 예: 1부, 2부, 리허설 등
  cameraGear?: string;   // 예: A7S3, DJI Drone 등

  // [광고/스튜디오 모드 전용]
  visualRef?: string;    // 콘티 이미지 URL
  lightingNote?: string; // 조명 톤앤매너
  clientMemo?: string;   // 클라이언트/감독 코멘트
}

export interface ScheduleState {
  template: TemplateType;
  callTime: Date | null;
  shootingStartTime: Date | null;
  scenes: Scene[];
  
  // Actions
  setTemplate: (template: TemplateType) => void;
  setCallTime: (time: Date | null) => void;
  setShootingStartTime: (time: Date | null) => void;
  addScene: (scene: Omit<Scene, 'id' | 'startTime' | 'endTime'>) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  reorderScenes: (activeId: string, overId: string) => void;
  calculateTimes: () => void;
}
