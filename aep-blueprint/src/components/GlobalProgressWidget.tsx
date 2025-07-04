"use client";

import { useDocProgress } from "@/hooks/useDocProgress";

export function GlobalProgressWidget() {
  const { data: progress, isLoading } = useDocProgress();

  if (isLoading) {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 animate-pulse">
        <div className="bg-gray-300 h-2.5 rounded-full w-1/3"></div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const finalCount = Math.floor(progress.score);
  const draftCount = Math.round((progress.score - finalCount) * 2);
  const unansweredCount = progress.total - finalCount - draftCount;

  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="text-sm text-gray-600">
        Overall Progress: {finalCount} final, {draftCount} draft, {unansweredCount} unanswered
        ({progress.percent}% complete)
      </div>
    </div>
  );
}