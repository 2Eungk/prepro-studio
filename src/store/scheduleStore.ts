import { create } from 'zustand';
import { addMinutes } from 'date-fns';
import { ScheduleState } from '@/types/schedule';
import { arrayMove } from '@dnd-kit/sortable';

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  template: 'film',
  callTime: null,
  shootingStartTime: null,
  scenes: [],

  setTemplate: (template) => set({ template }),
  
  setCallTime: (callTime) => {
    set({ callTime });
    get().calculateTimes();
  },
  
  setShootingStartTime: (shootingStartTime) => {
    set({ shootingStartTime });
    get().calculateTimes();
  },
  
  addScene: (scene) => {
    const newScene = { ...scene, id: crypto.randomUUID() };
    set((state) => ({ scenes: [...state.scenes, newScene] }));
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
}));
