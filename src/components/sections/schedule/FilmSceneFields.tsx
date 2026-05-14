'use client';

import type { Person, Scene } from '@/types/schedule';
import PersonPickerField from './PersonPickerField';

type FilmSceneValues = {
  sceneNumber: string;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
  cast: string;
  cutCount: number | '';
  pageCount: number | '';
};

type FilmSceneFieldsProps = {
  people: Person[];
  values: FilmSceneValues;
  onAddPerson: () => void;
  onChange: (values: Partial<FilmSceneValues>) => void;
};

export default function FilmSceneFields({
  people,
  values,
  onAddPerson,
  onChange,
}: FilmSceneFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">씬 번호</label>
          <input
            placeholder="S#1"
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PersonPickerField
          label="출연진"
          people={people}
          category="cast"
          value={values.cast}
          placeholder="예: 철수, 영희"
          emptyActionLabel="출연진 추가"
          addChipLabel="+ 인원"
          onAddPerson={onAddPerson}
          onChange={(cast) => onChange({ cast })}
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">컷 수</label>
            <input
              type="number"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none"
              value={values.cutCount || ''}
              onChange={(event) => onChange({ cutCount: event.target.value === '' ? '' : Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">페이지</label>
            <input
              type="number"
              step="0.1"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none"
              value={values.pageCount || ''}
              onChange={(event) => onChange({ pageCount: event.target.value === '' ? '' : Number(event.target.value) })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
