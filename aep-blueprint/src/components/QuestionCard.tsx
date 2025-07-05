"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnhancedAnswerEditor } from "./editor/EnhancedAnswerEditor";
import { AnswerViewer } from "./editor/AnswerViewer";
import { useAnswer } from "@/hooks/useAnswer";
import { useDeleteAnswer } from "@/hooks/answers";

interface QuestionCardProps {
  questionId: string;
  prompt: string;
  userRole?: "editor" | "viewer";
}

export function QuestionCard({ 
  questionId, 
  prompt, 
  userRole = "viewer" 
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { answer, loading } = useAnswer(questionId);
  const deleteAnswerMutation = useDeleteAnswer();

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleDeleteAnswer = async () => {
    if (!confirm("Are you sure you want to delete this answer?")) return;
    
    try {
      await deleteAnswerMutation.mutateAsync(questionId);
    } catch (error) {
      console.error("Failed to delete answer:", error);
    }
  };

  const hasAnswer = () => {
    return answer && (
      answer.content || 
      answer.chart_config || 
      (answer.media_urls && answer.media_urls.length > 0) ||
      answer.interactive_data
    );
  };

  if (loading) {
    return (
      <div className="border p-4 rounded-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 space-y-4" style={{ 
      backgroundColor: 'var(--color-bg-sidebar)', 
      border: '1px solid var(--color-border-custom)' 
    }}>
      <div className="flex items-start justify-between">
        {prompt && (
          <p className="font-medium text-base" style={{ color: 'var(--color-text-primary)' }}>
            {prompt}
          </p>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {answer?.status && (
            <Badge 
              variant={answer.status === "final" ? "default" : "secondary"}
              className={answer.status === "final" ? "bg-green-600" : "bg-orange-600"}
            >
              {answer.status.toUpperCase()}
            </Badge>
          )}
          {userRole === "editor" && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={hasAnswer() ? "ghost" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                className={`text-xs px-3 py-1 ${hasAnswer() ? "aep-button" : "aep-button bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                {isEditing ? "Cancel" : hasAnswer() ? "Edit" : "Add Answer"}
              </Button>
              
              {hasAnswer() && !isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAnswer();
                  }}
                  className="text-xs px-2 py-1 text-red-400 hover:text-red-600"
                  disabled={deleteAnswerMutation.isPending}
                >
                  {deleteAnswerMutation.isPending ? "⏳" : "🗑️"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {deleteAnswerMutation.error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
          Error deleting answer: {deleteAnswerMutation.error.message}
        </div>
      )}

      {isEditing ? (
        <EnhancedAnswerEditor
          questionId={questionId}
          initialContent={answer?.content || undefined}
          initialStatus={answer?.status}
          initialContentType={answer?.content_type}
          onSave={handleSave}
        />
      ) : (
        <AnswerViewer
          answer={answer || undefined}
        />
      )}
    </div>
  );
}