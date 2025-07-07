"use client";

import { useState } from "react";
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
import { useUpdateSection, useDeleteSection } from "@/hooks/sections";
import type { Section } from "@/types/database";

interface SectionCardProps {
  section: Section;
  dragHandleProps?: Record<string, unknown>;
}

/**
 * SectionCard - Clean component using service layer
 * 
 * Design principles:
 * 1. Single responsibility - display and edit sections
 * 2. Uses service layer hooks for all data operations
 * 3. Proper error handling with user feedback
 * 4. Optimistic updates handled by hooks
 * 5. Clean separation between UI and business logic
 */
export function SectionCard({ section, dragHandleProps }: SectionCardProps) {
  const { data: progress } = useSectionProgress(section.id);
  
  // Local UI state
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editDescription, setEditDescription] = useState(section.description || "");
  const [localError, setLocalError] = useState<string | null>(null);

  // Service layer hooks
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();

  // Computed values
  const finalCount = progress ? Math.floor(progress.score) : 0;
  const draftCount = progress ? Math.round((progress.score - finalCount) * 2) : 0;
  const totalCount = progress?.total || section.questions?.length || 0;
  const isLoading = updateSectionMutation.isPending || deleteSectionMutation.isPending;

  /**
   * Handle section save with proper validation and error handling
   */
  const handleSaveSection = async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    // Client-side validation
    if (!trimmedTitle) {
      setLocalError("Section title is required");
      return;
    }

    if (trimmedTitle.length > 200) {
      setLocalError("Section title must be less than 200 characters");
      return;
    }

    if (trimmedDescription.length > 1000) {
      setLocalError("Section description must be less than 1000 characters");
      return;
    }

    setLocalError(null);

    try {
      await updateSectionMutation.mutateAsync({
        id: section.id,
        input: {
          title: trimmedTitle,
          description: trimmedDescription || undefined,
        },
      });

      // Success - close edit mode
      setIsEditingSection(false);
    } catch (error) {
      // Error handled by mutation hook, but we can show local feedback
      console.error('Section update failed:', error);
    }
  };

  /**
   * Handle section deletion with confirmation
   */
  const handleDeleteSection = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${section.title}"? This will delete all questions and answers in this section.`
    );
    
    if (!confirmed) return;

    try {
      await deleteSectionMutation.mutateAsync(section.id);
    } catch (error) {
      // Error handled by mutation hook
      console.error('Section deletion failed:', error);
    }
  };

  /**
   * Cancel editing and reset form
   */
  const handleCancelEdit = () => {
    setEditTitle(section.title);
    setEditDescription(section.description || "");
    setLocalError(null);
    setIsEditingSection(false);
  };

  // Show editing form when in edit mode
  if (isEditingSection) {
    return (
      <div className="w-full p-4 rounded-lg" style={{ 
        backgroundColor: 'var(--color-bg-sidebar)', 
        border: '1px solid var(--color-border-custom)' 
      }}>
        <div className="flex items-center gap-2 mb-4">
          {/* Drag handle */}
          <div 
            {...dragHandleProps}
            className="cursor-move p-2 text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          >
            ⋮⋮
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Editing Section
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Error display */}
          {(localError || updateSectionMutation.error) && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {localError || updateSectionMutation.error?.message}
            </div>
          )}
          
          {/* Title input */}
          <div>
            <Input
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="Section title"
              className="font-semibold text-lg"
              style={{ 
                backgroundColor: 'var(--color-bg-primary)', 
                borderColor: localError ? '#ef4444' : 'var(--color-border-custom)',
                color: 'var(--color-text-primary)'
              }}
              disabled={isLoading}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {editTitle.length}/200 characters
            </div>
          </div>
          
          {/* Description input */}
          <div>
            <Textarea
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="Section description (optional)"
              className="text-sm"
              rows={3}
              style={{ 
                backgroundColor: 'var(--color-bg-primary)', 
                borderColor: 'var(--color-border-custom)',
                color: 'var(--color-text-secondary)'
              }}
              disabled={isLoading}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {editDescription.length}/1000 characters
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveSection}
              disabled={isLoading || !editTitle.trim()}
              className="aep-button text-xs"
            >
              {updateSectionMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show normal section display
  return (
    <div className="w-full">
      {/* Action buttons positioned outside accordion */}
      <div className="flex justify-end gap-1 mb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingSection(true);
          }}
          className="text-xs px-2 py-1 text-blue-400 hover:text-blue-600"
          title="Edit section"
          disabled={isLoading}
        >
          ✏️
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSection();
          }}
          className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
          title="Delete section"
          disabled={isLoading}
        >
          {deleteSectionMutation.isPending ? "⏳" : "🗑️"}
        </Button>
      </div>

      {/* Error display for mutations */}
      {deleteSectionMutation.error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
          {deleteSectionMutation.error.message}
        </div>
      )}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={section.id} className="border-none">
          <AccordionTrigger className="text-left hover:no-underline p-0">
            <div className="flex items-center justify-between w-full">
              {/* Drag handle */}
              <div 
                {...dragHandleProps}
                className="cursor-move p-2 text-gray-400 hover:text-gray-600 mr-2"
                title="Drag to reorder"
              >
                ⋮⋮
              </div>

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
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <SortableQuestionList
              questions={section.questions?.sort((a, b) => a.order_idx - b.order_idx) || []}
              sectionId={section.id}
              onQuestionsChange={() => {
                // Questions changes will be handled by React Query invalidation
                // No manual refetch needed
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}