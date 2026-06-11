import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const expectedRatio = 16 / 9;
const minOriginalBytes = 500 * 1024;
const monochromeSampleWidth = 64;
const monochromeSampleHeight = 36;
const maxMonochromeAverageDelta = 8;
const maxMonochromeHighDeltaRatio = 0.03;
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const fail = (report) => {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
};

const candidatePath = process.argv[2];

if (!candidatePath) {
  fail({
    error: 'Missing candidate path',
    usage: 'npm run check:storyboard-candidate -- /absolute/path/to/generated.png',
  });
}

const resolvedPath = path.resolve(candidatePath);

if (!fs.existsSync(resolvedPath)) {
  fail({ error: 'Candidate does not exist', file: resolvedPath });
}

const getMonochromeStats = async (imagePath) => {
  const { data, info } = await sharp(imagePath)
    .resize(monochromeSampleWidth, monochromeSampleHeight, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let totalDelta = 0;
  let highDeltaPixels = 0;
  const pixelCount = data.length / info.channels;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1] ?? red;
    const blue = data[offset + 2] ?? red;
    const channelDelta = (Math.abs(red - green) + Math.abs(green - blue) + Math.abs(red - blue)) / 3;

    totalDelta += channelDelta;
    if (channelDelta > 18) {
      highDeltaPixels += 1;
    }
  }

  return {
    averageDelta: Number((totalDelta / pixelCount).toFixed(2)),
    highDeltaRatio: Number((highDeltaPixels / pixelCount).toFixed(4)),
  };
};

const bytes = fs.readFileSync(resolvedPath);
const metadata = await sharp(resolvedPath).metadata();
const monochromeStats = await getMonochromeStats(resolvedPath);
const report = {
  file: resolvedPath,
  format: metadata.format,
  width: metadata.width,
  height: metadata.height,
  bytes: bytes.length,
  monochrome: monochromeStats,
  failures: [],
};

if (!bytes.subarray(0, 8).equals(pngSignature) || metadata.format !== 'png') {
  report.failures.push('not-png');
}

if (!metadata.width || !metadata.height || Math.abs(metadata.width / metadata.height - expectedRatio) > 0.01) {
  report.failures.push('not-16x9');
}

if (bytes.length < minOriginalBytes) {
  report.failures.push('low-detail-file-size');
}

if (
  monochromeStats.averageDelta > maxMonochromeAverageDelta ||
  monochromeStats.highDeltaRatio > maxMonochromeHighDeltaRatio
) {
  report.failures.push('not-monochrome-storyboard');
}

if (report.failures.length > 0) {
  fail(report);
}

console.log(
  `Storyboard candidate OK: ${path.basename(resolvedPath)} ` +
    `${metadata.width}x${metadata.height}, ${Math.round(bytes.length / 1024)}KB, ` +
    `monochrome avg ${monochromeStats.averageDelta}, high ${monochromeStats.highDeltaRatio}.`,
);
