'use client';

import type { ReactNode } from 'react';
import type { BreakItem, Scene, TemplateType } from '@/types/schedule';
import { Plus } from 'lucide-react';

type TimelineRow =
  | { id: string; type: 'scene'; scene: Scene }
  | { id: string; type: 'break'; breakItem: BreakItem };

type ReportStats = {
  done: number;
  ng: number;
  pending: number;
  completionRate: number;
};

type MobileFieldControlBarProps = {
  focusScene?: Scene;
  focusRowNumber: number;
  nextBreakLabel: string;
  copyItemPlural: string;
  reportStats: ReportStats;
  isReportMode: boolean;
  statusFilter: 'all' | 'pending' | 'done' | 'ng';
  onToggleReportMode: () => void;
  onSetStatusFilter: (status: 'all' | 'pending' | 'done' | 'ng') => void;
  onGoReport: () => void;
};

type MobileTimelineSceneCardProps = {
  scene: Scene;
  template: TemplateType;
  isReportMode: boolean;
  rowNumber: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type MobileTimelineBreakCardProps = {
  item: BreakItem;
  locationName: string;
  rowNumber: number;
  onEdit: () => void;
  onDelete: () => void;
};

type MobileScheduleListProps = {
  activeDaySceneCount: number;
  copyEmptyHint: string;
  copyItemPlural: string;
  filteredTimelineRows: TimelineRow[];
  isReportMode: boolean;
  isScheduleFiltered: boolean;
  mobileFieldFocus: {
    scene?: Scene;
    rowNumber?: number;
    nextBreakLabel?: string;
  };
  reportStats: ReportStats;
  scheduleStatusFilter: 'all' | 'pending' | 'done' | 'ng';
  template: TemplateType;
  getBreakLocationName: (item: BreakItem) => string;
  MobileFieldControlBar: (props: MobileFieldControlBarProps) => ReactNode;
  MobileTimelineBreakCard: (props: MobileTimelineBreakCardProps) => ReactNode;
  MobileTimelineSceneCard: (props: MobileTimelineSceneCardProps) => ReactNode;
  onDeleteBreak: (item: BreakItem) => void;
  onDeleteScene: (scene: Scene) => void;
  onDuplicateScene: (scene: Scene) => void;
  onEditBreak: (item: BreakItem) => void;
  onEditScene: (scene: Scene) => void;
  onGoReport: () => void;
  onLoadSampleData: () => void;
  onNewScene: () => void;
  onResetFilters: () => void;
  onSetStatusFilter: (status: 'all' | 'pending' | 'done' | 'ng') => void;
  onToggleReportMode: () => void;
};

export default function MobileScheduleList({
  activeDaySceneCount,
  copyEmptyHint,
  copyItemPlural,
  filteredTimelineRows,
  isReportMode,
  isScheduleFiltered,
  mobileFieldFocus,
  reportStats,
  scheduleStatusFilter,
  template,
  getBreakLocationName,
  MobileFieldControlBar,
  MobileTimelineBreakCard,
  MobileTimelineSceneCard,
  onDeleteBreak,
  onDeleteScene,
  onDuplicateScene,
  onEditBreak,
  onEditScene,
  onGoReport,
  onLoadSampleData,
  onNewScene,
  onResetFilters,
  onSetStatusFilter,
  onToggleReportMode,
}: MobileScheduleListProps) {
  return (
    <div className="mobile-timeline-cards space-y-3 p-3 lg:hidden">
      {activeDaySceneCount > 0 && (
        <MobileFieldControlBar
          focusScene={mobileFieldFocus.scene}
          focusRowNumber={mobileFieldFocus.rowNumber || 0}
          nextBreakLabel={mobileFieldFocus.nextBreakLabel || ''}
          copyItemPlural={copyItemPlural}
          reportStats={reportStats}
          isReportMode={isReportMode}
          statusFilter={scheduleStatusFilter}
          onToggleReportMode={onToggleReportMode}
          onSetStatusFilter={onSetStatusFilter}
          onGoReport={onGoReport}
        />
      )}
      {filteredTimelineRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/80 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900">
            <Plus className="h-6 w-6 text-neutral-600" />
          </div>
          <h3 className="text-base font-black text-neutral-200">{isScheduleFiltered ? '필터 결과가 없습니다' : '아직 추가된 일정이 없습니다'}</h3>
          <p className="mt-2 text-sm font-bold leading-relaxed text-neutral-600">{isScheduleFiltered ? '검색어나 필터 조건을 조금 넓혀보세요.' : copyEmptyHint}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {isScheduleFiltered && (
              <button onClick={onResetFilters} className="prepro-btn prepro-btn--secondary h-9">
                필터 초기화
              </button>
            )}
            <button onClick={onNewScene} className="prepro-btn prepro-btn--primary h-9">
              <Plus className="h-3.5 w-3.5" /> 직접 추가
            </button>
            <button onClick={onLoadSampleData} className="prepro-btn prepro-btn--quiet h-9">
              샘플
            </button>
          </div>
        </div>
      ) : (
        filteredTimelineRows.map((row, index) => {
          if (row.type === 'scene') {
            return (
              <MobileTimelineSceneCard
                key={`mobile-${row.id}`}
                scene={row.scene}
                template={template}
                isReportMode={isReportMode}
                rowNumber={index + 1}
                onEdit={() => onEditScene(row.scene)}
                onDuplicate={() => onDuplicateScene(row.scene)}
                onDelete={() => onDeleteScene(row.scene)}
              />
            );
          }

          return (
            <MobileTimelineBreakCard
              key={`mobile-${row.id}`}
              item={row.breakItem}
              locationName={getBreakLocationName(row.breakItem)}
              rowNumber={index + 1}
              onEdit={() => onEditBreak(row.breakItem)}
              onDelete={() => onDeleteBreak(row.breakItem)}
            />
          );
        })
      )}
    </div>
  );
}
