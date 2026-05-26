'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { PlanningDocument } from '@/types/schedule';
import { format } from 'date-fns';
import { ArrowRight, Clipboard, KeyRound, RefreshCw, ShieldCheck, Wand2, XCircle } from 'lucide-react';

export type PlanningAiProvider = 'openai-compatible' | 'gemini' | 'anthropic';

export type PlanningAiSettings = {
  provider: PlanningAiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  rememberKey: boolean;
};

export const defaultPlanningAiSettings: PlanningAiSettings = {
  provider: 'openai-compatible',
  apiKey: '',
  model: 'gpt-4.1-mini',
  baseUrl: 'https://api.openai.com/v1',
  rememberKey: false,
};

type PlanningApiGuideItem = {
  provider: string;
  url: string;
  note: string;
  actionLabel?: string;
};

type PlanningAiPanelProps = {
  guideItems: PlanningApiGuideItem[];
  isPlanningAiRunning: boolean;
  isPlanningAiTesting: boolean;
  planning: PlanningDocument;
  planningAiSettings: PlanningAiSettings;
  planningAiStatus: string;
  planningScheduleLabel: string;
  planningScheduleLines: string[];
  onChangePlanning: (values: Partial<PlanningDocument>) => void;
  onClearApiKey: () => void;
  onCopyPrompt: () => void;
  onGenerateAi: () => void;
  onPlanningToSchedule: () => void;
  onSetAiSettings: Dispatch<SetStateAction<PlanningAiSettings>>;
  onTestConnection: () => void;
};

export default function PlanningAiPanel({
  guideItems,
  isPlanningAiRunning,
  isPlanningAiTesting,
  planning,
  planningAiSettings,
  planningAiStatus,
  planningScheduleLabel,
  planningScheduleLines,
  onChangePlanning,
  onClearApiKey,
  onCopyPrompt,
  onGenerateAi,
  onPlanningToSchedule,
  onSetAiSettings,
  onTestConnection,
}: PlanningAiPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="rounded-[2rem] border border-indigo-500/30 bg-indigo-950/10 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">AI 설정</h3>
            <p className="text-xs font-bold text-neutral-500">사용자 API 키로만 실행</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-neutral-800 bg-black/60 p-4">
          <div className="text-sm font-black text-white">언제 API가 필요한가?</div>
          <div className="mt-3 grid gap-2 text-xs font-bold leading-relaxed text-neutral-400">
            <p>간단한 기획은 API 없이 브리프와 상세 설계를 직접 작성하면 됩니다.</p>
            <p>기획서를 앱 안에서 자동 정리하거나 누락 보완, 스케줄 초안 생성을 반복하려면 API 키를 등록합니다.</p>
            <p>프롬프트 복사는 외부 이동용 기본 흐름이 아니라, API 장애나 수동 검토가 필요할 때 쓰는 백업 기능입니다.</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-sm font-black text-white">무로그인 BYOK 보안 기준</div>
          <div className="mt-3 grid gap-2 text-xs font-bold leading-relaxed text-neutral-300">
            <p>API 키는 계정이나 서버 DB에 저장하지 않습니다.</p>
            <p>AI 정리 버튼을 누를 때만 이 브라우저에서 Next API 라우트를 거쳐 선택한 AI 제공사로 전달됩니다.</p>
            <p>공용 PC에서는 브라우저 저장을 사용하지 마세요. 배포 환경에서는 HTTPS에서만 사용하세요.</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-neutral-800 bg-black/60 p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-600">API Key 발급</div>
          <div className="space-y-2">
            {guideItems.map((item) => (
              <a
                key={item.provider}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-3 transition-colors hover:border-indigo-500/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-neutral-100">{item.provider}</span>
                  <span className="text-[10px] font-black text-indigo-300">{item.actionLabel || '등록 페이지'}</span>
                </div>
                <p className="mt-1 text-[11px] font-bold leading-relaxed text-neutral-600">{item.note}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Provider</span>
            <select
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-black text-white outline-none focus:border-indigo-500"
              value={planningAiSettings.provider}
              onChange={(event) => {
                const provider = event.target.value as PlanningAiProvider;
                onSetAiSettings((current) => ({
                  ...current,
                  provider,
                  model: provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'anthropic' ? 'claude-3-5-sonnet-latest' : current.model || defaultPlanningAiSettings.model,
                  baseUrl: provider === 'openai-compatible' ? current.baseUrl || defaultPlanningAiSettings.baseUrl : '',
                }));
              }}
            >
              <option value="openai-compatible">OpenAI 호환</option>
              <option value="gemini">Gemini</option>
              <option value="anthropic">Claude</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">API Key</span>
            <input
              type="password"
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
              value={planningAiSettings.apiKey}
              onChange={(event) => onSetAiSettings((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder="sk-..., AIza..., claude key"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Model</span>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
              value={planningAiSettings.model}
              onChange={(event) => onSetAiSettings((current) => ({ ...current, model: event.target.value }))}
              placeholder="모델명"
            />
          </label>
          {planningAiSettings.provider === 'openai-compatible' && (
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Base URL</span>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                value={planningAiSettings.baseUrl}
                onChange={(event) => onSetAiSettings((current) => ({ ...current, baseUrl: event.target.value }))}
                placeholder="https://api.openai.com/v1"
              />
            </label>
          )}
          <div className="rounded-xl border border-neutral-800 bg-black/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 text-xs font-bold text-neutral-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-500"
                  checked={planningAiSettings.rememberKey}
                  onChange={(event) => onSetAiSettings((current) => ({ ...current, rememberKey: event.target.checked }))}
                />
                이 브라우저에만 키 저장
              </label>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${
                planningAiSettings.rememberKey && planningAiSettings.apiKey.trim()
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-500'
              }`}>
                {planningAiSettings.rememberKey && planningAiSettings.apiKey.trim() ? '로컬 저장 ON' : '저장 안 함'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearApiKey}
              disabled={!planningAiSettings.apiKey.trim()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-400 transition-all hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:border-neutral-900 disabled:text-neutral-700"
            >
              <XCircle className="h-3.5 w-3.5" /> 입력/저장된 키 삭제
            </button>
          </div>
          <p className="px-1 text-[11px] font-bold leading-relaxed text-neutral-600">
            기본값은 저장 안 함입니다. 저장을 켜면 이 기기의 localStorage에만 보관되며, 공용 PC에서는 권장하지 않습니다.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            onClick={onGenerateAi}
            disabled={isPlanningAiRunning || isPlanningAiTesting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {isPlanningAiRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            AI 기획 정리
          </button>
          <button
            onClick={onTestConnection}
            disabled={isPlanningAiRunning || isPlanningAiTesting || !planningAiSettings.apiKey.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-black px-5 py-3 text-sm font-black text-neutral-300 transition-all hover:border-indigo-500/40 hover:text-indigo-300 disabled:cursor-not-allowed disabled:border-neutral-900 disabled:text-neutral-700"
          >
            {isPlanningAiTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            연결 테스트
          </button>
          <button
            onClick={onPlanningToSchedule}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-200 transition-all hover:bg-cyan-500/15"
          >
            <ArrowRight className="h-4 w-4" /> 스케줄 초안 추가
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-neutral-900 bg-black/40 p-3">
          <button
            onClick={onCopyPrompt}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-800 px-3 py-2 text-xs font-black text-neutral-500 transition-all hover:border-neutral-700 hover:text-neutral-300"
          >
            <Clipboard className="h-3.5 w-3.5" /> 백업용 프롬프트 복사
          </button>
          <p className="mt-2 text-[11px] font-bold leading-relaxed text-neutral-700">
            API 장애, 외부 검수, 수동 백업이 필요할 때만 사용합니다.
          </p>
        </div>

        {planningAiStatus && (
          <div className="mt-4 rounded-xl border border-neutral-800 bg-black/70 px-4 py-3 text-xs font-black text-neutral-300">
            {planningAiStatus}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400">Schedule Draft</p>
              <h3 className="mt-2 text-lg font-black text-white">스케줄 변환 후보</h3>
            </div>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200">
              {planningScheduleLines.length}개
            </span>
          </div>
          <div className="space-y-2">
            {planningScheduleLines.length > 0 ? planningScheduleLines.slice(0, 6).map((line, index) => (
              <div key={`${line}-${index}`} className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-3 text-sm font-bold text-neutral-300">
                {index + 1}. {line}
              </div>
            )) : (
              <div className="rounded-xl border border-neutral-900 bg-black/50 px-4 py-5 text-sm font-bold text-neutral-600">
                상세 설계 탭에서 {planningScheduleLabel} 입력하면 스케줄 초안으로 변환할 수 있습니다.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-neutral-900 bg-neutral-950 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-white">AI 정리본</h3>
            {planning.aiUpdatedAt && <span className="text-[10px] font-black text-neutral-600">{format(new Date(planning.aiUpdatedAt), 'MM.dd HH:mm')}</span>}
          </div>
          <textarea
            className="min-h-96 w-full rounded-2xl border border-neutral-800 bg-black px-4 py-4 text-xs font-bold leading-relaxed text-neutral-200 outline-none focus:border-indigo-500"
            value={planning.aiDraft || ''}
            onChange={(event) => onChangePlanning({ aiDraft: event.target.value })}
            placeholder="AI 기획 정리 결과가 여기에 저장됩니다."
          />
        </div>
      </div>
    </div>
  );
}
