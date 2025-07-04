"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuestionCard } from "./QuestionCard";

interface Section {
  id: string;
  title: string;
  order_idx: number;
  questions: Question[];
}

interface Question {
  id: string;
  prompt: string;
  order_idx: number;
  answers: Answer[];
}

interface Answer {
  status: "draft" | "final";
}

interface SectionCardProps {
  section: Section;
}

export function SectionCard({ section }: SectionCardProps) {
  const completedCount = section.questions.filter(
    (q) => q.answers?.[0]?.status === "final"
  ).length;
  const draftCount = section.questions.filter(
    (q) => q.answers?.[0]?.status === "draft"
  ).length;
  const totalCount = section.questions.length;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={section.id}>
        <AccordionTrigger className="text-left">
          <div className="flex items-center justify-between w-full pr-4">
            <span className="font-semibold">{section.title}</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">{completedCount}</span>/
              <span className="text-orange-600">{draftCount}</span>/
              <span className="text-gray-600">{totalCount}</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
            {section.questions
              .sort((a, b) => a.order_idx - b.order_idx)
              .map((question) => (
                <QuestionCard 
                  key={question.id} 
                  prompt={question.prompt}
                  status={question.answers?.[0]?.status}
                />
              ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}