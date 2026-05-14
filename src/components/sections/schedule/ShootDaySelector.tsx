import type { Scene, ShootDay } from '@/types/schedule';
import { Plus } from 'lucide-react';

export default function ShootDaySelector({
  activeDayId,
  activeDayIndex,
  activeShootingDate,
  itemPluralLabel,
  projectDays,
  scenes,
  onAddDay,
  onDeleteActiveDay,
  onSelectDay,
}: {
  activeDayId: string;
  activeDayIndex: number;
  activeShootingDate: string;
  itemPluralLabel: string;
  projectDays: ShootDay[];
  scenes: Scene[];
  onAddDay: () => void;
  onDeleteActiveDay: () => void;
  onSelectDay: (dayId: string) => void;
}) {
  const firstDayId = projectDays[0]?.id;
  const activeDaySceneCount = scenes.filter((scene) => (scene.dayId || firstDayId) === activeDayId).length;

  return (
    <section className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-600">촬영일 구성</div>
          <div className="mt-1 text-sm font-bold text-neutral-300">
            Day {activeDayIndex + 1} · {activeShootingDate} · {activeDaySceneCount}개 {itemPluralLabel}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {projectDays.map((day, index) => {
            const isSelected = day.id === activeDayId;
            const daySceneCount = scenes.filter((scene) => (scene.dayId || firstDayId) === day.id).length;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-neutral-600 bg-neutral-900 text-white'
                    : 'border-neutral-800 bg-black text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest">Day {index + 1}</div>
                <div className="mt-1 text-xs font-bold">{day.date}</div>
                <div className={`mt-1 text-[10px] font-bold ${isSelected ? 'text-neutral-400' : 'text-neutral-600'}`}>{daySceneCount}개</div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onAddDay}
            className="inline-flex min-h-[72px] items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-xs font-black text-neutral-400 transition-all hover:border-indigo-500/40 hover:text-indigo-300"
          >
            <Plus className="h-4 w-4" /> 날짜 추가
          </button>
          {projectDays.length > 1 && (
            <button
              type="button"
              onClick={onDeleteActiveDay}
              className="inline-flex min-h-[72px] items-center rounded-xl border border-red-500/20 px-4 text-xs font-black text-red-300 transition-all hover:bg-red-500/10"
            >
              현재 날짜 삭제
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
