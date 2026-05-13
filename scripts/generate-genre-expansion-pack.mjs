import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 576;
const WHITE = [255, 255, 255, 255];
const INK = [24, 24, 24, 255];
const SOFT = [142, 142, 142, 255];
const PALE = [224, 224, 224, 255];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffers) => {
  let crc = 0xffffffff;
  for (const buffer of buffers) {
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data = Buffer.alloc(0)) => {
  const typeBuffer = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuffer.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32([typeBuffer, data]), 8 + data.length);
  return out;
};

const png = (pixels) => {
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y += 1) {
    raw[y * (W * 4 + 1)] = 0;
    pixels.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND'),
  ]);
};

const canvas = () => {
  const pixels = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i += 1) WHITE.forEach((v, c) => { pixels[i * 4 + c] = v; });

  const set = (x, y, color = INK) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= W || iy < 0 || iy >= H) return;
    const off = (iy * W + ix) * 4;
    color.forEach((v, c) => { pixels[off + c] = v; });
  };
  const dot = (x, y, r = 3, color = INK) => {
    for (let yy = -r; yy <= r; yy += 1) {
      for (let xx = -r; xx <= r; xx += 1) {
        if (xx * xx + yy * yy <= r * r) set(x + xx, y + yy, color);
      }
    }
  };
  const line = (x1, y1, x2, y2, width = 5, color = INK) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i += 1) {
      const t = steps === 0 ? 0 : i / steps;
      dot(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
    }
  };
  const rect = (x, y, w, h, width = 5, color = INK) => {
    line(x, y, x + w, y, width, color);
    line(x + w, y, x + w, y + h, width, color);
    line(x + w, y + h, x, y + h, width, color);
    line(x, y + h, x, y, width, color);
  };
  const ellipse = (cx, cy, rx, ry, width = 5, color = INK, start = 0, end = Math.PI * 2) => {
    const steps = 220;
    let px = cx + Math.cos(start) * rx;
    let py = cy + Math.sin(start) * ry;
    for (let i = 1; i <= steps; i += 1) {
      const a = start + ((end - start) * i) / steps;
      const x = cx + Math.cos(a) * rx;
      const y = cy + Math.sin(a) * ry;
      line(px, py, x, y, width, color);
      px = x;
      py = y;
    }
  };
  const curve = (points, width = 5, color = INK) => {
    for (let i = 1; i < points.length; i += 1) line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color);
  };
  const frame = () => {
    rect(36, 36, 952, 504, 4, PALE);
    line(70, 492, 954, 492, 3, PALE);
  };
  const floor = () => {
    line(96, 456, 928, 456, 3, PALE);
    line(210, 456, 112, 530, 2, PALE);
    line(814, 456, 914, 530, 2, PALE);
  };
  const person = (x, y, scale = 1, facing = 1) => {
    ellipse(x, y, 30 * scale, 38 * scale, 5);
    line(x - 10 * scale, y + 40 * scale, x - 24 * scale, y + 142 * scale, 6);
    line(x + 10 * scale, y + 40 * scale, x + 25 * scale, y + 142 * scale, 6);
    line(x - 24 * scale, y + 142 * scale, x + 24 * scale, y + 142 * scale, 6);
    line(x - 28 * scale, y + 70 * scale, x - 78 * scale * facing, y + 112 * scale, 5);
    line(x + 28 * scale, y + 70 * scale, x + 68 * scale * facing, y + 112 * scale, 5);
    line(x - 16 * scale, y + 142 * scale, x - 42 * scale, y + 214 * scale, 6);
    line(x + 16 * scale, y + 142 * scale, x + 40 * scale, y + 214 * scale, 6);
    line(x - 52 * scale, y + 214 * scale, x - 18 * scale, y + 214 * scale, 5);
    line(x + 18 * scale, y + 214 * scale, x + 52 * scale, y + 214 * scale, 5);
  };
  const bust = (x, y, scale = 1) => {
    ellipse(x, y, 42 * scale, 52 * scale, 6);
    line(x - 34 * scale, y + 54 * scale, x - 88 * scale, y + 160 * scale, 7);
    line(x + 32 * scale, y + 54 * scale, x + 84 * scale, y + 160 * scale, 7);
    line(x - 92 * scale, y + 160 * scale, x + 92 * scale, y + 160 * scale, 7);
  };
  const product = (x, y, w = 140, h = 190) => {
    rect(x, y, w, h, 7);
    line(x + 20, y + 52, x + w - 20, y + 52, 4, SOFT);
    line(x + 26, y + 96, x + w - 26, y + 96, 4, SOFT);
    ellipse(x + w / 2, y + h - 42, 30, 18, 4, SOFT);
  };
  const camera = (x, y, scale = 1) => {
    rect(x, y, 132 * scale, 74 * scale, 5);
    ellipse(x + 68 * scale, y + 36 * scale, 24 * scale, 24 * scale, 5);
    rect(x + 104 * scale, y + 18 * scale, 44 * scale, 30 * scale, 5);
    line(x + 26 * scale, y + 74 * scale, x + 6 * scale, y + 132 * scale, 5);
    line(x + 96 * scale, y + 74 * scale, x + 122 * scale, y + 132 * scale, 5);
  };
  const audience = (x, y, count = 6, scale = 0.6) => {
    for (let i = 0; i < count; i += 1) {
      const px = x + i * 82 * scale;
      ellipse(px, y, 22 * scale, 28 * scale, 4);
      line(px - 18 * scale, y + 30 * scale, px - 38 * scale, y + 90 * scale, 5);
      line(px + 18 * scale, y + 30 * scale, px + 38 * scale, y + 90 * scale, 5);
      line(px - 40 * scale, y + 90 * scale, px + 40 * scale, y + 90 * scale, 5);
    }
  };
  const stage = () => {
    rect(150, 116, 724, 100, 5);
    line(166, 218, 858, 218, 4, SOFT);
    rect(250, 250, 524, 128, 5, PALE);
  };
  const dancer = (x, y, scale = 1, pose = 0) => {
    ellipse(x, y, 24 * scale, 30 * scale, 5);
    line(x, y + 32 * scale, x, y + 126 * scale, 6);
    if (pose % 3 === 0) {
      line(x, y + 66 * scale, x - 72 * scale, y + 34 * scale, 5);
      line(x, y + 66 * scale, x + 72 * scale, y + 34 * scale, 5);
      line(x, y + 126 * scale, x - 48 * scale, y + 206 * scale, 6);
      line(x, y + 126 * scale, x + 58 * scale, y + 190 * scale, 6);
    } else if (pose % 3 === 1) {
      line(x, y + 66 * scale, x - 54 * scale, y + 106 * scale, 5);
      line(x, y + 66 * scale, x + 76 * scale, y + 82 * scale, 5);
      line(x, y + 126 * scale, x - 18 * scale, y + 210 * scale, 6);
      line(x, y + 126 * scale, x + 78 * scale, y + 156 * scale, 6);
    } else {
      line(x, y + 66 * scale, x - 74 * scale, y + 86 * scale, 5);
      line(x, y + 66 * scale, x + 50 * scale, y + 122 * scale, 5);
      line(x, y + 126 * scale, x - 68 * scale, y + 172 * scale, 6);
      line(x, y + 126 * scale, x + 38 * scale, y + 208 * scale, 6);
    }
  };
  return { pixels, line, rect, ellipse, curve, frame, floor, person, bust, product, camera, audience, stage, dancer };
};

const danceGroup = (c, y = 160, scale = 0.72) => {
  [300, 410, 520, 630, 740].forEach((x, i) => c.dancer(x, y + (i % 2) * 10, scale, i));
};

const scenes = {
  151: (c) => { c.frame(); c.product(432, 132, 160, 230); c.ellipse(512, 424, 238, 38, 5, SOFT); c.line(270, 190, 400, 246, 4, PALE); c.line(754, 190, 622, 246, 4, PALE); },
  152: (c) => { c.frame(); c.rect(170, 160, 684, 230, 6); for (let x = 230; x < 805; x += 62) c.ellipse(x, 274 + ((x / 62) % 2) * 18, 26, 18, 4, SOFT); c.rect(408, 206, 208, 118, 6); },
  153: (c) => { c.frame(); c.rect(112, 128, 372, 282, 5); c.rect(540, 128, 372, 282, 5); c.product(248, 188, 94, 138); c.product(678, 158, 132, 188); c.line(512, 92, 512, 444, 5, PALE); },
  154: (c) => { c.frame(); c.rect(250, 112, 524, 330, 5); c.product(430, 190, 160, 180); c.line(266, 112, 366, 36, 4, SOFT); c.line(758, 112, 658, 36, 4, SOFT); c.line(358, 410, 658, 410, 5, SOFT); },
  155: (c) => { c.frame(); c.floor(); c.person(342, 186, 0.76, 1); c.product(610, 188, 120, 160); c.line(434, 294, 594, 250, 6, SOFT); c.camera(132, 328, 0.72); },
  156: (c) => { c.frame(); c.floor(); c.person(372, 182, 0.72, 1); c.person(650, 190, 0.68, -1); c.product(496, 250, 86, 120); c.rect(186, 122, 672, 292, 4, PALE); },
  157: (c) => { c.frame(); c.product(420, 150, 188, 220); c.ellipse(512, 260, 248, 128, 4, SOFT); c.line(314, 292, 244, 250, 5, SOFT); c.line(710, 292, 780, 250, 5, SOFT); },
  158: (c) => { c.frame(); c.product(458, 170, 110, 150); c.curve([[260, 238], [366, 182], [454, 214], [558, 176], [704, 238]], 6); c.ellipse(510, 392, 260, 38, 5, SOFT); },
  159: (c) => { c.frame(); c.product(452, 170, 120, 180); c.curve([[212, 382], [344, 292], [516, 286], [690, 292], [824, 384]], 5, SOFT); c.line(250, 146, 774, 146, 4, PALE); },
  160: (c) => { c.frame(); c.rect(262, 160, 500, 250, 7); c.product(340, 220, 118, 142); c.line(524, 230, 704, 230, 8); c.line(524, 280, 684, 280, 5, SOFT); c.line(524, 326, 646, 326, 5, SOFT); },
  161: (c) => { c.frame(); c.rect(160, 168, 704, 230, 6); c.product(212, 218, 88, 126); c.line(344, 240, 778, 240, 5); c.line(344, 286, 706, 286, 5, SOFT); c.line(344, 330, 750, 330, 5, SOFT); },
  162: (c) => { c.frame(); c.floor(); c.person(326, 174, 0.64, 1); c.product(520, 204, 120, 150); c.line(420, 290, 510, 264, 7); c.ellipse(700, 234, 82, 48, 5, SOFT); },
  163: (c) => { c.frame(); c.rect(118, 118, 350, 294, 6); c.rect(556, 118, 350, 294, 6); c.product(238, 190, 110, 154); c.line(644, 218, 826, 218, 6); c.line(644, 278, 790, 278, 5, SOFT); },
  164: (c) => { c.frame(); c.product(452, 150, 120, 172); c.ellipse(512, 380, 270, 42, 5, SOFT); c.curve([[238, 226], [356, 280], [512, 238], [674, 280], [786, 226]], 4, PALE); },
  165: (c) => { c.frame(); c.rect(262, 136, 500, 284, 6); c.line(302, 366, 720, 366, 5, SOFT); c.product(438, 188, 150, 162); c.line(322, 168, 398, 138, 4, PALE); c.line(702, 168, 626, 138, 4, PALE); },
  166: (c) => { c.frame(); c.floor(); c.person(354, 176, 0.74, 1); c.person(612, 178, 0.72, -1); c.product(486, 256, 76, 104); c.line(426, 286, 484, 266, 5); c.line(562, 266, 626, 286, 5); },
  167: (c) => { c.frame(); c.rect(220, 156, 584, 238, 6); c.product(456, 190, 112, 146); for (let i = 0; i < 5; i += 1) c.ellipse(320 + i * 96, 276, 30, 18, 4, SOFT); },
  168: (c) => { c.frame(); c.product(422, 166, 180, 200); c.rect(360, 126, 304, 282, 4, PALE); c.line(232, 456, 792, 456, 4, PALE); c.ellipse(512, 248, 254, 112, 3, SOFT); },
  169: (c) => { c.frame(); c.rect(176, 118, 672, 110, 6); c.product(436, 272, 152, 132); c.line(214, 170, 810, 170, 5, SOFT); c.line(310, 446, 714, 446, 5, PALE); },
  170: (c) => { c.frame(); c.floor(); c.product(442, 174, 136, 188); c.camera(128, 338, 0.82); c.line(272, 370, 428, 286, 5, SOFT); c.line(638, 256, 792, 192, 4, PALE); },
  171: (c) => { c.frame(); c.floor(); danceGroup(c, 152, 0.76); c.camera(112, 360, 0.75); c.line(252, 386, 426, 330, 5, SOFT); },
  172: (c) => { c.frame(); c.floor(); c.dancer(512, 136, 1.02, 1); [298, 724].forEach((x) => c.dancer(x, 186, 0.56, 0)); c.ellipse(512, 420, 226, 28, 4, SOFT); },
  173: (c) => { c.frame(); c.bust(512, 176, 1.14); c.line(392, 398, 632, 398, 6, SOFT); c.line(366, 142, 270, 92, 4, PALE); c.line(658, 142, 754, 92, 4, PALE); },
  174: (c) => { c.frame(); c.floor(); c.dancer(330, 160, 0.72, 0); c.dancer(510, 162, 0.72, 1); c.dancer(690, 160, 0.72, 2); c.line(218, 124, 806, 124, 4, PALE); },
  175: (c) => { c.frame(); c.rect(170, 190, 684, 190, 5); c.line(260, 285, 424, 236, 8); c.line(424, 236, 512, 292, 8); c.line(512, 292, 680, 238, 8); c.ellipse(424, 236, 34, 18, 5); c.ellipse(680, 238, 34, 18, 5); },
  176: (c) => { c.frame(); c.rect(150, 278, 724, 98, 5); c.line(270, 314, 414, 314, 8); c.line(610, 314, 756, 314, 8); c.ellipse(338, 314, 40, 18, 5); c.ellipse(684, 314, 40, 18, 5); },
  177: (c) => { c.frame(); c.floor(); danceGroup(c, 150, 0.7); c.line(218, 128, 804, 418, 4, SOFT); c.line(806, 128, 218, 418, 4, SOFT); },
  178: (c) => { c.frame(); c.floor(); c.dancer(512, 132, 1.0, 2); c.line(336, 408, 688, 408, 6, SOFT); c.line(424, 148, 298, 108, 4, PALE); c.line(600, 148, 726, 108, 4, PALE); },
  179: (c) => { c.frame(); c.floor(); c.dancer(512, 146, 0.86, 0); c.rect(156, 96, 712, 320, 5, PALE); c.line(512, 96, 512, 416, 4, SOFT); },
  180: (c) => { c.frame(); c.floor(); [330, 512, 694].forEach((x, i) => c.dancer(x, 172, 0.72, i)); c.line(268, 420, 756, 420, 6, SOFT); c.curve([[300, 114], [452, 80], [570, 80], [724, 114]], 4, PALE); },
  181: (c) => { c.frame(); c.floor(); c.dancer(512, 130, 1.02, 0); c.line(512, 82, 512, 432, 3, SOFT); c.line(270, 420, 754, 420, 5, PALE); },
  182: (c) => { c.frame(); c.floor(); danceGroup(c, 168, 0.66); c.rect(148, 100, 728, 304, 4, PALE); c.line(148, 252, 876, 252, 3, SOFT); },
  183: (c) => { c.frame(); c.floor(); [264, 380, 512, 644, 760].forEach((x, i) => c.dancer(x, 176 - Math.abs(512 - x) / 18, 0.66, i)); c.curve([[220, 438], [360, 382], [512, 360], [664, 382], [804, 438]], 4, SOFT); },
  184: (c) => { c.frame(); c.floor(); c.dancer(332, 176, 0.62, 0); c.dancer(512, 140, 0.9, 1); c.dancer(692, 176, 0.62, 2); c.line(512, 114, 512, 430, 4, SOFT); },
  185: (c) => { c.frame(); c.floor(); c.dancer(512, 126, 1.06, 2); c.line(298, 390, 724, 390, 5, SOFT); c.rect(406, 96, 210, 312, 4, PALE); },
  186: (c) => { c.frame(); c.floor(); c.dancer(512, 156, 0.88, 0); c.camera(130, 344, 0.7); c.line(268, 370, 452, 322, 6); c.line(452, 322, 422, 300, 6); c.line(452, 322, 428, 354, 6); },
  187: (c) => { c.frame(); c.floor(); danceGroup(c, 158, 0.7); c.camera(780, 344, 0.7); c.line(754, 370, 572, 322, 6); c.line(572, 322, 602, 300, 6); c.line(572, 322, 596, 354, 6); },
  188: (c) => { c.frame(); c.floor(); [314, 434, 590, 710].forEach((x, i) => c.dancer(x, 170 + i * 4, 0.68, i)); c.rect(180, 88, 664, 330, 4, PALE); c.line(512, 88, 512, 418, 3, SOFT); },
  189: (c) => { c.frame(); c.floor(); c.dancer(512, 124, 1.02, 1); c.line(360, 110, 260, 88, 4, PALE); c.line(664, 110, 764, 88, 4, PALE); c.line(302, 432, 722, 432, 5, SOFT); },
  190: (c) => { c.frame(); c.floor(); danceGroup(c, 150, 0.72); c.rect(130, 106, 764, 320, 5); c.line(130, 256, 894, 256, 3, PALE); c.line(512, 106, 512, 426, 3, PALE); },
  191: (c) => { c.frame(); c.rect(150, 98, 724, 106, 5); c.person(512, 224, 0.56, 1); c.audience(242, 366, 8, 0.64); c.line(150, 474, 874, 474, 4, PALE); },
  192: (c) => { c.frame(); c.stage(); c.audience(230, 366, 8, 0.62); c.person(512, 218, 0.54, 1); c.line(512, 214, 512, 366, 4, SOFT); },
  193: (c) => { c.frame(); c.floor(); c.bust(512, 178, 1.0); c.rect(210, 146, 160, 220, 4, PALE); c.rect(650, 146, 160, 220, 4, PALE); },
  194: (c) => { c.frame(); c.stage(); c.person(348, 218, 0.58, 1); c.audience(474, 326, 5, 0.55); c.line(410, 246, 612, 310, 4, SOFT); },
  195: (c) => { c.frame(); c.audience(188, 214, 9, 0.82); c.audience(238, 354, 7, 0.68); c.line(118, 456, 902, 456, 4, PALE); c.curve([[202, 116], [416, 82], [610, 82], [824, 116]], 4, SOFT); },
  196: (c) => { c.frame(); c.rect(136, 154, 752, 112, 6); c.line(178, 210, 846, 210, 4, SOFT); c.rect(298, 318, 428, 86, 5); c.audience(284, 440, 7, 0.48); },
  197: (c) => { c.frame(); c.rect(166, 128, 210, 282, 6); c.rect(430, 128, 172, 282, 5, SOFT); c.rect(660, 128, 210, 282, 6); c.audience(236, 438, 6, 0.45); },
  198: (c) => { c.frame(); c.floor(); c.person(352, 186, 0.64, 1); c.person(612, 186, 0.64, -1); c.person(500, 218, 0.48, 1); c.line(432, 292, 584, 292, 5, SOFT); },
  199: (c) => { c.frame(); c.floor(); c.rect(250, 142, 520, 230, 6); c.person(512, 218, 0.54, 1); c.line(178, 424, 846, 424, 5, PALE); },
  200: (c) => { c.frame(); c.floor(); c.person(346, 176, 0.62, 1); c.person(512, 176, 0.62, 1); c.person(678, 176, 0.62, -1); c.rect(250, 118, 524, 310, 4, PALE); },
  201: (c) => { c.frame(); c.rect(178, 122, 668, 138, 6); c.line(220, 190, 804, 190, 5, SOFT); c.audience(226, 348, 8, 0.64); c.rect(350, 420, 324, 46, 5); },
  202: (c) => { c.frame(); c.rect(250, 126, 524, 92, 5); c.product(324, 284, 88, 106); c.product(468, 284, 88, 106); c.product(612, 284, 88, 106); c.line(180, 442, 844, 442, 4, PALE); },
  203: (c) => { c.frame(); c.floor(); c.person(344, 178, 0.72, 1); c.person(594, 178, 0.72, -1); c.line(438, 270, 524, 270, 7); c.ellipse(480, 270, 36, 16, 5); },
  204: (c) => { c.frame(); c.rect(262, 116, 500, 292, 6); c.line(316, 184, 708, 184, 6); c.line(316, 244, 660, 244, 5, SOFT); c.line(316, 304, 704, 304, 5, SOFT); c.line(316, 364, 612, 364, 5, SOFT); },
  205: (c) => { c.frame(); c.rect(160, 116, 704, 264, 6); c.line(220, 182, 804, 182, 6, SOFT); c.person(332, 220, 0.48, 1); c.person(512, 220, 0.48, 1); c.person(692, 220, 0.48, -1); },
  206: (c) => { c.frame(); c.floor(); c.person(512, 174, 0.72, 1); c.rect(354, 120, 316, 230, 4, PALE); c.line(420, 406, 604, 406, 6, SOFT); },
  207: (c) => { c.frame(); c.rect(188, 120, 648, 120, 5); c.rect(250, 294, 524, 102, 5); c.line(216, 184, 808, 184, 4, SOFT); c.audience(272, 438, 7, 0.5); },
  208: (c) => { c.frame(); c.floor(); c.person(346, 178, 0.58, 1); c.person(512, 178, 0.58, 1); c.person(678, 178, 0.58, -1); c.line(302, 404, 722, 404, 7); c.line(302, 432, 722, 432, 4, SOFT); },
  209: (c) => { c.frame(); c.rect(110, 110, 804, 308, 4, PALE); c.rect(188, 168, 206, 154, 5); c.rect(410, 168, 206, 154, 5); c.rect(632, 168, 206, 154, 5); c.line(190, 452, 836, 452, 4, PALE); },
  210: (c) => { c.frame(); c.stage(); c.person(512, 210, 0.56, 1); c.audience(236, 366, 8, 0.58); c.rect(178, 438, 668, 44, 4, SOFT); c.line(236, 460, 786, 460, 5); },
};

for (let index = 151; index <= 210; index += 1) {
  const c = canvas();
  scenes[index](c);
  writeFileSync(`public/shot_${String(index).padStart(3, '0')}.png`, png(c.pixels));
}

console.log('Generated genre expansion storyboard pack: shot_151.png through shot_210.png');
