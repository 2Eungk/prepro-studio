'use client';

import Image from 'next/image';
import type { StoryboardShot } from '@/types/schedule';
import { Plus } from 'lucide-react';

type StoryboardPanelCopy = {
  storyboardLabel: string;
  storyboardDescription: string;
};

type StoryboardPanelProps = {
  copy: StoryboardPanelCopy;
  featuredStoryboards: StoryboardShot[];
  onApplyStoryboard: (shot: StoryboardShot, shouldOpenForm?: boolean) => void;
  onFallbackImage: (seed: string) => string;
  onOpenGallery: () => void;
};

export default function StoryboardPanel({
  copy,
  featuredStoryboards,
  onApplyStoryboard,
  onFallbackImage,
  onOpenGallery,
}: StoryboardPanelProps) {
  return (
    <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-100">{copy.storyboardLabel} 라이브러리</h2>
          <p className="text-sm text-neutral-500">{copy.storyboardDescription}</p>
        </div>
        <button onClick={onOpenGallery} className="prepro-btn prepro-btn--primary h-12 px-5 text-sm">
          전체 갤러리 열기
        </button>
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
