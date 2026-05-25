'use client';

import { useState } from 'react';
import type { Person, ProductionLocation, Scene, StoryboardCategory, StoryboardShot, TemplateType } from '@/types/schedule';
import AdSceneFields from './AdSceneFields';
import EventSceneFields from './EventSceneFields';
import FilmSceneFields from './FilmSceneFields';
import MusicSceneFields from './MusicSceneFields';
import QuickStoryboardPicker from './QuickStoryboardPicker';
import SceneBreakdownFieldset from './SceneBreakdownFieldset';
import SceneDescriptionTimingFields from './SceneDescriptionTimingFields';
import SceneFormHeader from './SceneFormHeader';
import SceneLocationField from './SceneLocationField';
import SceneStoryboardField from './SceneStoryboardField';

export type SceneFormValues = {
  location: string;
  locationId?: string;
  description: string;
  estimatedMinutes: number;
  sceneNumber: string;
  intExt: NonNullable<Scene['intExt']>;
  dayNight: NonNullable<Scene['dayNight']>;
  cast: string;
  cutCount: number | '';
  pageCount: number | '';
  eventSection: string;
  cameraGear: string;
  visualRef: string;
  lightingNote: string;
  clientMemo: string;
  musicCue: string;
  lyrics: string;
  choreoNote: string;
  focusMember: string;
  shotSize: string;
  formation: string;
  props: string;
  costume: string;
  soundNote: string;
  specialInstruction: string;
  insertNote: string;
  continuityNote: string;
};

type StoryboardCategoryOption = {
  id: StoryboardCategory | 'ALL';
  label: string;
};

type SceneFormCopy = {
  descriptionLabel: string;
  descriptionPlaceholder: string;
  eventSectionLabel: string;
  formTitle: string;
  gearLabel: string;
  item: string;
  modeLabel: string;
  storyboardLabel: string;
};

type SceneFormPanelProps = {
  canSave: boolean;
  categoryOptions: readonly StoryboardCategoryOption[];
  copy: SceneFormCopy;
  customImageStatus: string;
  editorStoryboardOptions: StoryboardShot[];
  filteredStoryboardCount: number;
  isEditing: boolean;
  isMusicTimelineTemplate: boolean;
  locations: ProductionLocation[];
  missingFields: string[];
  people: Person[];
  recommendedStoryboards: StoryboardShot[];
  sameText: (left: string, right: string) => boolean;
  sbCategory: StoryboardCategory | 'ALL';
  sbSearch: string;
  selectedStoryboard?: StoryboardShot;
  storyboardCount: number;
  template: TemplateType;
  values: SceneFormValues;
  onAddLocation: () => void;
  onAddPerson: () => void;
  onApplyStoryboard: (storyboard: StoryboardShot) => void;
  onChange: (values: Partial<SceneFormValues>) => void;
  onClearStoryboard: () => void;
  onClose: () => void;
  onFallbackImage: (name: string) => string;
  onOpenGallery: () => void;
  onSave: () => void;
  onSetCategory: (category: StoryboardCategory | 'ALL') => void;
  onSetSearch: (search: string) => void;
  onUploadStoryboard: (file?: File) => void;
};

export default function SceneFormPanel({
  canSave,
  categoryOptions,
  copy,
  customImageStatus,
  editorStoryboardOptions,
  filteredStoryboardCount,
  isEditing,
  isMusicTimelineTemplate,
  locations,
  missingFields,
  people,
  recommendedStoryboards,
  sameText,
  sbCategory,
  sbSearch,
  selectedStoryboard,
  storyboardCount,
  template,
  values,
  onAddLocation,
  onAddPerson,
  onApplyStoryboard,
  onChange,
  onClearStoryboard,
  onClose,
  onFallbackImage,
  onOpenGallery,
  onSave,
  onSetCategory,
  onSetSearch,
  onUploadStoryboard,
}: SceneFormPanelProps) {
  const hasAdvancedValues = Boolean(
    values.cast ||
    values.eventSection ||
    values.cameraGear ||
    values.visualRef ||
    values.lightingNote ||
    values.clientMemo ||
    values.musicCue ||
    values.lyrics ||
    values.choreoNote ||
    values.focusMember ||
    values.shotSize ||
    values.formation ||
    values.props ||
    values.costume ||
    values.soundNote ||
    values.specialInstruction ||
    values.insertNote ||
    values.continuityNote
  );

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(isEditing || hasAdvancedValues);
  const [isStoryboardPickerOpen, setIsStoryboardPickerOpen] = useState(Boolean(values.visualRef));

  return (
    <>
      <div id="scene-form" className="bg-neutral-900/40 border border-neutral-900 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group scroll-mt-6 sm:p-6 md:rounded-[2.5rem] md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <SceneFormHeader
          title={copy.formTitle}
          modeLabel={copy.modeLabel}
          canSave={canSave}
          missingFields={missingFields}
          onClose={onClose}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SceneLocationField
            location={values.location}
            locationId={values.locationId}
            locations={locations}
            sameText={sameText}
            onAddLocation={onAddLocation}
            onChange={onChange}
          />

          <SceneDescriptionTimingFields
            description={values.description}
            descriptionLabel={copy.descriptionLabel}
            descriptionPlaceholder={copy.descriptionPlaceholder}
            estimatedMinutes={values.estimatedMinutes}
            isEditing={isEditing}
            canSave={canSave}
            onChangeDescription={(description) => onChange({ description })}
            onChangeEstimatedMinutes={(estimatedMinutes) => onChange({ estimatedMinutes })}
            onSave={onSave}
          />
        </div>

        <details
          className="group mt-8 rounded-3xl border border-neutral-900 bg-black/25"
          open={isAdvancedOpen}
          onToggle={(event) => setIsAdvancedOpen(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-black text-neutral-100">고급 항목</span>
              <span className="mt-1 block text-xs font-bold text-neutral-600">인원, 세부 컷 정보, 콘티/레퍼런스는 필요할 때만 펼쳐서 입력하세요.</span>
            </span>
            <span className="rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-black text-neutral-500 group-open:hidden">펼치기</span>
            <span className="hidden rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-black text-neutral-500 group-open:inline">접기</span>
          </summary>
          <div className="grid grid-cols-1 gap-8 border-t border-neutral-900 p-5 lg:grid-cols-2">
            <div className="space-y-6">
              {template === 'film' && (
                <FilmSceneFields
                  people={people}
                  values={{
                    sceneNumber: values.sceneNumber,
                    intExt: values.intExt,
                    dayNight: values.dayNight,
                    cast: values.cast || '',
                    cutCount: values.cutCount,
                    pageCount: values.pageCount,
                  }}
                  onAddPerson={onAddPerson}
                  onChange={onChange}
                />
              )}

              {template === 'event' && (
                <EventSceneFields
                  eventSectionLabel={copy.eventSectionLabel}
                  gearLabel={copy.gearLabel}
                  people={people}
                  values={{
                    eventSection: values.eventSection,
                    cameraGear: values.cameraGear,
                    cast: values.cast || '',
                  }}
                  onAddPerson={onAddPerson}
                  onChange={onChange}
                />
              )}

              {isMusicTimelineTemplate && (
                <MusicSceneFields
                  people={people}
                  template={template}
                  values={{
                    sceneNumber: values.sceneNumber,
                    musicCue: values.musicCue,
                    shotSize: values.shotSize,
                    focusMember: values.focusMember,
                    cast: values.cast || '',
                    lyrics: values.lyrics,
                    formation: values.formation,
                    choreoNote: values.choreoNote,
                    cameraGear: values.cameraGear,
                  }}
                  onAddPerson={onAddPerson}
                  onChange={onChange}
                />
              )}

              {template === 'ad' && (
                <AdSceneFields
                  people={people}
                  values={{
                    sceneNumber: values.sceneNumber,
                    intExt: values.intExt,
                    dayNight: values.dayNight,
                    cutCount: values.cutCount,
                    cast: values.cast || '',
                    lightingNote: values.lightingNote,
                    clientMemo: values.clientMemo,
                  }}
                  onAddPerson={onAddPerson}
                  onChange={onChange}
                />
              )}
            </div>

            <div className="space-y-6">
              {template === 'film' && (
                <SceneBreakdownFieldset
                  values={{
                    props: values.props,
                    costume: values.costume,
                    soundNote: values.soundNote,
                    specialInstruction: values.specialInstruction,
                    insertNote: values.insertNote,
                    continuityNote: values.continuityNote,
                  }}
                  onChange={(field, value) => onChange({ [field]: value })}
                />
              )}

              <SceneStoryboardField
                itemLabel={copy.item}
                storyboardLabel={copy.storyboardLabel}
                visualRef={values.visualRef}
                selectedStoryboard={selectedStoryboard}
                customImageStatus={customImageStatus}
                onClear={onClearStoryboard}
                onUpload={onUploadStoryboard}
                onOpenGallery={onOpenGallery}
                onFallbackImage={onFallbackImage}
              />
            </div>
          </div>
        </details>
      </div>

      <details
        className="group rounded-3xl border border-neutral-900 bg-neutral-950/45 p-1"
        open={isStoryboardPickerOpen}
        onToggle={(event) => setIsStoryboardPickerOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-black text-neutral-100">콘티 추천 더 보기</span>
            <span className="mt-1 block text-xs font-bold text-neutral-600">처음 저장은 장소와 내용만으로 가능하고, 샷 추천은 필요할 때 펼칩니다.</span>
          </span>
          <span className="rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-black text-neutral-500 group-open:hidden">펼치기</span>
          <span className="hidden rounded-full border border-neutral-800 px-3 py-1 text-[10px] font-black text-neutral-500 group-open:inline">접기</span>
        </summary>
        <div className="border-t border-neutral-900 pt-1">
          <QuickStoryboardPicker
            category={sbCategory}
            categoryOptions={categoryOptions}
            filteredCount={filteredStoryboardCount}
            options={editorStoryboardOptions}
            recommendedStoryboards={recommendedStoryboards}
            search={sbSearch}
            selectedUrl={values.visualRef}
            storyboardCount={storyboardCount}
            storyboardLabel={copy.storyboardLabel}
            template={template}
            onApplyStoryboard={onApplyStoryboard}
            onFallbackImage={onFallbackImage}
            onOpenGallery={onOpenGallery}
            onSetCategory={onSetCategory}
            onSetSearch={onSetSearch}
          />
        </div>
      </details>
    </>
  );
}
