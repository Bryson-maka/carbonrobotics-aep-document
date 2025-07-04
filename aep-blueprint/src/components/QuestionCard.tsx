"use client";

import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  prompt: string;
  status?: string;
}

export function QuestionCard({ prompt, status }: QuestionCardProps) {
  return (
    <div className="border p-4 rounded-md">
      <div className="flex items-start justify-between">
        <p>{prompt}</p>
        {status && (
          <Badge variant={status === "final" ? "default" : "secondary"}>
            {status}
          </Badge>
        )}
      </div>
    </div>
  );
}