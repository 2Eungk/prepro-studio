import type { StoryboardCategory } from '@/types/schedule';

export type StoryboardQuickFilter = {
  id: string;
  label: string;
  helper: string;
  category: StoryboardCategory | 'ALL';
  search: string;
};

export const storyboardQuickFilters: StoryboardQuickFilter[] = [
  { id: 'people', label: '인물', helper: '원샷, 리액션, 관계 컷', category: 'SUBJECT', search: '인물' },
  { id: 'dialogue', label: '대화', helper: 'OTS, 투샷, 좌식 대화', category: 'ALL', search: '대화' },
  { id: 'coverage', label: '커버리지', helper: '클린/더티 싱글, 아이매치', category: 'ALL', search: '커버리지' },
  { id: 'movement', label: '이동', helper: '워킹, 트래킹, 동선', category: 'ALL', search: '이동' },
  { id: 'camera-move', label: '무빙', helper: '오빗, 짐벌, 슬라이더, 지브', category: 'ALL', search: '무빙' },
  { id: 'product', label: '제품', helper: '히어로, 팩샷, 사용 데모', category: 'ALL', search: '제품' },
  { id: 'event', label: '행사', helper: '무대, 객석, 부스 스케치', category: 'ALL', search: '행사' },
  { id: 'wide', label: '와이드', helper: '장소, 마스터, 전체 운영', category: 'WIDE', search: '' },
  { id: 'closeup', label: '클로즈업', helper: '표정, 디테일, 인서트', category: 'CLOSEUP', search: '' },
  { id: 'mood', label: '무드', helper: '조명, 실루엣, 감정 톤', category: 'LIGHTING', search: '' },
];
