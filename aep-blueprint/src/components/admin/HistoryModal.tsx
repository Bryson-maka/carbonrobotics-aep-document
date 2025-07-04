"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamic import for Monaco editor to avoid SSR issues
const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  questionPrompt: string;
}

export function HistoryModal({
  open,
  onOpenChange,
  questionId,
  questionPrompt,
}: HistoryModalProps) {
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, 1]);

  const { data: history, isLoading } = useQuery({
    queryKey: ["answer-history", questionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("answer_history")
        .select("*")
        .eq("question_id", questionId)
        .order("changed_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: open && !!questionId,
  });

  const convertTiptapToText = (content: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!content || typeof content !== 'object') return '';
    
    const extractText = (node: any): string => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!node) return '';
      
      switch (node.type) {
        case 'doc':
          return (node.content || []).map(extractText).join('\n\n');
        case 'paragraph':
          return (node.content || []).map(extractText).join('');
        case 'text':
          return node.text || '';
        case 'bulletList':
          return (node.content || []).map((item: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            `• ${extractText(item)}`
          ).join('\n');
        case 'orderedList':
          return (node.content || []).map((item: any, index: number) => // eslint-disable-line @typescript-eslint/no-explicit-any
            `${index + 1}. ${extractText(item)}`
          ).join('\n');
        case 'listItem':
          return (node.content || []).map(extractText).join('');
        case 'hardBreak':
          return '\n';
        default:
          return (node.content || []).map(extractText).join('');
      }
    };

    return extractText(content);
  };

  const getVersionText = (index: number): string => {
    if (!history || !history[index]) return '';
    const content = history[index].content;
    return convertTiptapToText(content);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg">Answer History</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {questionPrompt}
          </p>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading history...</div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              No answer history found for this question.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Select Version A</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {history.map((entry, index) => (
                      <Button
                        key={entry.id}
                        variant={selectedVersions[0] === index ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedVersions([index, selectedVersions[1]])}
                      >
                        <div className="flex flex-col items-start">
                          <div className="text-xs">
                            {new Date(entry.changed_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {entry.status || 'draft'}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Select Version B</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {history.map((entry, index) => (
                      <Button
                        key={entry.id}
                        variant={selectedVersions[1] === index ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedVersions([selectedVersions[0], index])}
                      >
                        <div className="flex flex-col items-start">
                          <div className="text-xs">
                            {new Date(entry.changed_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {entry.status || 'draft'}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1 min-h-0">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Diff: Version A vs Version B
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-96">
                    <DiffEditor
                      height="100%"
                      language="text"
                      original={getVersionText(selectedVersions[0])}
                      modified={getVersionText(selectedVersions[1])}
                      options={{
                        readOnly: true,
                        renderSideBySide: true,
                        enableSplitViewResizing: true,
                        fontSize: 12,
                        wordWrap: "on",
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}