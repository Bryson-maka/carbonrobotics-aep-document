"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateQuestion } from "@/hooks/questions";
import { Plus } from "lucide-react";

interface AddQuestionCardProps {
  sectionId: string;
}

export function AddQuestionCard({ sectionId }: AddQuestionCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createQuestionMutation = useCreateQuestion();

  const handleSave = async () => {
    const trimmedPrompt = prompt.trim();
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
      await createQuestionMutation.mutateAsync({
        section_id: sectionId,
        prompt: trimmedPrompt,
      });

      // Reset form
      setPrompt("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to create question:", error);
    }
  };

  const handleCancel = () => {
    setPrompt("");
    setError(null);
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid flex items-center justify-center gap-2"
          style={{
            borderColor: 'var(--color-border-custom)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Plus size={20} />
          <span className="text-sm font-medium">Add New Question</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg space-y-3" style={{
      backgroundColor: 'var(--color-bg-sidebar)',
      border: '1px solid var(--color-border-custom)'
    }}>
      <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        Creating New Question
      </div>

      {(error || createQuestionMutation.error) && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error || createQuestionMutation.error?.message}
        </div>
      )}

      <div>
        <Input
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Question prompt"
          className="font-medium"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: error ? '#ef4444' : 'var(--color-border-custom)',
            color: 'var(--color-text-primary)'
          }}
          disabled={createQuestionMutation.isPending}
          autoFocus
        />
        <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {prompt.length}/500 characters
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={createQuestionMutation.isPending || !prompt.trim()}
          className="aep-button text-xs"
        >
          {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={createQuestionMutation.isPending}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}