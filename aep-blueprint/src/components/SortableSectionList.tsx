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
import { SortableSectionCard } from "./SortableSectionCard";
import { SectionCard } from "./SectionCard";
import { useUpdateSectionOrder } from "@/hooks/sections";

import type { Section } from "@/types/database";

interface SortableSectionListProps {
  sections: Section[];
  onSectionsChange: () => void;
}

export function SortableSectionList({ sections, onSectionsChange }: SortableSectionListProps) {
  const [items, setItems] = useState(sections);
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateSectionOrderMutation = useUpdateSectionOrder();

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

          await updateSectionOrderMutation.mutateAsync(orderUpdates);
          onSectionsChange();
        } catch (error) {
          console.error("Error updating section order:", error);
          // Revert optimistic update on error
          setItems(sections);
        }
      }
    }
  };

  // Update items when sections prop changes
  useEffect(() => {
    setItems(sections);
  }, [sections]);

  return (
    <div className="space-y-6">
      {updateSectionOrderMutation.isPending && (
        <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Updating section order...
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={items.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {items.map((section) => (
            <SortableSectionCard
              key={section.id}
              section={section}
            />
          ))}
        </SortableContext>
        
        <DragOverlay>
          {activeId ? (
            <div className="w-full aep-card opacity-95 rotate-2 shadow-lg">
              <SectionCard
                section={items.find(s => s.id === activeId)!}
                dragHandleProps={{}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}