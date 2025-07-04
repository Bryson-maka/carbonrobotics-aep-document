"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SortableSectionItemProps {
  section: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onEdit: (section: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onDelete: (sectionId: string) => void;
}

export function SortableSectionItem({
  section,
  onEdit,
  onDelete,
}: SortableSectionItemProps) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{section.title}</h3>
        {section.description && (
          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {section.questions?.length || 0} questions
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/admin/sections/${section.id}`}>
          <Button size="sm" variant="outline">
            <ExternalLink className="w-4 h-4 mr-1" />
            Manage Questions
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(section)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(section.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}