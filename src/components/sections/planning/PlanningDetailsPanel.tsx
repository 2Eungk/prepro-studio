'use client';

import { Wand2 } from 'lucide-react';
import type { PlanningWorkspaceTab } from './PlanningBriefPanel';

type PlanningFieldDefinition = {
  id: string;
  label: string;
  placeholder: string;
  kind?: 'short' | 'long' | 'list';
};

type PlanningSectionDefinition = {
  id: string;
  title: string;
  caption: string;
  fields: PlanningFieldDefinition[];
};

type PlanningDetailsPanelProps = {
  sections: PlanningSectionDefinition[];
  templateLabel: string;
  getFieldValue: (sectionId: string, fieldId: string) => string;
  onSetWorkspaceTab: (tab: PlanningWorkspaceTab) => void;
  onUpdateField: (sectionId: string, fieldId: string, value: string) => void;
};

export default function PlanningDetailsPanel({
  sections,
  templateLabel,
  getFieldValue,
  onSetWorkspaceTab,
  onUpdateField,
}: PlanningDetailsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-400">Detailed Planning</p>
          <h2 className="mt-2 text-2xl font-black text-white">상세 설계</h2>
          <p className="mt-1 text-sm font-bold text-neutral-600">{templateLabel} 기준으로 필요한 제작 항목만 모았습니다.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onSetWorkspaceTab('brief')}
            className="prepro-btn prepro-btn--secondary h-12 text-sm"
          >
            개요로
          </button>
          <button
            onClick={() => onSetWorkspaceTab('ai')}
            className="prepro-btn prepro-btn--primary h-12 text-sm"
          >
            AI 정리 <Wand2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id} id={`planning-section-${section.id}`} className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-5">
            <h3 className="text-xl font-black text-white">{section.title}</h3>
            <p className="mt-1 text-sm font-bold text-neutral-600">{section.caption}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((field) => {
              const isWide = field.kind === 'long' || field.kind === 'list';
              return (
                <label
                  key={field.id}
                  id={`planning-field-${section.id}-${field.id}`}
                  className={`space-y-2 scroll-mt-28 ${isWide ? 'md:col-span-2' : ''}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600">{field.label}</span>
                  {field.kind === 'short' ? (
                    <input
                      className="w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-indigo-500"
                      value={getFieldValue(section.id, field.id)}
                      onChange={(event) => onUpdateField(section.id, field.id, event.target.value)}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <textarea
                      className={`${field.kind === 'list' ? 'min-h-44 font-mono' : 'min-h-32'} w-full rounded-2xl border border-neutral-800 bg-black px-5 py-4 text-sm font-bold leading-relaxed text-white outline-none transition-all focus:border-indigo-500`}
                      value={getFieldValue(section.id, field.id)}
                      onChange={(event) => onUpdateField(section.id, field.id, event.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
