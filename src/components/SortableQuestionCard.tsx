"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateQuestion, useDeleteQuestion } from "@/hooks/questions";
import type { Question } from "@/types/database";

interface SortableQuestionCardProps {
  question: Question;
  onQuestionUpdate?: () => void;
  onQuestionDelete?: () => void;
}

export function SortableQuestionCard({ 
  question, 
  onQuestionUpdate, 
  onQuestionDelete 
}: SortableQuestionCardProps) {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editPrompt, setEditPrompt] = useState(question.prompt);
  const [error, setError] = useState<string | null>(null);

  // Service layer hooks
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const isLoading = updateQuestionMutation.isPending || deleteQuestionMutation.isPending;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  const handleSaveQuestion = async () => {
    const trimmedPrompt = editPrompt.trim();
    if (!trimmedPrompt) {
      setError("Question prompt is required");
      return;
    }
    
    if (trimmedPrompt.length > 500) {
      setError("Question prompt must be less than 500 characters");
      return;
    }

    setError(null);
    
    try {
      await updateQuestionMutation.mutateAsync({
        id: question.id,
        input: { prompt: trimmedPrompt }
      });

      setIsEditingQuestion(false);
      onQuestionUpdate?.();
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirm(`Are you sure you want to delete this question? This will also delete any answers.`)) {
      return;
    }
    
    try {
      await deleteQuestionMutation.mutateAsync(question.id);
      onQuestionDelete?.();
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditPrompt(question.prompt);
    setError(null);
    setIsEditingQuestion(false);
  };

  if (isEditingQuestion) {
    return (
      <div ref={setNodeRef} style={{
        ...style,
        backgroundColor: 'var(--color-bg-sidebar)', 
        border: '1px solid var(--color-border-custom)'
      }} className="p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div 
            {...attributes}
            {...listeners}
            className="cursor-move p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="Drag to reorder"
            style={{ touchAction: 'none' }}
          >
            ⋮⋮
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Editing Question
          </div>
        </div>
        
        {(error || updateQuestionMutation.error) && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error || updateQuestionMutation.error?.message}
          </div>
        )}
        
        <div>
          <Input
            value={editPrompt}
            onChange={(e) => {
              setEditPrompt(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Question prompt"
            className="font-medium"
            style={{ 
              backgroundColor: 'var(--color-bg-primary)', 
              borderColor: error ? '#ef4444' : 'var(--color-border-custom)',
              color: 'var(--color-text-primary)'
            }}
            disabled={isLoading}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {editPrompt.length}/500 characters
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveQuestion}
            disabled={isLoading || !editPrompt.trim()}
            className="aep-button text-xs"
          >
            {updateQuestionMutation.isPending ? "Saving..." : "Save"}
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
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      className="p-4 rounded-lg mb-2" 
      style={{ 
        ...style,
        backgroundColor: 'var(--color-bg-primary)' 
      }}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div 
          {...attributes}
          {...listeners}
          className="cursor-move p-2 text-gray-400 hover:text-gray-600 mt-2 flex-shrink-0"
          title="Drag to reorder"
          style={{ touchAction: 'none' }}
        >
          ⋮⋮
        </div>

        {/* Question content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 mr-4">
              <p className="font-medium text-base" style={{ color: 'var(--color-text-primary)' }}>
                {question.prompt}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingQuestion(true);
                }}
                className="text-xs px-2 py-1 text-blue-400 hover:text-blue-600"
                title="Edit question"
                disabled={isLoading}
              >
                ✏️
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuestion();
                }}
                className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
                title="Delete question"
                disabled={isLoading}
              >
                {deleteQuestionMutation.isPending ? "⏳" : "🗑️"}
              </Button>
            </div>
          </div>

          {/* Error display for mutations */}
          {deleteQuestionMutation.error && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
              {deleteQuestionMutation.error.message}
            </div>
          )}

          {/* Answer section - always show when not editing the question */}
          {!isEditingQuestion && (
            <div className="mt-3">
              <QuestionCard 
                questionId={question.id}
                prompt="" // Don't show prompt again since it's already shown above
                userRole="editor"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}