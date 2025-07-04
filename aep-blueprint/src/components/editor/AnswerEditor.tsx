"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { uploadImageToSupabase } from "@/lib/image-upload";

interface AnswerEditorProps {
  questionId: string;
  initialContent?: Record<string, unknown>;
  initialStatus?: "draft" | "final";
  onSave?: () => void;
}

export function AnswerEditor({
  questionId,
  initialContent,
  initialStatus = "draft",
  onSave,
}: AnswerEditorProps) {
  const [status, setStatus] = useState<"draft" | "final">(initialStatus);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: initialContent || "",
    onUpdate: () => {
      setHasChanges(true);
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
      setHasChanges(false);
    }
  }, [editor, initialContent]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    setSaving(true);
    try {
      const content = editor.getJSON();
      
      const { error } = await supabase
        .from("answers")
        .upsert({
          question_id: questionId,
          content,
          status,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error("Error saving answer:", error);
    } finally {
      setSaving(false);
    }
  }, [editor, questionId, status, onSave]);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      try {
        // Show loading state
        editor.chain().focus().setImage({ src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJWNk0xMiAyVjZNMTIgMThWMjJNMTIgMThWMjJNNiAxMkgyTTYgMTJIMk0yMiAxMkgxOE0yMiAxMkgxOE00LjkzIDQuOTNMNy43NiA3Ljc2TTQuOTMgNC45M0w3Ljc2IDcuNzZNMTkuMDcgMTkuMDdMMTYuMjQgMTYuMjRNMTkuMDcgMTkuMDdMMTYuMjQgMTYuMjRNMTkuMDcgNC45M0wxNi4yNCA3Ljc2TTE5LjA3IDQuOTNMMTYuMjQgNy43Nk00LjkzIDE5LjA3TDcuNzYgMTYuMjRNNC45MyAxOS4wN0w3Ljc2IDE2LjI0IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgdHlwZT0icm90YXRlIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgdmFsdWVzPSIwIDEyIDEyOzM2MCAxMiAxMiI+PC9hbmltYXRlVHJhbnNmb3JtPgo8L3BhdGg+Cjwvc3ZnPgo=' }).run();

        // Upload to Supabase Storage
        const publicUrl = await uploadImageToSupabase(file);
        
        // Update with actual image URL
        editor.chain().focus().setImage({ src: publicUrl }).run();
      } catch (error) {
        console.error('Image upload failed:', error);
        // Remove loading image on error
        editor.chain().focus().deleteSelection().run();
        alert('Failed to upload image. Please try again.');
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="mb-2 flex gap-2 border-b pb-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-gray-200" : ""}
          >
            <strong>B</strong>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-gray-200" : ""}
          >
            <em>I</em>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
          >
            • List
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
          >
            1. List
          </Button>
          <Button size="sm" variant="ghost" onClick={handleImageUpload}>
            📷 Image
          </Button>
        </div>
        <EditorContent
          editor={editor}
          className="prose max-w-none min-h-[200px] focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
            />
            Draft
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              value="final"
              checked={status === "final"}
              onChange={() => setStatus("final")}
            />
            Final
          </label>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}