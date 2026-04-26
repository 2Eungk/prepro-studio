'use client';

import { useScheduleStore } from '@/store/scheduleStore';
import { Scene } from '@/types/schedule';
import { format } from 'date-fns';
import { Plus, GripVertical, Clock, Film, MonitorPlay, Camera, Image as ImageIcon, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

function SortableRow({ scene, template }: { scene: Scene; template: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-neutral-800/50 transition-colors group ${isDragging ? 'bg-neutral-800 shadow-xl shadow-black/50 opacity-90' : 'bg-neutral-900 hover:bg-neutral-800/20'
        }`}
    >
      <td className="px-4 py-4 text-center">
        <button {...attributes} {...listeners} className="text-neutral-600 hover:text-neutral-300 cursor-grab active:cursor-grabbing outline-none">
          <GripVertical className="w-4 h-4 mx-auto" />
        </button>
      </td>
      <td className="px-4 py-4 font-mono text-cyan-400">
        {scene.startTime && format(scene.startTime, 'HH:mm')} - {scene.endTime && format(scene.endTime, 'HH:mm')}
      </td>

      {/* 템플릿별 동적 컬럼 렌더링 */}
      {template === 'film' && (
        <td className="px-4 py-4 font-medium">
          <span className="bg-neutral-800 px-2 py-1 rounded text-xs mr-2">{scene.sceneNumber || '-'}</span>
          <span className="text-neutral-500 text-xs">{scene.intExt}</span>
        </td>
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

export default function Home() {
  const { template, setTemplate, callTime, setCallTime, shootingStartTime, setShootingStartTime, scenes, addScene, reorderScenes } = useScheduleStore();
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    try {
      // 1. DOM 요소를 Canvas로 렌더링
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // 고해상도 출력
        backgroundColor: '#171717', // 다크모드 배경색 유지 (bg-neutral-900)
      });
      const imgData = canvas.toDataURL('image/png');

      // 2. 가로 방향(landscape) PDF 객체 생성 (일촬표는 표 형태라 가로가 적합)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 3. 이미지 삽입 및 다운로드 트리거
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CallSheet_${template}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
  };

  const [newSceneParams, setNewSceneParams] = useState({
    location: '', description: '', estimatedMinutes: 30,
    sceneNumber: '', intExt: 'INT' as any, dayNight: 'DAY' as any,
    eventSection: '', cameraGear: '',
    visualRef: '', lightingNote: '', clientMemo: ''
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleAddScene = () => {
    if (!newSceneParams.description || !newSceneParams.location) return;
    addScene(newSceneParams);
    setNewSceneParams({ ...newSceneParams, description: '', sceneNumber: '' });
  };

  const handleTimeChange = (type: 'call' | 'shoot', timeString: string) => {
    if (!timeString) return;
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (type === 'call') setCallTime(date);
    else setShootingStartTime(date);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex items-center justify-between pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">PrePro Studio</h1>
            <p className="text-neutral-400 mt-1">올인원 일촬표 & 콘티 매니저</p>
          </div>
          <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            {[
              { id: 'film', label: '영화/드라마', icon: Film },
              { id: 'event', label: '행사/스케치', icon: MonitorPlay },
              { id: 'ad', label: '광고/스튜디오', icon: Camera },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${template === t.id ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Global Time Settings */}
        <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> 스태프 집합 시간 (Call Time)</label>
            <input type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg" onChange={(e) => handleTimeChange('call', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2"><Camera className="w-4 h-4 text-cyan-400" /> 첫 촬영 시작 (Shooting Call)</label>
            <input type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-lg" onChange={(e) => handleTimeChange('shoot', e.target.value)} />
          </div>
        </div>

        {/* Template Specific Input Form */}
        <div className="bg-neutral-900/30 rounded-2xl p-6 border border-neutral-800/50">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            새로운 일정 추가 <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">{template.toUpperCase()} MODE</span>
          </h3>
          <div className="grid grid-cols-12 gap-4">

            {/* 공통 필드: 장소 */}
            <input placeholder="장소 (예: 철수네 거실, 메인 스테이지)" className="col-span-3 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.location} onChange={(e) => setNewSceneParams({ ...newSceneParams, location: e.target.value })} />

            {/* 템플릿별 동적 필드 */}
            {template === 'film' && (
              <>
                <input placeholder="S#" className="col-span-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.sceneNumber} onChange={(e) => setNewSceneParams({ ...newSceneParams, sceneNumber: e.target.value })} />
                <select className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.intExt} onChange={(e) => setNewSceneParams({ ...newSceneParams, intExt: e.target.value as any })}>
                  <option value="INT">INT. (실내)</option><option value="EXT">EXT. (실외)</option>
                </select>
              </>
            )}

            {template === 'event' && (
              <>
                <input placeholder="식순 (예: 1부, 축사)" className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.eventSection} onChange={(e) => setNewSceneParams({ ...newSceneParams, eventSection: e.target.value })} />
                <input placeholder="장비 (예: 드론, A7S3)" className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.cameraGear} onChange={(e) => setNewSceneParams({ ...newSceneParams, cameraGear: e.target.value })} />
              </>
            )}

            {template === 'ad' && (
              <>
                <input placeholder="조명/톤 세팅 (예: 흑백, 사이버펑크)" className="col-span-3 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.lightingNote} onChange={(e) => setNewSceneParams({ ...newSceneParams, lightingNote: e.target.value })} />
              </>
            )}

            {/* 공통 필드: 내용 및 시간 */}
            <input placeholder="내용 요약" className={`bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 ${template === 'film' ? 'col-span-4' : template === 'event' ? 'col-span-3' : 'col-span-4'}`} value={newSceneParams.description} onChange={(e) => setNewSceneParams({ ...newSceneParams, description: e.target.value })} />
            <div className="col-span-2 relative">
              <input type="number" placeholder="예상 시간" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-indigo-500" value={newSceneParams.estimatedMinutes} onChange={(e) => setNewSceneParams({ ...newSceneParams, estimatedMinutes: Number(e.target.value) })} />
              <span className="absolute right-3 top-2.5 text-xs text-neutral-500">분</span>
            </div>

            {/* AI 스토리보드 매칭 (광고/스튜디오 모드 전용) */}
            {template === 'ad' && (
              <div className="col-span-12 mt-2 p-4 bg-neutral-950/50 rounded-lg border border-neutral-800">
                <p className="text-sm text-neutral-400 mb-3 flex items-center gap-2">
                  <span className="bg-indigo-500 w-2 h-2 rounded-full animate-pulse"></span>
                  고품질 AI 콘티 썸네일 (실제 생성본)
                </p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {[
                    { id: 'sb_1', name: '더치 앵글 (Dutch)', url: '/storyboards/dutch_angle.png' },
                    { id: 'sb_2', name: '익스트림 클로즈업', url: '/storyboards/extreme_closeup.png' },
                    { id: 'sb_3', name: '오버 더 숄더 (OTS)', url: '/storyboards/over_shoulder.png' },
                  ].map(sb => (
                    <div 
                      key={sb.id} 
                      onClick={() => setNewSceneParams({...newSceneParams, visualRef: sb.url})}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all shrink-0 ${newSceneParams.visualRef === sb.url ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={sb.url} alt={sb.name} className="w-32 h-20 object-cover bg-white" />
                      <div className="bg-neutral-900 text-xs text-center py-1.5 text-neutral-300 font-medium">{sb.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleAddScene} className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> 리스트에 추가하기</button>
        </div>

        {/* Timeline View */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">오늘의 일정표 <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-400 font-normal">총 {scenes.length}개</span></h2>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-sm font-medium transition-colors border border-neutral-700">
              <Download className="w-4 h-4" /> PDF 다운로드
            </button>
          </div>

          <div ref={pdfRef} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden relative">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => { if (e.over && e.active.id !== e.over.id) reorderScenes(e.active.id as string, e.over.id as string); }}>
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-950/50 text-neutral-400 uppercase text-xs border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-4 font-medium w-12 text-center">순서</th>
                    <th className="px-4 py-4 font-medium w-32">예상 시간</th>

                    {/* 동적 테이블 헤더 */}
                    {template === 'film' && <th className="px-4 py-4 font-medium w-24">씬 정보</th>}
                    {template === 'event' && <th className="px-4 py-4 font-medium w-24">식순 구분</th>}
                    {template === 'ad' && <th className="px-4 py-4 font-medium w-24">콘티</th>}

                    <th className="px-4 py-4 font-medium w-48">장소</th>
                    <th className="px-4 py-4 font-medium">상세 내용</th>
                    <th className="px-4 py-4 font-medium w-24 text-right">소요시간</th>
                  </tr>
                </thead>
                <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="bg-neutral-900">
                    {scenes.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-neutral-500">추가된 일정이 없습니다.</td></tr> : scenes.map((scene) => <SortableRow key={scene.id} scene={scene} template={template} />)}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        </div>

      </div>
    </div>
  );
}
