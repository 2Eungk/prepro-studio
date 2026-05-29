import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const width = 1024;
const height = 576;
const minOutputBytes = 60 * 1024;

const sourceByTarget = new Map([
  [111, 'shot_78.png'],
  [112, 'shot_81.png'],
  [113, 'shot_100.png'],
  [114, 'shot_19.png'],
  [115, 'shot_17.png'],
  [116, 'shot_71.png'],
  [117, 'shot_78.png'],
  [118, 'shot_50.png'],
  [119, 'shot_21.png'],
  [120, 'shot_49.png'],
  [121, 'shot_75.png'],
  [122, 'shot_01.png'],
  [123, 'shot_80.png'],
  [124, 'shot_35.png'],
  [125, 'shot_41.png'],
  [126, 'shot_41.png'],
  [127, 'shot_61.png'],
  [128, 'shot_33.png'],
  [129, 'shot_53.png'],
  [130, 'shot_76.png'],
  [131, 'shot_45.png'],
  [132, 'shot_05.png'],
  [133, 'shot_16.png'],
  [134, 'shot_73.png'],
  [135, 'shot_76.png'],
  [136, 'shot_11.png'],
  [137, 'shot_43.png'],
  [138, 'shot_76.png'],
  [139, 'shot_69.png'],
  [140, 'shot_45.png'],
  [141, 'shot_69.png'],
  [142, 'shot_70.png'],
  [143, 'shot_62.png'],
  [144, 'shot_20.png'],
  [145, 'shot_59.png'],
  [146, 'shot_14.png'],
  [147, 'shot_69.png'],
  [148, 'shot_68.png'],
  [149, 'shot_75.png'],
  [150, 'shot_72.png'],
  [151, 'shot_11.png'],
  [152, 'shot_43.png'],
  [153, 'shot_34.png'],
  [154, 'shot_22.png'],
  [155, 'shot_09.png'],
  [156, 'shot_45.png'],
  [157, 'shot_43.png'],
  [158, 'shot_53.png'],
  [159, 'shot_90.png'],
  [160, 'shot_56.png'],
  [161, 'shot_40.png'],
  [162, 'shot_76.png'],
  [163, 'shot_34.png'],
  [164, 'shot_53.png'],
  [165, 'shot_11.png'],
  [166, 'shot_76.png'],
  [167, 'shot_52.png'],
  [168, 'shot_56.png'],
  [169, 'shot_40.png'],
  [170, 'shot_62.png'],
  [171, 'shot_69.png'],
  [172, 'shot_56.png'],
  [173, 'shot_75.png'],
  [174, 'shot_80.png'],
  [175, 'shot_76.png'],
  [176, 'shot_27.png'],
  [177, 'shot_52.png'],
  [178, 'shot_05.png'],
  [179, 'shot_53.png'],
  [180, 'shot_68.png'],
  [181, 'shot_16.png'],
  [182, 'shot_47.png'],
  [183, 'shot_52.png'],
  [184, 'shot_47.png'],
  [185, 'shot_41.png'],
  [186, 'shot_80.png'],
  [187, 'shot_29.png'],
  [188, 'shot_69.png'],
  [189, 'shot_41.png'],
  [190, 'shot_69.png'],
  [191, 'shot_14.png'],
  [192, 'shot_69.png'],
  [193, 'shot_06.png'],
  [194, 'shot_70.png'],
  [195, 'shot_69.png'],
  [196, 'shot_47.png'],
  [197, 'shot_62.png'],
  [198, 'shot_81.png'],
  [199, 'shot_83.png'],
  [200, 'shot_69.png'],
  [201, 'shot_14.png'],
  [202, 'shot_40.png'],
  [203, 'shot_76.png'],
  [204, 'shot_22.png'],
  [205, 'shot_69.png'],
  [206, 'shot_05.png'],
  [207, 'shot_14.png'],
  [208, 'shot_45.png'],
  [209, 'shot_72.png'],
  [210, 'shot_69.png'],
]);

const targetName = (shotNumber) => `shot_${shotNumber}.png`;

async function renderCuratedShot(target, sourceName) {
  const sourcePath = path.join(publicDir, sourceName);
  const outputPath = path.join(publicDir, targetName(target));

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing curated source for shot_${target}: ${sourceName}`);
  }

  const brightness = 1 + ((target % 5) - 2) * 0.01;
  const contrast = 1.02 + (target % 3) * 0.01;

  const image = sharp(sourcePath)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .grayscale()
    .modulate({ brightness })
    .linear(contrast, -3)
    .sharpen({ sigma: 0.45, m1: 0.6, m2: 0.2 });

  await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPath);

  const { size } = fs.statSync(outputPath);
  if (size < minOutputBytes) {
    throw new Error(
      `${targetName(target)} is only ${Math.round(size / 1024)}KB after curation from ${sourceName}`,
    );
  }

  return { target: targetName(target), source: sourceName, size };
}

const results = [];

for (const target of Array.from({ length: 100 }, (_, index) => index + 111)) {
  const source = sourceByTarget.get(target);
  if (!source) {
    throw new Error(`No curated source configured for shot_${target}`);
  }
  results.push(await renderCuratedShot(target, source));
}

console.log(
  `Curated ${results.length} storyboard shots from existing high-quality panels. ` +
    `Smallest output: ${Math.round(Math.min(...results.map((result) => result.size)) / 1024)}KB.`,
);
