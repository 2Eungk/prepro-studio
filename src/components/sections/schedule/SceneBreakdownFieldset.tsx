'use client';

import { ShieldCheck } from 'lucide-react';

export type SceneBreakdownValues = {
  props: string;
  costume: string;
  soundNote: string;
  specialInstruction: string;
  insertNote: string;
  continuityNote: string;
};

type SceneBreakdownKey = keyof SceneBreakdownValues;

type SceneBreakdownFieldsetProps = {
  values: SceneBreakdownValues;
  onChange: (field: SceneBreakdownKey, value: string) => void;
};

const breakdownFields: Array<{ field: SceneBreakdownKey; label: string; placeholder: string }> = [
  { field: 'props', label: '소품', placeholder: '예: 시계, 휴대폰, 커피잔' },
  { field: 'costume', label: '의상', placeholder: '예: 실내복 1, 외출복 2' },
  { field: 'soundNote', label: '사운드', placeholder: '예: 차 소리, 핸드폰 진동, MOS' },
  { field: 'specialInstruction', label: '촬영지시', placeholder: '예: 트래킹, 핸드헬드, VFX 필요' },
  { field: 'insertNote', label: '인서트', placeholder: '예: 시계 ECU, 문고리, 손 클로즈업' },
  { field: 'continuityNote', label: '연결', placeholder: '예: 가방 왼손, 컵 위치, 의상 오염' },
];

export default function SceneBreakdownFieldset({ values, onChange }: SceneBreakdownFieldsetProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">씬 브레이크다운</div>
          <p className="mt-1 text-xs font-bold text-neutral-600">인물, 의상, 소품, 사운드, 인서트를 현장용 씬리스트로 남깁니다.</p>
        </div>
        <ShieldCheck className="h-5 w-5 text-teal-300" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {breakdownFields.map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{label}</label>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-3 text-xs font-bold text-white outline-none focus:border-teal-400/60"
              placeholder={placeholder}
              value={values[field]}
              onChange={(event) => onChange(field, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
