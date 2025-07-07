"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { HistoryModal } from "./HistoryModal";

interface SortableQuestionItemProps {
  question: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onEdit: (question: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onDelete: (questionId: string) => void;
}

export function SortableQuestionItem({
  question,
  onEdit,
  onDelete,
}: SortableQuestionItemProps) {
  const [showHistory, setShowHistory] = useState(false);
  
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
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-sm"
      >
        <button
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <p className="text-gray-900 leading-relaxed">{question.prompt}</p>
          <div className="text-xs text-gray-500 mt-2">
            Created: {new Date(question.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setShowHistory(true);
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(question);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(question.id);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <HistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        questionId={question.id}
        questionPrompt={question.prompt}
      />
    </>
  );
}