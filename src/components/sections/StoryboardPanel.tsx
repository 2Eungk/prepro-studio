'use client';

import Image from 'next/image';
import type { StoryboardCategory, StoryboardShot } from '@/types/schedule';
import type { StoryboardQuickFilter } from '@/data/storyboardQuickFilters';
import { ArrowRight, Plus, Search } from 'lucide-react';

type StoryboardPanelCopy = {
  storyboardLabel: string;
  storyboardDescription: string;
};

type StoryboardPanelProps = {
  copy: StoryboardPanelCopy;
  featuredStoryboards: StoryboardShot[];
  filteredCount: number;
  quickFilters: StoryboardQuickFilter[];
  search: string;
  selectedCategory: StoryboardCategory | 'ALL';
  onApplyStoryboard: (shot: StoryboardShot, shouldOpenForm?: boolean) => void;
  onChooseQuickFilter: (filter: StoryboardQuickFilter) => void;
  onFallbackImage: (seed: string) => string;
  onOpenGallery: () => void;
};

export default function StoryboardPanel({
  copy,
  featuredStoryboards,
  filteredCount,
  quickFilters,
  search,
  selectedCategory,
  onApplyStoryboard,
  onChooseQuickFilter,
  onFallbackImage,
  onOpenGallery,
}: StoryboardPanelProps) {
  const isFilterActive = (filter: StoryboardQuickFilter) => selectedCategory === filter.category && search === filter.search;

  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-100">{copy.storyboardLabel} 라이브러리</h2>
          <p className="text-sm text-neutral-500">{copy.storyboardDescription}</p>
          <p className="mt-2 text-xs font-bold text-neutral-400">
            먼저 목적별 추천 묶음을 누른 뒤 샷을 선택하면 다음 {copy.storyboardLabel.includes('커버리지') ? '프로그램' : '씬'} 폼에 바로 연결됩니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <button onClick={() => featuredStoryboards[0] && onApplyStoryboard(featuredStoryboards[0], true)} className="prepro-btn prepro-btn--primary h-12 px-5 text-sm">
            <Plus className="h-4 w-4" /> 추천 샷으로 시작
          </button>
          <button onClick={onOpenGallery} className="prepro-btn prepro-btn--quiet h-11 px-5 text-xs">
            <Search className="h-3.5 w-3.5" /> 전체 {filteredCount}개 보기
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-neutral-800 bg-black/30 p-3">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">추천 필터</div>
            <p className="text-xs font-bold text-neutral-500">전체 {filteredCount}개를 훑기 전에 지금 장면 목적에 가까운 묶음부터 좁혀보세요.</p>
          </div>
          <button type="button" onClick={onOpenGallery} className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-300 hover:text-indigo-200">
            검색/전체 갤러리 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {quickFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChooseQuickFilter(filter)}
              className={`min-h-16 rounded-xl border p-3 text-left transition-all ${
                isFilterActive(filter)
                  ? 'border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <span className="block text-sm font-black">{filter.label}</span>
              <span className={`mt-1 block text-[10px] font-bold leading-snug ${isFilterActive(filter) ? 'text-indigo-100' : 'text-neutral-600'}`}>
                {filter.helper}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {featuredStoryboards.map((shot) => (
          <div key={shot.id} className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="aspect-video w-full bg-white">
              <Image
                src={shot.url}
                alt={shot.name}
                width={320}
                height={180}
                loading="lazy"
                unoptimized
                className="h-full w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = onFallbackImage(shot.name); }}
              />
            </div>
            <div className="space-y-3 p-3">
              <div>
                <div className="text-[11px] font-bold text-neutral-300">{shot.name}</div>
                <div className="mt-1 line-clamp-2 text-[10px] font-bold leading-relaxed text-neutral-600">{shot.description}</div>
              </div>
              <button
                type="button"
                onClick={() => onApplyStoryboard(shot, true)}
                className="prepro-btn prepro-btn--quiet h-9 w-full text-[10px]"
              >
                <Plus className="h-3.5 w-3.5" /> 이 샷으로 추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
