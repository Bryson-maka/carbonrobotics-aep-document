import { useState, useCallback } from 'react';
import { useUpdateQuestion, useDeleteQuestion } from './questions';
import { formValidators } from '@/utils/validation';
import type { Question, UpdateQuestionInput } from '@/types/database';

/**
 * Custom hook for managing question editing state and operations
 * 
 * Design principles:
 * 1. Encapsulates all form-related logic for questions
 * 2. Provides validation and error handling
 * 3. Manages optimistic updates via service hooks
 * 4. Returns clean interface for UI components
 * 5. Single responsibility - only question editing concerns
 */

interface UseEditableQuestionConfig {
  question: Question;
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

interface UseEditableQuestionReturn {
  // Form state
  isEditing: boolean;
  prompt: string;
  localError: string | null;
  
  // Computed state
  isLoading: boolean;
  hasChanges: boolean;
  canSave: boolean;
  
  // Actions
  startEditing: () => void;
  cancelEditing: () => void;
  updatePrompt: (prompt: string) => void;
  save: () => Promise<void>;
  delete: () => Promise<void>;
  
  // Mutation states for UI feedback
  updateMutation: ReturnType<typeof useUpdateQuestion>;
  deleteMutation: ReturnType<typeof useDeleteQuestion>;
}

const PROMPT_MAX_LENGTH = 500;

export function useEditableQuestion({ 
  question, 
  onSaveSuccess, 
  onDeleteSuccess 
}: UseEditableQuestionConfig): UseEditableQuestionReturn {
  
  // Local form state
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(question.prompt);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Service layer hooks
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();
  
  // Computed state
  const isLoading = updateMutation.isPending || deleteMutation.isPending;
  const hasChanges = prompt !== question.prompt;
  const canSave = prompt.trim().length > 0 && prompt.trim().length <= PROMPT_MAX_LENGTH && !isLoading;
  
  /**
   * Start editing mode and reset form to current question values
   */
  const startEditing = useCallback(() => {
    setPrompt(question.prompt);
    setLocalError(null);
    setIsEditing(true);
  }, [question.prompt]);
  
  /**
   * Cancel editing and reset form state
   */
  const cancelEditing = useCallback(() => {
    setPrompt(question.prompt);
    setLocalError(null);
    setIsEditing(false);
  }, [question.prompt]);
  
  /**
   * Update prompt with validation
   */
  const updatePrompt = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  }, [localError]);
  
  /**
   * Validate form inputs using validation utilities
   */
  const validateForm = useCallback((): string | null => {
    const promptResult = formValidators.questionPrompt(prompt);
    if (!promptResult.isValid) {
      return promptResult.error!;
    }
    
    return null;
  }, [prompt]);
  
  /**
   * Save question changes with validation
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
      const trimmedPrompt = prompt.trim();
      
      const updateData: UpdateQuestionInput = {
        prompt: trimmedPrompt,
      };
      
      await updateMutation.mutateAsync({
        id: question.id,
        input: updateData,
      });
      
      // Success - exit editing mode
      setIsEditing(false);
      onSaveSuccess?.();
      
    } catch (error) {
      // Error is handled by the mutation hook and displayed via updateMutation.error
      console.error('Question save failed:', error);
    }
  }, [
    validateForm, 
    prompt, 
    question.id, 
    updateMutation, 
    onSaveSuccess
  ]);
  
  /**
   * Delete question with confirmation
   */
  const deleteQuestion = useCallback(async () => {
    const confirmed = confirm(
      'Are you sure you want to delete this question? This will also delete any answers.'
    );
    
    if (!confirmed) return;
    
    try {
      await deleteMutation.mutateAsync(question.id);
      onDeleteSuccess?.();
    } catch (error) {
      // Error is handled by the mutation hook and displayed via deleteMutation.error
      console.error('Question deletion failed:', error);
    }
  }, [question.id, deleteMutation, onDeleteSuccess]);
  
  return {
    // Form state
    isEditing,
    prompt,
    localError,
    
    // Computed state
    isLoading,
    hasChanges,
    canSave,
    
    // Actions
    startEditing,
    cancelEditing,
    updatePrompt,
    save,
    delete: deleteQuestion,
    
    // Mutation states for advanced UI feedback
    updateMutation,
    deleteMutation,
  };
}