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
    const steps = 240;
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
    for (let i = 1; i < points.length; i += 1) {
      line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color);
    }
  };

  const person = (x, y, scale = 1, facing = 1, mood = 'neutral') => {
    ellipse(x, y, 34 * scale, 42 * scale, 5);
    line(x - 11 * scale, y + 45 * scale, x - 28 * scale, y + 152 * scale, 6);
    line(x + 12 * scale, y + 45 * scale, x + 31 * scale, y + 152 * scale, 6);
    line(x - 28 * scale, y + 152 * scale, x + 30 * scale, y + 152 * scale, 6);
    line(x - 31 * scale, y + 72 * scale, x - 86 * scale * facing, y + 117 * scale, 5);
    line(x + 31 * scale, y + 72 * scale, x + 72 * scale * facing, y + 116 * scale, 5);
    line(x - 18 * scale, y + 152 * scale, x - 42 * scale, y + 222 * scale, 6);
    line(x + 18 * scale, y + 152 * scale, x + 40 * scale, y + 222 * scale, 6);
    line(x - 52 * scale, y + 222 * scale, x - 20 * scale, y + 222 * scale, 5);
    line(x + 20 * scale, y + 222 * scale, x + 54 * scale, y + 222 * scale, 5);
    if (mood === 'talk') line(x + 10 * scale * facing, y + 8 * scale, x + 26 * scale * facing, y + 11 * scale, 3);
    if (mood === 'listen') ellipse(x + 11 * scale * facing, y + 8 * scale, 7 * scale, 3 * scale, 3, INK, 0, Math.PI);
  };

  const foregroundHead = (x, y, side = 1) => {
    ellipse(x, y, 72, 92, 8);
    line(x - 42 * side, y + 84, x - 94 * side, y + 224, 8);
    line(x + 30 * side, y + 86, x + 84 * side, y + 224, 8);
  };

  const floor = () => {
    line(86, 456, 938, 456, 3, PALE);
    line(210, 456, 112, 530, 2, PALE);
    line(814, 456, 914, 530, 2, PALE);
  };

  const titleBars = () => {
    rect(36, 36, 952, 504, 4, PALE);
    line(70, 492, 954, 492, 3, PALE);
  };

  return { pixels, line, rect, ellipse, curve, person, foregroundHead, floor, titleBars };
};

const scenes = {
  111: (c) => {
    c.titleBars();
    c.floor();
    c.person(360, 190, 0.82, 1, 'talk');
    c.person(664, 190, 0.82, -1, 'listen');
    c.line(474, 218, 550, 218, 5, SOFT);
    c.line(496, 240, 528, 240, 4, SOFT);
  },
  112: (c) => {
    c.titleBars();
    c.foregroundHead(266, 265, -1);
    c.person(650, 188, 0.9, -1, 'listen');
    c.ellipse(658, 191, 18, 7, 4, SOFT, 0, Math.PI);
    c.line(530, 176, 472, 150, 3, SOFT);
    c.line(530, 208, 460, 210, 3, SOFT);
  },
  113: (c) => {
    c.titleBars();
    c.ellipse(512, 264, 265, 168, 5, PALE, Math.PI, Math.PI * 2);
    c.person(423, 195, 0.86, 1, 'neutral');
    c.person(602, 195, 0.86, -1, 'neutral');
    c.line(258, 430, 766, 430, 7);
    c.line(374, 430, 282, 508, 4, SOFT);
    c.line(650, 430, 744, 508, 4, SOFT);
  },
  114: (c) => {
    c.titleBars();
    c.ellipse(372, 292, 72, 42, 6);
    c.ellipse(650, 292, 72, 42, 6);
    c.rect(262, 352, 500, 54, 5);
    c.line(302, 160, 206, 88, 3, PALE);
    c.line(722, 160, 818, 88, 3, PALE);
    c.line(512, 92, 512, 420, 3, PALE);
  },
  115: (c) => {
    c.titleBars();
    c.line(148, 488, 876, 488, 5, PALE);
    c.person(390, 240, 1.05, 1, 'neutral');
    c.person(632, 240, 1.05, -1, 'neutral');
    c.line(236, 510, 390, 90, 4, SOFT);
    c.line(788, 510, 632, 90, 4, SOFT);
  },
  116: (c) => {
    c.titleBars();
    c.foregroundHead(154, 284, -1);
    c.line(256, 380, 438, 304, 8);
    c.line(248, 416, 438, 358, 8);
    c.person(650, 182, 0.84, -1, 'talk');
    c.line(476, 262, 562, 238, 4, SOFT);
    c.line(484, 306, 564, 292, 4, SOFT);
  },
  117: (c) => {
    c.titleBars();
    c.ellipse(393, 250, 116, 144, 8);
    c.ellipse(632, 250, 116, 144, 8);
    c.line(485, 320, 540, 320, 5, SOFT);
    c.line(340, 438, 458, 438, 8);
    c.line(570, 438, 690, 438, 8);
    c.ellipse(430, 252, 14, 5, 4, SOFT, 0, Math.PI);
    c.ellipse(594, 252, 14, 5, 4, SOFT, 0, Math.PI);
  },
  118: (c) => {
    c.titleBars();
    c.rect(84, 104, 856, 300, 4, PALE);
    c.person(430, 246, 0.45, 1, 'neutral');
    c.person(595, 246, 0.45, -1, 'neutral');
    c.line(112, 452, 914, 452, 3, PALE);
    c.line(522, 152, 522, 430, 2, PALE);
  },
  119: (c) => {
    c.titleBars();
    c.line(128, 422, 884, 332, 7, PALE);
    c.person(382, 186, 0.82, 1, 'talk');
    c.person(650, 210, 0.82, -1, 'neutral');
    c.line(474, 252, 560, 216, 5, SOFT);
    c.line(330, 132, 284, 96, 4, SOFT);
    c.line(710, 142, 760, 108, 4, SOFT);
  },
  120: (c) => {
    c.titleBars();
    c.rect(196, 96, 632, 350, 9);
    c.rect(262, 148, 500, 246, 4, PALE);
    c.line(512, 96, 512, 446, 5);
    c.person(392, 206, 0.64, 1, 'listen');
    c.person(634, 206, 0.64, -1, 'talk');
    c.line(150, 492, 874, 492, 3, PALE);
  },
  121: (c) => {
    c.titleBars();
    c.floor();
    c.rect(120, 358, 136, 76, 5);
    c.ellipse(188, 358, 40, 18, 5);
    c.person(672, 188, 0.86, -1, 'neutral');
    c.line(290, 392, 540, 348, 7);
    c.line(540, 348, 508, 326, 7);
    c.line(540, 348, 516, 382, 7);
  },
  122: (c) => {
    c.titleBars();
    c.floor();
    c.person(512, 182, 0.98, 1, 'neutral');
    c.rect(708, 358, 134, 78, 5);
    c.ellipse(774, 358, 40, 18, 5);
    c.line(654, 392, 434, 352, 7);
    c.line(434, 352, 466, 328, 7);
    c.line(434, 352, 462, 382, 7);
  },
  123: (c) => {
    c.titleBars();
    c.floor();
    c.person(390, 196, 0.76, 1, 'talk');
    c.person(628, 196, 0.76, -1, 'listen');
    c.rect(270, 396, 128, 70, 5);
    c.ellipse(332, 396, 38, 16, 5);
    c.line(186, 378, 830, 378, 6);
    c.line(830, 378, 790, 354, 6);
    c.line(830, 378, 790, 402, 6);
  },
  124: (c) => {
    c.titleBars();
    c.floor();
    c.person(514, 190, 0.82, 1, 'neutral');
    c.rect(138, 104, 748, 344, 4, PALE);
    c.rect(246, 154, 532, 242, 4, SOFT);
    c.line(246, 154, 140, 104, 4, PALE);
    c.line(778, 154, 886, 104, 4, PALE);
    c.line(246, 396, 140, 448, 4, PALE);
    c.line(778, 396, 886, 448, 4, PALE);
    c.line(392, 454, 270, 454, 6);
    c.line(632, 454, 754, 454, 6);
  },
  125: (c) => {
    c.titleBars();
    c.floor();
    c.person(512, 196, 0.76, 1, 'neutral');
    c.curve([[196, 282], [318, 206], [474, 182], [654, 210], [812, 302]], 7);
    c.line(812, 302, 768, 286, 7);
    c.line(812, 302, 780, 336, 7);
    c.line(176, 334, 850, 334, 3, PALE);
  },
  126: (c) => {
    c.titleBars();
    c.line(116, 448, 898, 448, 4, PALE);
    c.person(388, 200, 0.8, 1, 'neutral');
    c.person(628, 190, 0.74, 1, 'neutral');
    c.line(274, 168, 216, 124, 4, SOFT);
    c.line(758, 222, 822, 176, 4, SOFT);
    c.line(276, 444, 342, 382, 5, SOFT);
    c.line(686, 444, 742, 388, 5, SOFT);
    c.curve([[214, 116], [194, 150], [228, 178], [198, 214]], 4, SOFT);
    c.curve([[808, 174], [842, 190], [820, 228], [858, 250]], 4, SOFT);
  },
  127: (c) => {
    c.titleBars();
    c.rect(128, 378, 152, 64, 5);
    c.ellipse(204, 378, 42, 16, 5);
    c.person(516, 210, 0.74, 1, 'neutral');
    c.line(498, 410, 716, 170, 6);
    c.line(716, 170, 674, 184, 6);
    c.line(716, 170, 712, 214, 6);
    c.line(306, 442, 856, 442, 3, PALE);
    c.ellipse(678, 238, 180, 82, 3, PALE);
  },
  128: (c) => {
    c.titleBars();
    c.floor();
    c.person(374, 194, 0.76, 1, 'neutral');
    c.person(650, 194, 0.76, -1, 'neutral');
    c.line(450, 222, 572, 222, 3, PALE);
    c.ellipse(374, 194, 86, 116, 4, SOFT);
    c.rect(582, 116, 156, 206, 5);
    c.line(466, 146, 564, 124, 6);
    c.line(564, 124, 526, 108, 6);
    c.line(564, 124, 538, 156, 6);
  },
  129: (c) => {
    c.titleBars();
    c.rect(198, 102, 628, 344, 7);
    c.line(512, 102, 512, 446, 4, SOFT);
    c.person(382, 200, 0.7, 1, 'listen');
    c.person(642, 200, 0.7, -1, 'talk');
    c.person(512, 224, 0.46, 1, 'neutral');
    c.line(114, 492, 910, 492, 3, PALE);
    c.line(382, 374, 642, 374, 3, SOFT);
  },
  130: (c) => {
    c.titleBars();
    c.rect(160, 232, 704, 168, 5);
    c.line(188, 300, 338, 260, 7);
    c.line(338, 260, 488, 304, 7);
    c.line(488, 304, 662, 258, 7);
    c.line(662, 258, 820, 308, 7);
    c.ellipse(338, 260, 34, 17, 5);
    c.ellipse(662, 258, 34, 17, 5);
    c.line(420, 438, 604, 438, 6);
    c.line(604, 438, 566, 416, 6);
    c.line(604, 438, 566, 462, 6);
  },
};

for (const [id, draw] of Object.entries(scenes)) {
  const c = canvas();
  draw(c);
  writeFileSync(`public/shot_${id}.png`, png(c.pixels));
}

console.log(`Generated ${Object.keys(scenes).length} bespoke storyboard PNGs.`);
