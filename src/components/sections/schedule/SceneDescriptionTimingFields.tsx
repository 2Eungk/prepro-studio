'use client';

type SceneDescriptionTimingFieldsProps = {
  description: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  estimatedMinutes: number | '';
  isEditing: boolean;
  canSave: boolean;
  onChangeDescription: (description: string) => void;
  onChangeEstimatedMinutes: (minutes: number) => void;
  onSave: () => void;
};

export default function SceneDescriptionTimingFields({
  description,
  descriptionLabel,
  descriptionPlaceholder,
  estimatedMinutes,
  isEditing,
  canSave,
  onChangeDescription,
  onChangeEstimatedMinutes,
  onSave,
}: SceneDescriptionTimingFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
          {descriptionLabel} <span className="text-indigo-500">*</span>
        </label>
        <textarea
          placeholder={descriptionPlaceholder}
          className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
          value={description}
          onChange={(event) => onChangeDescription(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">예상 소요 시간</label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none"
              value={estimatedMinutes}
              onChange={(event) => onChangeEstimatedMinutes(Number(event.target.value))}
            />
            <span className="absolute right-4 top-3.5 text-[10px] font-black text-neutral-600 uppercase">분</span>
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/20"
          >
            {isEditing ? '변경사항 저장' : '일정에 추가'}
          </button>
        </div>
      </div>
    </>
  );
}
