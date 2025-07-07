"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

import { SortableQuestionItem } from "./SortableQuestionItem";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface DragDropQuestionsProps {
  questions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  sectionId: string;
  onEdit: (question: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function DragDropQuestions({ questions, sectionId, onEdit }: DragDropQuestionsProps) {
  const [items, setItems] = useState(questions);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update order_idx for all affected items
      setIsUpdating(true);
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          order_idx: index,
        }));

        for (const update of updates) {
          await supabase
            .from("questions")
            .update({ order_idx: update.order_idx })
            .eq("id", update.id);
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      } catch (error) {
        console.error("Error updating question order:", error);
        alert("Failed to update question order. Please refresh the page.");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure? This will delete the question and its answer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question. Please try again.");
    }
  };

  return (
    <div className="space-y-2">
      {isUpdating && (
        <div className="text-sm text-blue-600 mb-2">
          Updating order...
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((question) => (
            <SortableQuestionItem
              key={question.id}
              question={question}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}