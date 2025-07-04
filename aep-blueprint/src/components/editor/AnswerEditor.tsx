"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

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

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;

      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
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