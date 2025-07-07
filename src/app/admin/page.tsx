"use client";

import { useState } from "react";
import { useSections } from "@/hooks/sections";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonManager } from "@/components/JsonManager";
import { useToast } from "@/components/ui/toast";

export default function AdminPage() {
  const { data: sections, refetch } = useSections();
  const { addToast } = useToast();
  const [newSection, setNewSection] = useState({ title: "", description: "" });
  const [newQuestion, setNewQuestion] = useState({ sectionId: "", prompt: "" });
  const [loading, setLoading] = useState(false);

  const createSection = async () => {
    if (!newSection.title) return;
    
    setLoading(true);
    try {
      const orderValues = sections?.map(s => s.order_idx) || [];
      const maxOrder = orderValues.length > 0 ? Math.max(...orderValues) : 0;
      
      const { error } = await supabase
        .from("sections")
        .insert({
          title: newSection.title,
          description: newSection.description,
          order_idx: maxOrder + 1
        });

      if (error) throw error;

      setNewSection({ title: "", description: "" });
      refetch();
    } catch (error) {
      console.error("Error creating section:", error);
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    if (!newQuestion.prompt || !newQuestion.sectionId) return;
    
    setLoading(true);
    try {
      const section = sections?.find(s => s.id === newQuestion.sectionId);
      const existingQuestions = section?.questions || [];
      const maxOrder = existingQuestions.length > 0 
        ? Math.max(...existingQuestions.map(q => q.order_idx)) 
        : 0;
      
      const { error } = await supabase
        .from("questions")
        .insert({
          section_id: newQuestion.sectionId,
          prompt: newQuestion.prompt,
          order_idx: maxOrder + 1
        });

      if (error) throw error;

      setNewQuestion({ sectionId: "", prompt: "" });
      refetch();
    } catch (error) {
      console.error("Error creating question:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure? This will delete all questions in this section.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error deleting section:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure? This will delete the question and any answers.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setLoading(false);
    }
  };

  const importFromJson = async (jsonData: { sections: Array<{ title: string; description?: string; questions: string[] }> }) => {
    setLoading(true);
    try {
      // Get current max order index
      const orderValues = sections?.map(s => s.order_idx) || [];
      const currentMaxOrder = orderValues.length > 0 ? Math.max(...orderValues) : 0;
      
      // Process each section
      for (let i = 0; i < jsonData.sections.length; i++) {
        const sectionData = jsonData.sections[i];
        
        // Create section
        const { data: newSectionData, error: sectionError } = await supabase
          .from("sections")
          .insert({
            title: sectionData.title,
            description: sectionData.description || "",
            order_idx: currentMaxOrder + i + 1
          })
          .select()
          .single();

        if (sectionError) throw sectionError;

        // Create questions for this section
        const questionsToInsert = sectionData.questions.map((question, idx) => ({
          section_id: newSectionData.id,
          prompt: question,
          order_idx: idx + 1
        }));

        if (questionsToInsert.length > 0) {
          const { error: questionsError } = await supabase
            .from("questions")
            .insert(questionsToInsert);

          if (questionsError) throw questionsError;
        }
      }

      refetch();
      addToast({
        message: `Successfully imported ${jsonData.sections.length} sections`,
        type: "success"
      });
    } catch (error) {
      console.error("Error importing from JSON:", error);
      addToast({
        message: "Failed to import sections. Please check the console for details.",
        type: "error"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="aep-header mb-8">
        <h1 className="text-3xl font-light">AEP Blueprint Admin</h1>
        <p className="text-lg opacity-90">Manage sections and questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Section */}
        <Card className="aep-card">
          <CardHeader>
            <CardTitle>Create New Section</CardTitle>
            <CardDescription>Add a new section to the blueprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Section title"
              value={newSection.title}
              onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Section description (optional)"
              value={newSection.description}
              onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
            />
            <Button 
              onClick={createSection} 
              disabled={loading || !newSection.title}
              className="aep-button w-full"
            >
              Create Section
            </Button>
          </CardContent>
        </Card>

        {/* Create Question */}
        <Card className="aep-card">
          <CardHeader>
            <CardTitle>Create New Question</CardTitle>
            <CardDescription>Add a question to an existing section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="w-full p-2 rounded border"
              value={newQuestion.sectionId}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, sectionId: e.target.value }))}
              style={{ 
                backgroundColor: 'var(--color-bg-primary)', 
                borderColor: 'var(--color-border-custom)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">Select a section...</option>
              {sections?.map(section => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            <Textarea
              placeholder="Question prompt"
              value={newQuestion.prompt}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, prompt: e.target.value }))}
            />
            <Button 
              onClick={createQuestion} 
              disabled={loading || !newQuestion.prompt || !newQuestion.sectionId}
              className="aep-button w-full"
            >
              Create Question
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* JSON Manager */}
      <div className="mt-8">
        <JsonManager 
          sections={sections} 
          onImport={importFromJson}
        />
      </div>

      {/* Sections List */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Current Sections ({sections?.length || 0})
        </h2>
        
        <div className="space-y-6">
          {sections?.map(section => (
            <Card key={section.id} className="aep-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle style={{ color: 'var(--color-text-primary)' }}>
                      {section.title}
                    </CardTitle>
                    {section.description && (
                      <CardDescription style={{ color: 'var(--color-text-secondary)' }}>
                        {section.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {section.questions?.length || 0} questions
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSection(section.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {section.questions && section.questions.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {section.questions
                      .sort((a, b) => a.order_idx - b.order_idx)
                      .map((question, index) => (
                        <div 
                          key={question.id} 
                          className="flex items-start justify-between p-3 rounded"
                          style={{ backgroundColor: 'var(--color-bg-primary)' }}
                        >
                          <div className="flex-1">
                            <span className="text-sm text-gray-400 mr-2">
                              Q{index + 1}:
                            </span>
                            <span style={{ color: 'var(--color-text-primary)' }}>
                              {question.prompt}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-400 hover:text-red-600 ml-2"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}