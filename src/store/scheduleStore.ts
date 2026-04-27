import { create } from 'zustand';
import { addMinutes } from 'date-fns';
import { ScheduleState, Scene } from '@/types/schedule';
import { arrayMove } from '@dnd-kit/sortable';

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  template: 'film',
  shootingDate: new Date().toISOString().split('T')[0],
  location: 'Seoul',
  callTime: null,
  shootingStartTime: null,
  scenes: [],

  setTemplate: (template) => set({ template }),
  setShootingDate: (shootingDate) => set({ shootingDate }),
  setLocation: (location) => set({ location }),
  
  setCallTime: (callTime) => {
    set({ callTime });
    get().calculateTimes();
  },
  
  setShootingStartTime: (shootingStartTime) => {
    set({ shootingStartTime });
    get().calculateTimes();
  },
  
  addScene: (scene) => {
    const newScene: Scene = {
      ...scene,
      id: crypto.randomUUID(),
    };
    set((state) => ({ scenes: [...state.scenes, newScene] }));
    get().calculateTimes();
  },

  addScenes: (newScenes) => {
    const formattedScenes: Scene[] = newScenes.map(s => ({
      ...s,
      id: crypto.randomUUID(),
    }));
    set((state) => ({ scenes: [...state.scenes, ...formattedScenes] }));
    get().calculateTimes();
  },

  updateScene: (id, updates) => {
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().calculateTimes();
  },

  deleteScene: (id) => {
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id),
    }));
    get().calculateTimes();
  },

  // 드래그 앤 드롭으로 순서 변경 시 호출
  reorderScenes: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.scenes.findIndex((s) => s.id === activeId);
      const newIndex = state.scenes.findIndex((s) => s.id === overId);
      return { scenes: arrayMove(state.scenes, oldIndex, newIndex) };
    });
    // 순서가 바뀌었으므로 시간 전체 재계산
    get().calculateTimes();
  },

  // 첫 촬영 시간을 기준으로 모든 씬의 시작/종료 시간을 누적 계산하는 핵심 로직
  calculateTimes: () => {
    const { shootingStartTime, scenes } = get();
    if (!shootingStartTime || scenes.length === 0) return;

    let currentTime = new Date(shootingStartTime);
    const updatedScenes = scenes.map((scene) => {
      const startTime = new Date(currentTime);
      const endTime = addMinutes(startTime, scene.estimatedMinutes);
      currentTime = endTime; // 다음 씬의 시작 시간은 현재 씬의 종료 시간
      
      return {
        ...scene,
        startTime,
        endTime,
      };
    });

    set({ scenes: updatedScenes });
  },

  // 시나리오 기반 AI 스케줄 최적화 로직
  optimizeSchedule: () => {
    set((state) => {
      const sortedScenes = [...state.scenes].sort((a, b) => {
        // 1순위: 장소 (Location) - 동일 장소끼리 묶음
        if (a.location !== b.location) return a.location.localeCompare(b.location);
        
        // 2순위: 낮/밤 (Day -> Sunset -> Night) - 조명/시간대 최적화
        const getDayNightScore = (dn?: string) => dn === 'DAY' ? 1 : dn === 'SUNSET' ? 2 : dn === 'NIGHT' ? 3 : 4;
        const scoreA = getDayNightScore(a.dayNight);
        const scoreB = getDayNightScore(b.dayNight);
        if (scoreA !== scoreB) return scoreA - scoreB;

        // 3순위: 배우 (Cast) - 동일 배우끼리 묶어 배우 대기시간 최소화
        const castA = a.cast || '';
        const castB = b.cast || '';
        if (castA !== castB) return castA.localeCompare(castB);

        return 0;
      });
      return { scenes: sortedScenes };
    });
    get().calculateTimes();
  },

  loadSampleData: () => {
    const today = new Date();
    today.setHours(8, 0, 0, 0); // 기본 콜타임 08:00
    const start = addMinutes(today, 60); // 촬영 시작 09:00

    const sampleScenes = [
      { id: crypto.randomUUID(), location: '철수네 거실', description: '철수와 영희가 아침 식사를 하며 대화한다.', estimatedMinutes: 60, sceneNumber: 'S#1', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수, 영희', cutCount: 5, pageCount: 1.5, visualRef: '/storyboards/two_shot.webp' },
      { id: crypto.randomUUID(), location: '철수네 거실', description: '철수가 시계를 보며 당황한다.', estimatedMinutes: 30, sceneNumber: 'S#2', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수', cutCount: 3, pageCount: 0.5, visualRef: '/storyboards/extreme_closeup.webp' },
      { id: crypto.randomUUID(), location: '강남역 11번 출구', description: '영희가 누군가를 기다린다.', estimatedMinutes: 90, sceneNumber: 'S#3', intExt: 'EXT' as const, dayNight: 'DAY' as const, cast: '영희', cutCount: 8, pageCount: 2.0, visualRef: '/storyboards/medium_shot.webp' },
      { id: crypto.randomUUID(), location: '강남역 11번 출구', description: '철수가 뛰어와 영희와 만난다.', estimatedMinutes: 120, sceneNumber: 'S#4', intExt: 'EXT' as const, dayNight: 'SUNSET' as const, cast: '철수, 영희', cutCount: 12, pageCount: 3.0, visualRef: '/storyboards/over_shoulder.webp' },
      { id: crypto.randomUUID(), location: '한강 공원', description: '두 사람이 야경을 보며 걷는다.', estimatedMinutes: 60, sceneNumber: 'S#5', intExt: 'EXT' as const, dayNight: 'NIGHT' as const, cast: '철수, 영희', cutCount: 6, pageCount: 1.0, visualRef: '/storyboards/low_angle.webp' },
    ];

    set({
      template: 'film',
      location: 'Seoul',
      callTime: today,
      shootingStartTime: start,
      scenes: sampleScenes,
    });
    get().calculateTimes();
  },

  importData: (data) => {
    // string 속성으로 넘어온 날짜 데이터를 Date 객체로 변환
    const parsedData = { ...data };
    if (parsedData.callTime) parsedData.callTime = new Date(parsedData.callTime);
    if (parsedData.shootingStartTime) parsedData.shootingStartTime = new Date(parsedData.shootingStartTime);
    if (parsedData.scenes) {
      parsedData.scenes = parsedData.scenes.map(s => ({
        ...s,
        startTime: s.startTime ? new Date(s.startTime) : undefined,
        endTime: s.endTime ? new Date(s.endTime) : undefined,
      }));
    }
    
    set(parsedData);
    get().calculateTimes();
  },
}));
