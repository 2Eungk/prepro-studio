'use client';

import type { BreakItem, Person, ProductionLocation } from '@/types/schedule';
import { MapPin, XCircle } from 'lucide-react';

export type WeatherLocationCandidate = {
  latitude: number;
  longitude: number;
  label: string;
  query: string;
  provider?: 'kakao' | 'open-meteo' | 'osm' | 'local';
  address?: string;
  roadAddress?: string;
  category?: string;
  kakaoMapUrl?: string;
  naverMapUrl?: string;
};

type LocationForm = Omit<ProductionLocation, 'id'>;
type PersonForm = {
  name: string;
  category: Person['category'];
  role: string;
  phone: string;
  callTime: string;
  notes: string;
};
type BreakForm = {
  type: BreakItem['type'];
  label: string;
  estimatedMinutes: number;
  locationId: string;
};

type LocationModalProps = {
  editingLocation: ProductionLocation | null;
  form: LocationForm;
  isOpen: boolean;
  isSearchingWeatherLocation: boolean;
  weatherLocationError: string;
  weatherLocationResults: WeatherLocationCandidate[];
  onClearWeatherSearch: () => void;
  onClose: () => void;
  onFormChange: (form: LocationForm) => void;
  onSave: () => void;
  onSearchWeatherLocation: () => void;
  onSelectWeatherLocation: (candidate: WeatherLocationCandidate) => void;
};

type PersonModalProps = {
  editingPerson: Person | null;
  form: PersonForm;
  isOpen: boolean;
  onClose: () => void;
  onFormChange: (form: PersonForm) => void;
  onSave: () => void;
};

type BreakModalProps = {
  editingBreak: BreakItem | null;
  form: BreakForm;
  isOpen: boolean;
  locations: ProductionLocation[];
  onClose: () => void;
  onDeleteEditingBreak: () => void;
  onFormChange: (form: BreakForm) => void;
  onSave: () => void;
};

const locationChecklistFields = [
  ['storyFit', '스토리 적합성', '시나리오 분위기, 시대감, 연출 의도와 맞는지'],
  ['visualCheck', '비주얼 / 360도', '와이드 가능, 피해야 할 간판/반사/VFX 요소'],
  ['soundCheck', '사운드', 'HVAC, 냉장고, 에코, 도로/학교/공장 소음'],
  ['powerCheck', '전력', '두꺼비집, 콘센트 위치, 조명 전원, 충전 동선'],
  ['accessCheck', '운영', '주차, 화장실, 대기공간, 근처 철물점/편의점'],
  ['weatherRisk', '날씨 리스크', '햇빛 방향, 우천 대체, 실내 방음, 골든아워'],
] as const satisfies readonly [keyof LocationForm, string, string][];

export function LocationModal({
  editingLocation,
  form,
  isOpen,
  isSearchingWeatherLocation,
  weatherLocationError,
  weatherLocationResults,
  onClearWeatherSearch,
  onClose,
  onFormChange,
  onSave,
  onSearchWeatherLocation,
  onSelectWeatherLocation,
}: LocationModalProps) {
  if (!isOpen) return null;

  const updateForm = (updates: Partial<LocationForm>) => {
    onFormChange({ ...form, ...updates });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl custom-scrollbar">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{editingLocation ? '장소 편집' : '장소 추가'}</h2>
            <p className="text-sm text-neutral-500">촬영 장소와 현장 인텔 기준 위치를 관리합니다.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">장소명</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">주소</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.address} onChange={(e) => updateForm({ address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">장소 유형</label>
            <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.type} onChange={(e) => updateForm({ type: e.target.value as ProductionLocation['type'] })}>
              <option value="studio">스튜디오</option>
              <option value="indoor">실내</option>
              <option value="outdoor">실외</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">허가 상태</label>
            <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.permitStatus} onChange={(e) => updateForm({ permitStatus: e.target.value as ProductionLocation['permitStatus'] })}>
              <option value="ok">완료</option>
              <option value="pending">진행중</option>
              <option value="none">미확인</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">날씨 위치</label>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                placeholder="장소명이나 주소로 검색"
                value={form.weatherQuery || ''}
                onChange={(e) => {
                  updateForm({
                    weatherQuery: e.target.value,
                    weatherLabel: '',
                    weatherLatitude: undefined,
                    weatherLongitude: undefined,
                  });
                  onClearWeatherSearch();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSearchWeatherLocation();
                  }
                }}
              />
              <button
                type="button"
                onClick={onSearchWeatherLocation}
                disabled={isSearchingWeatherLocation || !(form.weatherQuery || form.address || form.name)?.trim()}
                className="prepro-btn prepro-btn--quiet h-12 shrink-0"
              >
                {isSearchingWeatherLocation ? '검색중' : '검색'}
              </button>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-black/40 p-3">
              {form.weatherLatitude && form.weatherLongitude ? (
                <div className="flex items-start gap-2 text-xs font-bold text-indigo-200">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                  <div className="min-w-0">
                    <div className="truncate">{form.weatherLabel || form.weatherQuery}</div>
                    {(form.address || form.kakaoMapUrl || form.naverMapUrl) && (
                      <div className="mt-1 truncate text-[10px] text-neutral-500">{form.address}</div>
                    )}
                    <div className="mt-1 font-mono text-[10px] text-neutral-600">
                      {form.weatherLatitude.toFixed(4)}, {form.weatherLongitude.toFixed(4)}
                    </div>
                    {(form.kakaoMapUrl || form.naverMapUrl) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.kakaoMapUrl && (
                          <a className="text-[10px] font-black text-yellow-300 hover:text-yellow-200" href={form.kakaoMapUrl} target="_blank" rel="noreferrer">카카오맵</a>
                        )}
                        {form.naverMapUrl && (
                          <a className="text-[10px] font-black text-emerald-300 hover:text-emerald-200" href={form.naverMapUrl} target="_blank" rel="noreferrer">네이버지도</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-bold text-neutral-600">위치 후보를 검색해서 선택하면 해당 좌표 기준으로 날씨를 조회합니다.</div>
              )}
              {weatherLocationError && <div className="mt-2 text-xs font-bold text-red-400">{weatherLocationError}</div>}
              {weatherLocationResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {weatherLocationResults.map((candidate) => (
                    <button
                      key={`${candidate.latitude}:${candidate.longitude}:${candidate.label}`}
                      type="button"
                      onClick={() => onSelectWeatherLocation(candidate)}
                      className="flex w-full items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-left hover:border-indigo-500/40"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black text-neutral-200">
                          {candidate.label}
                          {candidate.provider === 'kakao' && <span className="ml-2 rounded-full bg-yellow-300/10 px-1.5 py-0.5 text-[9px] text-yellow-200">Kakao</span>}
                        </span>
                        {(candidate.address || candidate.category) && (
                          <span className="mt-1 block truncate text-[10px] font-bold text-neutral-500">{[candidate.address, candidate.category].filter(Boolean).join(' · ')}</span>
                        )}
                        <span className="mt-1 block font-mono text-[10px] text-neutral-600">{candidate.latitude.toFixed(4)}, {candidate.longitude.toFixed(4)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">담당자 / 연락처</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.contact} onChange={(e) => updateForm({ contact: e.target.value })} />
          </div>
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-black/40 p-4">
            <div className="mb-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">로케이션 헌팅 체크</div>
              <p className="mt-1 text-xs font-bold text-neutral-600">와이드, 소리, 전력, 접근성처럼 현장에서 터지는 문제를 미리 적어둡니다.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {locationChecklistFields.map(([field, label, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{label}</label>
                  <textarea
                    className="h-20 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-teal-400/60"
                    placeholder={placeholder}
                    value={String(form[field] || '')}
                    onChange={(e) => updateForm({ [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">메모</label>
            <textarea className="h-24 w-full resize-none rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="prepro-btn prepro-btn--quiet h-12 px-5 text-sm">취소</button>
          <button onClick={onSave} disabled={!form.name.trim()} className="prepro-btn prepro-btn--primary h-12 px-7 text-sm">저장</button>
        </div>
      </div>
    </div>
  );
}

export function PersonModal({ editingPerson, form, isOpen, onClose, onFormChange, onSave }: PersonModalProps) {
  if (!isOpen) return null;

  const updateForm = (updates: Partial<PersonForm>) => {
    onFormChange({ ...form, ...updates });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{editingPerson ? '인원 편집' : '인원 추가'}</h2>
            <p className="text-sm text-neutral-500">출연진과 스태프 정보를 관리합니다.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">이름</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">구분</label>
            <select className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.category} onChange={(e) => updateForm({ category: e.target.value as Person['category'] })}>
              <option value="cast">출연진</option>
              <option value="crew">스태프</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">역할 / 직책</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.role} onChange={(e) => updateForm({ role: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">연락처</label>
            <input className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">콜 타임</label>
            <input
              type="time"
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark]"
              value={form.callTime}
              onChange={(e) => updateForm({ callTime: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">메모</label>
            <textarea className="h-24 w-full resize-none rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500" value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="prepro-btn prepro-btn--quiet h-12 px-5 text-sm">취소</button>
          <button onClick={onSave} disabled={!form.name.trim()} className="prepro-btn prepro-btn--primary h-12 px-7 text-sm">저장</button>
        </div>
      </div>
    </div>
  );
}

export function BreakModal({
  editingBreak,
  form,
  isOpen,
  locations,
  onClose,
  onDeleteEditingBreak,
  onFormChange,
  onSave,
}: BreakModalProps) {
  if (!isOpen) return null;

  const updateForm = (updates: Partial<BreakForm>) => {
    onFormChange({ ...form, ...updates });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{editingBreak ? '시간 편집' : '시간 추가'}</h2>
            <p className="text-sm text-neutral-500">식사, 이동, 세팅, 휴식 시간을 일정표에 넣습니다.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">종류</label>
            <select
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              value={form.type}
              onChange={(e) => updateForm({ type: e.target.value as BreakItem['type'] })}
            >
              <option value="meal">식사</option>
              <option value="move">이동</option>
              <option value="setup">세팅</option>
              <option value="rest">휴식</option>
              <option value="custom">기타</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">소요 시간</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 pr-14 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                value={form.estimatedMinutes}
                onChange={(e) => updateForm({ estimatedMinutes: Number(e.target.value) })}
              />
              <span className="absolute right-4 top-3.5 text-[10px] font-black uppercase text-neutral-600">분</span>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">라벨</label>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              value={form.label}
              onChange={(e) => updateForm({ label: e.target.value })}
              placeholder="예: 점심 식사, 이동, 조명 세팅"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">연결 장소</label>
            <select
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
              value={form.locationId}
              onChange={(e) => updateForm({ locationId: e.target.value })}
            >
              <option value="">장소 없음</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          {editingBreak ? (
            <button onClick={onDeleteEditingBreak} className="prepro-btn prepro-btn--danger h-12 px-5 text-sm">
              삭제
            </button>
          ) : (
            <span></span>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="prepro-btn prepro-btn--quiet h-12 px-5 text-sm">취소</button>
            <button
              onClick={onSave}
              disabled={!form.label.trim() || Number(form.estimatedMinutes || 0) < 1}
              className="prepro-btn prepro-btn--primary h-12 px-7 text-sm"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
