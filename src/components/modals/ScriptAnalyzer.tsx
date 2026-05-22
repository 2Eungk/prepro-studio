'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Brain, Sparkles, Upload, XCircle } from 'lucide-react';
import type { Scene } from '@/types/schedule';

export type AnalyzedScene = Omit<Scene, 'id' | 'startTime' | 'endTime'>;

type ParsedScriptScene = Omit<AnalyzedScene, 'cast'> & {
  cast: Set<string>;
  sceneNumber: string;
  location: string;
  description: string;
  estimatedMinutes: number;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
};

type ScriptAnalyzerProps = {
  onExtract: (scenes: AnalyzedScene[]) => void;
  onClose: () => void;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
};

const exteriorLocationPattern = /마당|공원|길|거리|골목|옥상|루프탑|한강|해변|산|도로|주차장|운동장|광장|출구|역/;
const dayNightPattern = /오전|아침|낮|점심|오후|저녁|해질|노을|밤|새벽|day|night|sunset|dawn/i;
const transitionPattern = /^(암전|컷 투|cut to|fade|dissolve|black|title)/i;
const shotListHeaderPattern = /S#\s+Shot\s+Shot Type|Shot Type\s+Description|EST\.?\s*Time\s+Equipment/i;
const shotRowPattern = /^(?:(\d{1,3})\s+)?(\d{1,3}[A-Z])\s+((?:EWS|VWS|WS|MLS|FS|MS|MCU|CU|ECU|BCU|CS|OTS|POV|INSERT|MACRO)[^가-힣]{0,80}?(?:eye level|high angle|low angle|bird'?s eye view|angle|level|view|static|tracking|zoom|pan|tilt|hand-?held)?)(?:\s{2,}(.+))?$/i;

const shotTypeMinutes = (shotType: string) => {
  const normalized = shotType.toUpperCase();
  if (/TRACK|DOLLY|PAN|TILT|HAND|ZOOM/.test(normalized)) return 12;
  if (/EWS|VWS|WS|MLS|FS/.test(normalized)) return 12;
  if (/MS|MCU/.test(normalized)) return 10;
  if (/CU|ECU|BCU|CS|INSERT|MACRO/.test(normalized)) return 8;
  return 10;
};

const getDayNight = (text = ''): NonNullable<Scene['dayNight']> => {
  const normalized = text.toLowerCase();
  if (/밤|새벽|night|dawn/.test(normalized)) return 'NIGHT';
  if (/저녁|해질|노을|sunset/.test(normalized)) return 'SUNSET';
  return 'DAY';
};

const getIntExt = (prefix: string, location: string): NonNullable<Scene['intExt']> => {
  if (/외부|ext/i.test(prefix)) return 'EXT';
  if (/내부|int/i.test(prefix)) return 'INT';
  return exteriorLocationPattern.test(location) ? 'EXT' : 'INT';
};

const cleanSceneLocation = (value: string) => (
  value
    .replace(/^[.:\-\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
);

const parseSceneHeading = (line: string, fallbackIndex: number) => {
  const trimmedLine = line.trim();
  const numberedMatch = trimmedLine.match(/^(?:S|씬|scene)\s*#?\s*(\d+)\.?\s*([^(\n-]+)(?:\(([^)]+)\))?/i);
  if (numberedMatch) {
    const location = cleanSceneLocation(numberedMatch[2]);
    return {
      sceneNumber: `S#${numberedMatch[1]}`,
      location: location || '장소 미정',
      dayNight: getDayNight(numberedMatch[3] || location),
      intExt: getIntExt('', location),
    };
  }

  const slugMatch = trimmedLine.match(/^(내부|외부|INT\.?|EXT\.?)\s*[.:\-]?\s*(.+)$/i);
  if (slugMatch) {
    const prefix = slugMatch[1];
    const rest = slugMatch[2].trim();
    const [rawLocation, ...timeParts] = rest.split(/\s[-–—]\s| - | – | — /);
    const timeText = timeParts.join(' ');
    const location = cleanSceneLocation(rawLocation.replace(/\([^)]*\)/g, ''));
    const dayNightText = timeText || rawLocation.match(/\(([^)]+)\)/)?.[1] || rest.match(dayNightPattern)?.[0] || '';

    return {
      sceneNumber: `S#${fallbackIndex}`,
      location: location || '장소 미정',
      dayNight: getDayNight(dayNightText),
      intExt: getIntExt(prefix, location),
    };
  }

  return null;
};

const createEmptyScene = (
  sceneNumber: string,
  location: string,
  intExt: NonNullable<Scene['intExt']>,
  dayNight: NonNullable<Scene['dayNight']>,
): ParsedScriptScene => ({
  sceneNumber,
  location,
  dayNight,
  description: '',
  cast: new Set(),
  estimatedMinutes: 60,
  intExt,
});

const appendLineToScene = (scene: ParsedScriptScene, line: string) => {
  const trimmedLine = line.trim();
  if (!trimmedLine || transitionPattern.test(trimmedLine)) return;

  const castMatch = trimmedLine.match(/^([^:(\s]{1,10})\s*:/);
  if (castMatch) {
    scene.cast.add(castMatch[1].trim());
    scene.description += `${trimmedLine} `;
  } else if (/소품|들고|꺼내|시계|휴대폰|가방|컵|잔|문서|편지|담배|라이터|우산|망치|프린터/.test(trimmedLine)) {
    scene.props = [scene.props, trimmedLine].filter(Boolean).join(' / ');
    scene.description += `${trimmedLine} `;
  } else if (/의상|입고|코트|셔츠|교복|정장|드레스|신발|모자|가디건|외투/.test(trimmedLine)) {
    scene.costume = [scene.costume, trimmedLine].filter(Boolean).join(' / ');
    scene.description += `${trimmedLine} `;
  } else if (/소리|음악|진동|벨소리|노크|발소리|차소리|사이렌|M\.?O\.?S|무음|나레이션|보이스오버/.test(trimmedLine)) {
    scene.soundNote = [scene.soundNote, trimmedLine].filter(Boolean).join(' / ');
    scene.description += `${trimmedLine} `;
  } else if (/카메라|트래킹|패닝|틸트|핸드헬드|줌|슬로우|VFX|CG|특수|드론/.test(trimmedLine)) {
    scene.specialInstruction = [scene.specialInstruction, trimmedLine].filter(Boolean).join(' / ');
    scene.description += `${trimmedLine} `;
  } else if (/인서트|클로즈업|ECU|CU|손|눈|시계|문고리|발|얼굴/.test(trimmedLine)) {
    scene.insertNote = [scene.insertNote, trimmedLine].filter(Boolean).join(' / ');
    scene.description += `${trimmedLine} `;
  } else if (!trimmedLine.includes(':') && trimmedLine.length > 1) {
    scene.description += `${trimmedLine} `;
  }
};

const cleanShotListNoise = (value: string) => (
  value
    .replace(/S#\s+Shot\s+Shot Type\s+Description\s+Character\s+Location\s+EST\.?\s*Time\s+Equipment\s+Day\s+Notes/gi, '')
    .replace(/\b(?:Morning|Afternoon|Night)\s*\(\d{1,2}:\s*\d{2}\s*(?:am|pm)?\s*start\s*-\s*\d{1,2}:\s*\d{2}\s*(?:am|pm)?\s*end\)/gi, '')
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '')
    .replace(/\b(?:Morning|Afternoon|Night|Credits|Shoot before destroying the printer)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
);

const inferShotLocation = (text: string, fallback = '장소 미정') => {
  const normalized = text.replace(/\s+/g, ' ');
  const locationPatterns: Array<[RegExp, string]> = [
    [/Apartment\s+Living\s+Room/i, '아파트 거실'],
    [/Apartment\s+Bedroom/i, '아파트 침실'],
    [/Apartment\s+Entrance/i, '집 현관'],
    [/Apartment\s+Building/i, '아파트 건물'],
    [/School\s+Corridor|School\s+Hallway/i, '학교 복도'],
    [/School\s+Classroom|Classroom/i, '학교 교실'],
    [/Traditional\s+Market|Market/i, '전통시장'],
    [/Train\s+Station|Station/i, '기차역'],
    [/Train/i, '기차 안'],
    [/Convenience\s+Store/i, '편의점'],
    [/Alley/i, '골목'],
    [/Bridge/i, '다리'],
    [/Streets?|Road/i, '거리'],
  ];
  return locationPatterns.find(([pattern]) => pattern.test(normalized))?.[1] || fallback;
};

const inferShotDayNight = (text: string): NonNullable<Scene['dayNight']> => {
  if (/Night|밤|새벽|1:\s*\d{2}/i.test(text)) return 'NIGHT';
  if (/Afternoon|오후|Sunset|노을/i.test(text)) return 'SUNSET';
  return 'DAY';
};

const parseShotListText = (sourceText: string): AnalyzedScene[] => {
  if (!shotListHeaderPattern.test(sourceText)) return [];

  const lines = sourceText
    .split('\n')
    .map((line) => cleanShotListNoise(line))
    .filter(Boolean);
  const shots: Array<{
    sceneNumber?: string;
    shotCode: string;
    shotType: string;
    descriptionLines: string[];
    location: string;
    dayNight: NonNullable<Scene['dayNight']>;
  }> = [];
  let current: (typeof shots)[number] | null = null;
  let pendingLeadLines: string[] = [];
  let lastSceneNumber = '1';
  let lastLocation = '장소 미정';

  const pushCurrent = () => {
    if (!current) return;
    const description = cleanShotListNoise(current.descriptionLines.join(' '));
    if (description || current.location !== '장소 미정') shots.push({ ...current, descriptionLines: [description] });
  };

  lines.forEach((line) => {
    if (shotListHeaderPattern.test(line)) return;
    const rowMatch = line.match(shotRowPattern);

    if (rowMatch) {
      pushCurrent();
      const [, sceneNumber, shotCode, shotType, tail = ''] = rowMatch;
      if (sceneNumber) lastSceneNumber = sceneNumber;
      const rowSeed = `${tail} ${pendingLeadLines.join(' ')}`;
      const inferredLocation = inferShotLocation(rowSeed, lastLocation);
      if (inferredLocation !== '장소 미정') lastLocation = inferredLocation;

      current = {
        sceneNumber: sceneNumber || lastSceneNumber,
        shotCode,
        shotType: shotType.trim(),
        descriptionLines: [...pendingLeadLines, tail],
        location: inferredLocation,
        dayNight: inferShotDayNight(rowSeed),
      };
      pendingLeadLines = [];
      return;
    }

    if (current) {
      const nextLocation = inferShotLocation(line, current.location);
      current.location = nextLocation;
      if (nextLocation !== '장소 미정') lastLocation = nextLocation;
      current.dayNight = inferShotDayNight(`${current.dayNight} ${line}`);
      current.descriptionLines.push(line);
    } else if (!/^\d+$/.test(line)) {
      pendingLeadLines.push(line);
    }
  });

  pushCurrent();

  return shots.slice(0, 160).map((shot, index) => {
    const description = cleanShotListNoise(shot.descriptionLines.join(' '));
    const shotLabel = shot.sceneNumber ? `S#${shot.sceneNumber} / ${shot.shotCode}` : shot.shotCode;

    return {
      dayId: undefined,
      location: shot.location,
      description: description || `${shot.shotCode} ${shot.shotType}`,
      estimatedMinutes: shotTypeMinutes(shot.shotType),
      sceneNumber: shotLabel,
      intExt: getIntExt('', shot.location),
      dayNight: shot.dayNight,
      cast: /Kairos|카이로스/i.test(description) || /Kairos/i.test(shot.location) ? 'Kairos Anderson' : '',
      cutCount: 1,
      pageCount: undefined,
      props: /printer|manual|sheet|watch|phone|milk|banana|coke|apple|hammer|origami/i.test(description) ? description.substring(0, 120) : undefined,
      cameraGear: shot.shotType,
      shotSize: shot.shotType.split(',')[0]?.trim().toUpperCase(),
      specialInstruction: shot.shotType,
      clientMemo: `샷리스트 PDF ${index + 1}번째 컷`,
      visualRef: undefined,
    };
  });
};

const extractTextFromPdf = async (file: File) => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lineBuckets: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];
    textContent.items.forEach((item) => {
      const pdfItem = item as PdfTextItem;
      const str = (pdfItem.str || '').trim();
      const transform = pdfItem.transform || [];
      if (!str) return;
      const x = Number(transform[4] || 0);
      const y = Number(transform[5] || 0);
      const line = lineBuckets.find((bucket) => Math.abs(bucket.y - y) < 3);
      if (line) {
        line.items.push({ x, str });
      } else {
        lineBuckets.push({ y, items: [{ x, str }] });
      }
    });

    const pageText = lineBuckets
      .sort((a, b) => b.y - a.y)
      .map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.str).join('  '))
      .join('\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join('\n\n');
};

export default function ScriptAnalyzer({ onExtract, onClose }: ScriptAnalyzerProps) {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileStatus, setFileStatus] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyze = () => {
    const sourceText = script.trim();
    if (!sourceText) {
      setAnalysisStatus('분석할 대본을 먼저 붙여넣거나 파일을 불러오세요.');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStatus('');

    setTimeout(() => {
      const shotListScenes = parseShotListText(sourceText);
      if (shotListScenes.length > 0) {
        onExtract(shotListScenes);
        setIsAnalyzing(false);
        onClose();
        return;
      }

      const extractedScenes: ParsedScriptScene[] = [];
      const lines = sourceText.split('\n');
      let currentScene: ParsedScriptScene | null = null;
      let pendingLinesBeforeFirstHeading: string[] = [];

      lines.forEach((line) => {
        const sceneHeading = parseSceneHeading(line, extractedScenes.length + (currentScene ? 2 : 1));
        if (sceneHeading) {
          if (currentScene) extractedScenes.push(currentScene);
          currentScene = createEmptyScene(sceneHeading.sceneNumber, sceneHeading.location, sceneHeading.intExt, sceneHeading.dayNight);
          pendingLinesBeforeFirstHeading.forEach((pendingLine) => appendLineToScene(currentScene as ParsedScriptScene, pendingLine));
          pendingLinesBeforeFirstHeading = [];
        } else {
          if (currentScene) {
            appendLineToScene(currentScene, line);
          } else if (line.trim()) {
            pendingLinesBeforeFirstHeading.push(line);
          }
        }
      });

      if (currentScene) extractedScenes.push(currentScene);
      if (!currentScene && pendingLinesBeforeFirstHeading.length > 0) {
        const fallbackScene = createEmptyScene('S#1', '장소 미정', 'INT', 'DAY');
        pendingLinesBeforeFirstHeading.forEach((line) => appendLineToScene(fallbackScene, line));
        extractedScenes.push(fallbackScene);
      }

      const finalScenes: AnalyzedScene[] = extractedScenes.map((scene) => ({
        ...scene,
        cast: Array.from(scene.cast).join(', '),
        description: (scene.description.trim() || scene.location).substring(0, 80).trim() + (scene.description.length > 80 ? '...' : ''),
      })).filter((scene) => scene.description.trim() || scene.location !== '장소 미정');

      if (finalScenes.length === 0) {
        setAnalysisStatus('씬을 찾지 못했습니다. 내부/외부, S#1, 장소명 같은 단서를 조금 넣어주세요.');
        setIsAnalyzing(false);
        return;
      }

      onExtract(finalScenes);
      setIsAnalyzing(false);
      onClose();
    }, 1200);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setFileStatus(`${file.name} 읽는 중...`);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
          setFileStatus('PDF에서 텍스트를 찾지 못했습니다. 스캔본이면 텍스트 PDF로 변환이 필요합니다.');
          return;
        }
        setScript(text);
        setFileStatus(`PDF ${text.length.toLocaleString()}자 불러옴`);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => setFileStatus('파일을 읽지 못했습니다.');
      reader.onload = (event) => {
        setScript(String(event.target?.result || ''));
        setFileStatus(`${file.name} 불러옴`);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Script file import failed:', error);
      setFileStatus('파일을 읽지 못했습니다. PDF가 잠겨 있거나 손상됐을 수 있습니다.');
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void handleFileUpload(file);
  };

  return (
    <div className="bg-neutral-900 border border-indigo-500/30 rounded-2xl p-8 mb-10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-100">
            <Brain className="w-6 h-6 text-indigo-400" /> 시나리오 AI 분석기
          </h3>
          <p className="text-sm text-neutral-500 mt-1">대본 텍스트와 PDF/TXT 대본, 구글시트형 샷리스트 PDF를 촬영표 초안으로 변환합니다. API 없이 로컬에서 분석합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.json,.pdf,application/pdf"
            onChange={(event) => {
              if (event.target.files?.[0]) void handleFileUpload(event.target.files[0]);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-neutral-700"
          >
            <Upload className="w-3.5 h-3.5" /> PDF/TXT 불러오기
          </button>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>

      {(fileStatus || analysisStatus) && (
        <div className="mb-4 rounded-xl border border-teal-400/20 bg-teal-400/10 px-4 py-3 text-xs font-bold text-teal-100">
          {analysisStatus || fileStatus}
        </div>
      )}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="relative group"
      >
        <textarea
          placeholder={`여기에 시나리오나 샷리스트를 붙여넣으세요.

예:
내부. 아파트 침실 - 오전 8:13
햇빛이 창문을 통해 들어온다.
카이로스: 매뉴얼은 없다.

또는 S# / Shot / Shot Type / Description 컬럼이 있는 샷리스트 PDF도 인식합니다.`}
          className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono mb-4 custom-scrollbar group-hover:border-neutral-700"
          value={script}
          onChange={(event) => {
            setScript(event.target.value);
            if (analysisStatus) setAnalysisStatus('');
          }}
        />
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/0 rounded-xl pointer-events-none group-hover:border-indigo-500/20 transition-all" />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={analyze}
          disabled={isAnalyzing || !script.trim()}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              촬영표 초안 생성 중...
            </>
          ) : !script.trim() ? (
            <>
              <Sparkles className="w-4 h-4" /> 대본/샷리스트 입력 필요
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> 촬영표 초안 생성
            </>
          )}
        </button>
      </div>
    </div>
  );
}
