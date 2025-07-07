"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SectionCard } from "./SectionCard";

import type { Section } from "@/types/database";

interface SortableSectionCardProps {
  section: Section;
  onSectionUpdate?: () => void;
  onSectionDelete?: () => void;
}

export function SortableSectionCard({ section }: SortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  // Create drag handle props that include both attributes and listeners
  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full aep-card">
      <SectionCard
        section={section}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}