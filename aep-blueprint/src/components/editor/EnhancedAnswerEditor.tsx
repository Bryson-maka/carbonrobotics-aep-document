"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartBuilder } from "./ChartBuilder";
import { MediaUploader } from "./MediaUploader";
import { InteractiveBuilder } from "./InteractiveBuilder";
import { useUpsertAnswer } from "@/hooks/answers";

interface EnhancedAnswerEditorProps {
  questionId: string;
  initialContent?: Record<string, unknown>;
  initialStatus?: "draft" | "final";
  initialContentType?: string;
  onSave?: () => void;
}

export function EnhancedAnswerEditor({
  questionId,
  initialContent,
  initialStatus = "draft",
  initialContentType = "text",
  onSave,
}: EnhancedAnswerEditorProps) {
  const [status, setStatus] = useState<"draft" | "final">(initialStatus);
  const [contentType] = useState(initialContentType); // setContentType currently unused but keeping for future use
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  const upsertAnswerMutation = useUpsertAnswer();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: initialContent || "",
    immediatelyRender: false, // Fix SSR hydration issues
    onUpdate: () => {
      setHasChanges(true);
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      // Only set content if it's valid TipTap content (not chart data)
      if (typeof initialContent === 'object' && 'type' in initialContent && initialContent.type === 'doc') {
        editor.commands.setContent(initialContent);
      } else if (typeof initialContent === 'string') {
        editor.commands.setContent(initialContent);
      }
      // Don't set content if it contains chart data
      setHasChanges(false);
    }
  }, [editor, initialContent]);

  // Check for changes when status or contentType changes
  useEffect(() => {
    const statusChanged = status !== initialStatus;
    const contentTypeChanged = contentType !== initialContentType;
    
    if (statusChanged || contentTypeChanged) {
      setHasChanges(true);
    }
  }, [status, contentType, initialStatus, initialContentType]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.getJSON();
      
      await upsertAnswerMutation.mutateAsync({
        questionId,
        input: {
          content,
          status,
          content_type: contentType as "text" | "chart" | "media" | "interactive",
        },
      });

      setHasChanges(false);
      onSave?.();
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  }, [editor, questionId, status, contentType, onSave, upsertAnswerMutation]);

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

  const contentTypes = [
    {
      id: "text",
      label: "Rich Text",
      icon: "📝",
      description: "Rich text editor with formatting, images, and links",
    },
    {
      id: "chart",
      label: "Data Visualization",
      icon: "📊",
      description: "Interactive charts and graphs",
    },
    {
      id: "media",
      label: "Media Gallery",
      icon: "🖼️",
      description: "Images, videos, and document attachments",
    },
    {
      id: "interactive",
      label: "Interactive Content",
      icon: "🎯",
      description: "Polls, surveys, decision matrices",
    },
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enhanced Answer Editor</CardTitle>
          <CardDescription>
            Create rich content with multiple formats including text, charts, media, and interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {contentTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="text" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              <ChartBuilder 
                questionId={questionId} 
                initialConfig={initialContent?.chart as any}
                onSave={() => {
                  setHasChanges(true);
                  onSave?.();
                }} 
              />
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <MediaUploader questionId={questionId} onSave={() => setHasChanges(true)} />
            </TabsContent>

            <TabsContent value="interactive" className="space-y-4">
              <InteractiveBuilder questionId={questionId} onSave={() => setHasChanges(true)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {upsertAnswerMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          Error saving answer: {upsertAnswerMutation.error.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
          <Badge variant={contentType === "text" ? "default" : "secondary"}>
            {contentTypes.find(t => t.id === contentType)?.label || "Text"}
          </Badge>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || upsertAnswerMutation.isPending}
        >
          {upsertAnswerMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}