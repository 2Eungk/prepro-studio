'use client';

import type { ProductionLocation } from '@/types/schedule';

type SceneLocationFieldProps = {
  location: string;
  locationId?: string;
  locations: ProductionLocation[];
  onChange: (next: { location: string; locationId: string }) => void;
  onAddLocation: () => void;
  sameText: (left: string, right: string) => boolean;
};

export default function SceneLocationField({
  location,
  locationId,
  locations,
  onChange,
  onAddLocation,
  sameText,
}: SceneLocationFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
        장소 <span className="text-indigo-500">*</span>
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none"
          value={locationId || locations.find((item) => item.name === location)?.id || ''}
          onChange={(event) => {
            const selected = locations.find((item) => item.id === event.target.value);
            onChange({ location: selected?.name || '', locationId: selected?.id || '' });
          }}
        >
          <option value="">장소 DB에서 선택</option>
          {locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onAddLocation}
          className="rounded-2xl border border-neutral-800 bg-neutral-950 px-4 text-xs font-black text-neutral-400 hover:border-indigo-500/40 hover:text-indigo-300"
        >
          추가
        </button>
      </div>
      <input
        list="location-list"
        placeholder="직접 입력하면 저장 시 장소 DB에 자동 추가"
        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
        value={location}
        onChange={(event) => {
          const matched = locations.find((item) => sameText(item.name, event.target.value));
          onChange({ location: event.target.value, locationId: matched?.id || '' });
        }}
      />
    </div>
  );
}
