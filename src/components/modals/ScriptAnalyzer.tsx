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
};

const exteriorLocationPattern = /마당|공원|길|거리|골목|옥상|루프탑|한강|해변|산|도로|주차장|운동장|광장|출구|역/;
const dayNightPattern = /오전|아침|낮|점심|오후|저녁|해질|노을|밤|새벽|day|night|sunset|dawn/i;
const transitionPattern = /^(암전|컷 투|cut to|fade|dissolve|black|title)/i;

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

const extractTextFromPdf = async (file: File) => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? (item as PdfTextItem).str || '' : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
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
      const extractedScenes: ParsedScriptScene[] = [];
      const lines = sourceText.split('\n');
      let currentScene: ParsedScriptScene | null = null;

      lines.forEach((line) => {
        const sceneHeading = parseSceneHeading(line, extractedScenes.length + (currentScene ? 2 : 1));
        if (sceneHeading) {
          if (currentScene) extractedScenes.push(currentScene);
          currentScene = createEmptyScene(sceneHeading.sceneNumber, sceneHeading.location, sceneHeading.intExt, sceneHeading.dayNight);
        } else {
          currentScene ||= createEmptyScene('S#1', '장소 미정', 'INT', 'DAY');
          appendLineToScene(currentScene, line);
        }
      });

      if (currentScene) extractedScenes.push(currentScene);

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
          <p className="text-sm text-neutral-500 mt-1">텍스트를 붙여넣거나 시나리오 파일(.txt)을 업로드하세요.</p>
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
            <Upload className="w-3.5 h-3.5" /> 파일 불러오기
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
          placeholder="여기에 시나리오를 붙여넣으세요. 또는 파일을 이곳에 끌어다 놓으세요. (예: S#1. 거실 (낮) ...)"
          className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono mb-4 custom-scrollbar group-hover:border-neutral-700"
          value={script}
          onChange={(event) => setScript(event.target.value)}
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
              시나리오 분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> AI 분석 시작
            </>
          )}
        </button>
      </div>
    </div>
  );
}
