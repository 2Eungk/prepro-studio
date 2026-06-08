export type PreProWorkspaceId = 'hub' | 'plan' | 'paper' | 'shoot' | 'storyboard' | 'diagram' | 'report';

export type PreProWorkspacePriority = 'high' | 'medium' | 'low';

export type PreProWorkspace = {
  id: PreProWorkspaceId;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
  mobilePriority: PreProWorkspacePriority;
  order: number;
};

export const preproWorkspaces: PreProWorkspace[] = [
  {
    id: 'hub',
    label: 'Home',
    shortLabel: '홈',
    path: '/',
    description: '프로젝트 홈과 빠른 시작',
    mobilePriority: 'high',
    order: 0,
  },
  {
    id: 'plan',
    label: 'Plan',
    shortLabel: '기획',
    path: '/plan',
    description: '기획서, 브리프, 대본 분석',
    mobilePriority: 'medium',
    order: 1,
  },
  {
    id: 'paper',
    label: 'Paper',
    shortLabel: 'OD',
    path: '/paper',
    description: '촬영 순서표와 현장 진행 체크',
    mobilePriority: 'high',
    order: 2,
  },
  {
    id: 'shoot',
    label: 'Shoot',
    shortLabel: '촬영',
    path: '/shoot',
    description: '촬영표, 큐시트, 장소, 인원',
    mobilePriority: 'high',
    order: 3,
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    shortLabel: '콘티',
    path: '/storyboard',
    description: '샷, 앵글, 레퍼런스',
    mobilePriority: 'medium',
    order: 4,
  },
  {
    id: 'diagram',
    label: 'Diagram',
    shortLabel: '조명도',
    path: '/diagram',
    description: '조명도와 카메라 배치',
    mobilePriority: 'low',
    order: 5,
  },
  {
    id: 'report',
    label: 'Report',
    shortLabel: '마무리',
    path: '/report',
    description: '마무리, 납품, 결과 정리',
    mobilePriority: 'medium',
    order: 6,
  },
];

export const getWorkspaceById = (id: PreProWorkspaceId) =>
  preproWorkspaces.find((workspace) => workspace.id === id);
