import { 
  useMutation, 
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { questionService } from '@/services/questionService';
import { sectionKeys } from './sections';
import type {
  Question,
  CreateQuestionInput,
  UpdateQuestionInput,
  ServiceError,
  Section,
} from '@/types/database';

/**
 * React Query hooks for questions - standardized patterns
 * 
 * Design principles:
 * 1. Leverage section cache for question data (questions are always part of sections)
 * 2. Optimistic updates with proper rollback
 * 3. Automatic section cache invalidation
 * 4. Type-safe throughout
 */

/**
 * Hook to create a new question with optimistic updates
 */
export function useCreateQuestion(): UseMutationResult<Question, ServiceError, CreateQuestionInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuestionInput) => {
      const response = await questionService.createQuestion(input);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    onSuccess: (newQuestion) => {
      // Update sections cache to include new question
      queryClient.setQueryData<Section[]>(
        sectionKeys.list(), 
        (oldSections = []) => oldSections.map(section => 
          section.id === newQuestion.section_id 
            ? {
                ...section, 
                questions: [...(section.questions || []), newQuestion]
                  .sort((a, b) => a.order_idx - b.order_idx)
              }
            : section
        )
      );

      // Invalidate section details if cached
      queryClient.invalidateQueries({ 
        queryKey: sectionKeys.detail(newQuestion.section_id) 
      });
    },
    onError: (error) => {
      console.error('Failed to create question:', error);
    },
  });
}

/**
 * Hook to update a question with optimistic updates
 */
export function useUpdateQuestion(): UseMutationResult<
  Question, 
  ServiceError, 
  { id: string; input: UpdateQuestionInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }) => {
      const response = await questionService.updateQuestion(id, input);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    onMutate: async ({ id, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());

      // Optimistically update sections list
      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.list(),
          previousSections.map(section => ({
            ...section,
            questions: section.questions?.map(question => 
              question.id === id 
                ? { ...question, ...input }
                : question
            ) || []
          }))
        );
      }

      return { previousSections };
    },
    onError: (error, _, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      console.error('Failed to update question:', error);
    },
    onSettled: (updatedQuestion) => {
      // Refresh data from server to ensure consistency
      if (updatedQuestion) {
        queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
        queryClient.invalidateQueries({ 
          queryKey: sectionKeys.detail(updatedQuestion.section_id) 
        });
      }
    },
  });
}

/**
 * Hook to delete a question with optimistic updates
 */
export function useDeleteQuestion(): UseMutationResult<void, ServiceError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await questionService.deleteQuestion(id);
      if (response.error) {
        throw response.error;
      }
    },
    onMutate: async (questionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());

      // Optimistically remove from sections
      if (previousSections) {
        queryClient.setQueryData<Section[]>(
          sectionKeys.list(),
          previousSections.map(section => ({
            ...section,
            questions: section.questions?.filter(question => question.id !== questionId) || []
          }))
        );
      }

      return { previousSections };
    },
    onError: (error, questionId, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      console.error('Failed to delete question:', error);
    },
    onSettled: () => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
  });
}

/**
 * Hook to update question order with optimistic updates
 */
export function useUpdateQuestionOrder(): UseMutationResult<
  void, 
  ServiceError, 
  { sectionId: string; updates: { id: string; order_idx: number }[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }) => {
      const response = await questionService.updateQuestionOrder(updates);
      if (response.error) {
        throw response.error;
      }
    },
    onMutate: async ({ sectionId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: sectionKeys.all });

      // Snapshot previous values
      const previousSections = queryClient.getQueryData<Section[]>(sectionKeys.list());

      // Optimistically update question order
      if (previousSections) {
        const updateMap = new Map(updates.map(u => [u.id, u.order_idx]));
        
        queryClient.setQueryData<Section[]>(
          sectionKeys.list(),
          previousSections.map(section => 
            section.id === sectionId
              ? {
                  ...section,
                  questions: (section.questions || [])
                    .map(question => ({
                      ...question,
                      order_idx: updateMap.get(question.id) ?? question.order_idx,
                    }))
                    .sort((a, b) => a.order_idx - b.order_idx)
                }
              : section
          )
        );
      }

      return { previousSections };
    },
    onError: (error, _, context) => {
      // Rollback optimistic updates
      if (context?.previousSections) {
        queryClient.setQueryData(sectionKeys.list(), context.previousSections);
      }
      console.error('Failed to update question order:', error);
    },
    onSettled: (_, __, { sectionId }) => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: sectionKeys.detail(sectionId) 
      });
    },
  });
}