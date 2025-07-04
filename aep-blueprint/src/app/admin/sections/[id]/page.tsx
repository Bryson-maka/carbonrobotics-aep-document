"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { QuestionFormDialog } from "@/components/admin/QuestionFormDialog";
import { DragDropQuestions } from "@/components/admin/DragDropQuestions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminSectionQuestionsPage({ params }: PageProps) {
  const [sectionId, setSectionId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Unwrap params
  React.useEffect(() => {
    params.then((resolvedParams) => {
      setSectionId(resolvedParams.id);
    });
  }, [params]);

  const { data: section, isLoading } = useQuery({
    queryKey: ["section", sectionId],
    queryFn: async () => {
      if (!sectionId) return null;
      const { data } = await supabase
        .from("sections")
        .select(`
          *,
          questions (
            id,
            prompt,
            order_idx,
            created_at
          )
        `)
        .eq("id", sectionId)
        .single();
      return data;
    },
    enabled: !!sectionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading section...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Section not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/sections">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sections
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {section.title}
              </h1>
              <p className="text-gray-600">
                Manage questions for this section
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Questions ({section.questions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {section.questions && section.questions.length > 0 ? (
                <DragDropQuestions
                  questions={section.questions}
                  sectionId={sectionId}
                  onEdit={setEditingQuestion}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No questions yet. Click &quot;Add Question&quot; to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <QuestionFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          mode="create"
          sectionId={sectionId}
        />

        <QuestionFormDialog
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          mode="edit"
          question={editingQuestion}
          sectionId={sectionId}
        />
      </div>
    </div>
  );
}