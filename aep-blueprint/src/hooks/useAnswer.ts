// This file is deprecated - use /hooks/answers.ts instead
// Keeping for backward compatibility during transition

import { useAnswer as useNewAnswer } from './answers';

export function useAnswer(questionId: string) {
  const { data: answer, isLoading: loading, error } = useNewAnswer(questionId);
  
  if (error) {
    console.error("Error fetching answer:", error);
  }
  
  return { answer, loading };
}