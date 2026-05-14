'use client';

import type { Person, Scene } from '@/types/schedule';
import PersonPickerField from './PersonPickerField';

type AdSceneValues = {
  sceneNumber: string;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
  cutCount: number | '';
  cast: string;
  lightingNote: string;
  clientMemo: string;
};

type AdSceneFieldsProps = {
  people: Person[];
  values: AdSceneValues;
  onAddPerson: () => void;
  onChange: (values: Partial<AdSceneValues>) => void;
};

export default function AdSceneFields({
  people,
  values,
  onAddPerson,
  onChange,
}: AdSceneFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 번호</label>
          <input
            placeholder="C#1"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.sceneNumber}
            onChange={(event) => onChange({ sceneNumber: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">INT/EXT</label>
          <select
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none"
            value={values.intExt}
            onChange={(event) => onChange({ intExt: event.target.value as NonNullable<Scene['intExt']> })}
          >
            <option value="INT">INT</option>
            <option value="EXT">EXT</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">시간대</label>
          <select
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none"
            value={values.dayNight}
            onChange={(event) => onChange({ dayNight: event.target.value as NonNullable<Scene['dayNight']> })}
          >
            <option value="DAY">DAY</option>
            <option value="NIGHT">NIGHT</option>
            <option value="SUNSET">SUNSET</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 수</label>
          <input
            type="number"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none"
            value={values.cutCount || ''}
            onChange={(event) => onChange({ cutCount: event.target.value === '' ? '' : Number(event.target.value) })}
          />
        </div>
      </div>
      <PersonPickerField
        label="모델 / 제품 출연"
        people={people}
        category="cast"
        value={values.cast}
        placeholder="예: 메인 모델"
        emptyActionLabel="모델 추가"
        addChipLabel="+ 모델"
        onAddPerson={onAddPerson}
        onChange={(cast) => onChange({ cast })}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">톤앤매너</label>
          <input
            placeholder="예: 화사하게, 시네마틱"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.lightingNote}
            onChange={(event) => onChange({ lightingNote: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">클라이언트 메모</label>
          <input
            placeholder="제품 로고 강조"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.clientMemo}
            onChange={(event) => onChange({ clientMemo: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
