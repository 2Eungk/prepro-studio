'use client';

import type { Person, TemplateType } from '@/types/schedule';
import MusicShotPresetPanel from './MusicShotPresetPanel';
import PersonPickerField from './PersonPickerField';

type MusicSceneValues = {
  sceneNumber: string;
  musicCue: string;
  shotSize: string;
  focusMember: string;
  cast: string;
  lyrics: string;
  formation: string;
  choreoNote: string;
  cameraGear: string;
};

type MusicSceneFieldsProps = {
  people: Person[];
  template: TemplateType;
  values: MusicSceneValues;
  onAddPerson: () => void;
  onChange: (values: Partial<MusicSceneValues>) => void;
};

export default function MusicSceneFields({
  people,
  template,
  values,
  onAddPerson,
  onChange,
}: MusicSceneFieldsProps) {
  return (
    <div className="space-y-4">
      <MusicShotPresetPanel
        template={template}
        focusMember={values.focusMember}
        onApply={onChange}
      />
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">구간 번호</label>
          <input
            placeholder={template === 'musicvideo' ? 'MV#1' : 'D#1'}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.sceneNumber}
            onChange={(event) => onChange({ sceneNumber: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">타임코드</label>
          <input
            placeholder="00:12"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.musicCue}
            onChange={(event) => onChange({ musicCue: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">샷 사이즈</label>
          <select
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none"
            value={values.shotSize}
            onChange={(event) => onChange({ shotSize: event.target.value })}
          >
            <option value="">선택</option>
            <option value="FS">FS</option>
            <option value="LS">LS</option>
            <option value="MS">MS</option>
            <option value="CS">CS</option>
            <option value="CU">CU</option>
            <option value="SIDE">SIDE</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">포커스</label>
          <input
            placeholder={template === 'musicvideo' ? '아티스트 / 오브젝트' : '센터 / 멤버명'}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.focusMember}
            onChange={(event) => onChange({ focusMember: event.target.value })}
          />
        </div>
      </div>
      <PersonPickerField
        label={template === 'musicvideo' ? '아티스트 / 출연' : '멤버'}
        people={people}
        category="cast"
        value={values.cast}
        placeholder="예: A, B, C, D"
        emptyActionLabel="멤버 추가"
        addChipLabel="+ 멤버"
        onAddPerson={onAddPerson}
        onChange={(cast) => onChange({ cast })}
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">가사 / 카운트</label>
          <textarea
            className="h-24 w-full resize-none bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            placeholder="Do it do it Chu..."
            value={values.lyrics}
            onChange={(event) => onChange({ lyrics: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">대형 / 동선</label>
          <textarea
            className="h-24 w-full resize-none bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            placeholder="센터 이동, 좌우 벌림, 엔딩 포즈"
            value={values.formation}
            onChange={(event) => onChange({ formation: event.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">안무 포인트</label>
          <input
            placeholder="킬링파트 손동작, 점프, 턴"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.choreoNote}
            onChange={(event) => onChange({ choreoNote: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">카메라 플랜</label>
          <input
            placeholder="정면 풀샷, CS 펀치인, 사이드 컷"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
            value={values.cameraGear}
            onChange={(event) => onChange({ cameraGear: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
