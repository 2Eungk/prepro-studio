'use client';

type ReportStats = {
  done: number;
  ng: number;
  pending: number;
  totalMinutes: number;
  completionRate: number;
};

type ScheduleExportHeaderProps = {
  activeDayIndex: number;
  activeShootingDate: string;
  displayedSceneCount: number;
  filteredSceneCount: number;
  isMusicTimelineTemplate: boolean;
  isReportMode: boolean;
  isScheduleFiltered: boolean;
  itemPluralLabel: string;
  location: string;
  locationsCount: number;
  pdfKindLabel: string;
  reportStats: ReportStats;
  template: string;
  templateLabel: string;
  totalItemLabel: string;
  totalMinutes: number;
  wrapTimeLabel: string;
};

export default function ScheduleExportHeader({
  activeDayIndex,
  activeShootingDate,
  displayedSceneCount,
  filteredSceneCount,
  isMusicTimelineTemplate,
  isReportMode,
  isScheduleFiltered,
  itemPluralLabel,
  location,
  locationsCount,
  pdfKindLabel,
  reportStats,
  template,
  templateLabel,
  totalItemLabel,
  totalMinutes,
  wrapTimeLabel,
}: ScheduleExportHeaderProps) {
  return (
    <>
      <div className="pdf-export-header flex flex-col gap-4 border-b border-neutral-900 bg-neutral-950/90 px-4 py-5 sm:px-6 md:flex-row md:items-end md:justify-between lg:min-w-[960px]">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">{templateLabel}</div>
          <h3 className="mt-1 text-2xl font-black text-neutral-100">{pdfKindLabel}</h3>
          <p className="mt-1 text-xs font-bold text-neutral-500">Day {activeDayIndex + 1} · {activeShootingDate} · {location || '촬영지 미정'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right text-xs sm:grid-cols-4">
          {[
            { label: totalItemLabel, value: `${displayedSceneCount}` },
            { label: '총 운영', value: `${totalMinutes}분` },
            { label: '예상 종료', value: wrapTimeLabel },
            { label: '장소', value: `${locationsCount}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/60 px-3 py-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
              <div className="mt-1 text-base font-black text-neutral-200">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      {isScheduleFiltered && (
        <div className="border-b border-neutral-900 bg-indigo-500/5 px-6 py-3 text-xs font-bold text-indigo-300">
          필터 적용됨 · {filteredSceneCount}/{displayedSceneCount}개 {itemPluralLabel} 표시
        </div>
      )}
      {isReportMode && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-neutral-900 bg-neutral-950/70 p-5">
          {[
            { label: '완료', value: `${reportStats.done}개`, tone: 'text-green-400' },
            { label: 'NG', value: `${reportStats.ng}개`, tone: 'text-red-400' },
            { label: '대기', value: `${reportStats.pending}개`, tone: 'text-neutral-300' },
            { label: template === 'event' ? '운영 시간' : isMusicTimelineTemplate ? '총 구간' : '총 촬영', value: `${reportStats.totalMinutes}분`, tone: 'text-cyan-400' },
            { label: '완료율', value: `${reportStats.completionRate}%`, tone: 'text-indigo-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/60 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">{item.label}</div>
              <div className={`mt-1 text-xl font-black ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="border-b border-neutral-900 bg-black/40 px-6 py-2 text-right text-[10px] font-bold text-neutral-600">
        Created with PrePro Studio
      </div>
    </>
  );
}
