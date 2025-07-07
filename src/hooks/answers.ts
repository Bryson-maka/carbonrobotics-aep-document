import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { answerService } from '@/services/answerService';
import type { Answer, ServiceError } from '@/types/database';

/**
 * Query key factory for answers
 */
export const answerKeys = {
  all: ['answers'] as const,
  byQuestion: (questionId: string) => [...answerKeys.all, 'question', questionId] as const,
};

/**
 * Hook to get answer by question ID
 */
export function useAnswer(questionId: string) {
  return useQuery({
    queryKey: answerKeys.byQuestion(questionId),
    queryFn: async () => {
      const response = await answerService.getAnswerByQuestionId(questionId);
      if (response.error) {
        throw response.error;
      }
      return response.data; // This can be null
    },
    enabled: !!questionId,
  });
}

/**
 * Hook to create or update an answer with optimistic updates
 */
export function useUpsertAnswer(): UseMutationResult<
  Answer,
  ServiceError,
  { questionId: string; input: Partial<Answer> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, input }) => {
      const response = await answerService.upsertAnswer(questionId, input);
      if (response.error) {
        throw response.error;
      }
      return response.data!;
    },
    onMutate: async ({ questionId, input }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: answerKeys.byQuestion(questionId) });

      // Snapshot previous value
      const previousAnswer = queryClient.getQueryData<Answer | null>(answerKeys.byQuestion(questionId));

      // Optimistically update answer
      queryClient.setQueryData<Answer | null>(
        answerKeys.byQuestion(questionId),
        previousAnswer ? { ...previousAnswer, ...input } : (input as Answer)
      );

      return { previousAnswer };
    },
    onError: (error, { questionId }, context) => {
      // Rollback optimistic update
      if (context?.previousAnswer !== undefined) {
        queryClient.setQueryData(answerKeys.byQuestion(questionId), context.previousAnswer);
      }
      console.error('Failed to save answer:', error);
    },
    onSettled: (updatedAnswer, error, { questionId }) => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: answerKeys.byQuestion(questionId) });
      
      // Also invalidate section progress since answers affect progress
      queryClient.invalidateQueries({ queryKey: ['section-progress'] });
    },
  });
}

/**
 * Hook to delete an answer with optimistic updates
 */
export function useDeleteAnswer(): UseMutationResult<void, ServiceError, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      const response = await answerService.deleteAnswer(questionId);
      if (response.error) {
        throw response.error;
      }
    },
    onMutate: async (questionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: answerKeys.byQuestion(questionId) });

      // Snapshot previous value
      const previousAnswer = queryClient.getQueryData<Answer | null>(answerKeys.byQuestion(questionId));

      // Optimistically remove answer
      queryClient.setQueryData<Answer | null>(answerKeys.byQuestion(questionId), null);

      return { previousAnswer };
    },
    onError: (error, questionId, context) => {
      // Rollback optimistic update
      if (context?.previousAnswer !== undefined) {
        queryClient.setQueryData(answerKeys.byQuestion(questionId), context.previousAnswer);
      }
      console.error('Failed to delete answer:', error);
    },
    onSettled: (_, __, questionId) => {
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: answerKeys.byQuestion(questionId) });
      
      // Also invalidate section progress since answers affect progress
      queryClient.invalidateQueries({ queryKey: ['section-progress'] });
    },
  });
}