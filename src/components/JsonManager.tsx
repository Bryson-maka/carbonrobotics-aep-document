"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Section } from "@/types/database";

interface JsonSection {
  title: string;
  description?: string;
  questions: string[];
}

interface JsonData {
  sections: JsonSection[];
}

interface JsonManagerProps {
  sections: Section[] | undefined;
  onImport: (data: JsonData) => Promise<void>;
}

export function JsonManager({ sections, onImport }: JsonManagerProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"template" | "view" | "import">("template");
  const [importJson, setImportJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Generate JSON template
  const jsonTemplate: JsonData = {
    sections: [
      {
        title: "Example Section Title",
        description: "Optional section description",
        questions: [
          "First question in this section?",
          "Second question in this section?",
          "Third question in this section?"
        ]
      },
      {
        title: "Another Section",
        questions: [
          "Questions don't need descriptions",
          "You can have as many as needed"
        ]
      }
    ]
  };

  // Convert current sections to JSON format
  const currentProjectJson = useMemo(() => {
    if (!sections || sections.length === 0) return null;

    const jsonData: JsonData = {
      sections: sections
        .sort((a, b) => a.order_idx - b.order_idx)
        .map(section => ({
          title: section.title,
          ...(section.description && { description: section.description }),
          questions: (section.questions || [])
            .sort((a, b) => a.order_idx - b.order_idx)
            .map(q => q.prompt)
        }))
    };

    return jsonData;
  }, [sections]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        message,
        type: "success",
        duration: 2000
      });
    } catch (err) {
      addToast({
        message: "Failed to copy to clipboard",
        type: "error"
      });
    }
  };

  // Validate JSON structure
  const validateJson = (jsonString: string): { valid: boolean; error?: string; data?: JsonData } => {
    try {
      const data = JSON.parse(jsonString);
      
      // Check basic structure
      if (!data.sections || !Array.isArray(data.sections)) {
        return { valid: false, error: "JSON must have a 'sections' array" };
      }

      // Validate each section
      for (let i = 0; i < data.sections.length; i++) {
        const section = data.sections[i];
        
        if (!section.title || typeof section.title !== "string") {
          return { valid: false, error: `Section ${i + 1} must have a title` };
        }
        
        if (section.description && typeof section.description !== "string") {
          return { valid: false, error: `Section ${i + 1} description must be a string` };
        }
        
        if (!section.questions || !Array.isArray(section.questions)) {
          return { valid: false, error: `Section "${section.title}" must have a questions array` };
        }
        
        if (section.questions.length === 0) {
          return { valid: false, error: `Section "${section.title}" must have at least one question` };
        }
        
        for (let j = 0; j < section.questions.length; j++) {
          if (typeof section.questions[j] !== "string" || !section.questions[j].trim()) {
            return { valid: false, error: `Question ${j + 1} in section "${section.title}" must be a non-empty string` };
          }
        }
      }

      return { valid: true, data };
    } catch (err) {
      return { valid: false, error: "Invalid JSON format" };
    }
  };

  // Handle import
  const handleImport = async () => {
    const validation = validateJson(importJson);
    
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid JSON");
      return;
    }

    setValidationError(null);
    setIsImporting(true);

    try {
      await onImport(validation.data!);
      addToast({
        message: `Successfully imported ${validation.data!.sections.length} sections`,
        type: "success"
      });
      setImportJson("");
    } catch (error) {
      addToast({
        message: "Failed to import sections",
        type: "error"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="aep-card">
      <CardHeader>
        <CardTitle>JSON Data Management</CardTitle>
        <CardDescription>
          Import and export sections and questions using JSON format for easy LLM integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "template" ? "default" : "outline"}
            onClick={() => setActiveTab("template")}
            size="sm"
          >
            Template
          </Button>
          <Button
            variant={activeTab === "view" ? "default" : "outline"}
            onClick={() => setActiveTab("view")}
            size="sm"
          >
            View Current
          </Button>
          <Button
            variant={activeTab === "import" ? "default" : "outline"}
            onClick={() => setActiveTab("import")}
            size="sm"
          >
            Import New
          </Button>
        </div>

        {/* Template Tab */}
        {activeTab === "template" && (
          <div className="space-y-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium">JSON Template</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Copy this template to share with an LLM for generating sections and questions
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => copyToClipboard(
                  JSON.stringify(jsonTemplate, null, 2),
                  "Template copied to clipboard!"
                )}
                className="aep-button"
              >
                Copy Template
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(jsonTemplate, null, 2)}
              readOnly
              className="font-mono text-sm h-64"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        )}

        {/* View Current Tab */}
        {activeTab === "view" && (
          <div className="space-y-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium">Current Project Data</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your current sections and questions in JSON format
                </p>
              </div>
              {currentProjectJson && (
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(
                    JSON.stringify(currentProjectJson, null, 2),
                    "Current data copied to clipboard!"
                  )}
                  className="aep-button"
                >
                  Copy Current
                </Button>
              )}
            </div>
            {currentProjectJson ? (
              <Textarea
                value={JSON.stringify(currentProjectJson, null, 2)}
                readOnly
                className="font-mono text-sm h-64"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)'
                }}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sections created yet. Create some sections first or import JSON data.
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Import JSON Data</h3>
              <p className="text-xs text-gray-500 mb-4">
                Paste JSON generated by an LLM to add new sections and questions to your project
              </p>
            </div>
            
            <Textarea
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setValidationError(null);
              }}
              placeholder='Paste your JSON here. Example:
{
  "sections": [
    {
      "title": "Performance Metrics",
      "description": "Key performance indicators",
      "questions": [
        "What defines success?",
        "How do we measure efficiency?"
      ]
    }
  ]
}'
              className="font-mono text-sm h-64"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
            
            {validationError && (
              <div className="text-red-500 text-sm">{validationError}</div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                New sections will be added at the end of your current list
              </div>
              <Button
                onClick={handleImport}
                disabled={!importJson.trim() || isImporting}
                className="aep-button"
              >
                {isImporting ? "Importing..." : "Import Sections"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}