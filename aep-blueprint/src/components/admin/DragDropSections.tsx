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

import { SortableSectionItem } from "./SortableSectionItem";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface DragDropSectionsProps {
  sections: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  onEdit: (section: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function DragDropSections({ sections, onEdit }: DragDropSectionsProps) {
  const [items, setItems] = useState(sections);
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
            .from("sections")
            .update({ order_idx: update.order_idx })
            .eq("id", update.id);
        }

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      } catch (error) {
        console.error("Error updating section order:", error);
        alert("Failed to update section order. Please refresh the page.");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm("Are you sure? This will delete the section and all its questions.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["sections"] });
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Failed to delete section. Please try again.");
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
          {items.map((section) => (
            <SortableSectionItem
              key={section.id}
              section={section}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}