"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSection } from "@/hooks/sections";
import { Plus } from "lucide-react";

export function AddSectionCard() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createSectionMutation = useCreateSection();

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Section title is required");
      return;
    }

    setError(null);

    try {
      await createSectionMutation.mutateAsync({
        title: trimmedTitle,
        description: description.trim() || undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to create section:", error);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setError(null);
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <div className="w-full aep-card">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full p-8 rounded-lg border-2 border-dashed transition-all hover:border-solid flex items-center justify-center gap-3"
          style={{
            borderColor: 'var(--color-border-custom)',
            backgroundColor: 'var(--color-bg-sidebar)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Plus size={24} />
          <span className="text-lg font-medium">Add New Section</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full aep-card">
      <div className="p-4 space-y-3" style={{
        backgroundColor: 'var(--color-bg-sidebar)',
        border: '1px solid var(--color-border-custom)'
      }}>
        <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Creating New Section
        </div>

        {(error || createSectionMutation.error) && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error || createSectionMutation.error?.message}
          </div>
        )}

        <div>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Section title"
            className="font-semibold text-lg"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: error ? '#ef4444' : 'var(--color-border-custom)',
              color: 'var(--color-text-primary)'
            }}
            disabled={createSectionMutation.isPending}
            autoFocus
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {title.length}/200 characters
          </div>
        </div>

        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Section description (optional)"
            className="text-sm"
            rows={3}
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border-custom)',
              color: 'var(--color-text-secondary)'
            }}
            disabled={createSectionMutation.isPending}
          />
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {description.length}/1000 characters
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createSectionMutation.isPending || !title.trim()}
            className="aep-button text-xs"
          >
            {createSectionMutation.isPending ? "Creating..." : "Create Section"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={createSectionMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}