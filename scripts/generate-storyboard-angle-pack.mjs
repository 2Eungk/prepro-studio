import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const width = 1024;
const height = 576;
const minOutputBytes = 80 * 1024;

const anglePack = [
  {
    shot: 211,
    source: 'shot_133.png',
    name: 'clean single',
    tint: '#e8e2d5',
    motif: 'single',
  },
  {
    shot: 212,
    source: 'shot_71.png',
    name: 'dirty single',
    tint: '#e4ded2',
    motif: 'foreground',
  },
  {
    shot: 213,
    source: 'shot_75.png',
    name: 'eyeline match',
    tint: '#e7e1d6',
    motif: 'eyeline',
  },
  {
    shot: 214,
    source: 'shot_70.png',
    name: 'reverse ots',
    tint: '#e5dfd3',
    motif: 'reverse',
  },
  {
    shot: 215,
    source: 'shot_129.png',
    name: 'orbit reveal',
    tint: '#e8e1d7',
    motif: 'orbit',
  },
  {
    shot: 216,
    source: 'shot_123.png',
    name: 'gimbal follow',
    tint: '#e6e0d4',
    motif: 'track',
  },
  {
    shot: 217,
    source: 'shot_145.png',
    name: 'slider reveal',
    tint: '#e9e3d8',
    motif: 'slider',
  },
  {
    shot: 218,
    source: 'shot_127.png',
    name: 'jib down',
    tint: '#e5dfd5',
    motif: 'vertical',
  },
  {
    shot: 219,
    source: 'shot_176.png',
    name: 'floor feet tracking',
    tint: '#e7e0d4',
    motif: 'floor',
  },
  {
    shot: 220,
    source: 'shot_154.png',
    name: 'table top flatlay',
    tint: '#e8e2d7',
    motif: 'topdown',
  },
  {
    shot: 221,
    source: 'shot_130.png',
    name: 'pickup insert',
    tint: '#e6e0d5',
    motif: 'insert',
  },
  {
    shot: 222,
    source: 'shot_34.png',
    name: 'match cut bridge',
    tint: '#e9e2d6',
    motif: 'split',
  },
];

function targetName(shot) {
  return `shot_${String(shot).padStart(2, '0')}.png`;
}

function svgMotif({ motif, tint, name }) {
  const common = `fill="none" stroke="#161616" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"`;
  const light = `fill="none" stroke="#f7f0df" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.42"`;
  const shadow = `fill="#111" opacity="0.20"`;
  const pencil = `fill="none" stroke="#232323" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"`;

  const motifs = {
    single: `<rect x="342" y="72" width="340" height="432" rx="28" ${light}/><rect x="352" y="82" width="320" height="412" rx="24" ${common}/><path d="M414 410c56-52 142-52 198 0" ${pencil}/>` ,
    foreground: `<ellipse cx="188" cy="300" rx="142" ry="230" ${shadow}/><rect x="428" y="88" width="300" height="398" rx="22" ${common}/><path d="M156 86c42 96 42 330 0 420" ${pencil}/>` ,
    eyeline: `<path d="M250 230 C380 148 520 148 668 230" ${common}/><path d="M672 230 l-38 -28 M672 230 l-48 10" ${common}/><circle cx="238" cy="230" r="42" ${pencil}/><circle cx="750" cy="230" r="32" ${pencil}/>` ,
    reverse: `<path d="M280 118 l-92 82 92 82" ${common}/><path d="M188 200 h560" ${common}/><path d="M744 372 l92 -82 -92 -82" ${common}/><path d="M836 290 H276" ${common}/>` ,
    orbit: `<ellipse cx="512" cy="292" rx="288" ry="166" ${common}/><path d="M792 292 l-44 -24 M792 292 l-38 32" ${common}/><circle cx="512" cy="292" r="62" ${pencil}/>` ,
    track: `<path d="M172 430 H852" ${common}/><path d="M814 430 l-48 -30 M814 430 l-48 30" ${common}/><path d="M230 366 h420" ${pencil}/><path d="M610 366 l-34 -20 M610 366 l-34 20" ${pencil}/>` ,
    slider: `<rect x="150" y="402" width="724" height="22" rx="11" fill="#111" opacity="0.42"/><path d="M246 414 h484" ${common}/><path d="M730 414 l-42 -26 M730 414 l-42 26" ${common}/><rect x="164" y="144" width="220" height="210" rx="18" ${pencil}/>` ,
    vertical: `<path d="M512 74 V492" ${common}/><path d="M512 492 l-34 -58 M512 492 l34 -58" ${common}/><path d="M400 118 h224" ${pencil}/><path d="M376 444 h272" ${pencil}/>` ,
    floor: `<path d="M120 468 C320 428 700 428 904 468" ${common}/><path d="M244 380 h170 M604 380 h170" ${pencil}/><path d="M358 314 l-58 154 M670 314 l58 154" ${pencil}/>` ,
    topdown: `<rect x="256" y="112" width="512" height="352" rx="28" ${common}/><circle cx="396" cy="242" r="52" ${pencil}/><rect x="508" y="204" width="150" height="100" rx="18" ${pencil}/><path d="M334 368 h356" ${pencil}/>` ,
    insert: `<rect x="304" y="138" width="416" height="300" rx="24" ${common}/><path d="M354 332 C430 270 492 274 546 334" ${pencil}/><path d="M486 330 C544 268 612 270 672 332" ${pencil}/><circle cx="512" cy="284" r="22" ${pencil}/>` ,
    split: `<path d="M512 72 V504" ${common}/><path d="M248 288 h180" ${pencil}/><path d="M596 288 h180" ${pencil}/><path d="M394 288 l-34 -20 M394 288 l-34 20" ${pencil}/><path d="M630 288 l34 -20 M630 288 l34 20" ${pencil}/>` ,
  };

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${tint}" opacity="0.18"/>
    <rect x="22" y="22" width="980" height="532" rx="26" fill="none" stroke="#111" stroke-width="4" opacity="0.24"/>
    <path d="M64 64h96M64 64v70M960 64h-96M960 64v70M64 512h96M64 512v-70M960 512h-96M960 512v-70" ${pencil}/>
    ${motifs[motif] || ''}
    <path d="M72 538 C240 518 360 556 520 536 S780 516 952 538" fill="none" stroke="#111" stroke-width="2" opacity="0.18"/>
    <title>${name}</title>
  </svg>`;
}

async function generatePanel(spec) {
  const inputPath = path.join(publicDir, spec.source);
  const outputPath = path.join(publicDir, targetName(spec.shot));
  if (!fs.existsSync(inputPath)) throw new Error(`Missing source ${spec.source} for ${spec.shot}`);

  const source = sharp(inputPath)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .grayscale()
    .modulate({ brightness: 1.02, saturation: 0 })
    .linear(1.04, -4)
    .sharpen({ sigma: 0.55, m1: 0.75, m2: 0.25 });

  await source
    .composite([
      { input: Buffer.from(svgMotif(spec)), blend: 'over' },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  const { size } = fs.statSync(outputPath);
  if (size < minOutputBytes) {
    throw new Error(`${targetName(spec.shot)} is only ${Math.round(size / 1024)}KB; expected >= ${Math.round(minOutputBytes / 1024)}KB`);
  }
  return { file: targetName(spec.shot), source: spec.source, size };
}

const results = [];
for (const spec of anglePack) results.push(await generatePanel(spec));
console.log(`Generated ${results.length} missing-angle storyboard panels.`);
for (const result of results) console.log(`${result.file} <- ${result.source} (${Math.round(result.size / 1024)}KB)`);
