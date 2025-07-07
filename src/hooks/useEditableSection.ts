import { useState, useCallback } from 'react';
import { useUpdateSection, useDeleteSection } from './sections';
import { formValidators } from '@/utils/validation';
import type { Section, UpdateSectionInput } from '@/types/database';

/**
 * Custom hook for managing section editing state and operations
 * 
 * Design principles:
 * 1. Encapsulates all form-related logic for sections
 * 2. Provides validation and error handling
 * 3. Manages optimistic updates via service hooks
 * 4. Returns clean interface for UI components
 * 5. Single responsibility - only section editing concerns
 */

interface UseEditableSectionConfig {
  section: Section;
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

interface UseEditableSectionReturn {
  // Form state
  isEditing: boolean;
  title: string;
  description: string;
  localError: string | null;
  
  // Computed state
  isLoading: boolean;
  hasChanges: boolean;
  canSave: boolean;
  
  // Actions
  startEditing: () => void;
  cancelEditing: () => void;
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  save: () => Promise<void>;
  delete: () => Promise<void>;
  
  // Mutation states for UI feedback
  updateMutation: ReturnType<typeof useUpdateSection>;
  deleteMutation: ReturnType<typeof useDeleteSection>;
}

const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 1000;

export function useEditableSection({ 
  section, 
  onSaveSuccess, 
  onDeleteSuccess 
}: UseEditableSectionConfig): UseEditableSectionReturn {
  
  // Local form state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description || '');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Service layer hooks
  const updateMutation = useUpdateSection();
  const deleteMutation = useDeleteSection();
  
  // Computed state
  const isLoading = updateMutation.isPending || deleteMutation.isPending;
  const hasChanges = title !== section.title || description !== (section.description || '');
  const canSave = title.trim().length > 0 && title.trim().length <= TITLE_MAX_LENGTH && 
                  description.length <= DESCRIPTION_MAX_LENGTH && !isLoading;
  
  /**
   * Start editing mode and reset form to current section values
   */
  const startEditing = useCallback(() => {
    setTitle(section.title);
    setDescription(section.description || '');
    setLocalError(null);
    setIsEditing(true);
  }, [section.title, section.description]);
  
  /**
   * Cancel editing and reset form state
   */
  const cancelEditing = useCallback(() => {
    setTitle(section.title);
    setDescription(section.description || '');
    setLocalError(null);
    setIsEditing(false);
  }, [section.title, section.description]);
  
  /**
   * Update title with validation
   */
  const updateTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  }, [localError]);
  
  /**
   * Update description with validation
   */
  const updateDescription = useCallback((newDescription: string) => {
    setDescription(newDescription);
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  }, [localError]);
  
  /**
   * Validate form inputs using validation utilities
   */
  const validateForm = useCallback((): string | null => {
    // Validate title
    const titleResult = formValidators.sectionTitle(title);
    if (!titleResult.isValid) {
      return titleResult.error!;
    }
    
    // Validate description
    const descriptionResult = formValidators.sectionDescription(description);
    if (!descriptionResult.isValid) {
      return descriptionResult.error!;
    }
    
    return null;
  }, [title, description]);
  
  /**
   * Save section changes with validation
   */
  const save = useCallback(async () => {
    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    
    setLocalError(null);
    
    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      
      const updateData: UpdateSectionInput = {
        title: trimmedTitle,
      };
      
      // Only include description if it's different from current
      if (trimmedDescription !== (section.description || '')) {
        updateData.description = trimmedDescription || undefined;
      }
      
      await updateMutation.mutateAsync({
        id: section.id,
        input: updateData,
      });
      
      // Success - exit editing mode
      setIsEditing(false);
      onSaveSuccess?.();
      
    } catch (error) {
      // Error is handled by the mutation hook and displayed via updateMutation.error
      console.error('Section save failed:', error);
    }
  }, [
    validateForm, 
    title, 
    description, 
    section.id, 
    section.description, 
    updateMutation, 
    onSaveSuccess
  ]);
  
  /**
   * Delete section with confirmation
   */
  const deleteSection = useCallback(async () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${section.title}"? This will delete all questions and answers in this section.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteMutation.mutateAsync(section.id);
      onDeleteSuccess?.();
    } catch (error) {
      // Error is handled by the mutation hook and displayed via deleteMutation.error
      console.error('Section deletion failed:', error);
    }
  }, [section.id, section.title, deleteMutation, onDeleteSuccess]);
  
  return {
    // Form state
    isEditing,
    title,
    description,
    localError,
    
    // Computed state
    isLoading,
    hasChanges,
    canSave,
    
    // Actions
    startEditing,
    cancelEditing,
    updateTitle,
    updateDescription,
    save,
    delete: deleteSection,
    
    // Mutation states for advanced UI feedback
    updateMutation,
    deleteMutation,
  };
}