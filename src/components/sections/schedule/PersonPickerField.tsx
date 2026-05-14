'use client';

import type { Person } from '@/types/schedule';

type PersonPickerFieldProps = {
  label: string;
  people: Person[];
  value: string;
  placeholder: string;
  emptyActionLabel: string;
  addChipLabel: string;
  category?: Person['category'];
  onChange: (value: string) => void;
  onAddPerson: () => void;
};

export default function PersonPickerField({
  label,
  people,
  value,
  placeholder,
  emptyActionLabel,
  addChipLabel,
  category,
  onChange,
  onAddPerson,
}: PersonPickerFieldProps) {
  const visiblePeople = category ? people.filter((person) => person.category === category) : people;
  const selectedNames = new Set(value.split(',').map((name) => name.trim()).filter(Boolean));

  const togglePerson = (name: string) => {
    const nextNames = new Set(selectedNames);
    if (nextNames.has(name)) nextNames.delete(name);
    else nextNames.add(name);
    onChange(Array.from(nextNames).join(', '));
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</label>
      <div className="min-h-[50px] rounded-xl border border-neutral-800 bg-neutral-950 p-3">
        {visiblePeople.length === 0 ? (
          <button type="button" onClick={onAddPerson} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
            {emptyActionLabel}
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visiblePeople.map((person) => {
              const checked = selectedNames.has(person.name);
              return (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => togglePerson(person.name)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${
                    checked
                      ? 'border-indigo-400 bg-indigo-500 text-white'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {person.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onAddPerson}
              className="rounded-full border border-neutral-800 px-3 py-1 text-[11px] font-bold text-neutral-500 hover:text-indigo-300"
            >
              {addChipLabel}
            </button>
          </div>
        )}
      </div>
      <input
        placeholder={placeholder}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
