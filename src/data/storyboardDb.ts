import { StoryboardShot } from '@/types/schedule';

export const storyboardDb: StoryboardShot[] = [
  // DISTANCE (15)
  { id: 'sb_01', name: '익스트림 와이드 (EWS)', category: 'WIDE', description: '풍경 속에 인물이 아주 작게 보이는 웅장한 샷', url: '/shot_01.png', keywords: ['웅장', '풍경', '스케일', '도시', '자연', '멀리'] },
  { id: 'sb_02', name: '베리 와이드 (VWS)', category: 'WIDE', description: '인물의 환경을 충분히 보여주는 넓은 샷', url: '/shot_02.png', keywords: ['환경', '공간', '배경', '건물'] },
  { id: 'sb_03', name: '와이드 샷 (WS)', category: 'WIDE', description: '인물의 전신과 주변 환경을 담은 샷', url: '/shot_03.png', keywords: ['전신', '주변', '인물'] },
  { id: 'sb_04', name: '풀 샷 (Full Shot)', category: 'WIDE', description: '인물의 머리부터 발끝까지 꽉 차게 담은 샷', url: '/shot_04.png', keywords: ['전신', '움직임', '동선'] },
  { id: 'sb_05', name: '미디엄 풀 (MFS)', category: 'WIDE', description: '무릎 위부터 머리까지 담는 샷 (카우보이 샷과 유사)', url: '/shot_05.png', keywords: ['무릎', '상체', '액션'] },
  { id: 'sb_06', name: '미디엄 샷 (MS)', category: 'MEDIUM', description: '허리 위부터 머리까지 담는 표준적인 대화 샷', url: '/shot_06.png', keywords: ['허리', '대화', '표준', '설명'] },
  { id: 'sb_07', name: '미디엄 클로즈업 (MCU)', category: 'MEDIUM', description: '가슴 위부터 머리까지 담아 표정에 집중하는 샷', url: '/shot_07.png', keywords: ['가슴', '표정', '집중', '인터뷰'] },
  { id: 'sb_08', name: '클로즈업 (CU)', category: 'CLOSEUP', description: '얼굴 전체를 담아 감정을 극대화하는 샷', url: '/shot_08.png', keywords: ['얼굴', '감정', '슬픔', '기쁨', '분노', '표정'] },
  { id: 'sb_09', name: '초커 샷 (Choker)', category: 'CLOSEUP', description: '눈썹 위부터 턱 아래까지 얼굴을 꽉 채운 샷', url: '/shot_09.png', keywords: ['압박', '강렬', '눈빛', '긴장'] },
  { id: 'sb_10', name: '익스트림 클로즈업 (ECU)', category: 'CLOSEUP', description: '눈, 입 등 특정 부위만 극단적으로 강조하는 샷', url: '/shot_10.png', keywords: ['눈', '입', '강조', '디테일', '특정'] },
  { id: 'sb_11', name: '매크로 샷 (Macro)', category: 'CLOSEUP', description: '사물의 아주 미세한 디테일을 보여주는 샷', url: '/shot_11.png', keywords: ['사물', '디테일', '미세', '곤충', '기계'] },
  { id: 'sb_12', name: '이탈리안 샷 (Italian)', category: 'CLOSEUP', description: '양쪽 눈만 가로로 길게 강조하는 스파게티 웨스턴 스타일', url: '/shot_12.png', keywords: ['눈만', '결투', '웨스턴', '긴박'] },
  { id: 'sb_13', name: '빅 클로즈업 (BCU)', category: 'CLOSEUP', description: '얼굴의 특정 부분을 더 크게 보여주는 연출', url: '/shot_13.png', keywords: ['부분', '확대', '강조'] },
  { id: 'sb_14', name: '설정 샷 (Establishing)', category: 'WIDE', description: '씬의 장소와 시간을 알려주는 첫 번째 샷', url: '/shot_14.png', keywords: ['장소', '시간', '시작', '소개'] },
  { id: 'sb_15', name: '마스터 샷 (Master)', category: 'WIDE', description: '씬 전체의 움직임을 한 번에 담는 기본 샷', url: '/shot_15.png', keywords: ['전체', '기본', '안전', '공간'] },

  // ANGLE (15)
  { id: 'sb_16', name: '아이 레벨 (Eye Level)', category: 'ANGLE', description: '인물의 눈높이에서 촬영하는 가장 평범하고 안정적인 샷', url: '/shot_16.png', keywords: ['안정', '평범', '정면', '신뢰'] },
  { id: 'sb_17', name: '로우 앵글 (Low)', category: 'ANGLE', description: '아래에서 위로 올려다보며 권위나 위협을 표현', url: '/shot_17.png', keywords: ['권위', '영웅', '위협', '강함', '크게'] },
  { id: 'sb_18', name: '웜즈 아이 (Worm)', category: 'ANGLE', description: '지면 밀착 각도에서 극단적으로 올려다보는 샷', url: '/shot_18.png', keywords: ['바닥', '극단', '독특', '지면'] },
  { id: 'sb_19', name: '하이 앵글 (High)', category: 'ANGLE', description: '위에서 아래로 내려다보며 약함이나 고립을 표현', url: '/shot_19.png', keywords: ['약함', '고립', '작게', '슬픔', '보호'] },
  { id: 'sb_20', name: '버드 아이 (Bird)', category: 'ANGLE', description: '하늘 수직 위에서 내려다보는 전경 샷', url: '/shot_20.png', keywords: ['수직', '하늘', '전경', '지도', '조감'] },
  { id: 'sb_21', name: '더치 앵글 (Dutch)', category: 'ANGLE', description: '카메라를 기울여 불안감이나 혼란을 표현', url: '/shot_21.png', keywords: ['불안', '혼란', '긴장', '충격', '기울기'] },
  { id: 'sb_22', name: '오버헤드 (Overhead)', category: 'ANGLE', description: '피사체 바로 위에서 수직으로 찍는 샷', url: '/shot_22.png', keywords: ['수직', '위에서', '평면', '정돈'] },
  { id: 'sb_23', name: '언더네스 (Underneath)', category: 'ANGLE', description: '피사체 바로 아래에서 수직으로 찍는 샷', url: '/shot_23.png', keywords: ['아래에서', '수직', '신비', '발바닥'] },
  { id: 'sb_24', name: '숄더 레벨 (Shoulder)', category: 'ANGLE', description: '어깨 높이에서 촬영하는 샷', url: '/shot_24.png', keywords: ['어깨', '높이', '대화'] },
  { id: 'sb_25', name: '힙 레벨 (Hip)', category: 'ANGLE', description: '골반 높이에서 촬영하는 샷', url: '/shot_25.png', keywords: ['골반', '허리', '액션'] },
  { id: 'sb_26', name: '니 레벨 (Knee)', category: 'ANGLE', description: '무릎 높이에서 촬영하는 샷', url: '/shot_26.png', keywords: ['무릎', '낮은', '동선'] },
  { id: 'sb_27', name: '그라운드 레벨 (Ground)', category: 'ANGLE', description: '바닥 높이에서 촬영하는 샷', url: '/shot_27.png', keywords: ['바닥', '발', '낮은'] },
  { id: 'sb_28', name: '슬랜트 앵글 (Slant)', category: 'ANGLE', description: '더치 앵글보다 완만한 기울기의 샷', url: '/shot_28.png', keywords: ['기울기', '미묘'] },
  { id: 'sb_29', name: '오블리크 (Oblique)', category: 'ANGLE', description: '비스듬한 각도에서 피사체를 비추는 샷', url: '/shot_29.png', keywords: ['비스듬', '측면'] },
  { id: 'sb_30', name: '틸트 앵글 (Tilt)', category: 'ANGLE', description: '수직 이동 중에 고정된 듯한 앵글', url: '/shot_30.png', keywords: ['수직', '이동', '위아래'] },

  // LENS & FOCUS (15)
  { id: 'sb_31', name: '딥 포커스 (Deep)', category: 'LENS', description: '앞뒤 모든 피사체가 선명하게 포커싱 된 샷', url: '/shot_31.png', keywords: ['선명', '전체', '깊이'] },
  { id: 'sb_32', name: '쉘로우 포커스 (Shallow)', category: 'LENS', description: '특정 피사체만 강조하고 나머지는 흐리게 처리(보케)', url: '/shot_32.png', keywords: ['흐림', '강조', '보케', '감성'] },
  { id: 'sb_33', name: '랙 포커스 (Rack)', category: 'LENS', description: '촬영 중 초점을 한 피사체에서 다른 피사체로 이동', url: '/shot_33.png', keywords: ['초점이동', '시선이동', '변화'] },
  { id: 'sb_34', name: '스플릿 디옵터 (Split)', category: 'LENS', description: '서로 다른 거리의 두 피사체가 모두 선명한 샷', url: '/shot_34.png', keywords: ['동시포커스', '긴장', '기묘'] },
  { id: 'sb_35', name: '피쉬아이 (Fisheye)', category: 'LENS', description: '광각 렌즈로 왜곡된 둥근 화면 연출', url: '/shot_35.png', keywords: ['왜곡', '둥근', '어안', '혼란'] },
  { id: 'sb_36', name: '망원 압축 (Tele)', category: 'LENS', description: '원근감을 줄여 피사체 간의 거리가 가깝게 보이게 연출', url: '/shot_36.png', keywords: ['압축', '원근감', '빽빽한'] },
  { id: 'sb_37', name: '광각 확장 (Wide)', category: 'LENS', description: '원근감을 극대화하여 공간을 넓게 보이게 연출', url: '/shot_37.png', keywords: ['확장', '광활', '왜곡'] },
  { id: 'sb_38', name: '렌즈 플레어 (Flare)', category: 'LENS', description: '강한 빛이 렌즈에 반사되어 빛 번짐이 나타나는 샷', url: '/shot_38.png', keywords: ['빛', '번짐', '신비', '눈부심'] },
  { id: 'sb_39', name: '소프트 포커스 (Soft)', category: 'LENS', description: '전체적으로 부드럽고 몽환적인 느낌의 포커스', url: '/shot_39.png', keywords: ['부드러운', '몽환', '꿈', '추억'] },
  { id: 'sb_40', name: '샤프 포커스 (Sharp)', category: 'LENS', description: '극도로 선명한 화질을 강조하는 포커스', url: '/shot_40.png', keywords: ['선명', '차가운', '디테일'] },
  { id: 'sb_41', name: '모션 블러 (Motion)', category: 'LENS', description: '움직임에 의한 잔상이 남는 연출', url: '/shot_41.png', keywords: ['속도', '잔상', '액션', '빠른'] },
  { id: 'sb_42', name: '아나모픽 룩 (Anamorphic)', category: 'LENS', description: '시네마스코프 비율의 독특한 렌즈 특성 강조', url: '/shot_42.png', keywords: ['영화적', '가로형', '시네마틱'] },
  { id: 'sb_43', name: '매크로 포커스 (Macro)', category: 'LENS', description: '초근접 사물에 집중된 포커스', url: '/shot_43.png', keywords: ['근접', '작은'] },
  { id: 'sb_44', name: '주변부 흐림 (Peripheral)', category: 'LENS', description: '화면 가장자리가 흐려지며 중앙으로 시선을 모으는 샷', url: '/shot_44.png', keywords: ['중앙집중', '터널', '시선'] },
  { id: 'sb_45', name: '선택적 포커스 (Selective)', category: 'LENS', description: '복잡한 배경 속 특정 대상만 포커싱', url: '/shot_45.png', keywords: ['선택', '복잡', '강조'] },

  // COMPOSITION (20)
  { id: 'sb_46', name: '3분할 법칙 (Thirds)', category: 'COMPOSITION', description: '화면을 가로세로 3등분하여 교차점에 피사체 배치', url: '/shot_46.png', keywords: ['안정', '균형', '기본', '3분할'] },
  { id: 'sb_47', name: '대칭 구도 (Symmetry)', category: 'COMPOSITION', description: '좌우 또는 상하가 대칭을 이루는 완벽한 균형 구도', url: '/shot_47.png', keywords: ['대칭', '균형', '정갈', '완벽', '웨스앤더슨'] },
  { id: 'sb_48', name: '소실점 구도 (Leading)', category: 'COMPOSITION', description: '길이나 선이 한 점으로 모이는 입체감 있는 구도', url: '/shot_48.png', keywords: ['소실점', '길', '입체감', '선'] },
  { id: 'sb_49', name: '프레임 속 프레임 (Frame)', category: 'COMPOSITION', description: '문, 창틀 등을 통해 피사체를 보여주는 구도', url: '/shot_49.png', keywords: ['창문', '문', '틀', '프레임', '관찰'] },
  { id: 'sb_50', name: '여백의 미 (Negative)', category: 'COMPOSITION', description: '넓은 빈 공간을 남겨 피사체를 강조하거나 고독 표현', url: '/shot_50.png', keywords: ['여백', '공백', '고독', '강조'] },
  { id: 'sb_51', name: '황금 나선 (Spiral)', category: 'COMPOSITION', description: '피보나치 수열을 활용한 자연스러운 시선 유도 구도', url: '/shot_51.png', keywords: ['황금비', '나선', '조화'] },
  { id: 'sb_52', name: '삼각형 구도 (Triangle)', category: 'COMPOSITION', description: '세 피사체를 배치하여 역동성이나 안정감을 주는 구도', url: '/shot_52.png', keywords: ['삼각형', '안정', '역동'] },
  { id: 'sb_53', name: '반영 구도 (Reflection)', category: 'COMPOSITION', description: '물이나 유리에 비친 모습을 활용한 중첩 구도', url: '/shot_53.png', keywords: ['거울', '물', '반사', '중첩'] },
  { id: 'sb_54', name: '실루엣 (Silhouette)', category: 'COMPOSITION', description: '역광을 이용해 인물의 형태만 검게 표현', url: '/shot_54.png', keywords: ['실루엣', '역광', '그림자', '신비'] },
  { id: 'sb_55', name: '그림자 투영 (Shadow)', category: 'COMPOSITION', description: '본체가 아닌 바닥이나 벽에 비친 그림자만 보여주는 구도', url: '/shot_55.png', keywords: ['그림자', '공포', '간접'] },
  { id: 'sb_56', name: '중앙 집중 (Center)', category: 'COMPOSITION', description: '피사체를 정확히 정중앙에 배치하여 위엄이나 정적 느낌 강조', url: '/shot_56.png', keywords: ['중앙', '정적', '위엄'] },
  { id: 'sb_57', name: '소실점/원근 (Perspective)', category: 'COMPOSITION', description: '깊이감을 강조한 원근법적 구성', url: '/shot_57.png', keywords: ['깊이', '원근'] },
  { id: 'sb_58', name: '대각선 구도 (Diagonal)', category: 'COMPOSITION', description: '대각선을 활용해 속도감이나 불안정함 표현', url: '/shot_58.png', keywords: ['대각선', '속도', '불안'] },
  { id: 'sb_59', name: 'S-커브 (S-Curve)', category: 'COMPOSITION', description: '부드러운 곡선을 따라 시선이 흐르게 하는 구도', url: '/shot_59.png', keywords: ['곡선', '부드러움', '강', '길'] },
  { id: 'sb_60', name: '패턴/반복 (Pattern)', category: 'COMPOSITION', description: '반복되는 형태를 통해 질서나 단조로움 표현', url: '/shot_60.png', keywords: ['패턴', '반복', '질서'] },
  { id: 'sb_61', name: '스케일 대비 (Contrast)', category: 'COMPOSITION', description: '큰 물체와 작은 물체를 함께 배치하여 크기 강조', url: '/shot_61.png', keywords: ['크기', '대비', '웅장'] },
  { id: 'sb_62', name: '깊이의 층 (Layers)', category: 'COMPOSITION', description: '전경, 중경, 후경을 나누어 입체감 부여', url: '/shot_62.png', keywords: ['레이어', '입체감', '복잡'] },
  { id: 'sb_63', name: '균형 잡힌 (Balanced)', category: 'COMPOSITION', description: '화면 전체의 무게감이 골고루 분산된 구도', url: '/shot_63.png', keywords: ['균형', '안정'] },
  { id: 'sb_64', name: '불균형한 (Unbalanced)', category: 'COMPOSITION', description: '무게감이 한쪽으로 쏠려 긴장감을 유발하는 구도', url: '/shot_64.png', keywords: ['긴장', '불안', '쏠림'] },
  { id: 'sb_65', name: '미니멀리즘 (Minimal)', category: 'COMPOSITION', description: '필요한 요소만 남기고 극도로 절제된 구도', url: '/shot_65.png', keywords: ['절제', '미니멀', '단순'] },

  // SUBJECT SETUP (20)
  { id: 'sb_66', name: '원 샷 (One Shot)', category: 'SUBJECT', description: '한 명의 인물만 담는 가장 기본적인 인물 샷', url: '/shot_66.png', keywords: ['한명', '주인공', '단독'] },
  { id: 'sb_67', name: '투 샷 (Two Shot)', category: 'SUBJECT', description: '두 명의 인물을 한 화면에 담는 관계 샷', url: '/shot_67.png', keywords: ['두명', '관계', '함께'] },
  { id: 'sb_68', name: '쓰리 샷 (Three Shot)', category: 'SUBJECT', description: '세 명의 인물을 담는 그룹 샷', url: '/shot_68.png', keywords: ['세명', '그룹'] },
  { id: 'sb_69', name: '그룹 샷 (Group)', category: 'SUBJECT', description: '네 명 이상의 다수 인원을 담는 군중 샷', url: '/shot_69.png', keywords: ['다수', '군중', '모임'] },
  { id: 'sb_70', name: '오버 더 숄더 (OTS)', category: 'SUBJECT', description: '한 사람의 어깨를 걸치고 상대를 비추는 대화 샷', url: '/shot_70.png', keywords: ['어깨', '대화', '관계', '마주보는'] },
  { id: 'sb_71', name: '더티 OTS (Dirty)', category: 'SUBJECT', description: '앞사람의 어깨나 머리가 화면을 많이 가리는 답답한 샷', url: '/shot_71.png', keywords: ['답답함', '관찰', '가려진'] },
  { id: 'sb_72', name: 'POV (1인칭)', category: 'SUBJECT', description: '인물의 시선에서 직접 바라보는 듯한 체험형 샷', url: '/shot_72.png', keywords: ['시선', '주인공', '내가보는', '직접'] },
  { id: 'sb_73', name: '프로필 샷 (Profile)', category: 'SUBJECT', description: '인물의 완벽한 옆모습을 비추는 샷', url: '/shot_73.png', keywords: ['옆모습', '단호', '사색'] },
  { id: 'sb_74', name: '백 샷 (Back)', category: 'SUBJECT', description: '인물의 뒷모습만 보여주어 호기심이나 고독 유발', url: '/shot_74.png', keywords: ['뒷모습', '고독', '비밀'] },
  { id: 'sb_75', name: '리액션 샷 (Reaction)', category: 'SUBJECT', description: '사건에 대한 인물의 반응을 포착하는 샷', url: '/shot_75.png', keywords: ['반응', '놀람', '표정', '대응'] },
  { id: 'sb_76', name: '인서트 (Insert)', category: 'SUBJECT', description: '씬과 관련된 사물이나 디테일을 삽입하는 샷', url: '/shot_76.png', keywords: ['사물', '강조', '정보', '시계', '전화'] },
  { id: 'sb_77', name: '컷어웨이 (Cutaway)', category: 'SUBJECT', description: '메인 액션과 다른 곳을 잠시 비추는 전환용 샷', url: '/shot_77.png', keywords: ['전환', '다른곳', '배경'] },
  { id: 'sb_78', name: '투샷 프로필 (Two Profile)', category: 'SUBJECT', description: '두 사람이 마주보는 옆모습을 담은 샷', url: '/shot_78.png', keywords: ['마주봄', '옆모습', '갈등', '사랑'] },
  { id: 'sb_79', name: '대결 구도 (Face-off)', category: 'SUBJECT', description: '두 인물이 정면으로 마주하여 긴장이 흐르는 샷', url: '/shot_79.png', keywords: ['대결', '긴장', '정면'] },
  { id: 'sb_80', name: '워킹 샷 (Walking)', category: 'SUBJECT', description: '걷는 인물을 따라가는 역동적인 샷', url: '/shot_80.png', keywords: ['걷기', '이동', '트래킹'] },
  { id: 'sb_81', name: '좌식 대화 (Sitting)', category: 'SUBJECT', description: '앉아서 나누는 안정적인 대화 샷', url: '/shot_81.png', keywords: ['앉아있기', '카페', '소파'] },
  { id: 'sb_82', name: '창 밖 풍경 (Window)', category: 'SUBJECT', description: '창 밖을 내다보는 사색적인 인물 샷', url: '/shot_82.png', keywords: ['사색', '창문', '기다림'] },
  { id: 'sb_83', name: '등장 (Entering)', category: 'SUBJECT', description: '공간으로 들어오는 인물의 순간 포착', url: '/shot_83.png', keywords: ['등장', '문열기', '입장'] },
  { id: 'sb_84', name: '퇴장 (Leaving)', category: 'SUBJECT', description: '프레임 밖으로 나가는 인물의 뒷모습', url: '/shot_84.png', keywords: ['퇴장', '끝', '나감'] },
  { id: 'sb_85', name: '가려진 피사체 (Hidden)', category: 'SUBJECT', description: '무언가에 가려져 일부만 보이는 미스테리한 샷', url: '/shot_85.png', keywords: ['미스테리', '가려짐', '일부'] },

  // LIGHTING & MOOD (15)
  { id: 'sb_86', name: '하이 키 (High Key)', category: 'LIGHTING', description: '전체적으로 밝고 그림자가 적은 화사한 샷', url: '/shot_86.png', keywords: ['밝음', '화사', '긍정', '코미디'] },
  { id: 'sb_87', name: '로우 키 (Low Key)', category: 'LIGHTING', description: '그림자가 많고 대비가 강한 어두운 샷', url: '/shot_87.png', keywords: ['어두움', '느와르', '공포', '무거움'] },
  { id: 'sb_88', name: '키아로스쿠로 (Contrast)', category: 'LIGHTING', description: '빛과 어둠의 강렬한 대비를 이용한 샷', url: '/shot_88.png', keywords: ['대비', '명암', '예술적'] },
  { id: 'sb_89', name: '역광 (Backlit)', category: 'LIGHTING', description: '뒤에서 오는 빛으로 후광 효과를 주는 샷', url: '/shot_89.png', keywords: ['역광', '후광', '신비', '천사'] },
  { id: 'sb_90', name: '림 라이트 (Rim Light)', category: 'LIGHTING', description: '인물의 테두리만 밝게 빛나서 배경과 분리하는 샷', url: '/shot_90.png', keywords: ['테두리', '라인', '분리'] },
  { id: 'sb_91', name: '탑 라이트 (Top Light)', category: 'LIGHTING', description: '정수리 위에서 빛이 내려와 눈에 그림자를 만드는 샷', url: '/shot_91.png', keywords: ['위에서', '압박', '비정함'] },
  { id: 'sb_92', name: '사이드 라이트 (Side)', category: 'LIGHTING', description: '얼굴 한쪽만 밝게 비추어 입체감이나 내적 갈등 표현', url: '/shot_92.png', keywords: ['옆면', '입체감', '갈등'] },
  { id: 'sb_93', name: '촛불 조명 (Candle)', category: 'LIGHTING', description: '촛불과 같은 약한 광원을 활용한 따뜻한 샷', url: '/shot_93.png', keywords: ['따뜻함', '과거', '클래식'] },
  { id: 'sb_94', name: '달빛 무드 (Moonlight)', category: 'LIGHTING', description: '밤의 차가운 푸른 빛을 활용한 감성 샷', url: '/shot_94.png', keywords: ['밤', '푸른빛', '정적', '꿈'] },
  { id: 'sb_95', name: '네온 라이트 (Neon)', category: 'LIGHTING', description: '강렬한 색상의 네온사인을 활용한 팝아트적 샷', url: '/shot_95.png', keywords: ['네온', '도시', '사이버펑크', '컬러풀'] },
  { id: 'sb_96', name: '골든 아워 (Golden)', category: 'LIGHTING', description: '해질녘 부드러운 오렌지빛의 감성 샷', url: '/shot_96.png', keywords: ['노을', '따뜻함', '낭만', '끝'] },
  { id: 'sb_97', name: '블루 아워 (Blue)', category: 'LIGHTING', description: '해뜨기 전이나 해진 직후의 신비로운 푸른 빛', url: '/shot_97.png', keywords: ['새벽', '신비', '차가움'] },
  { id: 'sb_98', name: '안개/미스트 (Fog)', category: 'LIGHTING', description: '안개를 통해 몽환적이거나 답답한 심리 표현', url: '/shot_98.png', keywords: ['안개', '몽환', '불확실'] },
  { id: 'sb_99', name: '비 오는 거리 (Rain)', category: 'LIGHTING', description: '빗줄기와 반사된 빛을 활용한 우울하거나 처절한 샷', url: '/shot_99.png', keywords: ['비', '슬픔', '처절', '감성'] },
  { id: 'sb_100', name: '그림자 놀이 (Shadow Play)', category: 'LIGHTING', description: '빛을 이용해 벽에 생기는 그림자로 이야기를 전달', url: '/shot_100.png', keywords: ['그림자', '상징', '공포', '예술'] },
];

export const recommendShots = (description: string): StoryboardShot[] => {
  if (!description) return [];
  const normalized = description.toLowerCase();
  
  // 키워드 가중치 기반 추천 (더 정교한 매칭)
  return storyboardDb
    .map(shot => ({
      ...shot,
      score: shot.keywords.reduce((acc, k) => acc + (normalized.includes(k) ? 1 : 0), 0)
    }))
    .filter(shot => shot.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};
