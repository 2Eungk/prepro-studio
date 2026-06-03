import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');

const diagram = read('src/components/workspaces/DiagramWorkspace.tsx');
const packageJson = read('package.json');

const checks = [
  {
    name: 'diagram workspace keeps scene-specific saved layouts separate from template scratch positions',
    ok: diagram.includes('savedLayoutsByScene')
      && diagram.includes('currentSceneSavedLayout')
      && diagram.includes('sceneLayoutKey')
      && diagram.includes('selectedScene?.id'),
  },
  {
    name: 'diagram workspace has explicit save and load actions for the selected scene',
    ok: diagram.includes('saveCurrentLayoutToScene')
      && diagram.includes('loadSavedSceneLayout')
      && diagram.includes('현재 배치 씬에 저장')
      && diagram.includes('저장 배치 불러오기'),
  },
  {
    name: 'saved scene layouts include template id, item positions, timestamp, and scene label for field trust',
    ok: diagram.includes('DiagramSceneLayout')
      && diagram.includes('templateId')
      && diagram.includes('positions')
      && diagram.includes('savedAt')
      && diagram.includes('sceneLabel'),
  },
  {
    name: 'diagram export and preview surface saved-scene state to avoid sending the wrong setup',
    ok: diagram.includes('sceneLayoutStatus')
      && diagram.includes('저장됨')
      && diagram.includes('아직 저장 안 됨')
      && diagram.includes('저장한 배치'),
  },
  {
    name: 'diagram workspace smoke check is wired into release check',
    ok: packageJson.includes('"check:diagram-workspace": "node scripts/check-diagram-workspace.mjs"')
      && packageJson.includes('npm run check:diagram-workspace'),
  },
];

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error('Diagram workspace checks failed:');
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log(`Diagram workspace checks passed (${checks.length})`);
