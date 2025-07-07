"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SortableQuestionList } from "./SortableQuestionList";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useEditableSection } from "@/hooks/useEditableSection";
import type { Section } from "@/types/database";

interface SectionCardProps {
  section: Section;
  dragHandleProps?: Record<string, unknown>;
}

/**
 * SectionCard - Refactored with clean separation of concerns
 * 
 * Design improvements:
 * 1. Form logic extracted to useEditableSection hook
 * 2. Component focuses only on UI rendering
 * 3. Clean, predictable state management
 * 4. Easy to test and maintain
 * 5. Reusable form logic across components
 */
export function SectionCard({ section, dragHandleProps }: SectionCardProps) {
  const { data: progress } = useSectionProgress(section.id);
  
  // All form logic encapsulated in custom hook
  const editableSection = useEditableSection({
    section,
    onSaveSuccess: () => {
      // Could add analytics, notifications, etc. here
      console.log('Section saved successfully');
    },
    onDeleteSuccess: () => {
      console.log('Section deleted successfully');
    },
  });
  
  // Computed values for progress display
  const finalCount = progress ? Math.floor(progress.score) : 0;
  const draftCount = progress ? Math.round((progress.score - finalCount) * 2) : 0;
  const totalCount = progress?.total || section.questions?.length || 0;

  // Show editing form when in edit mode
  if (editableSection.isEditing) {
    return <SectionEditForm editableSection={editableSection} dragHandleProps={dragHandleProps} />;
  }

  // Show normal section display
  return (
    <SectionDisplay 
      section={section} 
      editableSection={editableSection} 
      dragHandleProps={dragHandleProps}
      progress={{ finalCount, draftCount, totalCount }}
    />
  );
}

/**
 * SectionEditForm - Dedicated editing component
 * 
 * Benefits:
 * - Single responsibility: only form rendering
 * - Clean props interface
 * - Easy to test form interactions
 * - Could be reused in modals, different layouts, etc.
 */
interface SectionEditFormProps {
  editableSection: ReturnType<typeof useEditableSection>;
  dragHandleProps?: Record<string, unknown>;
}

function SectionEditForm({ editableSection, dragHandleProps }: SectionEditFormProps) {
  return (
    <div className="w-full flex items-start gap-2">
      {/* Drag handle - OUTSIDE of edit form */}
      <div 
        {...dragHandleProps}
        className="cursor-move p-2 text-gray-400 hover:text-gray-600 flex-shrink-0 mt-2"
        title="Drag to reorder"
        style={{ touchAction: 'none' }}
      >
        ⋮⋮
      </div>

      <div className="flex-1 p-4 rounded-lg" style={{ 
        backgroundColor: 'var(--color-bg-sidebar)', 
        border: '1px solid var(--color-border-custom)' 
      }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Editing Section
          </div>
        </div>
      
      <div className="space-y-3">
        {/* Error display */}
        {(editableSection.localError || editableSection.updateMutation.error) && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {editableSection.localError || editableSection.updateMutation.error?.message}
          </div>
        )}
        
        {/* Title input */}
        <div>
          <Input
            value={editableSection.title}
            onChange={(e) => editableSection.updateTitle(e.target.value)}
            placeholder="Section title"
            className="font-semibold text-lg"
            style={{ 
              backgroundColor: 'var(--color-bg-primary)', 
              borderColor: editableSection.localError ? '#ef4444' : 'var(--color-border-custom)',
              color: 'var(--color-text-primary)'
            }}
            disabled={editableSection.isLoading}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {editableSection.title.length}/200 characters
          </div>
        </div>
        
        {/* Description input */}
        <div>
          <Textarea
            value={editableSection.description}
            onChange={(e) => editableSection.updateDescription(e.target.value)}
            placeholder="Section description (optional)"
            className="text-sm"
            rows={3}
            style={{ 
              backgroundColor: 'var(--color-bg-primary)', 
              borderColor: 'var(--color-border-custom)',
              color: 'var(--color-text-secondary)'
            }}
            disabled={editableSection.isLoading}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {editableSection.description.length}/1000 characters
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={editableSection.save}
            disabled={!editableSection.canSave}
            className="aep-button text-xs"
          >
            {editableSection.updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={editableSection.cancelEditing}
            disabled={editableSection.isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

/**
 * SectionDisplay - Dedicated display component
 * 
 * Benefits:
 * - Single responsibility: only display rendering
 * - Clean props interface
 * - Easy to test display logic
 * - Could be reused in different contexts
 */
interface SectionDisplayProps {
  section: Section;
  editableSection: ReturnType<typeof useEditableSection>;
  dragHandleProps?: Record<string, unknown>;
  progress: {
    finalCount: number;
    draftCount: number;
    totalCount: number;
  };
}

function SectionDisplay({ section, editableSection, dragHandleProps, progress }: SectionDisplayProps) {
  return (
    <div className="w-full">
      {/* Action buttons positioned outside accordion */}
      <div className="flex justify-end gap-1 mb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            editableSection.startEditing();
          }}
          className="text-xs px-2 py-1 text-blue-400 hover:text-blue-600"
          title="Edit section"
          disabled={editableSection.isLoading}
        >
          ✏️
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            editableSection.delete();
          }}
          className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
          title="Delete section"
          disabled={editableSection.isLoading}
        >
          {editableSection.deleteMutation.isPending ? "⏳" : "🗑️"}
        </Button>
      </div>

      {/* Error display for mutations */}
      {editableSection.deleteMutation.error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
          {editableSection.deleteMutation.error.message}
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Drag handle - OUTSIDE of accordion to avoid event conflicts */}
        <div 
          {...dragHandleProps}
          className="cursor-move p-2 text-gray-400 hover:text-gray-600 flex-shrink-0 mt-2"
          title="Drag to reorder"
          style={{ touchAction: 'none' }}
        >
          ⋮⋮
        </div>

        {/* Accordion content */}
        <div className="flex-1">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={section.id} className="border-none">
              <AccordionTrigger className="text-left hover:no-underline p-0">
                <div className="flex items-center justify-between w-full">
                  {/* Section content */}
                  <div className="flex-1">
                    <div>
                      <div className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                        {section.title}
                      </div>
                      {section.description && (
                        <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {section.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress display */}
                  <SectionProgressDisplay progress={progress} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <SortableQuestionList
                  questions={section.questions?.sort((a, b) => a.order_idx - b.order_idx) || []}
                  sectionId={section.id}
                  onQuestionsChange={() => {
                    // Questions changes handled by React Query invalidation
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

/**
 * SectionProgressDisplay - Dedicated progress component
 * 
 * Benefits:
 * - Single responsibility: only progress rendering
 * - Reusable across different section displays
 * - Easy to test progress calculations
 * - Could be enhanced with animations, tooltips, etc.
 */
interface SectionProgressDisplayProps {
  progress: {
    finalCount: number;
    draftCount: number;
    totalCount: number;
  };
}

function SectionProgressDisplay({ progress }: SectionProgressDisplayProps) {
  const { finalCount, draftCount, totalCount } = progress;
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Progress
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span style={{ color: 'var(--color-progress-green)' }}>{finalCount}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
          <span style={{ color: 'var(--color-progress-orange)' }}>{draftCount}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>/</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{totalCount}</span>
        </div>
      </div>
      <div className="w-16 h-2 progress-bar ml-2">
        <div 
          className="progress-fill green" 
          style={{ 
            width: `${totalCount > 0 ? (finalCount + draftCount * 0.5) / totalCount * 100 : 0}%`
          }}
        />
      </div>
    </div>
  );
}