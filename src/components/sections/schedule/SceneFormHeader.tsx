'use client';

type SceneFormHeaderProps = {
  title: string;
  modeLabel: string;
  canSave: boolean;
  missingFields: string[];
  onClose: () => void;
};

export default function SceneFormHeader({
  title,
  modeLabel,
  canSave,
  missingFields,
  onClose,
}: SceneFormHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-black flex flex-wrap items-center gap-4">
          <div className="w-2 h-8 bg-indigo-600 rounded-full" />
          {title}
          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-black tracking-widest">
            {modeLabel}
          </span>
          <span
            className={`text-[10px] px-3 py-1 rounded-full border font-black tracking-widest ${
              canSave
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {canSave ? '저장 가능' : `${missingFields.join(', ')} 필요`}
          </span>
        </h3>
        <p className="text-xs font-bold text-neutral-600">
          {canSave ? '선택한 샷과 기본 제작값이 채워졌습니다.' : '장소와 진행 내용만 채우면 바로 일정에 넣을 수 있습니다.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs font-bold text-neutral-500 transition-all hover:border-neutral-700 hover:text-neutral-300"
      >
        닫기
      </button>
    </div>
  );
}
