'use client';

import Image from 'next/image';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import type { StoryboardCategory, StoryboardShot, TemplateType } from '@/types/schedule';

type StoryboardCategoryOption = {
  id: StoryboardCategory | 'ALL';
  label: string;
};

type QuickStoryboardPickerProps = {
  category: StoryboardCategory | 'ALL';
  categoryOptions: readonly StoryboardCategoryOption[];
  filteredCount: number;
  options: StoryboardShot[];
  recommendedStoryboards: StoryboardShot[];
  search: string;
  selectedUrl: string;
  storyboardCount: number;
  storyboardLabel: string;
  template: TemplateType;
  onApplyStoryboard: (storyboard: StoryboardShot) => void;
  onFallbackImage: (name: string) => string;
  onOpenGallery: () => void;
  onSetCategory: (category: StoryboardCategory | 'ALL') => void;
  onSetSearch: (search: string) => void;
};

const getQuickKeywords = (template: TemplateType) => {
  if (template === 'event') return ['마스터', '무대', '인터뷰', '객석', '와이드', '클로즈업'];
  if (template === 'ad') return ['제품', '디테일', '모델', '투 샷', '매크로', '대칭'];
  if (template === 'musicvideo') return ['립싱크', '퍼포먼스', 'B-roll', '인서트', '네온', '클로즈업'];
  if (template === 'dance') return ['풀샷', '센터', '포커스', '클로즈업', '사이드', '대형'];
  return ['투 샷', '대화', '클로즈업', '와이드', '로우', '오버숄더'];
};

export default function QuickStoryboardPicker({
  category,
  categoryOptions,
  filteredCount,
  options,
  recommendedStoryboards,
  search,
  selectedUrl,
  storyboardCount,
  storyboardLabel,
  template,
  onApplyStoryboard,
  onFallbackImage,
  onOpenGallery,
  onSetCategory,
  onSetSearch,
}: QuickStoryboardPickerProps) {
  const recommendedIds = new Set(recommendedStoryboards.map((storyboard) => storyboard.id));
  const quickKeywords = getQuickKeywords(template);

  return (
    <div className="mt-8 p-5 bg-neutral-950 rounded-xl border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <span className="bg-indigo-500 w-2 h-2 rounded-full animate-pulse" />
          빠른 {storyboardLabel} 선택
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg font-bold border border-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> {storyboardCount}종 전체보기
          </button>
          <p className="text-xs text-neutral-500">추천과 자주 쓰는 앵글만 먼저 보여줍니다</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSetCategory(option.id)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                  category === option.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="앵글 검색 (예: 웅장, 대화...)"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
              value={search}
              onChange={(event) => onSetSearch(event.target.value)}
            />
            <Sparkles className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickKeywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onSetSearch(keyword)}
              className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                search === keyword
                  ? 'border-indigo-400 bg-indigo-500 text-white'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[140px]">
          {options.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-neutral-600 py-10">
              <p className="text-xs">검색 결과가 없습니다.</p>
            </div>
          ) : options.map((storyboard) => {
            const isRecommended = recommendedIds.has(storyboard.id);
            const isSelected = selectedUrl === storyboard.url;

            return (
              <button
                key={storyboard.id}
                type="button"
                onClick={() => onApplyStoryboard(storyboard)}
                className={`relative cursor-pointer border-2 rounded-xl overflow-hidden transition-all shrink-0 w-40 h-[124px] text-left ${
                  isSelected
                    ? 'border-indigo-500 scale-105 shadow-xl shadow-indigo-500/30 z-10'
                    : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-700'
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-2 left-2 bg-indigo-500 text-[9px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-2 h-2" /> AI 추천
                  </div>
                )}
                <div className="w-full aspect-video bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src={storyboard.url}
                    alt={storyboard.name}
                    width={160}
                    height={90}
                    loading="lazy"
                    unoptimized
                    className="h-full w-full object-contain transition-opacity duration-300"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = onFallbackImage(storyboard.name);
                    }}
                  />
                </div>
                <div className={`text-[10px] text-center py-2 font-bold px-1 h-10 flex items-center justify-center leading-tight ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-400'
                }`}>
                  {storyboard.name}
                </div>
              </button>
            );
          })}
        </div>
        {filteredCount > options.length && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-900 bg-neutral-900/50 px-4 py-3">
            <p className="text-xs font-bold text-neutral-500">
              현재 조건에서 {filteredCount}개 중 {options.length}개만 빠르게 표시 중
            </p>
            <button
              type="button"
              onClick={onOpenGallery}
              className="text-xs font-black text-indigo-300 hover:text-indigo-200"
            >
              전체 갤러리에서 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
