import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const dbPath = path.join(rootDir, 'src/data/storyboardDb.ts');
const publicDir = path.join(rootDir, 'public');
const expectedRatio = 16 / 9;
const curatedRangeStart = 111;
const curatedRangeEnd = 222;
const minCuratedBytes = 50 * 1024;
const anglePackStart = 211;
const anglePackEnd = 222;
const minAnglePackBytes = 80 * 1024;
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const dbSource = fs.readFileSync(dbPath, 'utf8');
const urls = [...dbSource.matchAll(/url: '([^']+)'/g)].map((match) => match[1]);
const expectedCount = 222;
const duplicateUrls = urls.filter((url, index) => urls.indexOf(url) !== index);
const missing = [];
const badFormat = [];
const badRatio = [];
const badNames = [];
const lowDetail = [];

urls.forEach((url, index) => {
  const expectedName = `/shot_${String(index + 1).padStart(2, '0')}.png`;
  if (url !== expectedName) {
    badNames.push({ index: index + 1, expected: expectedName, actual: url });
  }

  const filePath = path.join(publicDir, url.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) {
    missing.push(url);
    return;
  }

  const bytes = fs.readFileSync(filePath);
  const isPng = bytes.subarray(0, 8).equals(pngSignature);
  if (!isPng) {
    badFormat.push(url);
    return;
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const ratio = width / height;
  if (Math.abs(ratio - expectedRatio) > 0.01) {
    badRatio.push({ url, width, height });
  }

  const shotNumber = index + 1;
  if (shotNumber >= curatedRangeStart && shotNumber <= curatedRangeEnd && bytes.length < minCuratedBytes) {
    lowDetail.push({ url, bytes: bytes.length, minBytes: minCuratedBytes });
  }

  if (shotNumber >= anglePackStart && shotNumber <= anglePackEnd && bytes.length < minAnglePackBytes) {
    lowDetail.push({ url, bytes: bytes.length, minBytes: minAnglePackBytes });
  }
});

const report = {
  count: urls.length,
  unique: new Set(urls).size,
  missing,
  duplicateUrls,
  badNames,
  badFormat,
  badRatio,
  lowDetail,
};

const hasErrors =
  report.count !== expectedCount ||
  report.unique !== expectedCount ||
  missing.length > 0 ||
  duplicateUrls.length > 0 ||
  badNames.length > 0 ||
  badFormat.length > 0 ||
  badRatio.length > 0 ||
  lowDetail.length > 0;

if (hasErrors) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(
  `Storyboard assets OK: ${expectedCount} PNG files, unique DB URLs, sequential names, ` +
    `16:9 ratio, curated shots ${curatedRangeStart}-${curatedRangeEnd} >= ${Math.round(minCuratedBytes / 1024)}KB, ` +
    `angle pack ${anglePackStart}-${anglePackEnd} >= ${Math.round(minAnglePackBytes / 1024)}KB.`,
);
