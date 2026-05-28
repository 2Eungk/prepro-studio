import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('docs/manual-storyboard-sheets');

const blocks = [
  {
    no: 1,
    title: '이른 아침 거리',
    tag: '자연광 / 무빙 중심',
    goal: '해 뜬 직후의 빛 활용. 광각/표준 짐벌 샷 먼저 밀고, 망원으로 마무리.',
    rows: [
      {
        time: '07:00 - 07:15',
        duration: '15분',
        scene: '현장 세팅',
        lens: '-',
        visual: 'streetSetup',
        caption: '거리 / 횡단보도 SETUP',
        note: '스태프 집결 및 카메라/짐벌 세팅',
      },
      {
        time: '07:15 - 08:00',
        duration: '45분',
        scene: 'S# 22A, 22B / S# 14A',
        lens: '24-70mm / 핸드헬드·짐벌 / Low·Eye',
        visual: 'crowdRun',
        caption: '군중 속 표류 / 달리기',
        note: '매뉴얼 없이 당황하며 뛰는 동선. 사람들은 직진, 카이로스만 방황. 핸드헬드 흔들림으로 불안감 강조.',
      },
      {
        time: '08:00 - 08:30',
        duration: '30분',
        scene: 'S# 22C',
        lens: '70-200mm / 삼각대 픽스 / Eye level',
        visual: 'skyClose',
        caption: '하늘 응시 CU / 배경 압축',
        note: '뛰다가 멈춰서 하늘을 보는 타이트 샷. 망원으로 군중 배경을 날리고 인물에 집중.',
      },
      {
        time: '08:30 - 09:00',
        duration: '30분',
        scene: '이동',
        lens: '-',
        visual: 'moveApartment',
        caption: '아파트 이동',
        note: '아파트로 이동 및 거실 픽스 세팅',
      },
    ],
  },
  {
    no: 2,
    title: '아파트 거실',
    tag: '동일 앵글 인서트 몰아 찍기',
    goal: '삼각대 고정 후, 인서트 먼저 다 찍고 메인 동선 트래킹.',
    rows: [
      {
        time: '09:00 - 09:40',
        duration: '40분',
        scene: 'S# 2C, 2F, 2H / S# 2J, 2L, 2N / S# 13A',
        lens: '70-200mm / 픽스 / CS·High',
        visual: 'insertTop',
        caption: '알람 손 / 매뉴얼 눈빛 / 탑뷰',
        note: '인서트 몰아찍기. 카메라 고정 후 시간대만 바꿔 알람 끄는 손 반복 촬영. 매뉴얼 확인하는 눈빛.',
      },
      {
        time: '09:40 - 11:30',
        duration: '110분',
        scene: 'S# 2B, 2D, 2E / S# 2G, 2I, 2K, 2M / S# 13B-13F / S# 1E',
        lens: '24-70mm / 픽스·트래킹 / MS·MCU',
        visual: 'routineContrast',
        caption: 'Day1 허겁지겁 vs Day2 여유',
        note: '허겁지겁 먹는 1일 차와 여유로운 2일 차 대비. 냉장고, 식탁, 양치, 옷입기 지정 위치 몰아찍기.',
      },
    ],
  },
  {
    no: 3,
    title: '아파트 현관 및 계단',
    tag: '광각 왜곡 활용',
    goal: '현관문 주변 씬 완벽 클리어. 계단은 12-24mm 광각으로 긴장감 극대화.',
    rows: [
      {
        time: '11:30 - 11:45',
        duration: '15분',
        scene: '현장 세팅',
        lens: '-',
        visual: 'doorSetup',
        caption: '복도 / 현관 SETUP',
        note: '실내외 노출 차이에 주의하여 조명과 카메라 세팅.',
      },
      {
        time: '11:45 - 12:45',
        duration: '60분',
        scene: 'S# 3B-3E / S# 10A-10E / S# 19A, 19B',
        lens: '24-70mm / 픽스·트래킹 / High·Eye',
        visual: 'doorPressure',
        caption: '문 앞 대기 / 뛰어 들어옴 / 팔로잉',
        note: '나가는 씬, 오후 3시 헐레벌떡 들어와 알람 끄는 씬, 문밖에서 시간 맞춰 대기하는 씬 몰아찍기.',
      },
      {
        time: '12:45 - 13:30',
        duration: '45분',
        scene: 'S# 9A-9D',
        lens: '12-24mm / 핸드헬드 / MS·CU',
        visual: 'stairsRun',
        caption: '계단 질주 / 떨리는 손',
        note: '계단 두 칸씩 뛰어오르는 역동적인 샷. 숨 가쁜 느낌을 위해 렌즈를 바짝 붙이기.',
      },
      {
        time: '13:30 - 14:30',
        duration: '60분',
        scene: '점심 / 이동',
        lens: '-',
        visual: 'mealMove',
        caption: '점심 식사 / 야외 이동',
        note: '점심 식사 및 로케이션 이동·세팅',
      },
    ],
  },
  {
    no: 4,
    title: '늦은 오후 거리',
    tag: '망원 타이트 샷 먼저',
    goal: '골든아워 빛 활용. 망원으로 압축감 살리고, 표준으로 넓은 횡단보도 샷.',
    rows: [
      {
        time: '14:30 - 14:50',
        duration: '20분',
        scene: '현장 세팅',
        lens: '-',
        visual: 'crosswalkSetup',
        caption: '거리 / 횡단보도 SETUP',
        note: '횡단보도 근처 자리 잡고 동선 체크.',
      },
      {
        time: '14:50 - 16:10',
        duration: '80분',
        scene: 'S# 8C, 8D',
        lens: '70-200mm / 픽스·트래킹 / Low·High',
        visual: 'crosswalkRun',
        caption: '신호 직전 통과 / 시계 줌인',
        note: '횡단보도 건너는 순간을 타이트하게 잡기. 배경 아웃포커싱으로 인물의 조급함 강조.',
      },
      {
        time: '16:10 - 17:30',
        duration: '80분',
        scene: 'S# 8A, 8B / S# 18A, 18B',
        lens: '24-70mm / 트래킹·픽스 / WS·MS',
        visual: 'goldenStreet',
        caption: '풀샷 질주 / 하늘 응시',
        note: '횡단보도를 향해 뛰는 전체 그림. 거리 한가운데 서서 10초간 하늘 보는 씬.',
      },
      {
        time: '17:30 - 18:30',
        duration: '60분',
        scene: '저녁 / 세팅',
        lens: '-',
        visual: 'nightSetup',
        caption: '저녁 식사 / 야간 침실 세팅',
        note: '저녁 식사 및 야간 침실 완벽 통제 세팅.',
      },
    ],
  },
  {
    no: 5,
    title: '야간 침실 & 메인 폭발',
    tag: 'FX3 저조도 / 극단적 광각',
    goal: '일상 씬 다 털어낸 후, 마지막에 방을 난장판으로 만들며 에너지 폭발.',
    rows: [
      {
        time: '18:30 - 19:00',
        duration: '30분',
        scene: '야간 조명 셋업',
        lens: '-',
        visual: 'lightSetup',
        caption: '실내 암막 / 조명',
        note: '창밖 어두운 룩, 방 안 기본조명 세팅.',
      },
      {
        time: '19:00 - 20:30',
        duration: '90분',
        scene: 'S# 11, 20 / S# 1, 12, 31',
        lens: '24-70mm / 픽스·팬 / 다양한 앵글',
        visual: 'bedroomRoutine',
        caption: '침대 통화 / 현관 진입 / 기상 탑뷰',
        note: '창문 환기, 야간 통화, 기상 씬 등 침실에서 할 수 있는 차분한 일상 컷 클리어.',
      },
      {
        time: '20:30 - 21:00',
        duration: '30분',
        scene: 'S# 21A-21F',
        lens: '70-200mm / 픽스 / CU·MCU',
        visual: 'printerPanic',
        caption: '무한 출력 / 떨리는 동공과 손',
        note: '매뉴얼이 다시 출력되며 패닉에 빠지는 타이트 샷. 미세한 떨림을 극대화하여 텐션업.',
      },
      {
        time: '21:00 - 21:20',
        duration: '20분',
        scene: '파괴 셋업',
        lens: '-',
        visual: 'safetySetup',
        caption: '더미 프린터 / 안전 구역',
        note: '파괴될 프린터 더미 세팅, 안전 구역 확보.',
      },
      {
        time: '21:20 - 22:00',
        duration: '40분',
        scene: 'S# 32A-32K',
        lens: '12-24mm / 베이비 레그 / Extreme Low·HH',
        visual: 'printerSmash',
        caption: '극단적 로우 / 광각 왜곡',
        note: '메인 액션 씬. 바닥에 붙은 앵글에서 거칠게 부수는 씬. 카메라 2대 동시 운용 필수.',
      },
      {
        time: '22:00 - 22:10',
        duration: '10분',
        scene: '아침 룩 전환',
        lens: '-',
        visual: 'morningLight',
        caption: '잔해 그대로 / 햇살 조명',
        note: '파괴된 잔해 그대로 두고, 아침 햇살 조명으로 전환.',
      },
      {
        time: '22:10 - 22:30',
        duration: '20분',
        scene: 'S# 33A, 33B',
        lens: '24-70mm / 픽스',
        visual: 'origamiEnd',
        caption: '잔해 위 종이학 / 크랭크업',
        note: '부서진 잔해 위 평온한 아침, 종이학 인서트 후 크랭크업.',
      },
    ],
  },
];

const W = 1800;
const margin = 42;
const headerH = 168;
const rowH = 252;
const leftW = 610;
const gap = 24;
const rightX = margin + leftW + gap;
const rightW = W - rightX - margin;
const col = [170, 235, 280, rightW - 170 - 235 - 280];

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

const wrap = (text, maxChars) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const text = (content, x, y, options = {}) => {
  const {
    size = 28,
    weight = 800,
    fill = '#f4f4f5',
    max = 28,
    line = Math.round(size * 1.35),
    anchor = 'start',
    family = 'Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif',
  } = options;
  const lines = Array.isArray(content) ? content : wrap(content, max);
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((item, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : line}">${esc(item)}</tspan>`).join('')}</text>`;
};

const line = (x1, y1, x2, y2, color = '#111', width = 4) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const rect = (x, y, w, h, fill = 'none', stroke = '#111', sw = 4, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (cx, cy, r, fill = 'none', stroke = '#111', sw = 4) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function person(x, y, scale = 1, pose = 'stand') {
  const head = circle(x, y - 32 * scale, 13 * scale, '#fff', '#111', 4 * scale);
  const body = line(x, y - 18 * scale, x, y + 32 * scale, '#111', 4 * scale);
  if (pose === 'run') {
    return `${head}${body}${line(x, y, x - 28 * scale, y + 12 * scale)}${line(x, y, x + 32 * scale, y - 8 * scale)}${line(x, y + 32 * scale, x - 24 * scale, y + 65 * scale)}${line(x, y + 32 * scale, x + 36 * scale, y + 52 * scale)}`;
  }
  if (pose === 'bend') {
    return `${head}${line(x, y - 18 * scale, x + 22 * scale, y + 20 * scale)}${line(x + 22 * scale, y + 20 * scale, x + 45 * scale, y + 34 * scale)}${line(x + 12 * scale, y + 10 * scale, x - 18 * scale, y + 35 * scale)}${line(x + 20 * scale, y + 28 * scale, x + 2 * scale, y + 68 * scale)}${line(x + 20 * scale, y + 28 * scale, x + 52 * scale, y + 60 * scale)}`;
  }
  return `${head}${body}${line(x, y, x - 24 * scale, y + 20 * scale)}${line(x, y, x + 24 * scale, y + 20 * scale)}${line(x, y + 32 * scale, x - 18 * scale, y + 68 * scale)}${line(x, y + 32 * scale, x + 18 * scale, y + 68 * scale)}`;
}

function sketch(type, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const base = [
    rect(x, y, w, h, '#fbfbfb', '#e5e5e5', 3, 18),
    rect(x + 16, y + 16, w - 32, h - 32, 'none', '#111', 3, 8),
  ];
  const ground = line(x + 34, y + h - 54, x + w - 34, y + h - 54, '#999', 3);

  const scenes = {
    streetSetup: () => `${ground}${rect(x + 65, y + 70, 80, 62)}${circle(x + 180, y + 102, 25)}${line(x + 205, y + 102, x + 285, y + 70)}${line(x + 285, y + 70, x + 320, y + 120)}${text('SETUP', cx, cy + 8, { size: 46, fill: '#111', weight: 950, anchor: 'middle', max: 12 })}`,
    crowdRun: () => `${ground}${[0,1,2,3,4].map((i) => person(x + 90 + i * 88, y + 160, 0.62)).join('')}${person(cx + 80, y + 166, 0.85, 'run')}${line(cx + 15, y + 94, cx - 60, y + 94, '#555', 5)}${line(cx + 20, y + 122, cx - 86, y + 122, '#555', 4)}`,
    skyClose: () => `${circle(cx - 18, cy - 4, 45)}${line(cx - 18, cy + 42, cx - 18, cy + 110)}${line(cx - 90, y + 82, cx + 190, y + 82, '#bbb', 4)}${line(cx + 80, y + 48, cx + 170, y + 48, '#bbb', 4)}${text('CU', x + w - 82, y + h - 42, { size: 34, fill: '#111', weight: 950, max: 4 })}`,
    moveApartment: () => `${ground}${rect(x + 90, y + 70, 120, 145)}${rect(x + 240, y + 52, 135, 165)}${line(x + 120, y + 242, x + w - 100, y + 242, '#111', 5)}${line(x + w - 130, y + 222, x + w - 96, y + 242)}${line(x + w - 130, y + 262, x + w - 96, y + 242)}${text('MOVE', cx, y + 132, { size: 42, fill: '#111', weight: 950, anchor: 'middle', max: 8 })}`,
    insertTop: () => `${rect(x + 70, y + 70, 160, 94)}${circle(x + 150, y + 118, 28)}${line(x + 150, y + 90, x + 150, y + 118)}${line(x + 150, y + 118, x + 177, y + 118)}${rect(x + 280, y + 72, 185, 110)}${line(x + 300, y + 100, x + 445, y + 100)}${line(x + 300, y + 128, x + 435, y + 128)}${line(x + 300, y + 156, x + 410, y + 156)}${line(x + 120, y + 210, x + 220, y + 185)}${line(x + 188, y + 192, x + 230, y + 214)}`,
    routineContrast: () => `${ground}${rect(x + 70, y + 80, 105, 105)}${rect(x + 360, y + 80, 105, 105)}${person(x + 230, y + 180, 0.72, 'bend')}${person(x + 500, y + 178, 0.72)}${line(cx - 25, cy, cx + 25, cy, '#111', 5)}${line(cx + 10, cy - 16, cx + 28, cy)}${line(cx + 10, cy + 16, cx + 28, cy)}`,
    doorSetup: () => `${ground}${rect(cx - 70, y + 55, 140, 210)}${circle(cx + 45, y + 166, 5, '#111')}${text('HALL', x + 92, cy, { size: 38, fill: '#111', weight: 950, max: 8 })}`,
    doorPressure: () => `${ground}${rect(x + 74, y + 54, 135, 205)}${person(x + 280, y + 180, 0.7)}${circle(x + 408, y + 104, 36)}${line(x + 408, y + 104, x + 408, y + 82)}${line(x + 408, y + 104, x + 430, y + 104)}${person(x + 505, y + 178, 0.72, 'run')}`,
    stairsRun: () => `${line(x + 70, y + 240, x + 500, y + 116, '#111', 5)}${line(x + 112, y + 228, x + 540, y + 104, '#111', 5)}${[0,1,2,3,4].map((i) => line(x + 92 + i * 82, y + 232 - i * 24, x + 132 + i * 82, y + 220 - i * 24, '#999', 3)).join('')}${person(cx, cy + 15, 0.82, 'run')}${text('12mm', x + 74, y + 82, { size: 34, fill: '#111', weight: 950, max: 6 })}`,
    mealMove: () => `${ground}${circle(cx - 60, cy, 40)}${line(cx - 105, cy, cx - 15, cy)}${line(cx + 38, cy, cx + 145, cy)}${line(cx + 112, cy - 24, cx + 145, cy)}${line(cx + 112, cy + 24, cx + 145, cy)}${text('LUNCH / MOVE', cx, y + 230, { size: 34, fill: '#111', weight: 950, anchor: 'middle', max: 20 })}`,
    crosswalkSetup: () => `${ground}${[0,1,2,3,4].map((i) => rect(x + 70 + i * 88, y + 180, 56, 28, '#fff', '#111', 3)).join('')}${circle(x + 475, y + 80, 17)}${circle(x + 475, y + 125, 17)}${text('SETUP', cx, y + 102, { size: 42, fill: '#111', weight: 950, anchor: 'middle', max: 10 })}`,
    crosswalkRun: () => `${[0,1,2,3,4].map((i) => rect(x + 70 + i * 88, y + 200, 56, 30, '#fff', '#111', 3)).join('')}${person(cx, y + 172, 0.9, 'run')}${circle(x + 475, y + 80, 17, '#fff', '#111')}${circle(x + 475, y + 125, 17, '#111', '#111')}${text('09', x + 475, y + 177, { size: 34, fill: '#111', weight: 950, anchor: 'middle', max: 3 })}`,
    goldenStreet: () => `${ground}${line(x + 60, y + 90, x + w - 60, y + 90, '#aaa', 4)}${circle(x + w - 118, y + 76, 32, '#fff', '#111')}${person(cx - 40, y + 174, 0.8)}${line(cx - 165, y + 190, cx + 190, y + 190, '#888', 3)}${text('WS', x + 78, y + 86, { size: 32, fill: '#111', weight: 950, max: 4 })}`,
    nightSetup: () => `${rect(x + 75, y + 60, 150, 160)}${line(x + 75, y + 110, x + 225, y + 110, '#111', 3)}${line(x + 150, y + 60, x + 150, y + 220, '#111', 3)}${circle(x + 384, y + 120, 36)}${line(x + 384, y + 156, x + 384, y + 240)}${text('NIGHT', cx, y + 244, { size: 36, fill: '#111', weight: 950, anchor: 'middle', max: 8 })}`,
    lightSetup: () => `${rect(x + 80, y + 55, 170, 150)}${line(x + 80, y + 110, x + 250, y + 110)}${line(x + 165, y + 55, x + 165, y + 205)}${circle(x + 410, y + 105, 36)}${line(x + 410, y + 141, x + 410, y + 238)}${line(x + 340, y + 95, x + 275, y + 70, '#999', 3)}${line(x + 340, y + 118, x + 275, y + 126, '#999', 3)}`,
    bedroomRoutine: () => `${rect(x + 70, y + 154, 210, 76)}${circle(x + 130, y + 145, 22)}${line(x + 150, y + 150, x + 230, y + 190)}${rect(x + 370, y + 76, 92, 120)}${line(x + 462, y + 76, x + 508, y + 96)}${person(x + 500, y + 188, 0.58)}`,
    printerPanic: () => `${rect(cx - 98, y + 116, 196, 88)}${rect(cx - 68, y + 70, 136, 70)}${line(cx - 50, y + 96, cx + 50, y + 96)}${person(x + 165, y + 185, 0.72)}${line(x + 118, y + 82, x + 138, y + 62, '#111', 5)}${line(x + 148, y + 72, x + 176, y + 52, '#111', 4)}${text('PANIC', x + 462, y + 228, { size: 31, fill: '#111', weight: 950, anchor: 'middle', max: 8 })}`,
    safetySetup: () => `${rect(cx - 100, y + 120, 200, 92)}${line(cx - 70, y + 96, cx + 70, y + 96)}${line(cx - 92, y + 244, cx + 92, y + 244, '#111', 5)}${line(cx - 92, y + 244, cx - 120, y + 272)}${line(cx + 92, y + 244, cx + 120, y + 272)}${text('SAFETY', cx, y + 76, { size: 38, fill: '#111', weight: 950, anchor: 'middle', max: 10 })}`,
    printerSmash: () => `${rect(cx - 105, y + 174, 210, 56)}${person(cx - 10, y + 150, 0.9, 'bend')}${line(cx + 40, y + 86, cx + 105, y + 142, '#111', 8)}${line(cx + 96, y + 134, cx + 132, y + 110, '#111', 8)}${line(cx - 130, y + 224, cx + 150, y + 250, '#999', 4)}${line(x + 98, y + 94, x + 150, y + 64, '#111', 4)}${line(x + 448, y + 88, x + 510, y + 58, '#111', 4)}`,
    morningLight: () => `${rect(x + 78, y + 58, 170, 155)}${line(x + 78, y + 110, x + 248, y + 110)}${line(x + 163, y + 58, x + 163, y + 213)}${line(x + 262, y + 68, x + 440, y + 220, '#999', 4)}${line(x + 300, y + 62, x + 478, y + 214, '#bbb', 4)}${rect(cx - 80, y + 220, 160, 32, '#fff', '#111', 3)}`,
    origamiEnd: () => `${rect(x + 78, y + 58, 170, 155)}${line(x + 262, y + 68, x + 440, y + 220, '#bbb', 4)}${line(cx - 150, y + 246, cx + 150, y + 246, '#111', 4)}${line(cx - 52, y + 186, cx, y + 224, '#111', 5)}${line(cx + 52, y + 186, cx, y + 224, '#111', 5)}${line(cx - 52, y + 186, cx + 52, y + 186, '#111', 5)}${line(cx, y + 224, cx + 18, y + 250, '#111', 4)}${text('END', x + 96, y + 248, { size: 32, fill: '#111', weight: 950, max: 5 })}`,
  };

  return `${base.join('')}${(scenes[type] || scenes.streetSetup)()}`;
}

function renderBlock(block) {
  const height = headerH + block.rows.length * rowH + margin;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}">`,
    `<rect width="${W}" height="${height}" fill="#0b0b0b"/>`,
    `<rect x="${margin}" y="${margin}" width="${W - margin * 2}" height="${height - margin * 2}" rx="28" fill="#121212" stroke="#2b2b2b" stroke-width="2"/>`,
    `<rect x="${margin}" y="${margin}" width="${W - margin * 2}" height="${headerH - 26}" rx="28" fill="#132321"/>`,
    text(`BLOCK ${block.no}`, margin + 32, margin + 46, { size: 24, fill: '#5ed7cf', weight: 950, max: 12 }),
    text(block.title, margin + 32, margin + 95, { size: 48, fill: '#ffffff', weight: 950, max: 18 }),
    text(block.goal, margin + 32, margin + 132, { size: 22, fill: '#a3a3a3', weight: 800, max: 62 }),
    `<rect x="${W - margin - 330}" y="${margin + 38}" width="290" height="54" rx="27" fill="rgba(94,215,207,0.10)" stroke="rgba(94,215,207,0.45)" stroke-width="2"/>`,
    text(block.tag, W - margin - 185, margin + 73, { size: 19, fill: '#5ed7cf', weight: 950, anchor: 'middle', max: 18 }),
  ];

  let y = margin + headerH - 8;
  block.rows.forEach((row, index) => {
    const bg = index % 2 === 0 ? '#171717' : '#101010';
    parts.push(`<rect x="${margin}" y="${y}" width="${W - margin * 2}" height="${rowH}" fill="${bg}" stroke="#2b2b2b" stroke-width="2"/>`);
    const frameX = margin + 28;
    const frameY = y + 26;
    parts.push(sketch(row.visual, frameX, frameY, leftW - 56, 156));
    parts.push(text(row.caption, frameX, y + 218, { size: 20, fill: '#f4f4f5', weight: 950, max: 25 }));
    parts.push(text('STORYBOARD FRAME', frameX, y + 244, { size: 14, fill: '#737373', weight: 950, max: 20 }));

    let x = rightX;
    const labels = [
      ['시간', `${row.time}\n${row.duration}`],
      ['S# 및 컷', row.scene],
      ['렌즈 및 앵글', row.lens],
      ['내용 및 연출 포인트', row.note],
    ];
    labels.forEach(([label, value], i) => {
      parts.push(`<rect x="${x}" y="${y}" width="${col[i]}" height="${rowH}" fill="transparent" stroke="#2b2b2b" stroke-width="2"/>`);
      parts.push(text(label, x + 22, y + 42, { size: 16, fill: '#737373', weight: 950, max: 15 }));
      parts.push(text(value, x + 22, y + 86, {
        size: i === 0 ? 27 : i === 3 ? 22 : 21,
        fill: i === 0 ? '#5ed7cf' : '#f4f4f5',
        weight: 900,
        max: i === 3 ? 36 : i === 2 ? 18 : 16,
        line: i === 0 ? 36 : 31,
      }));
      x += col[i];
    });
    y += rowH;
  });

  parts.push('</svg>');
  return parts.join('');
}

await fs.mkdir(outDir, { recursive: true });

for (const block of blocks) {
  const svg = renderBlock(block);
  const name = `the-manual-storyboard-block-${String(block.no).padStart(2, '0')}`;
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  await fs.writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  console.log(pngPath);
}
