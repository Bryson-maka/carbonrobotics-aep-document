"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuestionCard } from "./QuestionCard";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useUserRole } from "@/hooks/useUserRole";

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
  const { data: progress } = useSectionProgress(section.id);
  const { role } = useUserRole();
  
  const finalCount = progress ? Math.floor(progress.score) : 0;
  const draftCount = progress ? Math.round((progress.score - finalCount) * 2) : 0;
  const totalCount = progress?.total || section.questions.length;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={section.id}>
        <AccordionTrigger className="text-left">
          <div className="flex items-center justify-between w-full pr-4">
            <span className="font-semibold">{section.title}</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">{finalCount}</span>/
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
                  questionId={question.id}
                  prompt={question.prompt}
                  userRole={role}
                />
              ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}