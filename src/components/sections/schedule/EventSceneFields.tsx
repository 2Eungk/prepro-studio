'use client';

import type { Person } from '@/types/schedule';
import PersonPickerField from './PersonPickerField';

type EventSceneValues = {
  eventSection: string;
  cameraGear: string;
  cast: string;
};

type EventSceneFieldsProps = {
  eventSectionLabel: string;
  gearLabel: string;
  people: Person[];
  values: EventSceneValues;
  onAddPerson: () => void;
  onChange: (values: Partial<EventSceneValues>) => void;
};

export default function EventSceneFields({
  eventSectionLabel,
  gearLabel,
  people,
  values,
  onAddPerson,
  onChange,
}: EventSceneFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{eventSectionLabel}</label>
          <input
            placeholder="예: 1부 오프닝"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.eventSection}
            onChange={(event) => onChange({ eventSection: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{gearLabel}</label>
          <input
            placeholder="예: 짐벌, 삼각대"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.cameraGear}
            onChange={(event) => onChange({ cameraGear: event.target.value })}
          />
        </div>
      </div>
      <PersonPickerField
        label="진행 / 연사 / 담당"
        people={people}
        value={values.cast}
        placeholder="예: 사회자, 대표 연사"
        emptyActionLabel="인원 추가"
        addChipLabel="+ 인원"
        onAddPerson={onAddPerson}
        onChange={(cast) => onChange({ cast })}
      />
    </div>
  );
}
