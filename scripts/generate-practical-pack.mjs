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
    line(x - 31 * scale, y + 72 * scale, x - 82 * scale * facing, y + 116 * scale, 5);
    line(x + 31 * scale, y + 72 * scale, x + 70 * scale * facing, y + 116 * scale, 5);
    line(x - 18 * scale, y + 152 * scale, x - 42 * scale, y + 222 * scale, 6);
    line(x + 18 * scale, y + 152 * scale, x + 40 * scale, y + 222 * scale, 6);
    line(x - 52 * scale, y + 222 * scale, x - 20 * scale, y + 222 * scale, 5);
    line(x + 20 * scale, y + 222 * scale, x + 54 * scale, y + 222 * scale, 5);
    if (mood === 'talk') line(x + 10 * scale * facing, y + 8 * scale, x + 26 * scale * facing, y + 11 * scale, 3);
    if (mood === 'listen') ellipse(x + 11 * scale * facing, y + 8 * scale, 7 * scale, 3 * scale, 3, INK, 0, Math.PI);
  };

  const bust = (x, y, scale = 1, facing = 1) => {
    ellipse(x, y, 42 * scale, 52 * scale, 6);
    line(x - 34 * scale, y + 54 * scale, x - 88 * scale, y + 160 * scale, 7);
    line(x + 32 * scale, y + 54 * scale, x + 84 * scale, y + 160 * scale, 7);
    line(x - 92 * scale, y + 160 * scale, x + 92 * scale, y + 160 * scale, 7);
    line(x + 10 * scale * facing, y + 6 * scale, x + 26 * scale * facing, y + 9 * scale, 3);
  };

  const camera = (x, y, scale = 1) => {
    rect(x, y, 132 * scale, 74 * scale, 5);
    ellipse(x + 68 * scale, y + 36 * scale, 24 * scale, 24 * scale, 5);
    rect(x + 104 * scale, y + 18 * scale, 44 * scale, 30 * scale, 5);
    line(x + 26 * scale, y + 74 * scale, x + 6 * scale, y + 132 * scale, 5);
    line(x + 96 * scale, y + 74 * scale, x + 122 * scale, y + 132 * scale, 5);
  };

  const product = (x, y, w = 140, h = 190) => {
    rect(x, y, w, h, 7);
    line(x + 20, y + 52, x + w - 20, y + 52, 4, SOFT);
    line(x + 26, y + 96, x + w - 26, y + 96, 4, SOFT);
    ellipse(x + w / 2, y + h - 42, 30, 18, 4, SOFT);
  };

  const audienceRow = (x, y, count = 6, scale = 0.44) => {
    for (let i = 0; i < count; i += 1) {
      const px = x + i * 70 * scale;
      ellipse(px, y, 24 * scale, 30 * scale, 4);
      line(px - 20 * scale, y + 32 * scale, px - 42 * scale, y + 96 * scale, 5);
      line(px + 20 * scale, y + 32 * scale, px + 42 * scale, y + 96 * scale, 5);
      line(px - 44 * scale, y + 96 * scale, px + 44 * scale, y + 96 * scale, 5);
    }
  };

  const floor = () => {
    line(86, 456, 938, 456, 3, PALE);
    line(210, 456, 112, 530, 2, PALE);
    line(814, 456, 914, 530, 2, PALE);
  };

  const frame = () => {
    rect(36, 36, 952, 504, 4, PALE);
    line(70, 492, 954, 492, 3, PALE);
  };

  return { pixels, line, rect, ellipse, curve, person, bust, camera, product, audienceRow, floor, frame };
};

const scenes = {
  131: (c) => {
    c.frame();
    c.floor();
    c.bust(514, 214, 0.92, 1);
    c.rect(210, 154, 170, 222, 4, PALE);
    c.rect(646, 160, 168, 216, 4, PALE);
    c.line(154, 420, 872, 420, 3, SOFT);
  },
  132: (c) => {
    c.frame();
    c.floor();
    c.person(514, 158, 0.92, 1, 'neutral');
    c.line(324, 350, 702, 350, 5, SOFT);
    c.rect(372, 248, 74, 44, 5, SOFT);
    c.rect(580, 248, 74, 44, 5, SOFT);
  },
  133: (c) => {
    c.frame();
    c.floor();
    c.bust(512, 178, 1.02, 1);
    c.camera(138, 312, 0.82);
    c.rect(688, 168, 170, 210, 4, PALE);
    c.line(468, 408, 566, 408, 5, SOFT);
  },
  134: (c) => {
    c.frame();
    c.floor();
    c.bust(430, 186, 0.96, 1);
    c.camera(672, 314, 0.78);
    c.line(540, 164, 672, 148, 4, SOFT);
    c.line(542, 204, 676, 218, 4, SOFT);
    c.rect(168, 150, 124, 222, 4, PALE);
  },
  135: (c) => {
    c.frame();
    c.rect(156, 202, 712, 196, 5);
    c.line(220, 286, 382, 244, 8);
    c.line(382, 244, 514, 296, 8);
    c.line(514, 296, 690, 246, 8);
    c.line(690, 246, 816, 290, 8);
    c.ellipse(380, 244, 42, 22, 6);
    c.ellipse(690, 246, 42, 22, 6);
    c.curve([[318, 360], [428, 334], [574, 336], [704, 362]], 4, SOFT);
  },
  136: (c) => {
    c.frame();
    c.product(438, 142, 150, 210);
    c.ellipse(512, 410, 210, 38, 5, SOFT);
    c.line(256, 206, 394, 244, 4, PALE);
    c.line(768, 206, 630, 244, 4, PALE);
    c.line(308, 128, 416, 180, 4, PALE);
    c.line(716, 128, 608, 180, 4, PALE);
  },
  137: (c) => {
    c.frame();
    c.rect(286, 116, 452, 326, 7);
    c.rect(342, 170, 340, 96, 5, SOFT);
    c.line(366, 310, 658, 310, 5, SOFT);
    c.line(390, 354, 634, 354, 5, SOFT);
    c.ellipse(512, 214, 58, 28, 5);
    c.line(248, 456, 776, 456, 4, PALE);
  },
  138: (c) => {
    c.frame();
    c.rect(416, 192, 190, 132, 6);
    c.line(246, 288, 416, 238, 8);
    c.line(608, 238, 786, 288, 8);
    c.ellipse(416, 238, 34, 18, 5);
    c.ellipse(608, 238, 34, 18, 5);
    c.line(478, 368, 548, 368, 6, SOFT);
    c.line(548, 368, 524, 348, 6, SOFT);
    c.line(548, 368, 524, 388, 6, SOFT);
  },
  139: (c) => {
    c.frame();
    c.rect(150, 120, 724, 98, 5);
    c.person(512, 218, 0.54, 1, 'talk');
    c.audienceRow(230, 350, 9, 0.7);
    c.audienceRow(292, 432, 7, 0.56);
    c.line(148, 474, 876, 474, 4, PALE);
  },
  140: (c) => {
    c.frame();
    c.audienceRow(232, 196, 7, 0.92);
    c.audienceRow(272, 334, 6, 0.78);
    c.line(138, 438, 884, 438, 4, PALE);
    c.curve([[218, 126], [420, 86], [604, 86], [806, 126]], 4, SOFT);
  },
  141: (c) => {
    c.frame();
    c.rect(156, 102, 712, 210, 6);
    c.person(514, 286, 0.6, 1, 'talk');
    c.line(112, 438, 912, 438, 5, PALE);
    c.audienceRow(258, 452, 7, 0.56);
    c.rect(422, 350, 180, 48, 4, SOFT);
  },
  142: (c) => {
    c.frame();
    c.bust(162, 238, 0.98, 1);
    c.line(238, 296, 380, 242, 7);
    c.audienceRow(512, 220, 5, 0.78);
    c.audienceRow(552, 344, 4, 0.66);
    c.line(384, 438, 910, 438, 4, PALE);
  },
  143: (c) => {
    c.frame();
    c.rect(160, 122, 248, 250, 6);
    c.rect(620, 122, 248, 250, 6);
    c.line(152, 122, 230, 66, 5);
    c.line(876, 122, 796, 66, 5);
    c.person(496, 226, 0.56, 1, 'neutral');
    c.person(560, 236, 0.5, -1, 'talk');
    c.line(116, 440, 908, 440, 4, PALE);
  },
  144: (c) => {
    c.frame();
    c.rect(184, 118, 656, 300, 5);
    c.line(184, 210, 840, 210, 4, SOFT);
    c.line(360, 118, 360, 418, 4, SOFT);
    c.line(606, 118, 606, 418, 4, SOFT);
    c.ellipse(512, 274, 64, 42, 5);
    c.rect(420, 338, 182, 56, 5);
    c.line(742, 86, 804, 136, 5);
    c.line(804, 136, 760, 144, 5);
  },
  145: (c) => {
    c.frame();
    c.rect(146, 164, 732, 214, 5);
    c.person(268, 252, 0.42, 1, 'neutral');
    c.person(410, 232, 0.42, 1, 'neutral');
    c.person(562, 258, 0.42, -1, 'neutral');
    c.person(710, 236, 0.42, -1, 'neutral');
    c.line(208, 430, 816, 430, 4, PALE);
    c.curve([[206, 120], [338, 90], [474, 94], [614, 88], [792, 124]], 5, SOFT);
  },
  146: (c) => {
    c.frame();
    c.rect(242, 136, 540, 240, 7);
    c.line(308, 206, 716, 206, 7);
    c.line(334, 264, 690, 264, 6, SOFT);
    c.line(382, 318, 642, 318, 5, SOFT);
    c.line(242, 376, 178, 456, 6);
    c.line(782, 376, 846, 456, 6);
  },
  147: (c) => {
    c.frame();
    c.rect(214, 300, 596, 110, 6);
    c.person(344, 168, 0.58, 1, 'talk');
    c.person(670, 168, 0.58, -1, 'listen');
    c.line(418, 262, 586, 262, 6);
    c.rect(468, 218, 88, 50, 5, SOFT);
    c.line(184, 456, 840, 456, 4, PALE);
  },
  148: (c) => {
    c.frame();
    c.floor();
    c.person(304, 190, 0.62, 1, 'talk');
    c.person(438, 190, 0.62, -1, 'listen');
    c.person(616, 190, 0.62, 1, 'talk');
    c.person(748, 190, 0.62, -1, 'listen');
    c.rect(452, 350, 122, 50, 4, SOFT);
    c.curve([[192, 136], [340, 104], [514, 112], [824, 136]], 3, PALE);
  },
  149: (c) => {
    c.frame();
    c.audienceRow(246, 218, 7, 0.86);
    c.line(318, 178, 286, 128, 5);
    c.line(348, 178, 372, 124, 5);
    c.line(650, 178, 620, 126, 5);
    c.line(680, 178, 716, 126, 5);
    c.curve([[232, 112], [292, 86], [356, 110]], 4, SOFT);
    c.curve([[640, 112], [714, 82], [792, 116]], 4, SOFT);
    c.line(148, 440, 876, 440, 4, PALE);
  },
  150: (c) => {
    c.frame();
    c.rect(126, 120, 250, 142, 5);
    c.rect(386, 120, 250, 142, 5);
    c.rect(646, 120, 250, 142, 5);
    c.rect(252, 316, 250, 142, 5);
    c.rect(522, 316, 250, 142, 5);
    c.person(250, 150, 0.28, 1, 'neutral');
    c.product(456, 148, 80, 92);
    c.audienceRow(724, 192, 4, 0.44);
    c.camera(304, 352, 0.44);
    c.person(646, 346, 0.36, -1, 'talk');
    c.curve([[384, 292], [448, 274], [514, 292], [578, 274], [644, 292]], 5, SOFT);
  },
};

for (const [id, draw] of Object.entries(scenes)) {
  const c = canvas();
  draw(c);
  writeFileSync(`public/shot_${id}.png`, png(c.pixels));
}

console.log(`Generated ${Object.keys(scenes).length} practical storyboard PNGs.`);
