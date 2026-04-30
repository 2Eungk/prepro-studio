import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addMinutes } from 'date-fns';
import { BreakItem, Person, ProductionLocation, ScheduleState, Scene, ShootDay } from '@/types/schedule';
import { arrayMove } from '@dnd-kit/sortable';

const dayNightRank: Record<string, number> = {
  DAY: 1,
  SUNSET: 2,
  NIGHT: 3,
};

const normalizeCast = (cast?: string) =>
  (cast || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .sort();

const castOverlapScore = (a?: string, b?: string) => {
  const castA = new Set(normalizeCast(a));
  if (castA.size === 0) return 0;
  return normalizeCast(b).filter((name) => castA.has(name)).length;
};

const sceneNumberRank = (sceneNumber?: string) => {
  const match = sceneNumber?.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const legacyStoryboardRefs: Record<string, string> = {
  '/storyboards/two_shot.webp': '/shot_67.png',
  '/storyboards/extreme_closeup.webp': '/shot_10.png',
  '/storyboards/medium_shot.webp': '/shot_06.png',
  '/storyboards/over_shoulder.webp': '/shot_70.png',
  '/storyboards/low_angle.webp': '/shot_17.png',
};

const normalizeVisualRef = (visualRef?: string) =>
  visualRef ? legacyStoryboardRefs[visualRef] || visualRef : visualRef;

const copyLabel = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? `${trimmed} COPY` : trimmed;
};

type ScheduleAnchor = Pick<Scene, 'id' | 'location' | 'locationId' | 'intExt' | 'dayNight' | 'cast' | 'castIds' | 'crewIds'>;

const normalizedText = (value?: string) => (value || '').trim().toLowerCase();

const locationKey = (item: Pick<Scene, 'location' | 'locationId'>) =>
  item.locationId || normalizedText(item.location) || 'unknown-location';

const locationById = (locations: ProductionLocation[]) =>
  new Map(locations.map((location) => [location.id, location]));

const locationAreaToken = (location?: ProductionLocation) => {
  if (!location) return '';
  const joined = [location.weatherLabel, location.address, location.weatherQuery, location.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return joined.match(/[가-힣]+구|[a-z-]+-gu/)?.[0] || '';
};

const locationTransitionPenalty = (
  previous: Pick<Scene, 'location' | 'locationId'> | undefined,
  candidate: Pick<Scene, 'location' | 'locationId'>,
  locationsById: Map<string, ProductionLocation>,
) => {
  if (!previous) return 0;
  if (locationKey(previous) === locationKey(candidate)) return 0;

  const previousLocation = previous.locationId ? locationsById.get(previous.locationId) : undefined;
  const candidateLocation = candidate.locationId ? locationsById.get(candidate.locationId) : undefined;
  const previousArea = locationAreaToken(previousLocation);
  const candidateArea = locationAreaToken(candidateLocation);

  if (previousArea && previousArea === candidateArea) return 24;
  if (previousLocation?.weatherLabel && previousLocation.weatherLabel === candidateLocation?.weatherLabel) return 28;
  if (previousLocation?.type && previousLocation.type === candidateLocation?.type) return 58;

  return 120;
};

const scenePersonKeys = (item?: Pick<Scene, 'cast' | 'castIds' | 'crewIds'>) => {
  if (!item) return [];
  const ids = [...(item.castIds || []), ...(item.crewIds || [])].map((id) => `id:${id}`);
  if (ids.length > 0) return ids.sort();
  return normalizeCast(item.cast).map((name) => `name:${normalizedText(name)}`);
};

const peopleTransitionPenalty = (a?: Pick<Scene, 'cast' | 'castIds' | 'crewIds'>, b?: Pick<Scene, 'cast' | 'castIds' | 'crewIds'>) => {
  const peopleA = new Set(scenePersonKeys(a));
  const peopleB = new Set(scenePersonKeys(b));
  if (peopleA.size === 0 && peopleB.size === 0) return 0;

  const allPeople = new Set([...peopleA, ...peopleB]);
  const overlap = [...peopleA].filter((person) => peopleB.has(person)).length;

  return allPeople.size - overlap;
};

const setupTransitionPenalty = (previous: ScheduleAnchor | undefined, candidate: Scene) => {
  if (!previous) return (dayNightRank[candidate.dayNight || ''] ?? 4) * 5;

  const previousTimeRank = dayNightRank[previous.dayNight || ''] ?? 4;
  const candidateTimeRank = dayNightRank[candidate.dayNight || ''] ?? 4;
  const backwardsTime = candidateTimeRank < previousTimeRank;
  const interiorPenalty = previous.intExt && candidate.intExt && previous.intExt !== candidate.intExt ? 14 : 0;
  const timePenalty = backwardsTime ? 42 : Math.abs(candidateTimeRank - previousTimeRank) * 10;

  return interiorPenalty + timePenalty;
};

const sceneContinuityScore = (
  previous: ScheduleAnchor | undefined,
  candidate: Scene,
  originalIndex: Map<string, number>,
  locationsById: Map<string, ProductionLocation>,
) => {
  const originalRank = originalIndex.get(candidate.id) ?? Number.MAX_SAFE_INTEGER;
  const sharedCastReward = previous ? castOverlapScore(previous.cast, candidate.cast) * 3 : 0;

  return (
    locationTransitionPenalty(previous, candidate, locationsById) +
    setupTransitionPenalty(previous, candidate) +
    peopleTransitionPenalty(previous, candidate) * 7 -
    sharedCastReward +
    originalRank * 0.015 +
    sceneNumberRank(candidate.sceneNumber) * 0.001
  );
};

const breakAnchor = (item: BreakItem, locationsById: Map<string, ProductionLocation>): ScheduleAnchor => {
  const location = item.locationId ? locationsById.get(item.locationId) : undefined;
  return {
    id: item.id,
    locationId: item.locationId,
    location: location?.name || '',
  };
};

const optimizeSceneOrder = (
  scenes: Scene[],
  originalSceneOrder: string[],
  locationsById: Map<string, ProductionLocation>,
  previousAnchor?: ScheduleAnchor,
  nextBreakAnchor?: ScheduleAnchor,
) => {
  const originalIndex = new Map(originalSceneOrder.map((id, index) => [id, index]));
  const remaining = [...scenes];
  const ordered: Scene[] = [];

  while (remaining.length > 0) {
    const previous = ordered.at(-1) || previousAnchor;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      const breakPressure = nextBreakAnchor
        ? locationTransitionPenalty(candidate, nextBreakAnchor, locationsById) * (remaining.length <= 2 ? 0.35 : 0.08)
        : 0;
      const score = sceneContinuityScore(previous, candidate, originalIndex, locationsById) + breakPressure;

      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [nextScene] = remaining.splice(bestIndex, 1);
    ordered.push(nextScene);
  }

  return ordered;
};

const optimizeTimelineByFixedBreaks = (
  scenes: Scene[],
  breaks: BreakItem[],
  originalOrder: string[],
  locations: ProductionLocation[],
) => {
  const locationsById = locationById(locations);
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const breakById = new Map(breaks.map((item) => [item.id, item]));
  const optimizedTimeline: string[] = [];
  let segmentSceneIds: string[] = [];
  let previousAnchor: ScheduleAnchor | undefined;

  const flushSegment = (nextBreak?: ScheduleAnchor) => {
    if (segmentSceneIds.length === 0) return;
    const segmentScenes = segmentSceneIds.flatMap((id) => {
      const scene = sceneById.get(id);
      return scene ? [scene] : [];
    });
    const optimizedSegment = optimizeSceneOrder(segmentScenes, segmentSceneIds, locationsById, previousAnchor, nextBreak);
    optimizedTimeline.push(...optimizedSegment.map((scene) => scene.id));
    previousAnchor = optimizedSegment.at(-1) || previousAnchor;
    segmentSceneIds = [];
  };

  originalOrder.forEach((id) => {
    const scene = sceneById.get(id);
    if (scene) {
      segmentSceneIds.push(scene.id);
      return;
    }

    const breakItem = breakById.get(id);
    if (!breakItem) return;

    const anchor = breakAnchor(breakItem, locationsById);
    flushSegment(anchor);
    optimizedTimeline.push(breakItem.id);
    previousAnchor = anchor;
  });

  flushSegment();

  return optimizedTimeline;
};

const makeId = () => crypto.randomUUID();

const sameText = (a?: string, b?: string) =>
  (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

const createDefaultDay = (date: string, callTime: Date | null, firstShotTime: Date | null): ShootDay => ({
  id: makeId(),
  date,
  callTime,
  firstShotTime,
  locationIds: [],
});

const createEmptyProjectState = () => ({
  template: 'film' as const,
  shootingDate: new Date().toISOString().split('T')[0],
  location: 'Seoul',
  weatherLabel: undefined,
  weatherLatitude: undefined,
  weatherLongitude: undefined,
  callTime: null,
  shootingStartTime: null,
  days: [],
  locations: [],
  people: [],
  breaks: [],
  scenes: [],
  timelineOrder: [],
});

const ensureLocation = (locations: ProductionLocation[], name: string): { locations: ProductionLocation[]; id?: string } => {
  const trimmed = name.trim();
  if (!trimmed) return { locations };

  const existing = locations.find((location) => sameText(location.name, trimmed) || sameText(location.weatherQuery, trimmed));
  if (existing) return { locations, id: existing.id };

  const nextLocation: ProductionLocation = {
    id: makeId(),
    name: trimmed,
    type: 'indoor',
    permitStatus: 'pending',
    weatherQuery: trimmed,
  };

  return { locations: [...locations, nextLocation], id: nextLocation.id };
};

const ensurePeople = (people: Person[], cast?: string): { people: Person[]; ids: string[] } => {
  const names = normalizeCast(cast);
  let nextPeople = [...people];
  const ids = names.map((name) => {
    const existing = nextPeople.find((person) => person.category === 'cast' && sameText(person.name, name));
    if (existing) return existing.id;

    const nextPerson: Person = {
      id: makeId(),
      name,
      category: 'cast',
      role: '출연',
    };
    nextPeople = [...nextPeople, nextPerson];
    return nextPerson.id;
  });

  return { people: nextPeople, ids };
};

const normalizeSceneModel = (
  scene: Omit<Scene, 'id' | 'startTime' | 'endTime'> | Scene,
  days: ShootDay[],
  locations: ProductionLocation[],
  people: Person[],
): { scene: Scene; days: ShootDay[]; locations: ProductionLocation[]; people: Person[] } => {
  const nextScene = { ...scene, id: 'id' in scene ? scene.id : makeId() } as Scene;
  const nextDays = days;
  let nextLocations = locations;
  let nextPeople = people;

  nextScene.visualRef = normalizeVisualRef(nextScene.visualRef);

  if (!nextScene.dayId && nextDays[0]) nextScene.dayId = nextDays[0].id;

  const locationResult = ensureLocation(nextLocations, nextScene.location || '');
  nextLocations = locationResult.locations;
  if (locationResult.id) nextScene.locationId = locationResult.id;

  const peopleResult = ensurePeople(nextPeople, nextScene.cast);
  nextPeople = peopleResult.people;
  if (nextScene.cast !== undefined) nextScene.castIds = peopleResult.ids;
  if (!nextScene.crewIds) nextScene.crewIds = [];

  return { scene: nextScene, days: nextDays, locations: nextLocations, people: nextPeople };
};

const migrateProjectData = (data: Partial<ScheduleState>) => {
  const parsedData = { ...data };
  const shootingDate = parsedData.shootingDate || new Date().toISOString().split('T')[0];

  if (parsedData.callTime) parsedData.callTime = new Date(parsedData.callTime);
  if (parsedData.shootingStartTime) parsedData.shootingStartTime = new Date(parsedData.shootingStartTime);

  let days: ShootDay[] = (parsedData.days || []).map((day) => ({
    ...day,
    callTime: day.callTime ? new Date(day.callTime) : null,
    firstShotTime: day.firstShotTime ? new Date(day.firstShotTime) : null,
    locationIds: day.locationIds || [],
  }));
  if (days.length === 0) {
    days = [createDefaultDay(shootingDate, parsedData.callTime || null, parsedData.shootingStartTime || null)];
  }

  let locations = parsedData.locations || [];
  let people = parsedData.people || [];
  const scenes = (parsedData.scenes || []).map((scene) => {
    const normalized = normalizeSceneModel(
      {
        ...scene,
        startTime: undefined,
        endTime: undefined,
      },
      days,
      locations,
      people,
    );
    days = normalized.days;
    locations = normalized.locations;
    people = normalized.people;
    return {
      ...normalized.scene,
      startTime: scene.startTime ? new Date(scene.startTime) : undefined,
      endTime: scene.endTime ? new Date(scene.endTime) : undefined,
    };
  });

  days = days.map((day) => {
    const locationIds = new Set(day.locationIds || []);
    scenes.forEach((scene) => {
      if ((scene.dayId || days[0]?.id) === day.id && scene.locationId) locationIds.add(scene.locationId);
    });
    return { ...day, locationIds: Array.from(locationIds) };
  });

  const breaks = (parsedData.breaks || []).map((item) => ({
    ...item,
    startTime: item.startTime ? new Date(item.startTime) : undefined,
    endTime: item.endTime ? new Date(item.endTime) : undefined,
    dayId: item.dayId || days[0]?.id,
  }));

  const timelineOrder = reconcileTimelineOrder(scenes, breaks, parsedData.timelineOrder);

  return { ...parsedData, days, locations, people, breaks, scenes, timelineOrder };
};

const reconcileTimelineOrder = (scenes: Scene[], breaks: BreakItem[], currentOrder: string[] = []) => {
  const validIds = new Set([...scenes.map((scene) => scene.id), ...breaks.map((item) => item.id)]);
  const nextOrder = currentOrder.filter((id) => validIds.has(id));

  [...scenes, ...breaks].forEach((item) => {
    if (!nextOrder.includes(item.id)) nextOrder.push(item.id);
  });

  return nextOrder;
};

const persistedProjectState = (state: ScheduleState) => ({
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
});

export const useScheduleStore = create<ScheduleState>()(persist((set, get) => ({
  ...createEmptyProjectState(),

  setTemplate: (template) => set({ template }),
  setShootingDate: (shootingDate) => set((state) => ({
    shootingDate,
    days: state.days.length
      ? state.days.map((day, index) => index === 0 ? { ...day, date: shootingDate } : day)
      : state.days,
  })),
  setLocation: (location) => set({ location, weatherLabel: undefined, weatherLatitude: undefined, weatherLongitude: undefined }),
  setWeatherTarget: ({ location, label, latitude, longitude }) => set({
    location,
    weatherLabel: label,
    weatherLatitude: latitude,
    weatherLongitude: longitude,
  }),
  
  setCallTime: (callTime) => {
    set({ callTime });
    get().calculateTimes();
  },
  
  setShootingStartTime: (shootingStartTime) => {
    set({ shootingStartTime });
    get().calculateTimes();
  },

  addShootDay: (date) => {
    const id = makeId();
    set((state) => {
      const existingDays = state.days.length ? state.days : [createDefaultDay(state.shootingDate, state.callTime, state.shootingStartTime)];
      const previousDay = existingDays.at(-1);
      const baseDate = date || (previousDay
        ? new Date(new Date(previousDay.date).getTime() + 86400000).toISOString().split('T')[0]
        : state.shootingDate);
      return {
        days: [...existingDays, { ...createDefaultDay(baseDate, state.callTime, state.shootingStartTime), id }],
      };
    });
    return id;
  },

  updateShootDay: (id, updates) => {
    set((state) => {
      const dayIndex = state.days.findIndex((day) => day.id === id);
      const days = state.days.map((day) => day.id === id ? { ...day, ...updates } : day);
      return {
        days,
        ...(dayIndex === 0 && updates.date ? { shootingDate: updates.date } : {}),
        ...(dayIndex === 0 && 'callTime' in updates ? { callTime: updates.callTime ?? null } : {}),
        ...(dayIndex === 0 && 'firstShotTime' in updates ? { shootingStartTime: updates.firstShotTime ?? null } : {}),
      };
    });
    get().calculateTimes();
  },

  deleteShootDay: (id) => {
    set((state) => {
      if (state.days.length <= 1) return state;
      const remainingDays = state.days.filter((day) => day.id !== id);
      const fallbackDayId = remainingDays[0]?.id;
      const scenes = state.scenes.filter((scene) => scene.dayId !== id);
      const breaks = state.breaks.filter((item) => item.dayId !== id);
      const timelineOrder = reconcileTimelineOrder(scenes, breaks, state.timelineOrder);

      return {
        days: remainingDays,
        scenes: scenes.map((scene) => scene.dayId ? scene : { ...scene, dayId: fallbackDayId }),
        breaks: breaks.map((item) => item.dayId ? item : { ...item, dayId: fallbackDayId }),
        timelineOrder,
        shootingDate: remainingDays[0]?.date || state.shootingDate,
        callTime: remainingDays[0]?.callTime ?? state.callTime,
        shootingStartTime: remainingDays[0]?.firstShotTime ?? state.shootingStartTime,
      };
    });
    get().calculateTimes();
  },

  addProductionLocation: (location) => {
    const id = makeId();
    set((state) => ({
      locations: [...state.locations, { ...location, id }],
    }));
    return id;
  },

  updateProductionLocation: (id, updates) => {
    set((state) => ({
      locations: state.locations.map((location) => location.id === id ? { ...location, ...updates } : location),
      scenes: updates.name
        ? state.scenes.map((scene) => scene.locationId === id ? { ...scene, location: updates.name || scene.location } : scene)
        : state.scenes,
    }));
  },

  deleteProductionLocation: (id) => {
    set((state) => ({
      locations: state.locations.filter((location) => location.id !== id),
      days: state.days.map((day) => ({ ...day, locationIds: day.locationIds.filter((locationId) => locationId !== id) })),
      scenes: state.scenes.map((scene) => scene.locationId === id ? { ...scene, locationId: undefined } : scene),
      breaks: state.breaks.map((item) => item.locationId === id ? { ...item, locationId: undefined } : item),
    }));
  },

  addPerson: (person) => {
    const id = makeId();
    set((state) => ({
      people: [...state.people, { ...person, id }],
    }));
    return id;
  },

  updatePerson: (id, updates) => {
    set((state) => ({
      people: state.people.map((person) => person.id === id ? { ...person, ...updates } : person),
    }));
  },

  deletePerson: (id) => {
    set((state) => {
      const deletedPerson = state.people.find((person) => person.id === id);

      return {
        people: state.people.filter((person) => person.id !== id),
        scenes: state.scenes.map((scene) => ({
          ...scene,
          cast: deletedPerson
            ? normalizeCast(scene.cast).filter((name) => !sameText(name, deletedPerson.name)).join(', ')
            : scene.cast,
          castIds: scene.castIds?.filter((personId) => personId !== id),
          crewIds: scene.crewIds?.filter((personId) => personId !== id),
        })),
      };
    });
  },

  addBreak: (item) => {
    const newBreak: BreakItem = {
      ...item,
      id: makeId(),
    };
    set((state) => ({ breaks: [...state.breaks, newBreak], timelineOrder: [...state.timelineOrder, newBreak.id] }));
    get().calculateTimes();
  },

  updateBreak: (id, updates) => {
    set((state) => ({
      breaks: state.breaks.map((item) => item.id === id ? { ...item, ...updates } : item),
    }));
    get().calculateTimes();
  },

  deleteBreak: (id) => {
    set((state) => ({
      breaks: state.breaks.filter((item) => item.id !== id),
      timelineOrder: state.timelineOrder.filter((itemId) => itemId !== id),
    }));
    get().calculateTimes();
  },
  
  addScene: (scene) => {
    set((state) => {
      const days = state.days.length ? state.days : [createDefaultDay(state.shootingDate, state.callTime, state.shootingStartTime)];
      const normalized = normalizeSceneModel(scene, days, state.locations, state.people);
      const targetDayId = normalized.scene.dayId || normalized.days[0]?.id;
      return {
        days: normalized.days.map((day) => {
          if (day.id !== targetDayId) return day;
          const locationIds = new Set(day.locationIds || []);
          if (normalized.scene.locationId) locationIds.add(normalized.scene.locationId);
          return { ...day, locationIds: Array.from(locationIds) };
        }),
        locations: normalized.locations,
        people: normalized.people,
        scenes: [...state.scenes, normalized.scene],
        timelineOrder: [...state.timelineOrder, normalized.scene.id],
      };
    });
    get().calculateTimes();
  },

  addScenes: (newScenes) => {
    set((state) => {
      let days = state.days.length ? state.days : [createDefaultDay(state.shootingDate, state.callTime, state.shootingStartTime)];
      let locations = state.locations;
      let people = state.people;
      const formattedScenes = newScenes.map((scene) => {
        const normalized = normalizeSceneModel(scene, days, locations, people);
        days = normalized.days;
        locations = normalized.locations;
        people = normalized.people;
        return normalized.scene;
      });
      return {
        days: days.map((day) => {
          const locationIds = new Set(day.locationIds || []);
          formattedScenes.forEach((scene) => {
            if ((scene.dayId || days[0]?.id) === day.id && scene.locationId) locationIds.add(scene.locationId);
          });
          return { ...day, locationIds: Array.from(locationIds) };
        }),
        locations,
        people,
        scenes: [...state.scenes, ...formattedScenes],
        timelineOrder: [...state.timelineOrder, ...formattedScenes.map((scene) => scene.id)],
      };
    });
    get().calculateTimes();
  },

  updateScene: (id, updates) => {
    set((state) => {
      let days = state.days.length ? state.days : [createDefaultDay(state.shootingDate, state.callTime, state.shootingStartTime)];
      let locations = state.locations;
      let people = state.people;
      const scenes = state.scenes.map((scene) => {
        if (scene.id !== id) return scene;
        const normalized = normalizeSceneModel({ ...scene, ...updates }, days, locations, people);
        days = normalized.days;
        locations = normalized.locations;
        people = normalized.people;
        return normalized.scene;
      });
      return {
        days: days.map((day) => {
          const locationIds = new Set(day.locationIds || []);
          scenes.forEach((scene) => {
            if ((scene.dayId || days[0]?.id) === day.id && scene.locationId) locationIds.add(scene.locationId);
          });
          return { ...day, locationIds: Array.from(locationIds) };
        }),
        locations,
        people,
        scenes,
      };
    });
    get().calculateTimes();
  },

  deleteScene: (id) => {
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id),
      timelineOrder: state.timelineOrder.filter((itemId) => itemId !== id),
    }));
    get().calculateTimes();
  },

  duplicateScene: (id) => {
    set((state) => {
      const source = state.scenes.find((scene) => scene.id === id);
      if (!source) return state;

      const copy: Scene = {
        ...source,
        id: makeId(),
        sceneNumber: copyLabel(source.sceneNumber),
        eventSection: copyLabel(source.eventSection),
        description: `${source.description} (복제)`,
        startTime: undefined,
        endTime: undefined,
        status: 'pending',
        castIds: source.castIds ? [...source.castIds] : undefined,
        crewIds: source.crewIds ? [...source.crewIds] : undefined,
      };

      const sourceIndex = state.scenes.findIndex((scene) => scene.id === id);
      const scenes = [...state.scenes];
      scenes.splice(sourceIndex + 1, 0, copy);

      const order = reconcileTimelineOrder(state.scenes, state.breaks, state.timelineOrder);
      const orderIndex = order.findIndex((itemId) => itemId === id);
      const timelineOrder = [...order];
      timelineOrder.splice(orderIndex >= 0 ? orderIndex + 1 : timelineOrder.length, 0, copy.id);

      return {
        scenes,
        timelineOrder: reconcileTimelineOrder(scenes, state.breaks, timelineOrder),
      };
    });
    get().calculateTimes();
  },

  // 드래그 앤 드롭으로 순서 변경 시 호출
  reorderScenes: (activeId, overId) => {
    set((state) => {
      const oldIndex = state.scenes.findIndex((s) => s.id === activeId);
      const newIndex = state.scenes.findIndex((s) => s.id === overId);
      if (oldIndex < 0 || newIndex < 0) return state;
      const scenes = arrayMove(state.scenes, oldIndex, newIndex);
      return { scenes, timelineOrder: reconcileTimelineOrder(scenes, state.breaks, state.timelineOrder) };
    });
    // 순서가 바뀌었으므로 시간 전체 재계산
    get().calculateTimes();
  },

  reorderTimeline: (activeId, overId) => {
    set((state) => {
      const order = reconcileTimelineOrder(state.scenes, state.breaks, state.timelineOrder);
      const oldIndex = order.findIndex((id) => id === activeId);
      const newIndex = order.findIndex((id) => id === overId);
      if (oldIndex < 0 || newIndex < 0) return {};
      return { timelineOrder: arrayMove(order, oldIndex, newIndex) };
    });
    // 순서가 바뀌었으므로 시간 전체 재계산
    get().calculateTimes();
  },

  restoreTimelineOrder: (order) => {
    set((state) => ({
      timelineOrder: reconcileTimelineOrder(state.scenes, state.breaks, order),
    }));
    get().calculateTimes();
  },

  // 날짜별 첫 촬영 시간을 기준으로 각 날짜의 시작/종료 시간을 누적 계산합니다.
  calculateTimes: () => {
    const { shootingStartTime, scenes, breaks, days } = get();
    if (scenes.length === 0 && breaks.length === 0) return;

    const order = reconcileTimelineOrder(scenes, breaks, get().timelineOrder);
    const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
    const breakById = new Map(breaks.map((item) => [item.id, item]));
    const sceneTimes = new Map<string, Pick<Scene, 'startTime' | 'endTime'>>();
    const breakTimes = new Map<string, Pick<BreakItem, 'startTime' | 'endTime' | 'dayId'>>();

    const dayIds = days.length ? days.map((day) => day.id) : ['default-day'];
    dayIds.forEach((dayId, index) => {
      const day = days.find((item) => item.id === dayId);
      const startAnchor = day?.firstShotTime || (index === 0 ? shootingStartTime : null);
      if (!startAnchor) return;

      let currentTime = new Date(startAnchor);
      order.forEach((id) => {
        const scene = sceneById.get(id);
        const breakItem = breakById.get(id);
        const item = scene || breakItem;
        if (!item) return;

        const itemDayId = item.dayId || days[0]?.id || 'default-day';
        if (itemDayId !== dayId) return;

        const startTime = new Date(currentTime);
        const endTime = addMinutes(startTime, item.estimatedMinutes);
        currentTime = endTime;

        if (scene) sceneTimes.set(id, { startTime, endTime });
        if (breakItem) breakTimes.set(id, { dayId: itemDayId, startTime, endTime });
      });
    });

    const updatedScenes = scenes.map((scene) => ({ ...scene, startTime: undefined, endTime: undefined, ...sceneTimes.get(scene.id) }));
    const updatedBreaks = breaks.map((item) => ({ ...item, startTime: undefined, endTime: undefined, ...breakTimes.get(item.id) }));

    set({ scenes: updatedScenes, breaks: updatedBreaks, timelineOrder: order });
  },

  // 장소 이동, 시간대, 배우 대기 시간을 함께 줄이는 스케줄 최적화 로직
  optimizeSchedule: (dayId) => {
    set((state) => {
      const originalOrder = reconcileTimelineOrder(state.scenes, state.breaks, state.timelineOrder);
      const targetSceneIds = new Set(
        dayId ? state.scenes.filter((scene) => (scene.dayId || state.days[0]?.id) === dayId).map((scene) => scene.id) : state.scenes.map((scene) => scene.id),
      );
      const targetBreakIds = new Set(
        dayId ? state.breaks.filter((item) => (item.dayId || state.days[0]?.id) === dayId).map((item) => item.id) : state.breaks.map((item) => item.id),
      );
      const targetIds = new Set([...targetSceneIds, ...targetBreakIds]);
      const targetOrder = originalOrder.filter((id) => targetIds.has(id));
      const targetScenes = state.scenes.filter((scene) => targetSceneIds.has(scene.id));
      const targetBreaks = state.breaks.filter((item) => targetBreakIds.has(item.id));
      const optimizedSegment = optimizeTimelineByFixedBreaks(targetScenes, targetBreaks, targetOrder, state.locations);
      const optimizedTimeline = dayId
        ? originalOrder.reduce<string[]>((nextOrder, id) => {
            if (!targetIds.has(id)) return [...nextOrder, id];
            if (nextOrder.some((itemId) => targetIds.has(itemId))) return nextOrder;
            return [...nextOrder, ...optimizedSegment];
          }, [])
        : optimizedSegment;
      const optimizedSceneIds = optimizedTimeline.filter((id) => state.scenes.some((scene) => scene.id === id));
      const sceneById = new Map(state.scenes.map((scene) => [scene.id, scene]));
      const sortedScenes = dayId
        ? state.scenes.map((scene) => scene)
        : optimizedSceneIds.flatMap((id) => {
            const scene = sceneById.get(id);
            return scene ? [scene] : [];
          });

      return {
        scenes: sortedScenes,
        timelineOrder: reconcileTimelineOrder(sortedScenes, state.breaks, optimizedTimeline),
      };
    });
    get().calculateTimes();
  },

  loadSampleData: () => {
    if (get().template === 'ad') {
      const today = new Date();
      today.setHours(8, 0, 0, 0);
      const start = addMinutes(today, 60);
      const dayId = makeId();
      const studioId = makeId();
      const kitchenId = makeId();
      const streetId = makeId();
      const modelId = makeId();
      const directorId = makeId();
      const dpId = makeId();
      const lunchId = makeId();

      const sampleLocations: ProductionLocation[] = [
        { id: studioId, name: '화이트 스튜디오 A', address: '서울시 성동구 성수동', type: 'studio', permitStatus: 'ok', contact: '스튜디오 매니저', weatherQuery: '서울시 성동구 성수동', weatherLabel: 'Seongdong-gu, Seoul', weatherLatitude: 37.5446, weatherLongitude: 127.0557 },
        { id: kitchenId, name: '키친 세트', address: '서울시 성동구 성수동', type: 'indoor', permitStatus: 'ok', contact: '아트팀', weatherQuery: '서울시 성동구 성수동', weatherLabel: 'Seongdong-gu, Seoul', weatherLatitude: 37.5446, weatherLongitude: 127.0557 },
        { id: streetId, name: '성수동 골목', address: '서울시 성동구 성수동', type: 'outdoor', permitStatus: 'pending', contact: '로케이션 코디네이터', weatherQuery: '서울시 성동구 성수동', weatherLabel: 'Seongdong-gu, Seoul', weatherLatitude: 37.5446, weatherLongitude: 127.0557 },
      ];

      const samplePeople: Person[] = [
        { id: modelId, name: '메인 모델', category: 'cast', role: '제품 사용 컷', callTime: '08:30' },
        { id: directorId, name: '감독', category: 'crew', role: '연출', callTime: '08:00' },
        { id: dpId, name: '촬영감독', category: 'crew', role: '카메라/조명', callTime: '08:00' },
      ];

      const sampleScenes = [
        { id: makeId(), dayId, locationId: studioId, location: '화이트 스튜디오 A', description: '제품 단독 히어로 컷. 로고와 패키지 전면이 선명하게 보이도록 촬영한다.', estimatedMinutes: 50, sceneNumber: 'C#1', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '', castIds: [], crewIds: [directorId, dpId], cutCount: 6, visualRef: '/shot_56.png', lightingNote: '하이키, 깨끗한 그림자', clientMemo: '브랜드 로고 3초 이상 노출' },
        { id: makeId(), dayId, locationId: kitchenId, location: '키친 세트', description: '모델이 제품을 자연스럽게 사용하는 라이프스타일 컷. 손동작과 표정 리액션을 확보한다.', estimatedMinutes: 70, sceneNumber: 'C#2', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '메인 모델', castIds: [modelId], crewIds: [directorId, dpId], cutCount: 10, visualRef: '/shot_117.png', lightingNote: '부드러운 사이드 키', clientMemo: '사용 장면은 과장 없이 프리미엄 톤' },
        { id: makeId(), dayId, locationId: studioId, location: '화이트 스튜디오 A', description: '제품 디테일 인서트. 질감, 버튼, 라벨, 패키지 개봉 컷을 매크로로 촬영한다.', estimatedMinutes: 40, sceneNumber: 'C#3', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '', castIds: [], crewIds: [dpId], cutCount: 8, visualRef: '/shot_11.png', lightingNote: '반사 컨트롤, 플래그 사용', clientMemo: '상세 페이지용 세로 크롭 고려' },
        { id: makeId(), dayId, locationId: streetId, location: '성수동 골목', description: '외부 무드 컷. 모델 워킹, 제품 휴대 장면, 도시 배경 B-roll을 촬영한다.', estimatedMinutes: 80, sceneNumber: 'C#4', intExt: 'EXT' as const, dayNight: 'DAY' as const, cast: '메인 모델', castIds: [modelId], crewIds: [directorId, dpId], cutCount: 12, visualRef: '/shot_108.png', lightingNote: '자연광 + 반사판', clientMemo: 'SNS 숏폼용 움직임 확보' },
        { id: makeId(), dayId, locationId: studioId, location: '화이트 스튜디오 A', description: '엔드카드와 CTA 컷. 제품, 카피, 브랜드 컬러 배치를 확인하며 촬영한다.', estimatedMinutes: 30, sceneNumber: 'C#5', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '', castIds: [], crewIds: [directorId, dpId], cutCount: 4, visualRef: '/shot_47.png', lightingNote: '정면 대칭, 균일 조명', clientMemo: '최종 슬레이트 문구 확인' },
      ];

      set({
        template: 'ad',
        location: '서울시 성동구 성수동',
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: today.toISOString().split('T')[0], callTime: today, firstShotTime: start, locationIds: [studioId, kitchenId, streetId] }],
        locations: sampleLocations,
        people: samplePeople,
        breaks: [{ id: lunchId, dayId, type: 'meal', label: '점심 / 제품 세팅 리셋', estimatedMinutes: 50, locationId: studioId }],
        scenes: sampleScenes,
        timelineOrder: [
          sampleScenes[0].id,
          sampleScenes[1].id,
          lunchId,
          sampleScenes[2].id,
          sampleScenes[3].id,
          sampleScenes[4].id,
        ],
      });
      get().calculateTimes();
      return;
    }

    if (get().template === 'event') {
      const today = new Date();
      today.setHours(8, 30, 0, 0);
      const start = addMinutes(today, 60);
      const dayId = makeId();
      const hallId = makeId();
      const lobbyId = makeId();
      const stageId = makeId();
      const mcId = makeId();
      const speakerId = makeId();
      const directorId = makeId();
      const lunchId = makeId();

      const sampleLocations: ProductionLocation[] = [
        { id: hallId, name: '컨벤션홀 A', address: '서울시 강남구 삼성동', type: 'indoor', permitStatus: 'ok', contact: '행사장 운영팀', weatherQuery: '서울시 강남구 삼성동', weatherLabel: 'Gangnam-gu, Seoul', weatherLatitude: 37.5118, weatherLongitude: 127.0592 },
        { id: lobbyId, name: '로비 / 포토월', address: '서울시 강남구 삼성동', type: 'indoor', permitStatus: 'ok', contact: '브랜드 운영팀', weatherQuery: '서울시 강남구 삼성동', weatherLabel: 'Gangnam-gu, Seoul', weatherLatitude: 37.5118, weatherLongitude: 127.0592 },
        { id: stageId, name: '메인 무대', address: '서울시 강남구 삼성동', type: 'indoor', permitStatus: 'ok', contact: '무대 감독', weatherQuery: '서울시 강남구 삼성동', weatherLabel: 'Gangnam-gu, Seoul', weatherLatitude: 37.5118, weatherLongitude: 127.0592 },
      ];

      const samplePeople: Person[] = [
        { id: mcId, name: '사회자', category: 'cast', role: '진행', callTime: '09:00' },
        { id: speakerId, name: '대표 연사', category: 'cast', role: '키노트', callTime: '10:00' },
        { id: directorId, name: '현장 PD', category: 'crew', role: '운영 총괄', callTime: '08:30' },
      ];

      const samplePrograms = [
        { id: makeId(), dayId, locationId: lobbyId, location: '로비 / 포토월', description: '게스트 도착, 등록 데스크, 포토월 인터뷰와 현장 스케치를 촬영한다.', estimatedMinutes: 60, eventSection: '입장 / 등록', cameraGear: '짐벌 + 핸드헬드', cast: '사회자', castIds: [mcId], crewIds: [directorId], visualRef: '/shot_123.png' },
        { id: makeId(), dayId, locationId: stageId, location: '메인 무대', description: '사회자 오프닝 멘트, 행사 소개, 전체 객석 리액션을 커버한다.', estimatedMinutes: 30, eventSection: '오프닝', cameraGear: '삼각대 A캠 + 객석 B캠', cast: '사회자', castIds: [mcId], crewIds: [directorId], visualRef: '/shot_15.png' },
        { id: makeId(), dayId, locationId: stageId, location: '메인 무대', description: '대표 연사 키노트 발표. 슬라이드, 연사 클로즈업, 청중 반응을 순차 촬영한다.', estimatedMinutes: 70, eventSection: '키노트', cameraGear: 'A캠 고정 + 망원 B캠', cast: '대표 연사', castIds: [speakerId], crewIds: [directorId], visualRef: '/shot_06.png' },
        { id: makeId(), dayId, locationId: hallId, location: '컨벤션홀 A', description: '패널 토크와 질의응답. 패널 전체, 질문자, 객석 박수 컷을 확보한다.', estimatedMinutes: 60, eventSection: '패널 / Q&A', cameraGear: '투캠 + 무선 마이크 체크', cast: '사회자, 대표 연사', castIds: [mcId, speakerId], crewIds: [directorId], visualRef: '/shot_107.png' },
        { id: makeId(), dayId, locationId: lobbyId, location: '로비 / 포토월', description: '네트워킹, 브랜드 부스, 참가자 인터뷰, 엔딩 현장 분위기를 촬영한다.', estimatedMinutes: 50, eventSection: '네트워킹 / 클로징', cameraGear: '짐벌 + 인터뷰 마이크', cast: '', castIds: [], crewIds: [directorId], visualRef: '/shot_80.png' },
      ];

      set({
        template: 'event',
        location: '서울시 강남구 삼성동',
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: today.toISOString().split('T')[0], callTime: today, firstShotTime: start, locationIds: [hallId, lobbyId, stageId] }],
        locations: sampleLocations,
        people: samplePeople,
        breaks: [{ id: lunchId, dayId, type: 'meal', label: '스태프 식사 / 장비 점검', estimatedMinutes: 50, locationId: hallId }],
        scenes: samplePrograms,
        timelineOrder: [
          samplePrograms[0].id,
          samplePrograms[1].id,
          lunchId,
          samplePrograms[2].id,
          samplePrograms[3].id,
          samplePrograms[4].id,
        ],
      });
      get().calculateTimes();
      return;
    }

    const today = new Date();
    today.setHours(8, 0, 0, 0); // 기본 콜타임 08:00
    const start = addMinutes(today, 60); // 촬영 시작 09:00
    const dayId = makeId();
    const homeId = makeId();
    const stationId = makeId();
    const riverId = makeId();
    const chulsooId = makeId();
    const youngheeId = makeId();
    const lunchId = makeId();

    const sampleLocations: ProductionLocation[] = [
      { id: homeId, name: '철수네 거실', address: '서울시 마포구', type: 'indoor', permitStatus: 'ok', contact: '로케이션 매니저', weatherQuery: '서울시 마포구', weatherLabel: 'Mapo-gu, Seoul', weatherLatitude: 37.5663, weatherLongitude: 126.9019 },
      { id: stationId, name: '강남역 11번 출구', address: '서울시 강남구', type: 'outdoor', permitStatus: 'pending', contact: '강남구청', weatherQuery: '강남역', weatherLabel: 'Gangnam-gu, Seoul', weatherLatitude: 37.4979, weatherLongitude: 127.0276 },
      { id: riverId, name: '한강 공원', address: '서울시 영등포구', type: 'outdoor', permitStatus: 'ok', contact: '공원 관리사무소', weatherQuery: '서울시 영등포구 한강 공원', weatherLabel: 'Yeongdeungpo-gu, Seoul', weatherLatitude: 37.5263, weatherLongitude: 126.8963 },
    ];

    const samplePeople: Person[] = [
      { id: chulsooId, name: '철수', category: 'cast', role: '주연', callTime: '08:00' },
      { id: youngheeId, name: '영희', category: 'cast', role: '주연', callTime: '08:30' },
    ];

    const sampleScenes = [
      { id: makeId(), dayId, locationId: homeId, location: '철수네 거실', description: '철수와 영희가 아침 식사를 하며 대화한다.', estimatedMinutes: 60, sceneNumber: 'S#1', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 5, pageCount: 1.5, visualRef: '/shot_67.png' },
      { id: makeId(), dayId, locationId: homeId, location: '철수네 거실', description: '철수가 시계를 보며 당황한다.', estimatedMinutes: 30, sceneNumber: 'S#2', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수', castIds: [chulsooId], crewIds: [], cutCount: 3, pageCount: 0.5, visualRef: '/shot_10.png' },
      { id: makeId(), dayId, locationId: stationId, location: '강남역 11번 출구', description: '영희가 누군가를 기다린다.', estimatedMinutes: 90, sceneNumber: 'S#3', intExt: 'EXT' as const, dayNight: 'DAY' as const, cast: '영희', castIds: [youngheeId], crewIds: [], cutCount: 8, pageCount: 2.0, visualRef: '/shot_06.png' },
      { id: makeId(), dayId, locationId: stationId, location: '강남역 11번 출구', description: '철수가 뛰어와 영희와 만난다.', estimatedMinutes: 120, sceneNumber: 'S#4', intExt: 'EXT' as const, dayNight: 'SUNSET' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 12, pageCount: 3.0, visualRef: '/shot_70.png' },
      { id: makeId(), dayId, locationId: riverId, location: '한강 공원', description: '두 사람이 야경을 보며 걷는다.', estimatedMinutes: 60, sceneNumber: 'S#5', intExt: 'EXT' as const, dayNight: 'NIGHT' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 6, pageCount: 1.0, visualRef: '/shot_17.png' },
    ];

    set({
      template: 'film',
      location: 'Seoul',
      callTime: today,
      shootingStartTime: start,
      days: [{ id: dayId, date: today.toISOString().split('T')[0], callTime: today, firstShotTime: start, locationIds: [homeId, stationId, riverId] }],
      locations: sampleLocations,
      people: samplePeople,
      breaks: [{ id: lunchId, dayId, type: 'meal', label: '점심 식사', estimatedMinutes: 60, locationId: stationId }],
      scenes: sampleScenes,
      timelineOrder: [
        sampleScenes[0].id,
        sampleScenes[1].id,
        lunchId,
        sampleScenes[2].id,
        sampleScenes[3].id,
        sampleScenes[4].id,
      ],
    });
    get().calculateTimes();
  },

  importData: (data) => {
    const parsedData = migrateProjectData(data);
    set(parsedData);
    get().calculateTimes();
  },

  resetProject: () => {
    set(createEmptyProjectState());
  },
}), {
  name: 'prepro-studio-project-v2',
  version: 3,
  storage: createJSONStorage(() => localStorage),
  partialize: persistedProjectState,
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...migrateProjectData(persistedState as Partial<ScheduleState>),
  }),
  onRehydrateStorage: () => (state) => {
    state?.calculateTimes();
  },
}));
