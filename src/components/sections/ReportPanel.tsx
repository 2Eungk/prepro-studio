'use client';

import type { RefObject } from 'react';
import Image from 'next/image';
import type { Scene, TemplateType } from '@/types/schedule';
import { Clock, Database, Download, FileText, Image as ImageIcon, Plus } from 'lucide-react';

type ReportStats = {
  done: number;
  ng: number;
  pending: number;
  totalMinutes: number;
  doneMinutes: number;
  ngMinutes: number;
  pendingMinutes: number;
  completionRate: number;
};

type ReportLocationStat = {
  name: string;
  total: number;
  done: number;
  ng: number;
  pending: number;
  minutes: number;
  completionRate: number;
};

type ReportActionItem = {
  scene: Scene;
  priority: string;
  action: string;
};

type ReportSceneGroups = {
  ng: Scene[];
  done: Scene[];
  pending: Scene[];
};

type ReportPanelCopy = {
  item: string;
  itemPlural: string;
};

type ReportPanelProps = {
  copy: ReportPanelCopy;
  isExportingPdf: boolean;
  isMusicTimelineTemplate: boolean;
  location: string;
  reportActionItems: ReportActionItem[];
  reportLocationStats: ReportLocationStat[];
  reportPdfRef: RefObject<HTMLDivElement | null>;
  reportSceneGroups: ReportSceneGroups;
  reportStats: ReportStats;
  scenes: Scene[];
  shootingDate: string;
  template: TemplateType;
  templateLabel: string;
  onEnableReportMode: () => void;
  onExportPDF: () => void;
  onGoSchedule: () => void;
  onLoadSampleData: () => void;
  onNewScene: () => void;
  pdfButtonText: (label: string) => string;
  storyboardFallback: (seed: string) => string;
};

const reportTitleByTemplate: Record<TemplateType, string> = {
  event: '행사 결과 리포트',
  ad: '광고 촬영 리포트',
  musicvideo: '뮤직비디오 촬영 리포트',
  dance: '댄스커버 촬영 리포트',
  film: '촬영 리포트',
};

export default function ReportPanel({
  copy,
  isExportingPdf,
  isMusicTimelineTemplate,
  location,
  reportActionItems,
  reportLocationStats,
  reportPdfRef,
  reportSceneGroups,
  reportStats,
  scenes,
  shootingDate,
  template,
  templateLabel,
  onEnableReportMode,
  onExportPDF,
  onGoSchedule,
  onLoadSampleData,
  onNewScene,
  pdfButtonText,
  storyboardFallback,
}: ReportPanelProps) {
  return (
    <div ref={reportPdfRef} className="pdf-export-root rounded-3xl border border-neutral-800 bg-neutral-950 p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-100">{reportTitleByTemplate[template]}</h2>
          <p className="text-sm text-neutral-500">{shootingDate} · {location || '촬영지 미정'} · {templateLabel}</p>
        </div>
        <div data-html2canvas-ignore="true" className="flex flex-wrap gap-2">
          <button onClick={onEnableReportMode} className="prepro-btn prepro-btn--secondary h-12 px-5 text-sm">
            리포트 모드 켜기
          </button>
          <button
            onClick={onExportPDF}
            disabled={isExportingPdf}
            className="prepro-btn prepro-btn--primary h-12 px-5 text-sm"
          >
            <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-pulse' : ''}`} /> {pdfButtonText('결과 PDF')}
          </button>
        </div>
      </div>
      {scenes.length === 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-dashed border-neutral-800 bg-black/35">
          <div className="grid gap-0 lg:grid-cols-[minmax(260px,0.75fr)_minmax(420px,1fr)]">
            <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.1),rgba(242,161,75,0.06)_58%,transparent)] p-5 lg:border-b-0 lg:border-r">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-100">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-neutral-100">리포트는 촬영표에서 시작됩니다.</h3>
              <p className="mt-2 text-sm font-bold leading-relaxed text-neutral-500">
                일정이 생기면 Done/NG 체크, 장소별 진행률, 후속조치, 결과 PDF가 자동으로 연결됩니다.
              </p>
            </div>
            <div data-html2canvas-ignore="true" className="grid gap-3 p-5 sm:grid-cols-3">
              <button type="button" onClick={onNewScene} className="prepro-action-card is-primary rounded-xl border p-4 text-left">
                <Plus className="h-4 w-4 text-teal-200" />
                <div className="mt-4 text-sm font-black text-neutral-100">{copy.item} 추가</div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">첫 항목을 직접 등록</p>
              </button>
              <button type="button" onClick={onGoSchedule} className="prepro-action-card rounded-xl border p-4 text-left">
                <Clock className="h-4 w-4 text-neutral-300" />
                <div className="mt-4 text-sm font-black text-neutral-100">촬영표 보기</div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">일정 구성으로 이동</p>
              </button>
              <button type="button" onClick={onLoadSampleData} className="prepro-action-card rounded-xl border p-4 text-left">
                <Database className="h-4 w-4 text-neutral-300" />
                <div className="mt-4 text-sm font-black text-neutral-100">샘플 로드</div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">결과 리포트 흐름 확인</p>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '완료', value: `${reportStats.done}개`, tone: 'text-green-400' },
          { label: 'NG', value: `${reportStats.ng}개`, tone: 'text-red-400' },
          { label: '대기', value: `${reportStats.pending}개`, tone: 'text-neutral-300' },
          { label: template === 'event' ? '운영 시간' : isMusicTimelineTemplate ? '총 구간' : '총 촬영', value: `${reportStats.totalMinutes}분`, tone: 'text-cyan-400' },
          { label: '완료율', value: `${reportStats.completionRate}%`, tone: 'text-indigo-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">{item.label}</div>
            <div className={`mt-1 text-xl font-black ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-neutral-800 bg-black/35 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-neutral-100">현장 체크 요약</h3>
            <p className="mt-1 text-xs font-bold text-neutral-500">완료/재확인/남은 확인을 한 줄에서 바로 판단합니다.</p>
          </div>
          <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black text-indigo-200">{reportStats.completionRate}% 완료</span>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-green-200/70">완료</div>
            <div className="mt-1 text-2xl font-black text-green-200">{reportStats.done}개</div>
            <div className="mt-1 text-xs font-bold text-green-100/60">{reportStats.doneMinutes}분 확보</div>
          </div>
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-red-200/70">재확인</div>
            <div className="mt-1 text-2xl font-black text-red-200">{reportStats.ng}개</div>
            <div className="mt-1 text-xs font-bold text-red-100/60">{reportStats.ngMinutes}분 리커버리 후보</div>
          </div>
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">남은 확인</div>
            <div className="mt-1 text-2xl font-black text-neutral-100">{reportStats.pending}개</div>
            <div className="mt-1 text-xs font-bold text-neutral-500">{reportStats.pendingMinutes}분 대기</div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-neutral-900 bg-black/40 px-4 py-2 text-right text-[10px] font-bold text-neutral-600">
        Created with PrePro Studio
      </div>
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
        <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-neutral-500">
          <span>진행률</span>
          <span className="text-neutral-300">{reportStats.doneMinutes}분 완료 / {reportStats.totalMinutes || 0}분</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${reportStats.completionRate}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-green-500/10 px-3 py-2 text-green-300">완료 {reportStats.doneMinutes}분</div>
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-red-300">NG {reportStats.ngMinutes}분</div>
          <div className="rounded-lg bg-neutral-800 px-3 py-2 text-neutral-300">대기 {reportStats.pendingMinutes}분</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-neutral-100">장소별 진행률</h3>
              <p className="mt-1 text-xs text-neutral-500">어느 장소에 후속 확인이 남았는지 바로 봅니다.</p>
            </div>
            <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-black text-neutral-400">{reportLocationStats.length}곳</span>
          </div>
          <div className="space-y-3">
            {reportLocationStats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700 px-3 py-8 text-center text-xs text-neutral-500">장소 데이터 없음</div>
            ) : reportLocationStats.map((item) => (
              <div key={item.name} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-neutral-100">{item.name}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-neutral-500">{item.total}개 · {item.minutes}분</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-300">{item.completionRate}%</div>
                    <div className="text-[10px] font-bold text-neutral-600">완료율</div>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.completionRate}%` }} />
                </div>
                <div className="mt-2 flex gap-2 text-[10px] font-bold">
                  <span className="rounded bg-green-500/10 px-2 py-1 text-green-300">완료 {item.done}</span>
                  <span className="rounded bg-red-500/10 px-2 py-1 text-red-300">NG {item.ng}</span>
                  <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-300">대기 {item.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-neutral-100">후속조치</h3>
              <p className="mt-1 text-xs text-neutral-500">NG와 대기 항목만 모아봅니다.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black ${reportActionItems.length ? 'bg-red-500/10 text-red-300' : 'bg-green-500/10 text-green-300'}`}>
              {reportActionItems.length ? `${reportActionItems.length}건` : '완료'}
            </span>
          </div>
          <div className="space-y-2">
            {reportActionItems.length === 0 ? (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-8 text-center text-xs font-bold text-green-300">후속조치 없음</div>
            ) : reportActionItems.map(({ scene, priority, action }) => (
              <div key={scene.id} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`mb-1 inline-flex rounded px-2 py-0.5 text-[9px] font-black ${priority === '필수' ? 'bg-red-500/15 text-red-300' : 'bg-neutral-800 text-neutral-300'}`}>{priority}</div>
                    <div className="text-sm font-bold text-neutral-100">{scene.sceneNumber || scene.eventSection || copy.item} · {scene.location || '장소 미정'}</div>
                    <div className="mt-1 text-xs text-neutral-500">{action}</div>
                  </div>
                  <div className="shrink-0 text-xs font-black text-neutral-500">{scene.estimatedMinutes}분</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          { title: template === 'event' ? 'NG / 재확인 필요' : isMusicTimelineTemplate ? 'NG / 재촬영 구간' : 'NG / 재촬영 필요', scenes: reportSceneGroups.ng, tone: 'border-red-500/30 bg-red-500/5 text-red-300', empty: `NG ${copy.item} 없음` },
          { title: `완료 ${copy.itemPlural}`, scenes: reportSceneGroups.done, tone: 'border-green-500/30 bg-green-500/5 text-green-300', empty: '완료 체크 없음' },
          { title: `대기 ${copy.itemPlural}`, scenes: reportSceneGroups.pending, tone: 'border-neutral-700 bg-neutral-900 text-neutral-300', empty: `대기 ${copy.item} 없음` },
        ].map((group) => (
          <div key={group.title} className={`rounded-2xl border p-4 ${group.tone}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-100">{group.title}</h3>
              <span className="rounded-full bg-black/30 px-2 py-1 text-[10px] font-black">{group.scenes.length}개</span>
            </div>
            <div className="space-y-2">
              {group.scenes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-700 px-3 py-8 text-center text-xs text-neutral-500">{group.empty}</div>
              ) : (
                group.scenes.map((scene) => (
                  <div key={scene.id} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                    <div className="flex items-start gap-3">
                      <div className="pdf-shot-frame relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-white">
                        {scene.visualRef ? (
                          <Image
                            src={scene.visualRef}
                            alt={scene.sceneNumber || scene.eventSection || copy.item}
                            width={160}
                            height={90}
                            unoptimized
                            className="h-full w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = storyboardFallback(scene.sceneNumber || scene.eventSection || copy.item); }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-neutral-900">
                            <ImageIcon className="h-4 w-4 text-neutral-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{scene.sceneNumber || (template === 'event' ? scene.eventSection : 'NO SCENE') || copy.item} · {scene.location || '장소 미정'}</div>
                        <div className="mt-1 text-sm font-bold text-neutral-100">{scene.description || '상세 내용 없음'}</div>
                        {(scene.cast || scene.clientMemo || scene.cameraGear || scene.lightingNote) && (
                          <div className="mt-2 text-xs text-neutral-500">
                            {scene.cast && <span>{template === 'event' ? '진행/참석: ' : template === 'ad' ? '모델/출연: ' : template === 'musicvideo' ? '아티스트/출연: ' : template === 'dance' ? '멤버: ' : '출연: '}{scene.cast}</span>}
                            {isMusicTimelineTemplate && scene.musicCue && <span>타임코드: {scene.musicCue}</span>}
                            {scene.cast && (scene.clientMemo || scene.cameraGear || scene.lightingNote) && <span> · </span>}
                            {scene.clientMemo && <span>메모: {scene.clientMemo}</span>}
                            {!scene.clientMemo && scene.cameraGear && <span>장비: {scene.cameraGear}</span>}
                            {!scene.clientMemo && !scene.cameraGear && scene.lightingNote && <span>톤: {scene.lightingNote}</span>}
                          </div>
                        )}
                        {(scene.takeNote || scene.continuityNote || scene.lensNote || scene.slateNote || scene.props || scene.costume || scene.soundNote || scene.specialInstruction || scene.insertNote) && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-neutral-500">
                            {[
                              scene.takeNote && ['테이크', scene.takeNote],
                              scene.continuityNote && ['연결', scene.continuityNote],
                              scene.lensNote && ['카메라', scene.lensNote],
                              scene.slateNote && ['슬레이트', scene.slateNote],
                              scene.props && ['소품', scene.props],
                              scene.costume && ['의상', scene.costume],
                              scene.soundNote && ['사운드', scene.soundNote],
                              scene.specialInstruction && ['지시', scene.specialInstruction],
                              scene.insertNote && ['인서트', scene.insertNote],
                            ].filter(Boolean).map((entry) => {
                              const [label, value] = entry as string[];
                              return <span key={`${scene.id}-${label}`} className="rounded-full border border-neutral-800 px-2 py-1">{label} · {value}</span>;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-xs font-black text-neutral-400">{scene.estimatedMinutes}분</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
