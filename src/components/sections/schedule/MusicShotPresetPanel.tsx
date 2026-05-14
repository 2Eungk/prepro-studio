'use client';

import type { TemplateType } from '@/types/schedule';

type MusicShotPreset = {
  label: string;
  shotSize: string;
  focusMember: string;
  cameraGear: string;
  choreoNote: string;
  formation: string;
};

type MusicShotPresetPanelProps = {
  template: TemplateType;
  focusMember: string;
  onApply: (preset: Omit<MusicShotPreset, 'label'>) => void;
};

const getMusicShotPresets = (template: TemplateType, focusMember: string): MusicShotPreset[] => {
  if (template === 'musicvideo') {
    return [
      { label: '립싱크', shotSize: 'CU', focusMember: focusMember || '아티스트', cameraGear: '립싱크 CU + 느린 푸시인', choreoNote: '입 모양 싱크 / 눈빛 / 표정', formation: '단독 립싱크' },
      { label: '퍼포먼스', shotSize: 'FS', focusMember: '아티스트', cameraGear: '퍼포먼스 와이드 + 핸드헬드 CU', choreoNote: '후렴 제스처 / 카메라 응시', formation: '메인 세트' },
      { label: 'B-roll', shotSize: 'MS', focusMember: focusMember || '아티스트', cameraGear: '핸드헬드 무드 컷 / 이동 컷', choreoNote: '걷기 / 뒤돌아보기 / 공간 디테일', formation: '로케이션 이동' },
      { label: '인서트', shotSize: 'ECU', focusMember: '오브젝트', cameraGear: '손 / 소품 / 반사 매크로', choreoNote: '가사 모티프 디테일', formation: '인서트 컷' },
    ];
  }

  return [
    { label: '원테이크', shotSize: 'FS', focusMember: '전체', cameraGear: 'A캠 정면 고정 풀샷', choreoNote: '전체 대형 / 동선 확인', formation: '전체 대형' },
    { label: '센터 포커스', shotSize: 'CS', focusMember: focusMember || '센터', cameraGear: 'B캠 센터 CS 펀치인', choreoNote: '표정 / 손 포인트', formation: '센터 기준' },
    { label: '인서트', shotSize: 'CU', focusMember: focusMember || '포인트 멤버', cameraGear: '손동작 / 표정 인서트', choreoNote: '킬링파트 디테일', formation: '인서트 컷' },
    { label: '엔딩', shotSize: 'LS', focusMember: '전체', cameraGear: '엔딩 포즈 와이드 + 세로 리캡', choreoNote: '엔딩 시선 / 포즈 고정', formation: '엔딩 대형' },
  ];
};

export default function MusicShotPresetPanel({ template, focusMember, onApply }: MusicShotPresetPanelProps) {
  const presets = getMusicShotPresets(template, focusMember);
  const description = template === 'musicvideo'
    ? 'MV에서 자주 쓰는 립싱크, 퍼포먼스, B-roll 구성을 먼저 잡고 세부만 수정하세요.'
    : '댄스커버에서 자주 쓰는 컷 구성을 먼저 잡고 세부만 수정하세요.';

  return (
    <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-200">촬영 방식 프리셋</div>
          <p className="mt-0.5 text-[11px] font-bold text-neutral-600">{description}</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
          {presets.map(({ label, ...preset }) => (
            <button
              key={label}
              type="button"
              onClick={() => onApply(preset)}
              className="rounded-lg border border-neutral-800 bg-black/55 px-3 py-2 text-[10px] font-black text-neutral-300 transition-all hover:border-teal-300/40 hover:text-teal-100"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
