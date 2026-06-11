import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const packDir = path.join(rootDir, 'public/storyboard-generic-hq');
const indexPath = path.join(packDir, 'index.json');
const expectedRatio = 16 / 9;
const minOriginalBytes = 500 * 1024;
const maxThumbnailBytes = 90 * 1024;
const expectedThumbWidth = 480;
const expectedThumbHeight = 270;
const monochromeSampleWidth = 64;
const monochromeSampleHeight = 36;
const maxMonochromeAverageDelta = 8;
const maxMonochromeHighDeltaRatio = 0.03;
const allowedGenders = new Set(['neutral', 'mixed', 'male', 'female']);

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const fail = (report) => {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
};

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

if (!fs.existsSync(indexPath)) {
  fail({ missingIndex: indexPath });
}

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const originalFiles = fs
  .readdirSync(packDir)
  .filter((file) => /^generic_hq_\d{3}\.png$/.test(file))
  .sort();

const report = {
  count: index.length,
  originalCount: originalFiles.length,
  missingOriginals: [],
  missingThumbnails: [],
  duplicateFiles: [],
  badSequence: [],
  badMetadata: [],
  badOriginalFormat: [],
  badOriginalRatio: [],
  badMonochromeOriginals: [],
  lowDetailOriginals: [],
  badThumbnailFormat: [],
  largeThumbnails: [],
};

const seenFiles = new Set();
const seenThumbs = new Set();

for (const [indexNumber, item] of index.entries()) {
  const expectedFile = `generic_hq_${String(indexNumber + 1).padStart(3, '0')}.png`;
  const expectedThumbnail = `thumbs/${expectedFile.replace(/\.png$/, '.webp')}`;

  if (item.file !== expectedFile) {
    report.badSequence.push({ index: indexNumber + 1, expected: expectedFile, actual: item.file });
  }

  if (item.thumbnail !== expectedThumbnail) {
    report.badSequence.push({ index: indexNumber + 1, expected: expectedThumbnail, actual: item.thumbnail });
  }

  if (seenFiles.has(item.file)) {
    report.duplicateFiles.push(item.file);
  }
  seenFiles.add(item.file);

  if (seenThumbs.has(item.thumbnail)) {
    report.duplicateFiles.push(item.thumbnail);
  }
  seenThumbs.add(item.thumbnail);

  if (
    typeof item.title !== 'string' ||
    item.title.trim().length < 4 ||
    !allowedGenders.has(item.gender) ||
    !Array.isArray(item.tags) ||
    item.tags.length < 3 ||
    item.tags.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)
  ) {
    report.badMetadata.push(item);
  }

  const originalPath = path.join(packDir, item.file);
  if (!fs.existsSync(originalPath)) {
    report.missingOriginals.push(item.file);
  } else {
    const bytes = fs.readFileSync(originalPath);
    const isPng = bytes.subarray(0, 8).equals(pngSignature);
    if (!isPng) {
      report.badOriginalFormat.push(item.file);
    } else {
      const width = bytes.readUInt32BE(16);
      const height = bytes.readUInt32BE(20);
      const ratio = width / height;
      if (Math.abs(ratio - expectedRatio) > 0.01) {
        report.badOriginalRatio.push({ file: item.file, width, height });
      }
    }

    if (bytes.length < minOriginalBytes) {
      report.lowDetailOriginals.push({ file: item.file, bytes: bytes.length, minBytes: minOriginalBytes });
    }

    const monochromeStats = await getMonochromeStats(originalPath);
    if (
      monochromeStats.averageDelta > maxMonochromeAverageDelta ||
      monochromeStats.highDeltaRatio > maxMonochromeHighDeltaRatio
    ) {
      report.badMonochromeOriginals.push({
        file: item.file,
        ...monochromeStats,
        maxAverageDelta: maxMonochromeAverageDelta,
        maxHighDeltaRatio: maxMonochromeHighDeltaRatio,
      });
    }
  }

  const thumbnailPath = path.join(packDir, item.thumbnail);
  if (!fs.existsSync(thumbnailPath)) {
    report.missingThumbnails.push(item.thumbnail);
  } else {
    const metadata = await sharp(thumbnailPath).metadata();
    if (
      metadata.format !== 'webp' ||
      metadata.width !== expectedThumbWidth ||
      metadata.height !== expectedThumbHeight
    ) {
      report.badThumbnailFormat.push({
        file: item.thumbnail,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
      });
    }

    const thumbnailBytes = fs.statSync(thumbnailPath).size;
    if (thumbnailBytes > maxThumbnailBytes) {
      report.largeThumbnails.push({ file: item.thumbnail, bytes: thumbnailBytes, maxBytes: maxThumbnailBytes });
    }
  }
}

const hasErrors = Object.entries(report).some(([key, value]) => {
  if (key === 'count' || key === 'originalCount') {
    return false;
  }
  return Array.isArray(value) && value.length > 0;
});

if (report.count !== report.originalCount) {
  report.badSequence.push({ expectedCount: report.count, actualOriginals: report.originalCount });
}

if (hasErrors || report.count !== report.originalCount) {
  fail(report);
}

console.log(
  `Generic storyboard pack OK: ${report.count} PNG originals, ${report.count} WebP thumbnails, ` +
    `sequential metadata, 16:9 monochrome originals, ${expectedThumbWidth}x${expectedThumbHeight} thumbnails.`,
);
