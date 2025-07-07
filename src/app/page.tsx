"use client";

import { useSections } from "@/hooks/sections";
import { SortableSectionList } from "@/components/SortableSectionList";
import { AddSectionCard } from "@/components/AddSectionCard";
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

  // Don't block on empty sections - allow creating new ones

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Carbon Robotics styling */}
        <header className="aep-header">
          <div className="text-center">
            <h1 className="text-4xl font-light mb-2">
              Advanced Engineering & Performance
            </h1>
            <div className="text-xl opacity-90 mb-4">
              Team Scope Blueprint
            </div>
            <div className="flex justify-center gap-8 text-sm opacity-80">
              <div>Carbon Robotics</div>
              <div>•</div>
              <div>Q1 2025 - Q4 2025</div>
              <div>•</div>
              <div>AEP Team</div>
            </div>
          </div>
        </header>

        {/* Controls bar */}
        <div className="aep-section flex justify-center items-center" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
          <GlobalProgressWidget />
        </div>

        {/* Main content */}
        <div className="p-6 space-y-6">
          {sections && sections.length > 0 && (
            <SortableSectionList 
              sections={sections.sort((a, b) => a.order_idx - b.order_idx)} 
              onSectionsChange={() => {
                // No manual refetch needed - React Query handles cache updates
              }}
            />
          )}
          
          <AddSectionCard />
        </div>
      </div>
    </div>
  );
}