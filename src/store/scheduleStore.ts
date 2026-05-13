import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { addMinutes } from 'date-fns';
import type { BreakItem, Person, PlanningDocument, ProductionLocation, ScheduleState, Scene, ShootDay, TemplateType } from '@/types/schedule';
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

const getKoreaTodayString = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value || '2000';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
};

const formatDateFromDate = (date: Date) => date.toISOString().split('T')[0];

const sameText = (a?: string, b?: string) =>
  (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

const createDefaultDay = (date: string, callTime: Date | null, firstShotTime: Date | null): ShootDay => ({
  id: makeId(),
  date,
  callTime,
  firstShotTime,
  locationIds: [],
});

const createDefaultPlanning = (template: TemplateType = 'film'): PlanningDocument => ({
  projectTitle: '',
  projectType: template,
  productionScale: 'standard',
  projectFormat: template === 'film' ? 'short_film' : undefined,
  purpose: template === 'event' ? '행사 기록 / 하이라이트 제작' : template === 'ad' ? '브랜드 메시지 전달 / 전환 유도' : template === 'musicvideo' ? '뮤직비디오 기획 / 촬영 운영' : template === 'dance' ? '댄스커버 콘티 / 촬영 운영' : '작품 개발 / 촬영 준비',
  oneLiner: '',
  audience: '',
  coreMessage: '',
  sections: {},
  aiDraft: '',
  aiUpdatedAt: undefined,
});

const createEmptyProjectState = () => ({
  template: 'film' as const,
  shootingDate: getKoreaTodayString(),
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
  planning: createDefaultPlanning('film'),
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
  const shootingDate = parsedData.shootingDate || getKoreaTodayString();

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
  const template = parsedData.template || 'film';
  const planning = {
    ...createDefaultPlanning(template),
    ...(parsedData.planning || {}),
    projectType: parsedData.planning?.projectType || template,
    productionScale: parsedData.planning?.productionScale || 'standard',
    projectFormat: parsedData.planning?.projectFormat || (template === 'film' ? 'short_film' : undefined),
    sections: parsedData.planning?.sections || {},
  };

  return { ...parsedData, days, locations, people, breaks, scenes, timelineOrder, planning };
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
  planning: state.planning,
});

const createDeferredLocalStorage = (): StateStorage => {
  let pendingTimer: number | undefined;
  let pendingName = '';
  let pendingValue = '';

  const flush = () => {
    if (!pendingName) return;
    window.localStorage.setItem(pendingName, pendingValue);
    pendingName = '';
    pendingValue = '';
    pendingTimer = undefined;
  };

  return {
    getItem: (name) => window.localStorage.getItem(name),
    setItem: (name, value) => {
      pendingName = name;
      pendingValue = value;
      if (pendingTimer) window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(flush, 450);
    },
    removeItem: (name) => {
      if (pendingTimer) window.clearTimeout(pendingTimer);
      pendingName = '';
      pendingValue = '';
      pendingTimer = undefined;
      window.localStorage.removeItem(name);
    },
  };
};

export const useScheduleStore = create<ScheduleState>()(persist((set, get) => ({
  ...createEmptyProjectState(),

  setTemplate: (template) => set((state) => ({
    template,
    planning: {
      ...state.planning,
      projectType: template,
      purpose: state.planning.purpose || createDefaultPlanning(template).purpose,
    },
  })),
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
        ? formatDateFromDate(new Date(new Date(`${previousDay.date}T00:00:00`).getTime() + 86400000))
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

  updatePlanning: (updates) => {
    set((state) => ({
      planning: {
        ...state.planning,
        ...updates,
        sections: updates.sections || state.planning.sections,
      },
    }));
  },

  updatePlanningField: (sectionId, fieldId, value) => {
    set((state) => ({
      planning: {
        ...state.planning,
        sections: {
          ...state.planning.sections,
          [sectionId]: {
            ...(state.planning.sections[sectionId] || {}),
            [fieldId]: value,
          },
        },
      },
    }));
  },

  resetPlanning: (template) => {
    set((state) => ({ planning: createDefaultPlanning(template || state.template) }));
  },

  loadSampleData: () => {
    if (get().template === 'musicvideo') {
      const today = new Date();
      today.setHours(8, 30, 0, 0);
      const start = addMinutes(today, 60);
      const dayId = makeId();
      const studioId = makeId();
      const rooftopId = makeId();
      const streetId = makeId();
      const artistId = makeId();
      const directorId = makeId();
      const dpId = makeId();
      const artId = makeId();
      const resetId = makeId();

      const sampleLocations: ProductionLocation[] = [
        { id: studioId, name: '블랙 박스 스튜디오', address: '서울시 성동구 성수동', type: 'studio', permitStatus: 'ok', contact: '스튜디오 매니저', weatherQuery: '서울시 성동구 성수동', weatherLabel: 'Seongdong-gu, Seoul', weatherLatitude: 37.5446, weatherLongitude: 127.0557, storyFit: '립싱크와 무빙라이트를 통제하기 좋은 메인 퍼포먼스 공간', visualCheck: '검은 배경, 바닥 반사, 무빙라이트 위치 체크', soundCheck: '플레이백 스피커와 립싱크 모니터링 가능', powerCheck: '조명 전원 분리, 멀티탭 여유 확인' },
        { id: rooftopId, name: '루프탑 야간 세트', address: '서울시 용산구', type: 'outdoor', permitStatus: 'pending', contact: '건물 관리팀', weatherQuery: '서울시 용산구', weatherLabel: 'Yongsan-gu, Seoul', weatherLatitude: 37.5326, weatherLongitude: 126.9905, storyFit: '후렴의 해방감과 도시 야경을 보여주는 공간', visualCheck: '야경 노출, 안전 난간, 네온 실루엣 체크', soundCheck: '바람과 도로 소음은 립싱크 플레이백만 사용', accessCheck: '엘리베이터 장비 반입, 야간 허가 확인', weatherRisk: '강풍/우천 시 스튜디오 네온 세트로 대체' },
        { id: streetId, name: '성수 골목 B-roll', address: '서울시 성동구', type: 'outdoor', permitStatus: 'pending', contact: '로케이션 코디네이터', weatherQuery: '서울시 성동구 성수동', weatherLabel: 'Seongdong-gu, Seoul', weatherLatitude: 37.5446, weatherLongitude: 127.0557, storyFit: '가사 속 고립감과 이동감을 만드는 몽타주 공간', visualCheck: '간판, 차량, 보행자 동선, 반사 유리 확인', soundCheck: '동시녹음 없음. 플레이백 소음 민원만 주의', accessCheck: '소형 짐벌/핸드헬드 위주로 최소 인원 운영' },
      ];

      const samplePeople: Person[] = [
        { id: artistId, name: '아티스트', category: 'cast', role: '립싱크 / 퍼포먼스', callTime: '09:00' },
        { id: directorId, name: '감독', category: 'crew', role: '연출 / 콘셉트', callTime: '08:30' },
        { id: dpId, name: '촬영감독', category: 'crew', role: '카메라 / 조명', callTime: '08:30' },
        { id: artId, name: '미술/스타일링', category: 'crew', role: '의상, 소품, 세트', callTime: '08:30' },
      ];

      const sampleScenes = [
        { id: makeId(), dayId, locationId: studioId, location: '블랙 박스 스튜디오', description: '프리 인트로. 아티스트 실루엣과 키 오브젝트를 매크로 인서트로 연결한다.', estimatedMinutes: 35, sceneNumber: 'MV#1', cast: '아티스트', castIds: [artistId], crewIds: [directorId, dpId, artId], visualRef: '/shot_151.png', musicCue: '00:00', lyrics: 'Instrumental intro', choreoNote: '손, 목걸이, 그림자 인서트', focusMember: '아티스트', shotSize: 'ECU/CU', formation: '정지 포즈', cameraGear: '매크로 인서트 + 슬로모션', lightingNote: '틸 백라이트와 약한 오렌지 키', costume: '블랙 재킷, 실버 액세서리', props: '목걸이, 낡은 카세트' },
        { id: makeId(), dayId, locationId: studioId, location: '블랙 박스 스튜디오', description: 'Verse 1 립싱크. 카메라는 천천히 푸시인하고 눈빛과 입 모양 싱크를 우선 확보한다.', estimatedMinutes: 50, sceneNumber: 'MV#2', cast: '아티스트', castIds: [artistId], crewIds: [directorId, dpId], visualRef: '/shot_10.png', musicCue: '00:18', lyrics: '첫 벌스 가사 / 낮은 감정', choreoNote: '시선 회피 후 정면 응시', focusMember: '아티스트', shotSize: 'CU', formation: '단독 립싱크', cameraGear: '돌리 푸시인, 50mm', lightingNote: '낮은 콘트라스트, 눈 캐치라이트', soundNote: '플레이백 기준 립싱크 싱크 체크' },
        { id: makeId(), dayId, locationId: rooftopId, location: '루프탑 야간 세트', description: '후렴 퍼포먼스. 도시 야경을 배경으로 풀샷과 클로즈업을 모두 확보한다.', estimatedMinutes: 80, sceneNumber: 'MV#3', cast: '아티스트', castIds: [artistId], crewIds: [directorId, dpId, artId], visualRef: '/shot_171.png', musicCue: '01:02', lyrics: 'Hook / chorus', choreoNote: '후렴 제스처, 카메라를 향한 워킹', focusMember: '아티스트', shotSize: 'FS/CU', formation: '루프탑 중앙 -> 난간 라인', cameraGear: '짐벌 와이드 + 핸드헬드 CU', lightingNote: '네온 엣지, 야경 노출 유지', weatherRisk: '강풍 시 헤어/의상 고정 필요' },
        { id: makeId(), dayId, locationId: streetId, location: '성수 골목 B-roll', description: '브릿지 몽타주. 걷는 발, 간판 반사, 손 인서트로 감정 전환을 만든다.', estimatedMinutes: 45, sceneNumber: 'MV#4', cast: '아티스트', castIds: [artistId], crewIds: [directorId, dpId], visualRef: '/shot_108.png', musicCue: '01:48', lyrics: 'Bridge / 숨 고르는 구간', choreoNote: '걷기, 뒤돌아보기, 손 클로즈업', focusMember: '아티스트', shotSize: 'MS/Insert', formation: '골목 이동', cameraGear: '핸드헬드, 35mm, 느린 셔터감', lightingNote: '거리 조명 활용, 반사 하이라이트' },
        { id: makeId(), dayId, locationId: studioId, location: '블랙 박스 스튜디오', description: '엔딩 립싱크와 히어로 컷. 썸네일 후보용 정면 프레임을 별도로 확보한다.', estimatedMinutes: 45, sceneNumber: 'MV#5', cast: '아티스트', castIds: [artistId], crewIds: [directorId, dpId, artId], visualRef: '/shot_75.png', musicCue: '02:36', lyrics: 'Final hook / outro', choreoNote: '정면 응시, 손을 내리는 엔딩', focusMember: '아티스트', shotSize: 'MS/CU', formation: '단독 히어로', cameraGear: '정면 고정 + 세로 썸네일 리캡', lightingNote: '오렌지 키 강화, 배경 틸 유지', clientMemo: '썸네일 후보 5장 확보' },
      ];

      set({
        template: 'musicvideo',
        location: '서울시 성동구 성수동',
        planning: {
          ...createDefaultPlanning('musicvideo'),
          productionScale: 'standard',
          projectTitle: 'Midnight Signal MV',
          oneLiner: '도시의 밤을 배경으로 고립감이 해방감으로 변하는 원데이 뮤직비디오',
          audience: '아티스트 팬덤, 유튜브/쇼츠 시청자, 라이브 클립 유입층',
          coreMessage: '혼자 남은 밤에도 신호는 결국 닿는다.',
          sections: {
            brief: {
              songInfo: 'Midnight Signal, 3분 10초, 신스팝/R&B, BPM 96, 원데이 촬영',
              artistImage: '차갑지만 섬세한 보컬, 절제된 움직임, 눈빛 중심의 퍼포먼스',
              concept: '틸 도시광과 오렌지 키라이트가 충돌하는 밤. 카세트와 반사 유리를 반복 모티프로 사용',
              audienceRelease: '유튜브 본편, 15초 티저 2개, 후렴 쇼츠 3개, 썸네일은 정면 CU',
            },
            structure: {
              cueSheet: '00:00 Intro - 카세트/손/실루엣 인서트\n00:18 Verse 1 - 스튜디오 립싱크 CU\n01:02 Hook - 루프탑 퍼포먼스 FS/CU\n01:48 Bridge - 성수 골목 B-roll 몽타주\n02:36 Final Hook - 히어로 립싱크와 썸네일 컷',
              lyricsMap: 'Verse는 낮은 시선, Hook은 정면 응시, Bridge는 이동감, Outro는 정지',
              performanceMap: '스튜디오 립싱크 안전본, 루프탑 후렴 퍼포먼스, 엔딩 히어로 컷',
              narrativeBeat: '카세트 -> 도시 이동 -> 루프탑 해방 -> 다시 정면 응시',
            },
            visual: {
              visualMotif: '틸/오렌지 대비, 반사 유리, 카세트, 손 인서트, 고립된 도시광',
              shotLanguage: '립싱크 CU, 퍼포먼스 FS, 핸드헬드 B-roll, 매크로 인서트, 느린 푸시인',
              colorLighting: '블랙 베이스, 틸 백라이트, 오렌지 키, 야경 하이라이트',
              stylingArt: '블랙 재킷, 실버 액세서리, 카세트, 최소 세트 드레싱',
            },
            production: {
              locationPlan: '성수 스튜디오 + 용산 루프탑 + 성수 골목. 우천 시 루프탑은 스튜디오 네온 세트로 대체',
              coveragePlan: '립싱크 안전본, 후렴 풀샷, CU 리액션, 손/소품 인서트, B-roll 몽타주',
              lowBudgetPlan: '스튜디오와 골목 중심으로 압축하고 루프탑은 1시간만 운영. 조명은 LED 튜브와 실내 무빙라이트 위주',
              risk: '야간 허가, 강풍, 립싱크 싱크, 스타일링 지연, 음원/크레딧 표기',
              deliverables: '16:9 본편, 9:16 쇼츠 3개, 15초 티저 2개, 썸네일 5장, 클린본',
            },
          },
        },
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: getKoreaTodayString(), callTime: today, firstShotTime: start, locationIds: [studioId, rooftopId, streetId] }],
        locations: sampleLocations,
        people: samplePeople,
        breaks: [{ id: resetId, dayId, type: 'setup', label: '스타일링 / 조명 리셋', estimatedMinutes: 40, locationId: studioId }],
        scenes: sampleScenes,
        timelineOrder: [sampleScenes[0].id, sampleScenes[1].id, resetId, sampleScenes[2].id, sampleScenes[3].id, sampleScenes[4].id],
      });
      get().calculateTimes();
      return;
    }

    if (get().template === 'dance') {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const start = addMinutes(today, 60);
      const dayId = makeId();
      const studioId = makeId();
      const memberAId = makeId();
      const memberBId = makeId();
      const memberCId = makeId();
      const memberDId = makeId();
      const directorId = makeId();
      const breakId = makeId();

      const sampleLocations: ProductionLocation[] = [
        { id: studioId, name: '댄스 스튜디오 A', address: '서울시 마포구 합정동', type: 'studio', permitStatus: 'ok', contact: '스튜디오 매니저', weatherQuery: '서울시 마포구 합정동', weatherLabel: 'Mapo-gu, Seoul', weatherLatitude: 37.5497, weatherLongitude: 126.9136 },
      ];

      const samplePeople: Person[] = [
        { id: memberAId, name: '멤버 A', category: 'cast', role: '센터 / 보컬 파트', callTime: '10:30' },
        { id: memberBId, name: '멤버 B', category: 'cast', role: '랩 파트 / 좌측', callTime: '10:30' },
        { id: memberCId, name: '멤버 C', category: 'cast', role: '댄스 브레이크', callTime: '10:30' },
        { id: memberDId, name: '멤버 D', category: 'cast', role: '우측 / 엔딩 포즈', callTime: '10:30' },
        { id: directorId, name: '촬영감독', category: 'crew', role: '카메라 / 편집 기준', callTime: '10:00' },
      ];

      const sampleScenes = [
        { id: makeId(), dayId, locationId: studioId, location: '댄스 스튜디오 A', description: '인트로 전체 대형 확인. 네 명이 한 프레임에 들어오도록 정면 원테이크 풀샷을 유지한다.', estimatedMinutes: 12, sceneNumber: 'D#1', cast: '멤버 A, 멤버 B, 멤버 C, 멤버 D', castIds: [memberAId, memberBId, memberCId, memberDId], crewIds: [directorId], visualRef: '/shot_171.png', musicCue: '00:00', lyrics: 'Intro count 5-6-7-8', choreoNote: '대형 시작, 손 포인트 동작', focusMember: '전체', shotSize: 'FS', formation: '4인 가로 대형', cameraGear: 'A캠 정면 고정 풀샷' },
        { id: makeId(), dayId, locationId: studioId, location: '댄스 스튜디오 A', description: '첫 가사 진입. 센터 멤버의 표정과 손동작을 클로즈업으로 보강한다.', estimatedMinutes: 10, sceneNumber: 'D#2', cast: '멤버 A, 멤버 B', castIds: [memberAId, memberBId], crewIds: [directorId], visualRef: '/shot_173.png', musicCue: '00:12', lyrics: "Do it do it Chu, It's true true", choreoNote: '손 하트 후 좌우 스텝', focusMember: '멤버 A', shotSize: 'CS', formation: '센터 A, B 보조', cameraGear: 'B캠 CS 펀치인' },
        { id: makeId(), dayId, locationId: studioId, location: '댄스 스튜디오 A', description: '프리코러스 대형 변화. 좌우 이동이 커서 안전 와이드 확보 후 멤버별 포인트 컷을 촬영한다.', estimatedMinutes: 14, sceneNumber: 'D#3', cast: '멤버 A, 멤버 B, 멤버 C, 멤버 D', castIds: [memberAId, memberBId, memberCId, memberDId], crewIds: [directorId], visualRef: '/shot_177.png', musicCue: '00:28', lyrics: 'Yeah Baby Yeah Baby', choreoNote: '대각선 이동, 턴 후 정면', focusMember: '멤버 C', shotSize: 'FS/CS', formation: '대각선 -> 일렬', cameraGear: '풀샷 후 C 멤버 CS' },
        { id: makeId(), dayId, locationId: studioId, location: '댄스 스튜디오 A', description: '후렴 킬링파트. 원테이크용 풀샷과 숏폼용 세로 클로즈업을 모두 확보한다.', estimatedMinutes: 16, sceneNumber: 'D#4', cast: '멤버 A, 멤버 B, 멤버 C, 멤버 D', castIds: [memberAId, memberBId, memberCId, memberDId], crewIds: [directorId], visualRef: '/shot_181.png', musicCue: '00:35', lyrics: '매일 수백 번 상상하며', choreoNote: '점프, 팔 라인, 엔딩 시선', focusMember: '전체 -> 멤버 D', shotSize: 'FS/LS', formation: '센터 D 엔딩', cameraGear: 'A캠 풀샷 + 세로 리캡' },
      ];

      set({
        template: 'dance',
        location: '서울시 마포구 합정동',
        planning: {
          ...createDefaultPlanning('dance'),
          productionScale: 'standard',
          projectTitle: '엘리크루 댄스커버',
          oneLiner: '원곡 안무의 포인트를 살리되 멤버별 포커스 컷으로 완성도를 높이는 댄스커버',
          audience: 'K-pop 댄스커버 팬과 숏폼 시청자',
          coreMessage: '안무 정확도, 팀 합, 멤버별 매력을 동시에 보여준다.',
          sections: {
            brief: {
              songInfo: 'K-pop 커버곡, 약 3분 풀버전, 4인 구성, 가로 풀버전과 세로 숏폼 동시 제작',
              concept: '원곡 무드 재현 + 스튜디오 클린룩. 의상은 블랙/화이트/데님 계열',
              members: '멤버 A 센터/보컬, 멤버 B 좌측 랩, 멤버 C 댄스 브레이크, 멤버 D 엔딩 포즈',
              reference: '원곡 안무 영상, 릴레이댄스, 직캠. CS/FS 표기 기준으로 촬영',
            },
            structure: {
              cueSheet: "00:00 Intro count 5-6-7-8 - FS 전체 대형\n00:12 Do it do it Chu - CS 멤버 A 포커스\n00:28 Yeah Baby Yeah Baby - FS/CS 대형 변화\n00:35 매일 수백 번 상상하며 - FS 후 멤버 D 포커스",
              lyricsMap: '가사별 손동작과 시선 처리 체크. 포인트 가사는 빨간 박스처럼 포커스 표시',
              formationMap: '4인 가로 대형 -> 대각선 -> 센터 교체 -> 엔딩 포즈',
              highlightMoments: '손 하트, 턴, 점프, 후렴 팔 라인, 엔딩 시선',
            },
            camera: {
              coverageMode: '원테이크 풀버전은 필수로 두지 않고, 기본 사이즈별로 구간을 따며 부족한 손동작/표정/센터 전환 인서트를 추가 촬영',
              shotLanguage: 'FS 기본, 킬링파트 CS, 대형 변화는 LS/FS, 숏폼용 세로 컷 별도 확보',
              cameraPlan: 'A캠 정면 고정 풀샷, B캠 클로즈업, 필요 시 후렴만 세로 리캡',
              coverageRules: '체력 배분을 위해 곡 전체 원테이크 반복은 최소화. 파트별 FS/CS/LS를 먼저 찍고, 모자란 인서트만 추가',
              insertPlan: '손동작, 표정, 센터 교체, 엔딩 포즈, 킬링파트는 별도 인서트로 보강',
              editPlan: '가로 퍼포먼스 컷 1개, 세로 숏폼 3개, 썸네일 후보 5장',
            },
            production: {
              locationSetup: '댄스 스튜디오 A, 회색 벽, 미끄럼 적은 바닥, 상단 조명 플리커 체크',
              styling: '블랙/화이트/데님. 신발 바닥 소음과 미끄럼 체크',
              rehearsal: '촬영 전 30분 대형 마킹, 카메라 리허설 2회. 체력 배분을 위해 후렴/킬링파트만 반복',
              risk: '동선 충돌, 바닥 미끄럼, 조명 플리커, 음원 권리, 체력 저하',
              deliverables: '가로 풀버전, 세로 하이라이트, 썸네일, 크레딧, 업로드 일정 확인',
            },
          },
        },
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: getKoreaTodayString(), callTime: today, firstShotTime: start, locationIds: [studioId] }],
        locations: sampleLocations,
        people: samplePeople,
        breaks: [{ id: breakId, dayId, type: 'rest', label: '리허설 / 물 체크', estimatedMinutes: 20, locationId: studioId }],
        scenes: sampleScenes,
        timelineOrder: [sampleScenes[0].id, sampleScenes[1].id, breakId, sampleScenes[2].id, sampleScenes[3].id],
      });
      get().calculateTimes();
      return;
    }

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
        planning: {
          ...createDefaultPlanning('ad'),
          productionScale: 'premium',
          projectTitle: '프리미엄 주방 디바이스 캠페인',
          oneLiner: '제품의 간편함과 프리미엄 질감을 하루 루틴 안에서 보여주는 30초 광고',
          audience: '집에서도 감도 있는 라이프스타일을 원하는 25-39세 소비자',
          coreMessage: '복잡한 준비 없이 매일의 순간이 더 좋아진다.',
          sections: {
            brief: {
              brandContext: '홈라이프 시장에서 디자인 감도와 실용성을 동시에 설득해야 하는 신제품 런칭',
              product: '프리미엄 주방 디바이스 신제품',
              usp: '빠른 세팅, 깔끔한 디자인, 쉬운 세척',
              objective: '공식몰 상세페이지 전환과 런칭 캠페인 인지도 확보',
              painPoint: '번거로운 조리 준비와 정리 때문에 건강한 루틴이 지속되지 않음',
              mandatory: '로고 3초 이상, 패키지 전면, 세척 장면, 공식몰 CTA, 과장 효능 표현 금지',
            },
            strategy: {
              consumerInsight: '집을 감도 있게 꾸미는 사람일수록 주방 도구가 번거로우면 루틴을 포기한다.',
              singleMessage: '복잡한 준비 없이 매일의 순간이 더 좋아진다.',
              reasonToBelieve: '원터치 세팅, 분리 세척, 슬림한 보관 컷을 실제 동작으로 보여준다.',
            },
            creative: {
              concept: '아침 루틴이 정리되는 10분의 차이',
              tone: '하이키, 깨끗한 그림자, 프리미엄 홈라이프',
              hook: '출근 전 바쁜 주방이 제품 한 번으로 차분해지는 첫 3초',
              copy: '준비는 가볍게, 하루는 더 근사하게.',
              cta: '지금 공식몰에서 확인',
            },
            structure: {
              contentFlow: '제품 단독 히어로 컷\n모델 사용 라이프스타일 컷\n제품 디테일 인서트\n외부 무드 B-roll\n엔드카드 CTA',
              variants: '30초 메인, 15초 퍼포먼스, 6초 범퍼, 9:16 릴스, 상세페이지 GIF',
              aspectRatios: '16:9, 9:16, 1:1. 자막 안전영역과 엔드카드 여백 확보',
              editRhythm: '첫 3초 빠른 후킹, 사용 시연은 호흡을 길게, CTA는 2초 이상 고정',
            },
            production: {
              talentCasting: '손동작이 자연스러운 20-30대 메인 모델 1명, 손 모델 대체 가능',
              artDirection: '화이트/스틸/우드 계열, 과한 생활감 배제, 제품 컬러와 충돌 없는 소품',
              productHandling: '스크래치 없는 히어로 제품 2개, 반사 체크용 더미 1개, 패키지 예비분 확보',
              mustHave: '로고 3초 이상, 패키지 전면, 사용 손동작, 세척 컷, 엔드카드 CTA',
              lowBudgetPlan: '스튜디오와 키친 세트를 한 공간에 통합하고 외부 B-roll은 최소 인원 짐벌 컷으로 압축',
              risk: '반사광, 로고 가림, 과장된 연기, 고지 문구 누락, 음악/폰트 라이선스',
              deliverables: '30초/15초/6초, 16:9/9:16/1:1, 클린본/자막본, 썸네일 3종, 수정 2라운드',
            },
          },
        },
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: getKoreaTodayString(), callTime: today, firstShotTime: start, locationIds: [studioId, kitchenId, streetId] }],
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
        planning: {
          ...createDefaultPlanning('event'),
          productionScale: 'premium',
          projectTitle: '브랜드 컨퍼런스 하이라이트',
          oneLiner: '키노트와 네트워킹의 에너지를 2분 하이라이트로 압축하는 행사 스케치',
          audience: '행사 참석자, 잠재 고객, 내부 세일즈/PR 팀',
          coreMessage: '브랜드가 업계의 흐름을 주도하고 있다는 인상',
          sections: {
            brief: {
              stakeholders: '주최 브랜드, PR팀, 세일즈팀, VIP 파트너, 행사장 운영팀',
              eventGoal: '신제품 메시지 확산과 파트너 네트워킹',
              audienceMood: '성황, 전문성, 업계 리더십, 참가자 간 교류가 활발한 분위기',
              keyPeople: '사회자, 대표 연사, 패널, VIP',
              successCriteria: '무대 와이드, 연사 핵심 멘트, 객석 리액션, 포토월, 네트워킹이 모두 남아야 함',
            },
            program: {
              runOfShow: '입장 / 등록\n오프닝\n키노트\n점심 / 장비 점검\n패널 / Q&A\n네트워킹 / 클로징',
              criticalMoments: '대표 입장, 오프닝 타이틀, 키노트 첫 슬라이드, 박수, 패널 단체샷, VIP 포토콜',
              vipFlow: 'VIP는 등록 후 별도 대기실, 키노트 전 포토콜, 네트워킹 초반 인터뷰 가능',
              accessWindows: '리허설 30분, 등록 시작 전 로비, 키노트 후 10분 인터뷰, 클로징 직후 부스 컷',
            },
            coverage: {
              mustShots: '등록 데스크, 포토월, 무대 와이드, 연사 클로즈업, 객석 리액션, 박수, 네트워킹',
              cameraPlan: 'A캠 무대 정면 고정, B캠 망원 리액션, 짐벌 로비/네트워킹, 포토그래퍼 포토월',
              interviewPlan: '연사 2명, 참가자 3명, 브랜드 담당자 1명. 포토월 옆 조용한 배경에서 3문항',
              audio: '무대 라인 아웃 + 인터뷰 무선 마이크',
              socialCuts: '당일 릴스용 세로 입장/박수/네트워킹 컷, 스틸 10장 선공유',
            },
            operation: {
              venueZones: '메인 무대, 객석 중앙 통로, 로비 포토월, VIP 대기실, 인터뷰존',
              crewComms: '현장 PD가 큐시트 확인, A캠/B캠/짐벌 단톡, VIP 이동은 운영팀 확인',
              dataPlan: '세션 종료마다 카드 백업, 원본 2중 저장, 당일 프록시 하이라이트 폴더 분리',
              lowBudgetPlan: '투맨이면 A캠 고정 + 짐벌 1명으로 압축하고 인터뷰는 네트워킹 후 20분에 몰아서 진행',
              risk: '무대 조도 변동, VIP 동선, 객석 소음, 발표 자료 저작권, 촬영 제한 구역',
              deliverables: '2분 하이라이트, 30초 숏폼 3개, 행사 사진 30장, 풀버전 기록본, 당일 스틸 선공유',
            },
          },
        },
        callTime: today,
        shootingStartTime: start,
        days: [{ id: dayId, date: getKoreaTodayString(), callTime: today, firstShotTime: start, locationIds: [hallId, lobbyId, stageId] }],
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
      { id: homeId, name: '철수네 거실', address: '서울시 마포구', type: 'indoor', permitStatus: 'ok', contact: '로케이션 매니저', weatherQuery: '서울시 마포구', weatherLabel: 'Mapo-gu, Seoul', weatherLatitude: 37.5663, weatherLongitude: 126.9019, storyFit: '아침 식탁과 관계의 거리감이 보이는 생활 공간', visualCheck: '창문 역광과 주방 반사 체크', soundCheck: '냉장고, 에어컨, 외부 도로 소음 차단', powerCheck: '콘센트 2구, 주방 조명 차단 가능' },
      { id: stationId, name: '강남역 11번 출구', address: '서울시 강남구', type: 'outdoor', permitStatus: 'pending', contact: '강남구청', weatherQuery: '강남역', weatherLabel: 'Gangnam-gu, Seoul', weatherLatitude: 37.4979, weatherLongitude: 127.0276, storyFit: '기다림과 재회가 명확히 보이는 출구 동선', visualCheck: '간판, 유동 인구, 360도 피해야 할 광고판 체크', soundCheck: '버스킹, 차량, 지하철 출입구 안내음', accessCheck: '보행자 동선 방해 최소화, 장비 대기 위치 확인', weatherRisk: '노을 시간 30분 전부터 대기' },
      { id: riverId, name: '한강 공원', address: '서울시 영등포구', type: 'outdoor', permitStatus: 'ok', contact: '공원 관리사무소', weatherQuery: '서울시 영등포구 한강 공원', weatherLabel: 'Yeongdeungpo-gu, Seoul', weatherLatitude: 37.5263, weatherLongitude: 126.8963, storyFit: '관계의 여백과 야경 마무리를 보여주는 공간', visualCheck: '강변 조명, 산책로 폭, 배경 노출 확인', soundCheck: '바람, 자전거, 사람 소리', powerCheck: '배터리 운용, 근처 충전 불가 전제', weatherRisk: '강풍 시 대사 수음 리스크' },
    ];

    const samplePeople: Person[] = [
      { id: chulsooId, name: '철수', category: 'cast', role: '주연', callTime: '08:00' },
      { id: youngheeId, name: '영희', category: 'cast', role: '주연', callTime: '08:30' },
    ];

    const sampleScenes = [
      { id: makeId(), dayId, locationId: homeId, location: '철수네 거실', description: '철수와 영희가 아침 식사를 하며 대화한다.', estimatedMinutes: 60, sceneNumber: 'S#1', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 5, pageCount: 1.5, visualRef: '/shot_67.png', props: '식기, 커피잔, 휴대폰', costume: '실내복 1', soundNote: '냉장고 소음 차단, 식기 소리', continuityNote: '컵 위치와 휴대폰 놓인 방향 유지' },
      { id: makeId(), dayId, locationId: homeId, location: '철수네 거실', description: '철수가 시계를 보며 당황한다.', estimatedMinutes: 30, sceneNumber: 'S#2', intExt: 'INT' as const, dayNight: 'DAY' as const, cast: '철수', castIds: [chulsooId], crewIds: [], cutCount: 3, pageCount: 0.5, visualRef: '/shot_10.png', props: '손목시계', insertNote: '시계 ECU', specialInstruction: '시선에서 시계로 컷어웨이' },
      { id: makeId(), dayId, locationId: stationId, location: '강남역 11번 출구', description: '영희가 누군가를 기다린다.', estimatedMinutes: 90, sceneNumber: 'S#3', intExt: 'EXT' as const, dayNight: 'DAY' as const, cast: '영희', castIds: [youngheeId], crewIds: [], cutCount: 8, pageCount: 2.0, visualRef: '/shot_06.png', costume: '외출복 1, 코트', soundNote: '차량 소음, 행인 소리', insertNote: '휴대폰 알림 확인' },
      { id: makeId(), dayId, locationId: stationId, location: '강남역 11번 출구', description: '철수가 뛰어와 영희와 만난다.', estimatedMinutes: 120, sceneNumber: 'S#4', intExt: 'EXT' as const, dayNight: 'SUNSET' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 12, pageCount: 3.0, visualRef: '/shot_70.png', specialInstruction: '노을 역광, 핸드헬드 추적', continuityNote: '철수 가방 왼손, 영희 시선 방향' },
      { id: makeId(), dayId, locationId: riverId, location: '한강 공원', description: '두 사람이 야경을 보며 걷는다.', estimatedMinutes: 60, sceneNumber: 'S#5', intExt: 'EXT' as const, dayNight: 'NIGHT' as const, cast: '철수, 영희', castIds: [chulsooId, youngheeId], crewIds: [], cutCount: 6, pageCount: 1.0, visualRef: '/shot_17.png', soundNote: '강바람, 산책로 소음', specialInstruction: '소형 LED 보조, 실루엣 유지' },
    ];

    set({
      template: 'film',
      location: 'Seoul',
      planning: {
        ...createDefaultPlanning('film'),
        productionScale: 'standard',
        projectFormat: 'short_film',
        projectTitle: '늦은 약속',
        oneLiner: '늘 늦는 남자와 기다림에 익숙해진 여자가 하루 동안 관계의 균열을 마주한다.',
        audience: '20-30대 관계 드라마와 일상 로맨스를 좋아하는 관객',
        coreMessage: '사랑은 약속을 지키는 작은 태도에서 시작된다.',
        sections: {
          brief: {
            logline: '아침 식탁에서 시작된 작은 지각이 하루 끝 관계의 고백으로 이어진다.',
            synopsis: '철수와 영희는 평범한 하루를 보내지만, 반복되는 늦음과 기다림 속에서 서로의 마음을 확인한다. 아침 대화의 작은 균열은 낮의 기다림과 저녁의 재회로 이어지고, 야경을 걷는 마지막 장면에서 두 사람은 관계를 계속할 조건을 마주한다.',
            theme: '사랑은 감정보다 시간을 지키는 태도에 가깝다.',
            worldGenre: '현대 서울, 생활 밀착형 관계 드라마, 자연광 중심의 리얼리즘',
          },
          audience: {
            targetViewer: '20-30대 관계 드라마와 일상 로맨스를 좋아하는 관객',
            formatRuntime: '단편영화 12-15분. 크레딧 포함 40분/50분 제한 영화제를 모두 고려해 최종본 15분 이하 목표',
            distribution: '국내 단편영화제 우선 출품 후 온라인 공개. 프리미어 조건은 목표 영화제별 확인',
            festivalFit: '생활 관계 드라마, 서울 로케이션, 저예산 독립 단편. 학생작품 여부/첫 연출 여부/완성 예정일 확인 필요',
          },
          character: {
            characters: '철수: 호감은 있지만 시간 감각이 느슨한 인물. 영희: 기다림에 익숙하지만 이번에는 선을 긋고 싶은 인물.',
            relationships: '철수는 사과로 상황을 넘기려 하고, 영희는 반복된 패턴을 말없이 관찰한다.',
            castingNeeds: '생활 연기가 자연스럽고 침묵의 감정선을 표현할 수 있는 배우',
          },
          structure: {
            beatSheet: '아침 대화 / 지각 인지 / 기다림 / 재회 / 야경 속 대화',
            sceneOutline: '철수와 영희가 아침 식사를 하며 대화한다.\n철수가 시계를 보며 당황한다.\n영희가 누군가를 기다린다.\n철수가 뛰어와 영희와 만난다.\n두 사람이 야경을 보며 걷는다.',
            emotionalBeat: '평온함에서 불편함, 기다림의 체념, 재회의 어색함, 마지막 선택으로 이동',
            setPieces: '해질녘 역 출구 재회와 야간 한강 보행 장면',
          },
          creative: {
            tone: '담백한 생활감, 정적인 미디엄 샷, 해질녘 감정선',
            references: '도시 관계 드라마의 대화 리듬, 자연광 로케이션 무드',
            visualRules: '마스터-투샷으로 거리감을 유지하고, 감정이 꺾이는 순간에만 클로즈업 사용',
            colorLighting: '아침은 차가운 자연광, 노을은 따뜻한 역광, 밤은 실루엣과 도시광',
            soundMusic: '음악 최소화, 거리 소음과 침묵으로 관계의 공백을 살림',
          },
          production: {
            locations: '거실, 강남역 출구, 한강 공원. 야외는 허가와 소음 체크 필요',
            artPropsCostume: '아침 식기, 시계/휴대폰, 계절감 있는 외투',
            technicalNeeds: '경량 카메라, 무선 핀마이크, 반사판, 야간 소형 LED',
            mustHave: '아침 투샷, 시계 인서트, 기다리는 영희 클로즈업, 역 출구 재회 와이드, 야간 보행 투샷',
            lowBudgetPlan: '거실과 야간 장면은 최소 장비로 찍고, 역/한강은 같은 권역에서 이동 시간을 줄인다.',
            risk: '야외 소음, 노을 시간, 지하철역 촬영 허가, 야간 보행 동선',
            rightsDeliverables: '로케이션 릴리즈, 음악 미사용 또는 라이선스 확보, 영화제 제출용 DCP/ProRes/자막본',
          },
          festivalPackage: {
            projectSpecs: '런타임 12-15분, 완성 예정 2026년, 제작국가/촬영국가 대한민국, 언어 한국어, 장르 드라마, 디지털 촬영, 16:9, 컬러',
            submissionAssets: '국문/영문 로그라인, 500자 시놉시스, 감독 소개, 감독의 말, 포스터 1종, 스틸 5장, 주요 크레딧, EPK PDF',
            screeningDeliverables: '영화제 제출용 온라인 screener, ProRes master, H.264 preview, DCP 필요 시 변환, 국문/영문 SRT 자막, 최종 QC 체크',
            rightsClearance: '배우 초상권 동의, 거실/역/한강 로케이션 허가, 음악 라이선스 또는 무음악, 폰트/포스터 이미지 권리 확인',
            festivalTracker: '목표 영화제, 마감일, 출품비, 프리미어 조건, 알림일, 제출 상태를 표로 관리',
          },
        },
      },
      callTime: today,
      shootingStartTime: start,
      days: [{ id: dayId, date: getKoreaTodayString(), callTime: today, firstShotTime: start, locationIds: [homeId, stationId, riverId] }],
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
  storage: createJSONStorage(() => createDeferredLocalStorage()),
  partialize: persistedProjectState,
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...migrateProjectData(persistedState as Partial<ScheduleState>),
  }),
  onRehydrateStorage: () => (state) => {
    state?.calculateTimes();
  },
}));
