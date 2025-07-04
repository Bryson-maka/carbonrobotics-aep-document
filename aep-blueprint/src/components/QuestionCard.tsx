"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnswerEditor } from "./editor/AnswerEditor";
import { AnswerViewer } from "./editor/AnswerViewer";
import { useAnswer } from "@/hooks/useAnswer";

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

  const handleSave = () => {
    setIsEditing(false);
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
    <div className="border p-4 rounded-md space-y-4">
      <div className="flex items-start justify-between">
        <p className="font-medium">{prompt}</p>
        <div className="flex items-center gap-2">
          {answer?.status && (
            <Badge variant={answer.status === "final" ? "default" : "secondary"}>
              {answer.status}
            </Badge>
          )}
          {userRole === "editor" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <AnswerEditor
          questionId={questionId}
          initialContent={answer?.content}
          initialStatus={answer?.status}
          onSave={handleSave}
        />
      ) : (
        <AnswerViewer
          content={answer?.content}
          status={answer?.status}
        />
      )}
    </div>
  );
}