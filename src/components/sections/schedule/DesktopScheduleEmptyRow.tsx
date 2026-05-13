'use client';

import type { TemplateType } from '@/types/schedule';
import { Brain, Plus } from 'lucide-react';

type DesktopScheduleEmptyRowProps = {
  copyEmptyHint: string;
  isScheduleFiltered: boolean;
  template: TemplateType;
  onLoadSampleData: () => void;
  onNewScene: () => void;
  onOpenAnalyzer: () => void;
  onResetFilters: () => void;
};

const analyzerLabelByTemplate: Record<TemplateType, string> = {
  event: '식순 정리',
  ad: '구성 분석',
  musicvideo: 'MV 콘티',
  dance: '타임코드 콘티',
  film: '시나리오 분석',
};

const sampleLabelByTemplate: Record<TemplateType, string> = {
  event: '행사 샘플',
  ad: '광고 샘플',
  musicvideo: 'MV 샘플',
  dance: '댄스 샘플',
  film: '샘플 데이터',
};

export default function DesktopScheduleEmptyRow({
  copyEmptyHint,
  isScheduleFiltered,
  template,
  onLoadSampleData,
  onNewScene,
  onOpenAnalyzer,
  onResetFilters,
}: DesktopScheduleEmptyRowProps) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-24 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-neutral-900/50 p-8 rounded-3xl border border-dashed border-neutral-800">
            <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-200">{isScheduleFiltered ? '필터 결과가 없습니다' : '아직 추가된 일정이 없습니다'}</h3>
            <p className="text-sm text-neutral-500 mt-2">{isScheduleFiltered ? '검색어나 필터 조건을 조금 넓혀보세요.' : copyEmptyHint}</p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              {isScheduleFiltered && (
                <button
                  onClick={onResetFilters}
                  className="prepro-btn prepro-btn--secondary h-9"
                >
                  필터 초기화
                </button>
              )}
              <button
                onClick={onNewScene}
                className="prepro-btn prepro-btn--primary h-9"
              >
                <Plus className="w-3.5 h-3.5" /> 직접 추가
              </button>
              <button
                onClick={onOpenAnalyzer}
                className="prepro-btn prepro-btn--secondary h-9"
              >
                <Brain className="w-3.5 h-3.5" /> {analyzerLabelByTemplate[template]}
              </button>
              <button
                onClick={onLoadSampleData}
                className="prepro-btn prepro-btn--ghost h-9"
              >
                {sampleLabelByTemplate[template]}
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
