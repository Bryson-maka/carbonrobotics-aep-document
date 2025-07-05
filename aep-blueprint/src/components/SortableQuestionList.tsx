"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
import { SortableQuestionCard } from "./SortableQuestionCard";
import { AddQuestionCard } from "./AddQuestionCard";
import { useUpdateQuestionOrder } from "@/hooks/questions";
import type { Question } from "@/types/database";

interface SortableQuestionListProps {
  questions: Question[];
  sectionId: string;
  onQuestionsChange: () => void;
}

export function SortableQuestionList({ questions, sectionId, onQuestionsChange }: SortableQuestionListProps) {
  const [items, setItems] = useState(questions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateQuestionOrderMutation = useUpdateQuestionOrder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order_idx: index + 1,
        }));
        
        // Optimistic update
        setItems(updatedItems);

        // Update order_idx in database using service layer
        try {
          const orderUpdates = updatedItems.map((item, index) => ({
            id: item.id,
            order_idx: index + 1,
          }));

          await updateQuestionOrderMutation.mutateAsync({
            sectionId,
            updates: orderUpdates
          });
          onQuestionsChange();
        } catch (error) {
          console.error("Error updating question order:", error);
          // Revert optimistic update on error
          setItems(questions);
        }
      }
    }
  };

  // Update items when questions prop changes
  useEffect(() => {
    setItems(questions);
  }, [questions]);

  if (!questions || questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="text-lg mb-2">📝</div>
          <div>No questions in this section yet.</div>
        </div>
        <AddQuestionCard sectionId={sectionId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updateQuestionOrderMutation.isPending && (
        <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Updating question order...
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={items.map(q => q.id)} strategy={verticalListSortingStrategy}>
          {items.map((question) => (
            <SortableQuestionCard
              key={question.id}
              question={question}
              onQuestionUpdate={onQuestionsChange}
              onQuestionDelete={onQuestionsChange}
            />
          ))}
        </SortableContext>
        
        <DragOverlay>
          {activeId ? (
            <div 
              className="p-4 rounded-lg mb-2 opacity-95 rotate-1 shadow-lg" 
              style={{ backgroundColor: 'var(--color-bg-primary)' }}
            >
              <div className="font-medium text-base" style={{ color: 'var(--color-text-primary)' }}>
                {items.find(q => q.id === activeId)?.prompt}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      <AddQuestionCard sectionId={sectionId} />
    </div>
  );
}