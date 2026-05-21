'use client';

import { Sparkles } from 'lucide-react';
import type { AnalyzedScene } from '@/components/modals/ScriptAnalyzer';

type AnalyzerResultPreviewProps = {
  addResultLabel: string;
  analyzerResultLabel: string;
  itemPluralLabel: string;
  scenes: AnalyzedScene[];
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AnalyzerResultPreview({
  addResultLabel,
  analyzerResultLabel,
  itemPluralLabel,
  scenes,
  onCancel,
  onConfirm,
}: AnalyzerResultPreviewProps) {
  if (scenes.length === 0) return null;

  return (
    <div className="animate-in slide-in-from-top-4 rounded-3xl border border-indigo-500/30 bg-indigo-950/20 p-8 shadow-2xl shadow-indigo-500/10 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="flex items-center gap-3 font-black text-indigo-200">
          <Sparkles className="h-5 w-5 animate-pulse text-indigo-400" />
          {analyzerResultLabel}: {scenes.length}개의 {itemPluralLabel} 감지됨
        </h4>
      </div>
      <div className="custom-scrollbar mb-8 grid max-h-64 grid-cols-1 gap-4 overflow-y-auto pr-4 md:grid-cols-3">
        {scenes.map((scene, index) => (
          <div key={`${scene.sceneNumber}-${index}`} className="group rounded-2xl border border-neutral-900 bg-neutral-950/50 p-4 text-[11px] transition-colors hover:border-indigo-500/30">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-black text-indigo-500">{scene.sceneNumber}</span>
              <span className="font-bold uppercase tracking-widest text-neutral-600">{scene.intExt} • {scene.dayNight}</span>
            </div>
            <div className="mb-1 truncate font-bold text-neutral-200">{scene.location}</div>
            <div className="truncate text-neutral-600">{scene.cast || '출연 없음'}</div>
            {scene.visualRef && (
              <div className="mt-3 inline-flex items-center rounded-full border border-teal-400/20 bg-teal-400/10 px-2 py-1 text-[10px] font-black text-teal-200">
                콘티 자동 부착
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-4">
        <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-neutral-500 transition-colors hover:text-neutral-300">
          취소
        </button>
        <button
          onClick={onConfirm}
          className="prepro-btn prepro-btn--primary h-12 px-8 text-sm"
        >
          {addResultLabel}
        </button>
      </div>
    </div>
  );
}
