"use client";

import { useState } from "react";
import { useSections } from "@/hooks/useSections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink, Download } from "lucide-react";
import Link from "next/link";
import { SectionFormDialog } from "@/components/admin/SectionFormDialog";
import { DragDropSections } from "@/components/admin/DragDropSections";
import { supabase } from "@/lib/supabase";

export default function AdminSectionsPage() {
  const { data: sections, isLoading } = useSections();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'md') => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/export_prd?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aep-blueprint-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading sections...</div>
      </div>
    );
  }

  if (!sections) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading sections</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin: Sections
              </h1>
              <p className="text-gray-600">
                Manage sections and their ordering
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live Site
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => handleExport('md')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export MD
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sections ({sections.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropSections 
                sections={sections}
                onEdit={setEditingSection}
              />
            </CardContent>
          </Card>
        </div>

        <SectionFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          mode="create"
        />

        <SectionFormDialog
          open={!!editingSection}
          onOpenChange={(open) => !open && setEditingSection(null)}
          mode="edit"
          section={editingSection}
        />
      </div>
    </div>
  );
}