'use client';

import type { ReactNode } from 'react';
import type { BreakItem, Scene, TemplateType } from '@/types/schedule';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DesktopScheduleEmptyRow from './DesktopScheduleEmptyRow';

type TimelineRow =
  | { id: string; type: 'scene'; scene: Scene }
  | { id: string; type: 'break'; breakItem: BreakItem };

type SortableRowProps = {
  scene: Scene;
  template: TemplateType;
  isReportMode: boolean;
  rowNumber: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

type SortableBreakRowProps = {
  item: BreakItem;
  locationName: string;
  rowNumber: number;
  onEdit: () => void;
  onDelete: () => void;
};

type DesktopScheduleTableProps = {
  contentColumnLabel: string;
  copyEmptyHint: string;
  infoColumnLabel: string;
  isMusicTimelineTemplate: boolean;
  isReportMode: boolean;
  isScheduleFiltered: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  template: TemplateType;
  timelineRows: TimelineRow[];
  getBreakLocationName: (item: BreakItem) => string;
  onDeleteBreak: (item: BreakItem) => void;
  onDeleteScene: (scene: Scene) => void;
  onDuplicateScene: (scene: Scene) => void;
  onEditBreak: (item: BreakItem) => void;
  onEditScene: (scene: Scene) => void;
  onLoadSampleData: () => void;
  onNewScene: () => void;
  onOpenAnalyzer: () => void;
  onResetFilters: () => void;
  onTimelineDragEnd: (event: DragEndEvent) => void;
  SortableBreakRow: (props: SortableBreakRowProps) => ReactNode;
  SortableRow: (props: SortableRowProps) => ReactNode;
};

export default function DesktopScheduleTable({
  contentColumnLabel,
  copyEmptyHint,
  infoColumnLabel,
  isMusicTimelineTemplate,
  isReportMode,
  isScheduleFiltered,
  sensors,
  template,
  timelineRows,
  getBreakLocationName,
  onDeleteBreak,
  onDeleteScene,
  onDuplicateScene,
  onEditBreak,
  onEditScene,
  onLoadSampleData,
  onNewScene,
  onOpenAnalyzer,
  onResetFilters,
  onTimelineDragEnd,
  SortableBreakRow,
  SortableRow,
}: DesktopScheduleTableProps) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTimelineDragEnd}>
      <table className="desktop-schedule-table hidden w-full min-w-[1120px] text-sm text-left lg:table">
        <thead className="bg-neutral-950 text-neutral-500 uppercase text-[11px] border-b border-neutral-900">
          <tr>
            <th className="px-4 py-3 font-black w-12 text-center">순서</th>
            <th className="px-4 py-3 font-black w-32">시간</th>

            {template === 'film' && (
              <>
                <th className="px-4 py-3 font-black w-28">{infoColumnLabel}</th>
                <th className="px-4 py-3 font-black w-40">콘티</th>
              </>
            )}
            {template === 'event' && (
              <>
                <th className="px-4 py-3 font-black w-28">식순 구분</th>
                <th className="px-4 py-3 font-black w-40">샷 플랜</th>
              </>
            )}
            {isMusicTimelineTemplate && (
              <>
                <th className="px-4 py-3 font-black w-40">타임코드 / 가사</th>
                <th className="px-4 py-3 font-black w-40">{template === 'musicvideo' ? 'MV 레퍼런스' : '레퍼런스'}</th>
              </>
            )}
            {template === 'ad' && (
              <>
                <th className="px-4 py-3 font-black w-28">{infoColumnLabel}</th>
                <th className="px-4 py-3 font-black w-40">콘티</th>
              </>
            )}

            <th className="px-4 py-3 font-black w-36">장소</th>
            <th className="px-4 py-3 font-black min-w-[260px]">{contentColumnLabel}</th>
            <th className="px-4 py-3 font-black w-20 text-right">분량</th>
          </tr>
        </thead>
        <SortableContext items={timelineRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <tbody className="divide-y divide-neutral-900">
            {timelineRows.length === 0 ? (
              <DesktopScheduleEmptyRow
                copyEmptyHint={copyEmptyHint}
                isScheduleFiltered={isScheduleFiltered}
                template={template}
                onLoadSampleData={onLoadSampleData}
                onNewScene={onNewScene}
                onOpenAnalyzer={onOpenAnalyzer}
                onResetFilters={onResetFilters}
              />
            ) : (
              <>
                {timelineRows.map((row, index) => {
                  if (row.type === 'scene') {
                    return (
                      <SortableRow
                        key={row.id}
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
                    <SortableBreakRow
                      key={row.id}
                      item={row.breakItem}
                      locationName={getBreakLocationName(row.breakItem)}
                      rowNumber={index + 1}
                      onEdit={() => onEditBreak(row.breakItem)}
                      onDelete={() => onDeleteBreak(row.breakItem)}
                    />
                  );
                })}
              </>
            )}
          </tbody>
        </SortableContext>
      </table>
    </DndContext>
  );
}
