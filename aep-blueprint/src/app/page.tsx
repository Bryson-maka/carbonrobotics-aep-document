"use client";

import { useSections } from "@/hooks/useSections";
import { SectionCard } from "@/components/SectionCard";
import { GlobalProgressWidget } from "@/components/GlobalProgressWidget";

export default function Home() {
  const { data: sections, isLoading, error } = useSections();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading data</div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">No sections found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AEP Blueprint
          </h1>
          <p className="text-gray-600 mb-6">
            Advanced Engineering & Performance Team Scope
          </p>
          <GlobalProgressWidget />
        </header>

        <div className="space-y-4">
          {sections
            .sort((a, b) => a.order_idx - b.order_idx)
            .map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
        </div>
      </div>
    </div>
  );
}