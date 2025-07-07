"use client";

interface Question {
  id: string;
  prompt: string;
  order_idx: number;
  answers?: { status: "draft" | "final" }[];
}

interface Section {
  id: string;
  title: string;
  order_idx: number;
  questions: Question[];
}

interface ProgressBarProps {
  sections: Section[];
}

export function ProgressBar({ sections }: ProgressBarProps) {
  const totalQuestions = sections.reduce(
    (acc, section) => acc + section.questions.length,
    0
  );
  
  const finalCount = sections.reduce(
    (acc, section) =>
      acc +
      section.questions.filter((q) => q.answers?.[0]?.status === "final")
        .length,
    0
  );
  
  const draftCount = sections.reduce(
    (acc, section) =>
      acc +
      section.questions.filter((q) => q.answers?.[0]?.status === "draft")
        .length,
    0
  );

  const progressPercentage = totalQuestions > 0
    ? ((finalCount + draftCount * 0.5) / totalQuestions) * 100
    : 0;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${progressPercentage}%` }}
      />
      <div className="mt-2 text-sm text-gray-600">
        {finalCount} final, {draftCount} draft, {totalQuestions - finalCount - draftCount} unanswered
      </div>
    </div>
  );
}