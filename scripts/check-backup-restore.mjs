import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');

const page = read('src/app/page.tsx');
const appHeader = read('src/components/header/AppHeader.tsx');
const store = read('src/store/scheduleStore.ts');

const projectSnapshotStart = page.indexOf('type ProjectSnapshot = Pick<');
const projectSnapshotEnd = page.indexOf('>;', projectSnapshotStart);
const projectSnapshot = projectSnapshotStart >= 0 && projectSnapshotEnd > projectSnapshotStart
  ? page.slice(projectSnapshotStart, projectSnapshotEnd)
  : '';

const createSnapshotStart = page.indexOf('const createProjectSnapshot = (): ProjectSnapshot => {');
const createSnapshotEnd = page.indexOf('const handleCopyShareLink = async () => {', createSnapshotStart);
const createSnapshot = createSnapshotStart >= 0 && createSnapshotEnd > createSnapshotStart
  ? page.slice(createSnapshotStart, createSnapshotEnd)
  : '';

const exportStart = page.indexOf('const handleExportJSON = () => {');
const exportEnd = page.indexOf('const createProjectSnapshot = (): ProjectSnapshot => {', exportStart);
const exportJson = exportStart >= 0 && exportEnd > exportStart
  ? page.slice(exportStart, exportEnd)
  : '';

const importStart = page.indexOf('const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {');
const importEnd = page.indexOf('useEffect(() => {', importStart);
const importJson = importStart >= 0 && importEnd > importStart
  ? page.slice(importStart, importEnd)
  : '';

const readImportedStart = page.indexOf('const readImportedProject = (value: unknown)');
const readImportedEnd = page.indexOf('const encodeShareSnapshot =', readImportedStart);
const readImported = readImportedStart >= 0 && readImportedEnd > readImportedStart
  ? page.slice(readImportedStart, readImportedEnd)
  : '';

const requiredSnapshotFields = [
  'template',
  'shootingDate',
  'location',
  'weatherLabel',
  'weatherLatitude',
  'weatherLongitude',
  'callTime',
  'shootingStartTime',
  'days',
  'locations',
  'people',
  'breaks',
  'scenes',
  'timelineOrder',
  'planning',
];

const checks = [
  {
    name: 'JSON backup exports a versioned PrePro envelope instead of the live Zustand object',
    ok: page.includes("type ProjectBackupFile = {")
      && exportJson.includes("schema: 'prepro-studio-backup'")
      && exportJson.includes('version: 1')
      && exportJson.includes('exportedAt: new Date().toISOString()')
      && exportJson.includes('project: createProjectSnapshot()')
      && exportJson.includes('meta:')
      && exportJson.includes('isSampleProject: Boolean(sampleProjectNotice)')
      && exportJson.includes('sampleProjectNotice')
      && !exportJson.includes('useScheduleStore.getState()'),
  },
  {
    name: 'snapshot contract includes operational blocks, storyboard/report scene data, planning, weather, and ordering',
    ok: requiredSnapshotFields.every((field) => projectSnapshot.includes(`'${field}'`))
      && createSnapshot.includes('weatherLabel: state.weatherLabel')
      && createSnapshot.includes('weatherLatitude: state.weatherLatitude')
      && createSnapshot.includes('weatherLongitude: state.weatherLongitude')
      && createSnapshot.includes('breaks: state.breaks')
      && createSnapshot.includes('scenes: state.scenes')
      && createSnapshot.includes('timelineOrder: state.timelineOrder')
      && createSnapshot.includes('planning: state.planning'),
  },
  {
    name: 'import understands new backup envelopes, older raw project JSON, and persisted Zustand state blobs',
    ok: readImported.includes("value.schema === 'prepro-studio-backup'")
      && readImported.includes('isRecord(value.project)')
      && readImported.includes('sampleProjectNotice')
      && readImported.includes('isRecord(value.state)')
      && readImported.includes('project: value.state as Partial<ScheduleState>')
      && readImported.includes('project: value as Partial<ScheduleState>'),
  },
  {
    name: 'restore keeps sample-project label when present and reports backup-specific errors',
    ok: importJson.includes('const imported = readImportedProject(json);')
      && importJson.includes('importData(imported.project);')
      && importJson.includes("setSampleProjectNotice(imported.sampleProjectNotice || '')")
      && importJson.includes("setFileStatus(imported.sampleProjectNotice ? '샘플 백업 복원됨' : '백업 복원됨')")
      && importJson.includes("setFileStatus('복원 실패 · JSON 백업 파일을 확인하세요')"),
  },
  {
    name: 'header labels JSON import as backup restore rather than a vague project-file import',
    ok: appHeader.includes('PrePro Studio JSON 백업 복원')
      && appHeader.includes("'백업 복원'")
      && appHeader.includes('백업에서 복원')
      && !appHeader.includes('프로젝트 파일 가져오기')
      && !appHeader.includes("'파일 가져오기'"),
  },
  {
    name: 'store migration still restores dates, breaks, scenes, timeline order, and legacy storyboard refs',
    ok: store.includes('const migrateProjectData = (data: Partial<ScheduleState>) =>')
      && store.includes('parsedData.callTime = new Date(parsedData.callTime)')
      && store.includes('parsedData.shootingStartTime = new Date(parsedData.shootingStartTime)')
      && store.includes('startTime: item.startTime ? new Date(item.startTime) : undefined')
      && store.includes('endTime: item.endTime ? new Date(item.endTime) : undefined')
      && store.includes('const timelineOrder = reconcileTimelineOrder(scenes, breaks, parsedData.timelineOrder)')
      && store.includes('nextScene.visualRef = normalizeVisualRef(nextScene.visualRef)'),
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error('Backup/restore checks failed:');
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log(`Backup/restore checks passed (${checks.length})`);
