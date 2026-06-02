# PrePro Studio 조명/촬영 다이어그램 기능 체크포인트

사용자가 이동 전 공유한 인스타그램 `jejudominjun Lighting Diagram Breakdown` 레퍼런스 기반 메모.

## 첨부 레퍼런스 이미지

- `/Users/eung/.hermes/image_cache/img_d78f1cf4bb80.jpeg`
- `/Users/eung/.hermes/image_cache/img_dff26be32f40.jpeg`
- `/Users/eung/.hermes/image_cache/img_fc3344390499.jpeg`

## 레퍼런스 핵심

인스타 carousel 형식의 `장면 스틸 + overhead lighting diagram` 구성.
각 슬라이드는 위쪽에 실제 장면 스틸, 아래쪽에 같은 장면의 탑뷰 플로어/라이팅 다이어그램을 붙여 보여준다.

### 공통 구성

- 상단: 실제 영화/드라마 프레임 스틸
- 하단: 흰 배경의 탑뷰 다이어그램
- 공간 구조: 벽/창문/문/가구/소파/테이블/책상 등을 간단한 선형 아이콘으로 표시
- 인물 위치: 사람 아이콘과 시선/방향 표시
- 카메라 위치: `Sony` 등 카메라 아이콘 + 라벨
- 조명 위치: 조명 기구 아이콘 + 빔/확산 영역 색상 오버레이
- 장비 라벨: 기구명, 출력/모디파이어, 역할 표시
  - 예: `Aputure STORM 1200x w/ bare bulb`
  - `Nanlite Pavoslim 240c w/ grid`
  - `Nanlite Pavoslim 60c w/ grid`
  - `Aputure MC Pro`
  - `Aputure B7c`
  - `House light`
- 역할 라벨:
  - Key light
  - Fill light
  - Rim light
  - Ambient light
  - Bouncing on the ceiling
- 컬러 범례:
  - 빨강: Aputure 계열/키·실내 practical 류
  - 파랑: Nanlite/Sony 등 카메라·패널 라이트
  - 회색: 하우스 라이트/디퓨저 등
- 빛 표현:
  - 따뜻한 노란 빔: 키/필/앰비언트 방향
  - 파란 빔: 차가운 앰비언트/반사광
  - 반투명 polygon/gradient로 조명 범위 표시

## PrePro Studio 기능화 방향

### 1차 MVP: 수동 조명 다이어그램 빌더

- `콘티/샷` 또는 `장소` 탭 안에 `조명도`/`라이팅 플랜` 섹션 추가
- 사용자가 평면 캔버스에 배치:
  - 벽/창문/문
  - 테이블/소파/책상/의자
  - 인물
  - 카메라
  - 조명
  - 디퓨저/반사판/플래그
- 각 오브젝트는 드래그/회전/라벨 입력 가능
- 조명 오브젝트는 빔 방향/각도/색온도/색상/강도/역할 지정 가능
- 완성본을 PNG/SVG로 내보내기
- 콜시트/촬영표/콘티 카드에 첨부

### 2차: 프리셋 기반 빠른 생성

- 상황 프리셋:
  - 인터뷰 1인
  - 인터뷰 2인 대담
  - 사무실 회의실
  - 식당/카페 테이블
  - 제품 테이블탑
  - 뮤직비디오 퍼포먼스
  - 야외 골든아워
- 장비 프리셋:
  - Sony 카메라
  - Aputure STORM / MC Pro / B7c
  - Nanlite Pavoslim 240c / 60c
  - 소프트박스, 그리드, 디퓨저, 반사판
- 선택하면 기본 배치 자동 생성 후 사용자가 수정

### 3차: 이미지/텍스트 기반 반자동 생성

- 사용자가 장면 스틸/로케이션 사진 업로드
- AI가 다음을 제안:
  - 공간 구조 초안
  - 인물/카메라/조명 위치 후보
  - 키/필/림/앰비언트 역할
- 단, MVP는 AI 없이 수동/템플릿 중심으로 먼저 구현

## UX 메모

- 복잡한 CAD가 아니라 `촬영팀이 빠르게 공유하는 인스타식/콜시트식 조명도`가 목표.
- 모바일에서도 확인 가능해야 하지만, 제작/편집은 태블릿·PC가 편해야 함.
- 최종 산출물은 현장 공유용:
  - PNG 저장
  - PDF/콜시트 삽입
  - 장비 리스트 자동 집계
  - 샷별 조명 세팅 메모와 연결

## 구현 후보 데이터 모델

```ts
type LightingDiagram = {
  id: string;
  sceneId?: string;
  locationId?: string;
  title: string;
  referenceImageUrl?: string;
  canvasWidth: number;
  canvasHeight: number;
  objects: LightingDiagramObject[];
};

type LightingDiagramObject = {
  id: string;
  type: 'wall' | 'window' | 'door' | 'furniture' | 'person' | 'camera' | 'light' | 'modifier' | 'label';
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
  label?: string;
  role?: 'key' | 'fill' | 'rim' | 'ambient' | 'practical' | 'bounce';
  equipmentName?: string;
  color?: string;
  beamAngle?: number;
  beamLength?: number;
  beamColor?: string;
};
```

## 다음에 이어서 할 일

1. 현재 PrePro UI 안에서 들어갈 위치 결정: `콘티/샷` 탭 하위 vs `장소` 탭 하위.
2. 수동 캔버스 라이브러리 선택: SVG 직접 구현 또는 lightweight canvas/SVG editor.
3. 오브젝트 팔레트 설계.
4. 기본 프리셋 3개 먼저 구현.
5. PNG/SVG export 검증.
