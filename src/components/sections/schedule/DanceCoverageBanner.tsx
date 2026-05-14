import type { TemplateType } from '@/types/schedule';
import { Music2 } from 'lucide-react';

type DanceCoverageStats = {
  cueCount: number;
  lyricCount: number;
  oneTakeCount: number;
  insertCount: number;
  focusMembers: Array<string | undefined>;
  shotSizes: string[];
};

export default function DanceCoverageBanner({
  stats,
  template,
}: {
  stats: DanceCoverageStats;
  template: TemplateType;
}) {
  const isMusicVideo = template === 'musicvideo';
  const focusMembers = stats.focusMembers.filter((member): member is string => Boolean(member));

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-400/25 bg-neutral-950/85">
      <div className="grid gap-0 lg:grid-cols-[minmax(280px,0.7fr)_minmax(520px,1.3fr)]">
        <div className="border-b border-neutral-900 bg-[linear-gradient(135deg,rgba(94,215,207,0.16),rgba(242,161,75,0.07)_58%,transparent)] p-5 lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-teal-100">
            <Music2 className="h-3 w-3" />
            {isMusicVideo ? 'Music Video Mode' : 'Dance Cover Mode'}
          </div>
          <h2 className="mt-4 text-2xl font-black text-white">{isMusicVideo ? '타임코드로 짜는 MV 콘티' : '타임코드로 짜는 댄스 콘티'}</h2>
          <p className="mt-2 text-sm font-bold leading-relaxed text-neutral-500">
            {isMusicVideo ? '곡 구조를 기준으로 립싱크, 퍼포먼스, B-roll, 인서트 컷을 구간별로 쌓아가는 방식입니다.' : '원테이크 풀샷을 기준으로, 포커스 멤버와 인서트 컷을 구간별로 쌓아가는 방식입니다.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(isMusicVideo ? ['립싱크', '퍼포먼스', 'B-roll', '가사 큐'] : ['원테이크', '인서트', '포커스 멤버', '가사 큐']).map((label) => (
              <span key={label} className="rounded-full border border-neutral-800 bg-black/45 px-3 py-1 text-[10px] font-black text-neutral-300">
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: '타임코드 큐', value: `${stats.cueCount}개`, detail: `${stats.lyricCount}개 가사 연결`, tone: 'text-teal-200' },
            {
              label: isMusicVideo ? '퍼포먼스 마스터' : '원테이크/풀샷',
              value: `${stats.oneTakeCount}개`,
              detail: isMusicVideo ? '전체 동선 확인용 기준 컷' : '대형 확인용 기준 컷',
              tone: 'text-white',
            },
            {
              label: isMusicVideo ? 'B-roll/인서트' : '인서트 컷',
              value: `${stats.insertCount}개`,
              detail: isMusicVideo ? '소품, 무드, 디테일 보강' : '센터, 손동작, 표정 보강',
              tone: 'text-amber-200',
            },
            {
              label: isMusicVideo ? '아티스트' : '포커스 멤버',
              value: `${focusMembers.length}명`,
              detail: focusMembers.slice(0, 3).join(', ') || '아직 미정',
              tone: 'text-neutral-200',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-600">{item.label}</div>
              <div className={`mt-1 text-2xl font-black ${item.tone}`}>{item.value}</div>
              <div className="mt-1 truncate text-[10px] font-bold text-neutral-600">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
      {stats.shotSizes.length > 0 && (
        <div className="border-t border-neutral-900 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-neutral-600">
            <span className="uppercase tracking-[0.18em]">Shot Sizes</span>
            {stats.shotSizes.map((size) => (
              <span key={size} className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-300">{size}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
