'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { Scene } from '@/types/schedule';
import { format, addMinutes, subMinutes } from 'date-fns';
import { Plus, GripVertical, Clock, Film, MonitorPlay, Camera, Image as ImageIcon, Download, Cloud, Sun, Sunrise, Sunset, MapPin, Calendar as CalendarIcon, CheckCircle2, XCircle, Circle, FileText, Umbrella, Wind, Sparkles, Upload, Database, FileJson, Brain, Save, FolderOpen, Layout, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { storyboardDb, recommendShots } from '@/data/storyboardDb';
import AdBanner from '@/components/AdBanner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableRow = ({ scene, template, isReportMode }: { scene: Scene, template: string, isReportMode: boolean }) => {
  const { updateScene } = useScheduleStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const setStatus = (status: 'done' | 'ng' | 'pending') => {
    updateScene(scene.id, { status });
  };

  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-neutral-800 group hover:bg-neutral-800/30 transition-colors ${scene.status === 'done' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
      <td className="px-4 py-4 text-center">
        {isReportMode ? (
          <div className="flex flex-col gap-1 items-center">
            <button onClick={() => setStatus('done')} className={`p-1 rounded ${scene.status === 'done' ? 'text-green-500 bg-green-500/10' : 'text-neutral-600 hover:text-neutral-400'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={() => setStatus('ng')} className={`p-1 rounded ${scene.status === 'ng' ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-neutral-400'}`}>
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-700 rounded transition-colors inline-block">
            <GripVertical className="w-4 h-4 text-neutral-600" />
          </div>
        )}
      </td>
      <td className="px-4 py-4 font-mono text-cyan-400">
        {scene.startTime && format(scene.startTime, 'HH:mm')} - {scene.endTime && format(scene.endTime, 'HH:mm')}
      </td>

      {/* 템플릿별 동적 컬럼 렌더링 */}
      {template === 'film' && (
        <>
          <td className="px-4 py-4 font-medium">
            <div className="flex flex-col gap-1">
              <div>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-[10px] mr-2 text-neutral-300">{scene.sceneNumber || '-'}</span>
                <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wide">{scene.intExt} / {scene.dayNight}</span>
              </div>
              {scene.cast && <div className="text-[10px] text-indigo-400 font-bold mt-1">👤 {scene.cast}</div>}
              {(scene.cutCount || scene.pageCount) && (
                <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                  {scene.cutCount ? `${scene.cutCount}컷 ` : ''} 
                  {scene.pageCount ? `(${scene.pageCount}p)` : ''}
                </div>
              )}
            </div>
          </td>
          <td className="px-4 py-4 font-medium">
            {scene.visualRef ? (
              <img src={scene.visualRef} alt="Storyboard" className="w-16 h-10 object-cover bg-white rounded border border-neutral-700" />
            ) : (
              <div className="w-16 h-10 bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
                 <ImageIcon className="w-4 h-4 text-neutral-600" />
              </div>
            )}
          </td>
        </>
      )}
      {template === 'event' && (
        <td className="px-4 py-4 font-medium">
          <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-xs">
            {scene.eventSection || '공통'}
          </span>
        </td>
      )}
      {template === 'ad' && (
        <td className="px-4 py-4 font-medium">
          {scene.visualRef ? (
            <img src={scene.visualRef} alt="Storyboard" className="w-16 h-10 object-cover bg-white rounded border border-neutral-700" />
          ) : (
            <div className="w-16 h-10 bg-neutral-800 rounded flex items-center justify-center border border-neutral-700">
               <ImageIcon className="w-4 h-4 text-neutral-600" />
            </div>
          )}
          {scene.clientMemo && <div className="text-[10px] text-amber-500/80 mt-1 max-w-[120px] truncate" title={scene.clientMemo}>📝 {scene.clientMemo}</div>}
        </td>
      )}

      <td className="px-4 py-4 text-neutral-300">{scene.location}</td>
      <td className="px-4 py-4 text-neutral-400">
        <div className="text-sm">{scene.description}</div>
        {template === 'event' && scene.cameraGear && (
          <div className="text-xs text-neutral-500 mt-1 flex gap-1">🎥 {scene.cameraGear}</div>
        )}
        {template === 'ad' && scene.lightingNote && (
          <div className="text-xs text-amber-500/70 mt-1 flex gap-1">💡 {scene.lightingNote}</div>
        )}
      </td>
      <td className="px-4 py-4 text-right text-neutral-500">{scene.estimatedMinutes}분</td>
    </tr>
  );
}

const WeatherWidget = ({ location, date }: { location: string, date: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;
      setLoading(true);
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results[0]) {
          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,windspeed_10m_max&timezone=auto&start_date=${date}&end_date=${date}`);
          const weatherData = await weatherRes.json();
          setData(weatherData.daily);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    const timer = setTimeout(fetchWeather, 800);
    return () => clearTimeout(timer);
  }, [location, date]);

  if (loading) return <div className="bg-neutral-900 h-24 rounded-2xl border border-neutral-800 animate-pulse flex items-center justify-center text-neutral-600 text-sm italic">날씨 정보 불러오는 중...</div>;
  if (!data || !data.sunrise) return null;

  return (
    <div className="bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800/60 backdrop-blur-sm flex flex-wrap gap-6 items-center justify-between">
      <div className="flex flex-wrap gap-8 items-center">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400 border border-indigo-500/20">
             <Cloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-0.5">Weather Intel</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-200">{data.temperature_2m_max[0]}°C</span>
              <span className="text-neutral-600">/</span>
              <span className="text-sm text-neutral-400">{data.temperature_2m_min[0]}°C</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Umbrella className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">강수 확률</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{data.precipitation_probability_max[0]}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Wind className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-[10px] text-neutral-500 font-bold leading-none mb-1">최대 풍속</p>
              <p className="text-sm font-bold text-neutral-200 leading-none">{data.windspeed_10m_max[0]}km/h</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-10">
        <div className="flex items-center gap-3">
          <Sunrise className="w-5 h-5 text-amber-500/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunrise</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(data.sunrise[0]), 'HH:mm')}</p>
            <p className="text-[10px] text-blue-400 mt-1">블루: {format(subMinutes(new Date(data.sunrise[0]), 30), 'HH:mm')}~</p>
            <p className="text-[10px] text-amber-400">골든: {format(new Date(data.sunrise[0]), 'HH:mm')}~{format(addMinutes(new Date(data.sunrise[0]), 60), 'HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sunset className="w-5 h-5 text-indigo-400/80" />
          <div>
            <p className="text-[9px] uppercase text-neutral-500 font-bold">Sunset</p>
            <p className="text-sm font-mono font-bold text-neutral-300">{format(new Date(data.sunset[0]), 'HH:mm')}</p>
            <p className="text-[10px] text-amber-400 mt-1">골든: {format(subMinutes(new Date(data.sunset[0]), 60), 'HH:mm')}~</p>
            <p className="text-[10px] text-blue-400">블루: {format(new Date(data.sunset[0]), 'HH:mm')}~{format(addMinutes(new Date(data.sunset[0]), 30), 'HH:mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScriptAnalyzer = ({ onExtract, onClose }: { onExtract: (scenes: any[]) => void, onClose: () => void }) => {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    
    // 시나리오 분석 로직 (Regex 기반의 Intelligent Parser)
    setTimeout(() => {
      const extractedScenes: any[] = [];
      const lines = script.split('\n');
      let currentScene: any = null;

      lines.forEach(line => {
        // S# 패턴 매칭: S#1. 거실 (낮)
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
            intExt: loc.includes('마당') || loc.includes('공원') || loc.includes('길') ? 'EXT' : 'INT'
          };
        } else if (currentScene) {
          // 대사 주체 추출: 철수: 안녕하세요
          const castMatch = line.match(/^([^:(\s]{1,10})\s*:/);
          if (castMatch) {
            currentScene.cast.add(castMatch[1].trim());
          } else if (line.trim() && !line.includes(':') && line.length > 5) {
            // 지문/설명을 description에 누적
            currentScene.description += line.trim() + ' ';
          }
        }
      });
      if (currentScene) extractedScenes.push(currentScene);

      const finalScenes = extractedScenes.map(s => ({
        ...s,
        cast: Array.from(s.cast).join(', '),
        description: s.description.substring(0, 80).trim() + (s.description.length > 80 ? '...' : '')
      }));

      onExtract(finalScenes);
      setIsAnalyzing(false);
    }, 1200);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setScript(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-neutral-900 border border-indigo-500/30 rounded-2xl p-8 mb-10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
      
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
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-neutral-700"
          >
            <Upload className="w-3.5 h-3.5" /> 파일 불러오기
          </button>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative group"
      >
        <textarea
          placeholder="여기에 시나리오를 붙여넣으세요. 또는 파일을 이곳에 끌어다 놓으세요. (예: S#1. 거실 (낮) ...)"
          className="w-full h-48 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono mb-4 custom-scrollbar group-hover:border-neutral-700"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <div className="absolute inset-0 border-2 border-dashed border-indigo-500/0 rounded-xl pointer-events-none group-hover:border-indigo-500/20 transition-all"></div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={analyze}
          disabled={isAnalyzing || !script.trim()}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white px-10 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
};

export default function Home() {
  const { 
    template, setTemplate, 
    shootingDate, setShootingDate,
    location, setLocation,
    callTime, setCallTime, 
    shootingStartTime, setShootingStartTime, 
    scenes, addScene, addScenes, reorderScenes,
    loadSampleData, importData
  } = useScheduleStore();
  const [isReportMode, setIsReportMode] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [extractedScenes, setExtractedScenes] = useState<any[]>([]);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [newSceneParams, setNewSceneParams] = useState({
    location: '', description: '', estimatedMinutes: 30,
    sceneNumber: '', intExt: 'INT' as any, dayNight: 'DAY' as any, cast: '', cutCount: '' as any, pageCount: '' as any,
    eventSection: '', cameraGear: '',
    visualRef: '', lightingNote: '', clientMemo: ''
  });

  const recommendations = useMemo(() => recommendShots(newSceneParams.description), [newSceneParams.description]);
  const [sbCategory, setSbCategory] = useState('ALL');
  const [sbSearch, setSbSearch] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const filteredStoryboards = useMemo(() => {
    return storyboardDb.filter(sb => {
      const matchesCategory = sbCategory === 'ALL' || sb.category === sbCategory;
      const matchesSearch = sb.name.includes(sbSearch) || sb.keywords.some(k => k.includes(sbSearch));
      return matchesCategory && matchesSearch;
    });
  }, [sbCategory, sbSearch]);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 3,
        backgroundColor: '#171717',
        useCORS: true,
        logging: false,
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`PrePro_Studio_${template}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
  };

  const handleExportJSON = () => {
    const data = useScheduleStore.getState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrePro_Studio_${template}_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        importData(json);
      } catch (err) {
        alert('올바른 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };



  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleAddScene = () => {
    if (!newSceneParams.description || !newSceneParams.location) return;
    addScene(newSceneParams);
    setNewSceneParams({ ...newSceneParams, description: '', sceneNumber: '' });
  };

  const [activeStep, setActiveStep] = useState(1);
  useEffect(() => {
    if (scenes.length > 0) setActiveStep(3);
    else if (newSceneParams.description || template) setActiveStep(2);
    else setActiveStep(1);
  }, [scenes.length, newSceneParams.description, template]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* === HEADER SECTION (Vercel Deploy Sync Check v1.2) === */}
        <header className="flex flex-col gap-8">
          {/* Row 1: Brand & Global Actions */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-900">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-2xl shadow-indigo-500/40 rotate-3 group-hover:rotate-0 transition-transform">
                <Film className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent uppercase">PrePro Studio</h1>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md font-black border border-indigo-500/30">V1.2 LIVE</span>
                </div>
                <p className="text-xs text-neutral-500 font-bold tracking-tight mt-1">올인원 일촬표 & 콘티 매니저 • <span className="text-indigo-500/80">Professional Studio Mode</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-900/80 p-2 rounded-2xl border border-neutral-800 shadow-inner">
              <button onClick={handleExportJSON} className="group relative p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all text-neutral-400 hover:text-white" title="JSON 저장">
                <Save className="w-5 h-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">저장</span>
              </button>
              <label className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all text-neutral-400 hover:text-white cursor-pointer" title="열기">
                <FolderOpen className="w-5 h-5" />
                <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
              </label>
              <div className="w-[1px] h-6 bg-neutral-800 mx-1"></div>
              <button 
                onClick={() => setIsReportMode(!isReportMode)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all border ${isReportMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30' : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-200'}`}
              >
                <FileText className="w-4 h-4" />
                {isReportMode ? '리포트 모드 ON' : '리포트 모드 OFF'}
              </button>
            </div>
          </div>

          {/* Row 2: Production Settings Cards (3-Column Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Location & Date Setting */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 flex flex-col gap-3">
              <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 group focus-within:border-indigo-500/50 transition-all">
                <MapPin className="w-5 h-5 text-neutral-600 group-focus-within:text-indigo-400" />
                <div className="flex flex-col flex-1">
                  <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Location</span>
                  <input className="bg-transparent border-none text-sm focus:outline-none w-full text-neutral-200 font-bold" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="서울 / 촬영 장소" />
                </div>
              </div>
              <div className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 group focus-within:border-indigo-500/50 transition-all">
                <CalendarIcon className="w-5 h-5 text-neutral-600 group-focus-within:text-indigo-400" />
                <div className="flex flex-col flex-1">
                  <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Shoot Date</span>
                  <input type="date" className="bg-transparent border-none text-sm focus:outline-none text-neutral-200 font-bold [color-scheme:dark]" value={shootingDate} onChange={(e) => setShootingDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 2. Template Selection (Horizontal Switch) */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 flex flex-col justify-between gap-3">
              <span className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em] ml-4">Production Template</span>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { id: 'film', name: '영화', icon: Film },
                  { id: 'ad', name: '광고', icon: MonitorPlay },
                  { id: 'event', name: '행사', icon: Camera },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id as any)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl transition-all border ${template === t.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' : 'bg-neutral-950 border-neutral-800 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'}`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-[11px] font-black">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. AI Analysis & Sample Loader */}
            <div className="bg-neutral-900/50 p-4 rounded-[2rem] border border-neutral-800/50 flex flex-col gap-3">
              <button 
                onClick={() => setShowAnalyzer(true)}
                className="flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 font-black text-sm group"
              >
                <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                AI 시나리오 분석기 실행
              </button>
              <button 
                onClick={() => confirm('샘플 데이터를 로드하시겠습니까?') && loadSampleData()}
                className="flex items-center justify-center gap-2 bg-neutral-950 border border-neutral-800 text-neutral-500 py-3 rounded-2xl hover:text-neutral-300 hover:border-neutral-700 transition-all font-bold text-xs"
              >
                <Database className="w-4 h-4" />
                샘플 데이터 로드
              </button>
            </div>
          </div>
        </header>

        {/* === MAIN CONTENT === */}
        <main className="space-y-10">
          {/* Ad Slot */}
          <AdBanner slot="top_banner" format="auto" />

          {/* AI Script Analyzer Overlay */}
          {showAnalyzer && (
            <div className="animate-in fade-in zoom-in duration-300">
              <ScriptAnalyzer 
                onClose={() => setShowAnalyzer(false)}
                onExtract={(result) => setExtractedScenes(result)} 
              />
            </div>
          )}

          {/* AI Analysis Preview (Extracted Scenes) */}
          {extractedScenes.length > 0 && (
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-black text-indigo-200 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> 
                  AI 분석 결과: {extractedScenes.length}개의 씬 감지됨
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-h-64 overflow-y-auto custom-scrollbar pr-4">
                {extractedScenes.map((s, i) => (
                  <div key={i} className="bg-neutral-950/50 p-4 rounded-2xl border border-neutral-900 text-[11px] group hover:border-indigo-500/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-indigo-500">{s.sceneNumber}</span>
                      <span className="text-neutral-600 font-bold uppercase tracking-widest">{s.intExt} • {s.dayNight}</span>
                    </div>
                    <div className="text-neutral-200 font-bold mb-1 truncate">{s.location}</div>
                    <div className="text-neutral-600 truncate">{s.cast || 'NO CAST'}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 justify-end">
                <button onClick={() => setExtractedScenes([])} className="px-6 py-2.5 text-sm font-bold text-neutral-500 hover:text-neutral-300 transition-colors">취소</button>
                <button 
                  onClick={() => { addScenes(extractedScenes); setExtractedScenes([]); setShowAnalyzer(false); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-500/20"
                >
                  전체 일정에 추가하기
                </button>
              </div>
            </div>
          )}

          {/* Weather & Sun Intel */}
          <WeatherWidget location={location} date={shootingDate} />

          {/* Time Settings Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1.5 rounded-[2.5rem] bg-neutral-900/30 border border-neutral-900/50 backdrop-blur-md">
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Call Time</label>
                <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" onChange={(e) => handleTimeChange('call', e.target.value)} />
              </div>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-[2rem] p-6 flex items-center gap-6 group hover:border-cyan-500/30 transition-all">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Shooting Call</label>
                <input type="time" className="w-full bg-transparent border-none text-2xl font-black focus:outline-none [color-scheme:dark]" onChange={(e) => handleTimeChange('shoot', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Add Scene Form */}
          <div className="bg-neutral-900/40 border border-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
              <h3 className="text-2xl font-black flex items-center gap-4">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                NEW PRODUCTION SCENE
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30 font-black tracking-widest">{template.toUpperCase()} MODE</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Location <span className="text-indigo-500">*</span></label>
                  <input list="location-list" placeholder="촬영 장소 직접 입력 또는 선택" className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all" value={newSceneParams.location} onChange={(e) => setNewSceneParams({ ...newSceneParams, location: e.target.value })} />
                </div>

                {template === 'film' && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Scene #</label>
                        <input placeholder="S#1" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.sceneNumber} onChange={(e) => setNewSceneParams({ ...newSceneParams, sceneNumber: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">INT/EXT</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.intExt} onChange={(e) => setNewSceneParams({ ...newSceneParams, intExt: e.target.value as any })}>
                          <option value="INT">INT</option><option value="EXT">EXT</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">D / N / S</label>
                        <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none" value={newSceneParams.dayNight} onChange={(e) => setNewSceneParams({ ...newSceneParams, dayNight: e.target.value as any })}>
                          <option value="DAY">DAY</option><option value="NIGHT">NIGHT</option><option value="SUNSET">SUNSET</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">CAST (Actors)</label>
                        <input placeholder="예: 철수, 영희" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cast || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cast: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Cuts</label>
                          <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.cutCount || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, cutCount: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Pages</label>
                          <input type="number" step="0.1" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.pageCount || ''} onChange={(e) => setNewSceneParams({ ...newSceneParams, pageCount: Number(e.target.value) })} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {template === 'event' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Event Section</label>
                      <input placeholder="예: 1부 오프닝" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.eventSection} onChange={(e) => setNewSceneParams({ ...newSceneParams, eventSection: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">GEAR</label>
                      <input placeholder="예: 짐벌, 삼각대" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.cameraGear} onChange={(e) => setNewSceneParams({ ...newSceneParams, cameraGear: e.target.value })} />
                    </div>
                  </div>
                )}

                {template === 'ad' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">TONE & MANNER</label>
                      <input placeholder="예: 화사하게, 시네마틱" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.lightingNote} onChange={(e) => setNewSceneParams({ ...newSceneParams, lightingNote: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">CLIENT MEMO</label>
                      <input placeholder="제품 로고 강조" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500" value={newSceneParams.clientMemo} onChange={(e) => setNewSceneParams({ ...newSceneParams, clientMemo: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 파트: 내용 & 시간 & 추가 버튼 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Description / Content <span className="text-indigo-500">*</span></label>
                  <textarea 
                    placeholder="해당 장면에 대한 상세 촬영 내용을 입력하세요." 
                    className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none" 
                    value={newSceneParams.description} 
                    onChange={(e) => setNewSceneParams({ ...newSceneParams, description: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Est. Duration</label>
                    <div className="relative">
                      <input type="number" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none" value={newSceneParams.estimatedMinutes} onChange={(e) => setNewSceneParams({ ...newSceneParams, estimatedMinutes: Number(e.target.value) })} />
                      <span className="absolute right-4 top-3.5 text-[10px] font-black text-neutral-600 uppercase">mins</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleAddScene} 
                      disabled={!newSceneParams.description || !newSceneParams.location}
                      className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-900 disabled:text-neutral-700 text-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                    >
                      ADD TO TIMELINE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI 스토리보드 매칭 (광고 모드 & 필름 모드) */}
          {(template === 'ad' || template === 'film') && (
            <div className="mt-8 p-5 bg-neutral-950 rounded-xl border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <span className="bg-indigo-500 w-2 h-2 rounded-full animate-pulse"></span>
                  AI 앵글 레퍼런스 선택
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowGallery(true)}
                    className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg font-bold border border-indigo-500/20 transition-all flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> 100종 전체보기
                  </button>
                  <p className="text-xs text-neutral-500">원하는 콘티를 클릭하세요</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                    {['ALL', 'WIDE', 'MEDIUM', 'CLOSEUP', 'ANGLE', 'LENS', 'COMPOSITION', 'SUBJECT', 'LIGHTING'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSbCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${sbCategory === cat ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text" 
                      placeholder="앵글 검색 (예: 웅장, 대화...)" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-4 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      value={sbSearch}
                      onChange={(e) => setSbSearch(e.target.value)}
                    />
                    <Sparkles className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-2" />
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[140px]">
                  {filteredStoryboards.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center text-neutral-600 py-10">
                      <p className="text-xs">검색 결과가 없습니다.</p>
                    </div>
                  ) : filteredStoryboards.map(sb => {
                    const isRecommended = recommendations.some(r => r.id === sb.id);
                    const isSelected = newSceneParams.visualRef === sb.url;
                    
                    return (
                      <div 
                        key={sb.id} 
                        onClick={() => setNewSceneParams({...newSceneParams, visualRef: sb.url})}
                        className={`relative cursor-pointer border-2 rounded-xl overflow-hidden transition-all shrink-0 w-40 h-[124px] ${isSelected ? 'border-indigo-500 scale-105 shadow-xl shadow-indigo-500/30 z-10' : 'border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-700'}`}
                      >
                        {isRecommended && (
                          <div className="absolute top-2 left-2 bg-indigo-500 text-[9px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-2 h-2" /> AI 추천
                          </div>
                        )}
                        {/* 이미지 로딩 전 placeholder */}
                        <div className="w-full h-24 bg-neutral-800 flex items-center justify-center overflow-hidden">
                           <img 
                            src={sb.url} 
                            alt={sb.name} 
                            className="w-full h-full object-cover transition-opacity duration-300" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/171717/4f46e5?text=' + encodeURIComponent(sb.name);
                            }}
                          />
                        </div>
                        <div className={`text-[10px] text-center py-2 font-bold px-1 h-10 flex items-center justify-center leading-tight ${isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 text-neutral-400'}`}>
                          {sb.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        {/* Middle Ad Slot */}
        <AdBanner slot="middle_timeline" format="auto" />

        {/* Timeline View */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">오늘의 일정표 <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-400 font-normal">총 {scenes.length}개</span></h2>
            <div className="flex gap-3">
              <button onClick={() => useScheduleStore.getState().optimizeSchedule()} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-bold transition-colors">
                <Sparkles className="w-4 h-4" /> AI 동선 최적화
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-sm font-medium transition-colors border border-neutral-700">
                <Download className="w-4 h-4" /> PDF 다운로드
              </button>
            </div>
          </div>

          <div ref={pdfRef} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-x-auto relative custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => { if (e.over && e.active.id !== e.over.id) reorderScenes(e.active.id as string, e.over.id as string); }}>
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-950/50 text-neutral-400 uppercase text-xs border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-medium w-12 text-center">순서</th>
                    <th className="px-4 py-4 font-medium w-32">예상 시간</th>

                    {/* 동적 테이블 헤더 */}
                    {template === 'film' && (
                      <>
                        <th className="px-4 py-4 font-medium w-24">씬 정보</th>
                        <th className="px-4 py-4 font-medium w-24">콘티</th>
                      </>
                    )}
                    {template === 'event' && <th className="px-4 py-4 font-medium w-24">식순 구분</th>}
                    {template === 'ad' && <th className="px-4 py-4 font-medium w-24">콘티</th>}

                    <th className="px-4 py-4 font-medium w-48">장소</th>
                    <th className="px-4 py-4 font-medium">상세 내용</th>
                    <th className="px-4 py-4 font-medium w-24 text-right">소요시간</th>
                  </tr>
                </thead>
                <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-neutral-800">
                    {scenes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="max-w-md mx-auto space-y-6">
                            <div className="bg-neutral-900/50 p-8 rounded-3xl border border-dashed border-neutral-800">
                              <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-neutral-600" />
                              </div>
                              <h3 className="text-lg font-bold text-neutral-200">아직 추가된 일정이 없습니다</h3>
                              <p className="text-sm text-neutral-500 mt-2">
                                상단에서 씬 정보를 입력하거나,<br />
                                <b>AI 시나리오 분석기</b>를 사용해 빠르게 시작해 보세요.
                              </p>
                              <div className="flex gap-3 justify-center mt-6">
                                <button 
                                  onClick={loadSampleData}
                                  className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl transition-all"
                                >
                                  샘플 데이터 불러오기
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      scenes.map((scene) => (
                        <SortableRow key={scene.id} scene={scene} template={template} isReportMode={isReportMode} />
                      ))
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>

        {/* SEO & Production Guide Section */}
        <section className="mt-16 pt-12 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-12 text-neutral-400 pb-20">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-neutral-200 flex items-center gap-2">
              <span className="bg-indigo-500 w-1 h-6 rounded-full"></span>
              효율적인 촬영 준비를 위한 가이드
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-neutral-300 font-medium mb-1">1. 일촬표(Call Sheet)의 중요성</h4>
                <p className="text-sm leading-relaxed">촬영 현장의 모든 스태프가 공유하는 단 하나의 지도입니다. 시작 시간, 장소, 촬영 순서를 명확히 기재하여 불필요한 대기 시간을 줄이는 것이 핵심입니다.</p>
              </div>
              <div>
                <h4 className="text-neutral-300 font-medium mb-1">2. 씬(Scene) 배치 전략</h4>
                <p className="text-sm leading-relaxed">보통 조명 세팅의 효율을 위해 같은 장소와 같은 시간대(Day/Night)를 묶어서 촬영하는 것이 제작비를 아끼는 지름길입니다.</p>
              </div>
              <div>
                <h4 className="text-neutral-300 font-medium mb-1">3. AI 콘티 활용법</h4>
                <p className="text-sm leading-relaxed">PrePro Studio의 AI 콘티는 감독의 머릿속에 있는 앵글을 빠르게 시각화해줍니다. '더치 앵글', 'OTS' 등 전문 용어를 몰라도 그림을 보며 소통하세요.</p>
              </div>
            </div>
          </div>
          <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800/50">
            <h3 className="text-lg font-semibold text-neutral-200 mb-4">자주 묻는 질문 (FAQ)</h3>
            <div className="space-y-4 text-sm">
              <details className="group cursor-pointer">
                <summary className="list-none flex items-center justify-between font-medium text-neutral-300">
                  데이터는 어디에 저장되나요? <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-2 text-neutral-500">현재 모든 데이터는 보안을 위해 브라우저의 로컬 스토리지에만 저장됩니다. 별도의 회원가입 없이도 안심하고 사용하세요.</p>
              </details>
              <details className="group cursor-pointer">
                <summary className="list-none flex items-center justify-between font-medium text-neutral-300">
                  PDF가 잘려서 나와요. <span className="group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-2 text-neutral-500">일촬표 특성상 '가로형(Landscape)' 레이아웃에 최적화되어 있습니다. 내보내기 시 자동으로 A4 가로 사이즈로 조정됩니다.</p>
              </details>
            </div>
          </div>
        {/* 스토리보드 갤러리 모달 */}
        {showGallery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowGallery(false)}></div>
            <div className="relative bg-neutral-900 w-full max-w-6xl h-full max-h-[85vh] rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> 시네마틱 앵글 100종 갤러리
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">전문 영화 연출 기법 100가지를 그림을 보고 직접 선택하세요.</p>
                </div>
                <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-neutral-900 py-2 z-10">
                  <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                    {['ALL', 'WIDE', 'MEDIUM', 'CLOSEUP', 'ANGLE', 'LENS', 'COMPOSITION', 'SUBJECT', 'LIGHTING'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSbCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${sbCategory === cat ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:w-80">
                    <input 
                      type="text" 
                      placeholder="앵글 명칭 또는 키워드 검색..." 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                      value={sbSearch}
                      onChange={(e) => setSbSearch(e.target.value)}
                    />
                    <Sparkles className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredStoryboards.map(sb => {
                    const isRecommended = recommendations.some(r => r.id === sb.id);
                    const isSelected = newSceneParams.visualRef === sb.url;
                    
                    return (
                      <div 
                        key={sb.id} 
                        onClick={() => {
                          setNewSceneParams({...newSceneParams, visualRef: sb.url});
                          setShowGallery(false);
                        }}
                        className={`group relative cursor-pointer border-2 rounded-2xl overflow-hidden transition-all h-full flex flex-col ${isSelected ? 'border-indigo-500 scale-[1.02] shadow-xl shadow-indigo-500/20' : 'border-neutral-800 hover:border-neutral-600'}`}
                      >
                        {isRecommended && (
                          <div className="absolute top-2 left-2 bg-indigo-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold z-20 flex items-center gap-1 shadow-lg border border-white/20">
                            <Sparkles className="w-2.5 h-2.5" /> 추천
                          </div>
                        )}
                        <div className="w-full aspect-[16/9] bg-neutral-800 overflow-hidden relative">
                           <img 
                            src={sb.url} 
                            alt={sb.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/171717/4f46e5?text=' + encodeURIComponent(sb.name);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform" />
                          </div>
                        </div>
                        <div className={`p-3 text-center flex-1 flex flex-col items-center justify-center gap-1 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-neutral-900 group-hover:bg-neutral-800'}`}>
                          <p className="text-[11px] font-bold leading-tight">{sb.name}</p>
                          <p className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-neutral-500'} line-clamp-1`}>{sb.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <p className="text-xs text-neutral-500">전체 100종 중 {filteredStoryboards.length}개 표시 중</p>
                <button 
                  onClick={() => setShowGallery(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  </div>
</div>
  );
}
