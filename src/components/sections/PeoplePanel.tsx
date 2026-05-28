'use client';

import type { RefObject } from 'react';
import { format } from 'date-fns';
import type { Person, Scene, TemplateType } from '@/types/schedule';
import { Clock, Database, Download, Plus, Users } from 'lucide-react';

type CallSheetPerson = {
  person: Person;
  assignedCount: number;
  firstLocation: string;
  firstStartTime?: Date;
  missingCallTime: boolean;
  missingContact: boolean;
};

type CallSheetStats = {
  earliestCall: string;
  missingCallTime: number;
  missingContact: number;
};

type PeoplePanelCopy = {
  item: string;
  itemPlural: string;
};

type PeoplePanelProps = {
  callSheetPdfRef: RefObject<HTMLDivElement | null>;
  callSheetPeople: CallSheetPerson[];
  callSheetStats: CallSheetStats;
  copy: PeoplePanelCopy;
  filteredCallSheetPeople: CallSheetPerson[];
  filteredPeople: Person[];
  isExportingPdf: boolean;
  location: string;
  people: Person[];
  peopleIssueFilter: boolean;
  personCategoryLabels: Record<Person['category'], string>;
  scenes: Scene[];
  shootingDate: string;
  template: TemplateType;
  templateLabel: string;
  onDeletePerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onExportPDF: () => void;
  onGoSchedule: () => void;
  onLoadSampleData: () => void;
  onNewPerson: () => void;
  onToggleIssueFilter: () => void;
  pdfButtonText: (label: string) => string;
};

const descriptionByTemplate: Record<TemplateType, string> = {
  event: '진행자, 연사, 운영 스태프를 등록하고 프로그램에 연결합니다.',
  musicvideo: '아티스트, 출연자, 촬영/미술/스타일링 스태프를 구간에 연결합니다.',
  dance: '멤버와 촬영 스태프를 등록하고 구간 포커스에 연결합니다.',
  film: '출연진과 스태프를 등록하고 씬에 연결합니다.',
  ad: '출연진과 스태프를 등록하고 씬에 연결합니다.',
};

const emptyDescriptionByTemplate: Record<TemplateType, string> = {
  event: '프로그램 담당자, 연사, 운영 스태프를 등록하면 식순과 콜시트에 바로 연결됩니다.',
  musicvideo: '아티스트와 촬영/미술/스타일링 스태프를 등록하면 MV 구간별 콜시트가 정리됩니다.',
  dance: '멤버와 촬영 스태프를 등록하면 포커스 멤버와 콜타임 관리가 쉬워집니다.',
  film: '출연진과 스태프를 등록하면 씬 연결, 콜타임, 연락처 누락을 한 번에 볼 수 있습니다.',
  ad: '출연진과 스태프를 등록하면 씬 연결, 콜타임, 연락처 누락을 한 번에 볼 수 있습니다.',
};

export default function PeoplePanel({
  callSheetPdfRef,
  callSheetPeople,
  callSheetStats,
  copy,
  filteredCallSheetPeople,
  filteredPeople,
  isExportingPdf,
  location,
  people,
  peopleIssueFilter,
  personCategoryLabels,
  scenes,
  shootingDate,
  template,
  templateLabel,
  onDeletePerson,
  onEditPerson,
  onExportPDF,
  onGoSchedule,
  onLoadSampleData,
  onNewPerson,
  onToggleIssueFilter,
  pdfButtonText,
}: PeoplePanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-neutral-100">인원 DB</h2>
          <p className="text-sm text-neutral-500">{descriptionByTemplate[template]}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:justify-end">
          <button
            onClick={onExportPDF}
            disabled={isExportingPdf}
            className="prepro-btn prepro-btn--secondary min-h-12 w-full justify-center px-5 text-sm md:w-auto"
          >
            <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-pulse' : ''}`} /> {pdfButtonText('콜시트 PDF')}
          </button>
          <button onClick={onNewPerson} className="prepro-btn prepro-btn--primary min-h-12 w-full justify-center px-5 text-sm md:w-auto">
            + 인원 추가
          </button>
        </div>
      </div>

      <div ref={callSheetPdfRef} className="pdf-export-root rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">콜시트</div>
            <h3 className="mt-1 text-lg font-black text-neutral-100">현장 콜타임 보드</h3>
            <p className="mt-1 text-sm text-neutral-500">{shootingDate} · {location || '촬영지 미정'} · {templateLabel}</p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              {[
                { label: '첫 콜', value: callSheetStats.earliestCall, tone: 'text-cyan-300' },
                { label: '콜 미정', value: `${callSheetStats.missingCallTime}`, tone: callSheetStats.missingCallTime ? 'text-amber-300' : 'text-green-300' },
                { label: '연락처 누락', value: `${callSheetStats.missingContact}`, tone: callSheetStats.missingContact ? 'text-red-300' : 'text-green-300' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-left sm:text-right">
                  <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{item.label}</div>
                  <div className={`mt-1 text-base font-black ${item.tone}`}>{item.value}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleIssueFilter}
              disabled={callSheetStats.missingCallTime + callSheetStats.missingContact === 0}
              className={`prepro-btn min-h-11 w-full justify-center md:h-9 md:min-h-0 md:w-auto ${peopleIssueFilter ? 'prepro-btn--warm' : 'prepro-btn--secondary'}`}
            >
              {peopleIssueFilter ? '전체 인원 보기' : '누락 인원만 보기'}
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-neutral-900 bg-black/40 px-4 py-2 text-right text-[10px] font-bold text-neutral-600">
          Created with PrePro Studio
        </div>

        {callSheetPeople.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 px-4 py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-black text-neutral-500">
              <Users className="h-4 w-4" />
            </div>
            <div className="mt-3 text-sm font-black text-neutral-300">콜시트에 표시할 인원이 없습니다.</div>
            <p className="mt-1 text-xs font-bold text-neutral-600">인원을 먼저 등록하면 콜타임 PDF가 바로 정리됩니다.</p>
            <div data-html2canvas-ignore="true" className="mt-4 flex justify-center">
              <button type="button" onClick={onNewPerson} className="prepro-btn prepro-btn--secondary h-9">
                <Plus className="h-3.5 w-3.5" /> 인원 추가
              </button>
            </div>
          </div>
        ) : filteredCallSheetPeople.length === 0 ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-8 text-center text-sm font-bold text-green-300">
            콜타임과 연락처 누락이 없습니다.
          </div>
        ) : (
          <div>
            <div className="space-y-3 md:hidden">
              {filteredCallSheetPeople.map(({ person, assignedCount, firstLocation, firstStartTime, missingCallTime, missingContact }) => (
                <div key={person.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-2xl font-black leading-none text-cyan-300">{person.callTime || '미정'}</div>
                      <div className="mt-3 font-black text-neutral-100">{person.name}</div>
                      <div className="mt-1 text-xs font-bold text-neutral-500">{person.role || (person.category === 'cast' ? '출연진' : '스태프')}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase ${person.category === 'cast' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-amber-500/10 text-amber-300'}`}>
                      {personCategoryLabels[person.category]}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">첫 투입</div>
                      <div className="mt-1 truncate font-bold text-neutral-200">{firstLocation || '미정'}</div>
                      <div className="mt-0.5 text-[11px] font-bold text-neutral-600">{firstStartTime ? `${format(firstStartTime, 'HH:mm')} 첫 일정` : '시간 미정'}</div>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-black/30 px-3 py-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-neutral-600">연결</div>
                      <div className="mt-1 font-bold text-neutral-300">{assignedCount}개 {copy.itemPlural}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {missingCallTime && <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">콜 미정</span>}
                    {missingContact && <span className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300">연락처 없음</span>}
                    {!missingCallTime && !missingContact && <span className="rounded bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-300">확인 완료</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto custom-scrollbar md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500">
                  <tr>
                    <th className="px-3 py-3 font-black">콜</th>
                    <th className="px-3 py-3 font-black">이름</th>
                    <th className="px-3 py-3 font-black">구분</th>
                    <th className="px-3 py-3 font-black">첫 투입</th>
                    <th className="px-3 py-3 font-black">연결</th>
                    <th className="px-3 py-3 font-black">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredCallSheetPeople.map(({ person, assignedCount, firstLocation, firstStartTime, missingCallTime, missingContact }) => (
                    <tr key={person.id} className="hover:bg-neutral-900/60">
                      <td className="px-3 py-3 font-mono text-lg font-black text-cyan-300">{person.callTime || '미정'}</td>
                      <td className="px-3 py-3">
                        <div className="font-black text-neutral-100">{person.name}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">{person.role || (person.category === 'cast' ? '출연진' : '스태프')}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${person.category === 'cast' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-amber-500/10 text-amber-300'}`}>
                          {personCategoryLabels[person.category]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-300">
                        <div className="font-bold">{firstLocation || '미정'}</div>
                        <div className="mt-0.5 text-xs text-neutral-600">{firstStartTime ? `${format(firstStartTime, 'HH:mm')} 첫 일정` : '시간 미정'}</div>
                      </td>
                      <td className="px-3 py-3 text-neutral-400">{assignedCount}개 {copy.itemPlural}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {missingCallTime && <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">콜 미정</span>}
                          {missingContact && <span className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300">연락처 없음</span>}
                          {!missingCallTime && !missingContact && <span className="rounded bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-300">확인 완료</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {people.length === 0 ? (
          <div className="col-span-full overflow-hidden rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/70">
            <div className="grid gap-0 lg:grid-cols-[minmax(260px,0.7fr)_minmax(420px,1fr)]">
              <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.1),rgba(242,161,75,0.08)_60%,transparent)] p-6 lg:border-b-0 lg:border-r">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-100">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-black text-neutral-100">첫 인원을 등록하세요.</h3>
                <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-neutral-500">
                  {emptyDescriptionByTemplate[template]}
                </p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { label: '인원 직접 추가', detail: '역할, 연락처, 콜타임 입력', Icon: Plus, action: onNewPerson, tone: 'primary' },
                  { label: '촬영표에서 연결', detail: `${copy.item}에 인원을 연결`, Icon: Clock, action: onGoSchedule, tone: 'neutral' },
                  { label: '샘플로 확인', detail: `${templateLabel} 예시 인원 불러오기`, Icon: Database, action: onLoadSampleData, tone: 'neutral' },
                ].map((item) => {
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      className={`prepro-action-card group rounded-xl border p-4 text-left transition-all ${item.tone === 'primary' ? 'is-primary' : ''}`}
                    >
                      <Icon className="h-4 w-4 text-amber-200" />
                      <div className="mt-4 text-sm font-black text-neutral-100">{item.label}</div>
                      <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-green-500/20 bg-green-500/5 p-10 text-center text-green-300">
            누락 항목이 있는 인원이 없습니다.
          </div>
        ) : filteredPeople.map((person) => {
          const sceneCount = scenes.filter((scene) => scene.castIds?.includes(person.id) || scene.crewIds?.includes(person.id)).length;
          return (
            <div key={person.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ${person.category === 'cast' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {person.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-black text-neutral-100">{person.name}</h3>
                  <p className="text-xs text-neutral-500">{person.role || (person.category === 'cast' ? '출연진' : '스태프')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-900 px-3 py-2 text-xs">
                <span className="font-bold text-neutral-500">{personCategoryLabels[person.category]}</span>
                <span className="font-bold text-neutral-300">{sceneCount}개 {copy.itemPlural}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs">
                <span className="font-bold uppercase text-neutral-500">콜</span>
                <span className="font-black text-cyan-300">{person.callTime || '미정'}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => onEditPerson(person)} className="prepro-btn prepro-btn--secondary h-9">
                  편집
                </button>
                <button onClick={() => onDeletePerson(person)} className="prepro-btn prepro-btn--danger h-9">
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
