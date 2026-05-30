'use client';

import type { StoryboardCategory, StoryboardShot } from '@/types/schedule';
import type { StoryboardQuickFilter } from '@/data/storyboardQuickFilters';
import { Plus, Sparkles, XCircle } from 'lucide-react';
import Image from 'next/image';

type StoryboardCategoryOption = {
  id: StoryboardCategory | 'ALL';
  label: string;
};

type StoryboardGalleryModalProps = {
  category: StoryboardCategory | 'ALL';
  categoryOptions: readonly StoryboardCategoryOption[];
  copyDescription: string;
  filteredStoryboards: StoryboardShot[];
  isOpen: boolean;
  quickFilters: StoryboardQuickFilter[];
  recommendedStoryboards: StoryboardShot[];
  search: string;
  selectedVisualRef?: string;
  showSceneForm: boolean;
  totalCount: number;
  onApplyStoryboard: (shot: StoryboardShot, shouldOpenSceneForm: boolean) => void;
  onClose: () => void;
  onFallbackImage: (name: string) => string;
  onChooseQuickFilter: (filter: StoryboardQuickFilter) => void;
  onSetCategory: (category: StoryboardCategory | 'ALL') => void;
  onSetSearch: (value: string) => void;
};

export default function StoryboardGalleryModal({
  category,
  categoryOptions,
  copyDescription,
  filteredStoryboards,
  isOpen,
  quickFilters,
  recommendedStoryboards,
  search,
  selectedVisualRef,
  showSceneForm,
  totalCount,
  onApplyStoryboard,
  onClose,
  onFallbackImage,
  onChooseQuickFilter,
  onSetCategory,
  onSetSearch,
}: StoryboardGalleryModalProps) {
  if (!isOpen) return null;

  const isFilterActive = (filter: StoryboardQuickFilter) => category === filter.category && search === filter.search;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-neutral-900 w-full max-w-6xl h-full max-h-[85vh] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-indigo-400" /> 시네마틱 앵글 {totalCount}종 갤러리
            </h2>
            <p className="text-xs text-neutral-500 mt-1">{copyDescription}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="rounded-2xl border border-neutral-800 bg-black/30 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">바로 고르기</div>
                <p className="text-xs font-bold text-neutral-500">인물, 대화, 커버리지, 무빙, 제품, 행사처럼 현장 의도별로 먼저 좁힌 뒤 적용하세요.</p>
              </div>
              <p className="text-[11px] font-bold text-neutral-600">샷을 누르면 선택한 {showSceneForm ? '씬 폼' : '새 씬 폼'}에 바로 연결됩니다.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onChooseQuickFilter(filter)}
                  className={`min-w-32 rounded-xl border px-3 py-2 text-left transition-all ${
                    isFilterActive(filter)
                      ? 'border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="block text-xs font-black">{filter.label}</span>
                  <span className={`mt-1 block text-[9px] font-bold leading-snug ${isFilterActive(filter) ? 'text-indigo-100' : 'text-neutral-600'}`}>
                    {filter.helper}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-neutral-900 py-2 z-10">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
              {categoryOptions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSetCategory(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    category === item.id
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="앵글 명칭 또는 키워드 검색..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                value={search}
                onChange={(event) => onSetSearch(event.target.value)}
              />
              <Sparkles className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredStoryboards.map((shot) => {
              const isRecommended = recommendedStoryboards.some((item) => item.id === shot.id);
              const isSelected = selectedVisualRef === shot.url;

              return (
                <div
                  key={shot.id}
                  onClick={() => {
                    onApplyStoryboard(shot, !showSceneForm);
                    onClose();
                  }}
                  className={`group relative cursor-pointer border-2 rounded-2xl overflow-hidden transition-all h-full flex flex-col ${
                    isSelected ? 'border-indigo-500 scale-[1.02] shadow-xl shadow-indigo-500/20' : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-2 left-2 bg-indigo-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg border border-white/20">
                      <Sparkles className="w-2.5 h-2.5" /> 추천
                    </div>
                  )}
                  <div className="w-full aspect-video bg-white overflow-hidden relative">
                    <Image
                      src={shot.url}
                      alt={shot.name}
                      width={320}
                      height={180}
                      loading="lazy"
                      unoptimized
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = onFallbackImage(shot.name);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                  </div>
                  <div className={`p-3 text-center flex-1 flex flex-col items-center justify-center gap-1 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 group-hover:bg-neutral-800'}`}>
                    <p className="text-[11px] font-bold leading-tight">{shot.name}</p>
                    <p className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-neutral-500'} line-clamp-1`}>{shot.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <p className="text-xs text-neutral-500">전체 {totalCount}종 중 {filteredStoryboards.length}개 표시 중</p>
          <button
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
