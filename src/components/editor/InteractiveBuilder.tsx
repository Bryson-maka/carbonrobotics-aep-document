"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface InteractiveBuilderProps {
  questionId: string;
  onSave?: () => void;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface DecisionCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export function InteractiveBuilder({ questionId, onSave }: InteractiveBuilderProps) {
  const [activeType, setActiveType] = useState("poll");
  const [saving, setSaving] = useState(false);
  
  // Poll state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "", votes: 0 },
    { id: "2", text: "", votes: 0 }
  ]);
  
  // Decision matrix state
  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionOptions, setDecisionOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [decisionCriteria, setDecisionCriteria] = useState<DecisionCriteria[]>([
    { id: "1", name: "Cost", weight: 5, description: "Financial impact" },
    { id: "2", name: "Time", weight: 4, description: "Implementation time" }
  ]);

  const interactiveTypes = [
    { id: "poll", label: "Poll", icon: "📊", description: "Simple voting on options" },
    { id: "survey", label: "Survey", icon: "📝", description: "Multi-question feedback form" },
    { id: "decision", label: "Decision Matrix", icon: "🎯", description: "Weighted criteria evaluation" },
    { id: "approval", label: "Approval Flow", icon: "✅", description: "Stakeholder sign-off process" }
  ];

  const addPollOption = useCallback(() => {
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: "",
      votes: 0
    };
    setPollOptions(prev => [...prev, newOption]);
  }, []);

  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions(prev => prev.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  }, []);

  const removePollOption = useCallback((id: string) => {
    setPollOptions(prev => prev.filter(option => option.id !== id));
  }, []);

  const addDecisionCriteria = useCallback(() => {
    const newCriteria: DecisionCriteria = {
      id: Date.now().toString(),
      name: "",
      weight: 3,
      description: ""
    };
    setDecisionCriteria(prev => [...prev, newCriteria]);
  }, []);

  const updateDecisionCriteria = useCallback((id: string, field: keyof DecisionCriteria, value: string | number) => {
    setDecisionCriteria(prev => prev.map(criteria => 
      criteria.id === id ? { ...criteria, [field]: value } : criteria
    ));
  }, []);

  const removeDecisionCriteria = useCallback((id: string) => {
    setDecisionCriteria(prev => prev.filter(criteria => criteria.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let interactiveData: any = {};
      
      if (activeType === "poll") {
        interactiveData = {
          type: "poll",
          question: pollQuestion,
          options: pollOptions,
          totalVotes: pollOptions.reduce((sum, opt) => sum + opt.votes, 0)
        };
      } else if (activeType === "decision") {
        interactiveData = {
          type: "decision_matrix",
          title: decisionTitle,
          options: decisionOptions,
          criteria: decisionCriteria
        };
      }

      const { error } = await supabase
        .from("answers")
        .upsert({
          question_id: questionId,
          content: { interactive: interactiveData },
          content_type: "interactive",
          interactive_data: interactiveData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      onSave?.();
    } catch (error) {
      console.error("Error saving interactive content:", error);
    } finally {
      setSaving(false);
    }
  }, [activeType, pollQuestion, pollOptions, decisionTitle, decisionOptions, decisionCriteria, questionId, onSave]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Content Builder</CardTitle>
        <CardDescription>Create polls, surveys, and decision tools</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Content Type</Label>
          <Select value={activeType} onValueChange={setActiveType}>
            <SelectTrigger>
              <SelectValue placeholder="Select interactive type" />
            </SelectTrigger>
            <SelectContent>
              {interactiveTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="grid w-full grid-cols-4">
            {interactiveTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-1">
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="poll" className="space-y-4">
            <div>
              <Label htmlFor="pollQuestion">Poll Question</Label>
              <Input
                id="pollQuestion"
                placeholder="What would you like to ask?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Poll Options</Label>
                <Button variant="outline" size="sm" onClick={addPollOption}>
                  Add Option
                </Button>
              </div>
              
              {pollOptions.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Badge variant="secondary" className="min-w-fit">
                    {index + 1}
                  </Badge>
                  <Input
                    placeholder="Option text"
                    value={option.text}
                    onChange={(e) => updatePollOption(option.id, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePollOption(option.id)}
                      className="text-red-500"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Poll Preview</h4>
              <div className="space-y-2">
                <p className="font-medium">{pollQuestion || "Your poll question will appear here"}</p>
                {pollOptions.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input type="radio" name="preview" disabled />
                    <span>{option.text || `Option ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="survey" className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Survey Builder</h4>
              <p className="text-sm text-gray-600">
                Advanced survey functionality with multiple question types, branching logic, and analytics.
              </p>
              <Button variant="outline" className="mt-3">
                Coming Soon
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="decision" className="space-y-4">
            <div>
              <Label htmlFor="decisionTitle">Decision Title</Label>
              <Input
                id="decisionTitle"
                placeholder="What decision needs to be made?"
                value={decisionTitle}
                onChange={(e) => setDecisionTitle(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Decision Options</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDecisionOptions(prev => [...prev, `Option ${prev.length + 1}`])}
                >
                  Add Option
                </Button>
              </div>
              
              {decisionOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="min-w-fit">
                    {index + 1}
                  </Badge>
                  <Input
                    placeholder="Option name"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...decisionOptions];
                      newOptions[index] = e.target.value;
                      setDecisionOptions(newOptions);
                    }}
                  />
                  {decisionOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDecisionOptions(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-500"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Evaluation Criteria</Label>
                <Button variant="outline" size="sm" onClick={addDecisionCriteria}>
                  Add Criteria
                </Button>
              </div>
              
              {decisionCriteria.map((criteria) => (
                <div key={criteria.id} className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Criteria name"
                    value={criteria.name}
                    onChange={(e) => updateDecisionCriteria(criteria.id, "name", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Weight (1-5)"
                    min="1"
                    max="5"
                    value={criteria.weight}
                    onChange={(e) => updateDecisionCriteria(criteria.id, "weight", parseInt(e.target.value))}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Description"
                      value={criteria.description}
                      onChange={(e) => updateDecisionCriteria(criteria.id, "description", e.target.value)}
                    />
                    {decisionCriteria.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDecisionCriteria(criteria.id)}
                        className="text-red-500"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Decision Matrix Preview</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Criteria</th>
                      <th className="text-center p-2">Weight</th>
                      {decisionOptions.map((option, index) => (
                        <th key={index} className="text-center p-2">{option}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {decisionCriteria.map((criteria) => (
                      <tr key={criteria.id} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{criteria.name || "Criteria"}</div>
                          <div className="text-gray-500 text-xs">{criteria.description}</div>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant="secondary">{criteria.weight}</Badge>
                        </td>
                        {decisionOptions.map((_, index) => (
                          <td key={index} className="text-center p-2">
                            <input type="number" className="w-16 text-center border rounded" min="1" max="5" defaultValue="3" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Approval Workflow</h4>
              <p className="text-sm text-gray-600">
                Create multi-step approval processes with stakeholder assignments, due dates, and notifications.
              </p>
              <Button variant="outline" className="mt-3">
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setPollQuestion("");
              setPollOptions([{ id: "1", text: "", votes: 0 }, { id: "2", text: "", votes: 0 }]);
              setDecisionTitle("");
              setDecisionOptions(["Option 1", "Option 2"]);
              setDecisionCriteria([
                { id: "1", name: "Cost", weight: 5, description: "Financial impact" },
                { id: "2", name: "Time", weight: 4, description: "Implementation time" }
              ]);
            }}
          >
            Clear
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || (activeType === "poll" && !pollQuestion)}
          >
            {saving ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}