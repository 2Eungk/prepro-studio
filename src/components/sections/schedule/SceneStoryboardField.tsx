'use client';

import Image from 'next/image';
import { Image as ImageIcon, Upload } from 'lucide-react';
import type { StoryboardShot } from '@/types/schedule';

type SceneStoryboardFieldProps = {
  itemLabel: string;
  storyboardLabel: string;
  visualRef: string;
  selectedStoryboard?: StoryboardShot;
  customImageStatus: string;
  onClear: () => void;
  onUpload: (file?: File) => void;
  onOpenGallery: () => void;
  onFallbackImage: (name: string) => string;
};

export default function SceneStoryboardField({
  itemLabel,
  storyboardLabel,
  visualRef,
  selectedStoryboard,
  customImageStatus,
  onClear,
  onUpload,
  onOpenGallery,
  onFallbackImage,
}: SceneStoryboardFieldProps) {
  const displayName = selectedStoryboard?.name || (visualRef.startsWith('data:') ? '내 이미지' : `${storyboardLabel} 없음`);
  const imageAlt = selectedStoryboard?.name || storyboardLabel;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{storyboardLabel}</div>
          <div className="mt-1 text-sm font-bold text-neutral-200">{displayName}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          {visualRef && (
            <button
              type="button"
              onClick={onClear}
              className="prepro-btn prepro-btn--quiet h-9"
            >
              해제
            </button>
          )}
          <label className="prepro-btn prepro-btn--secondary h-9 cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            내 이미지
            <input
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                onUpload(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            onClick={onOpenGallery}
            className="prepro-btn prepro-btn--primary h-9"
          >
            {storyboardLabel} 변경
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl border border-neutral-800 bg-white">
          {visualRef ? (
            <Image
              src={visualRef}
              alt={imageAlt}
              width={320}
              height={180}
              unoptimized
              className="h-full w-full object-contain"
              onError={(event) => {
                (event.target as HTMLImageElement).src = onFallbackImage(imageAlt);
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900">
              <ImageIcon className="h-6 w-6 text-neutral-700" />
            </div>
          )}
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-neutral-500">
          <p>갤러리에서 고르거나 직접 만든 이미지를 올리면 이 {itemLabel}에 바로 연결됩니다.</p>
          <p className="text-[10px] font-bold text-neutral-700">업로드 이미지는 브라우저/JSON 안에만 저장됩니다.</p>
          {customImageStatus && <p className="text-[10px] font-black text-teal-200">{customImageStatus}</p>}
        </div>
      </div>
    </div>
  );
}
