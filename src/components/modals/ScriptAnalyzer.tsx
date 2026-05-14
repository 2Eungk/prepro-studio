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

export default function ScriptAnalyzer({ onExtract, onClose }: ScriptAnalyzerProps) {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyze = () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const extractedScenes: ParsedScriptScene[] = [];
      const lines = script.split('\n');
      let currentScene: ParsedScriptScene | null = null;

      lines.forEach((line) => {
        const sceneMatch = line.match(/S#\s*(\d+)\.?\s*([^(]+)(?:\(([^)]+)\))?/);
        if (sceneMatch) {
          if (currentScene) extractedScenes.push(currentScene);

          const loc = sceneMatch[2].trim();
          const dn = sceneMatch[3]?.toLowerCase();

          currentScene = {
            sceneNumber: `S#${sceneMatch[1]}`,
            location: loc,
            dayNight: dn?.includes('밤') ? 'NIGHT' : dn?.includes('저녁') || dn?.includes('해질') ? 'SUNSET' : 'DAY',
            description: '',
            cast: new Set(),
            estimatedMinutes: 60,
            intExt: loc.includes('마당') || loc.includes('공원') || loc.includes('길') ? 'EXT' : 'INT',
          };
        } else if (currentScene) {
          const trimmedLine = line.trim();
          const castMatch = line.match(/^([^:(\s]{1,10})\s*:/);
          if (castMatch) {
            currentScene.cast.add(castMatch[1].trim());
          } else if (/소품|들고|꺼내|시계|휴대폰|가방|컵|잔|문서|편지|담배|라이터|우산/.test(trimmedLine)) {
            currentScene.props = [currentScene.props, trimmedLine].filter(Boolean).join(' / ');
          } else if (/의상|입고|코트|셔츠|교복|정장|드레스|신발|모자|가디건|외투/.test(trimmedLine)) {
            currentScene.costume = [currentScene.costume, trimmedLine].filter(Boolean).join(' / ');
          } else if (/소리|음악|진동|벨소리|노크|발소리|차소리|사이렌|M\.?O\.?S|무음/.test(trimmedLine)) {
            currentScene.soundNote = [currentScene.soundNote, trimmedLine].filter(Boolean).join(' / ');
          } else if (/카메라|트래킹|패닝|틸트|핸드헬드|줌|슬로우|VFX|CG|특수|드론/.test(trimmedLine)) {
            currentScene.specialInstruction = [currentScene.specialInstruction, trimmedLine].filter(Boolean).join(' / ');
          } else if (/인서트|클로즈업|ECU|CU|손|눈|시계|문고리|발/.test(trimmedLine)) {
            currentScene.insertNote = [currentScene.insertNote, trimmedLine].filter(Boolean).join(' / ');
          } else if (trimmedLine && !line.includes(':') && line.length > 5) {
            currentScene.description += `${trimmedLine} `;
          }
        }
      });

      if (currentScene) extractedScenes.push(currentScene);

      const finalScenes: AnalyzedScene[] = extractedScenes.map((scene) => ({
        ...scene,
        cast: Array.from(scene.cast).join(', '),
        description: scene.description.substring(0, 80).trim() + (scene.description.length > 80 ? '...' : ''),
      }));

      onExtract(finalScenes);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setScript(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleFileUpload(file);
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
            accept=".txt,.json"
            onChange={(event) => event.target.files?.[0] && handleFileUpload(event.target.files[0])}
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
