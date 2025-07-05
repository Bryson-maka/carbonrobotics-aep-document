"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const importOriginalData = async () => {
    setImporting(true);
    setLogs([]);

    try {
      log("🚀 Starting data import from original AEP Blueprint...");

      // Define the 6 sections from the original document
      const sections = [
        {
          title: "Performance Standards Definition",
          description: "Defining success in fleet performance through clear metrics and customer expectations",
          order_idx: 1,
          questions: [
            {
              prompt: "What specific outcomes define success for Carbon Robotics' laser weeding fleet? (Weed Kill Efficiency, Performance Consistency, Fleet Uptime)",
              order_idx: 1
            },
            {
              prompt: "What quantifiable metrics should we use to measure fleet performance? (OEE, SLE, Uptime %)",
              order_idx: 2
            },
            {
              prompt: "What are the specific performance thresholds that meet customer expectations?",
              order_idx: 3
            },
            {
              prompt: "How do these standards vary by customer segment, environmental conditions, or use case?",
              order_idx: 4
            },
            {
              prompt: "How do we incorporate field conditions and their impact on performance standards?",
              order_idx: 5
            }
          ]
        },
        {
          title: "Robot Configuration & Experience",
          description: "Optimizing initial setup and configuration for consistent fleet performance",
          order_idx: 2,
          questions: [
            {
              prompt: "What is the ideal customer experience for initial robot configuration and calibration?",
              order_idx: 1
            },
            {
              prompt: "Which configuration parameters most significantly impact performance outcomes?",
              order_idx: 2
            },
            {
              prompt: "How can we simplify the calibration process while ensuring optimal performance?",
              order_idx: 3
            },
            {
              prompt: "What validation processes ensure configurations meet performance standards?",
              order_idx: 4
            },
            {
              prompt: "How do we handle configuration updates and performance tuning over time?",
              order_idx: 5
            }
          ]
        },
        {
          title: "Performance Monitoring & Intervention",
          description: "Real-time monitoring and proactive intervention strategies for fleet health",
          order_idx: 3,
          questions: [
            {
              prompt: "What real-time monitoring capabilities are needed to track fleet performance?",
              order_idx: 1
            },
            {
              prompt: "What early warning indicators predict performance degradation?",
              order_idx: 2
            },
            {
              prompt: "What intervention protocols should trigger when performance drops below standards?",
              order_idx: 3
            },
            {
              prompt: "How do we balance automated interventions with human oversight?",
              order_idx: 4
            },
            {
              prompt: "What remote diagnostic and remediation capabilities are required?",
              order_idx: 5
            }
          ]
        },
        {
          title: "Responsibility Framework",
          description: "Clear ownership and accountability for fleet performance outcomes",
          order_idx: 4,
          questions: [
            {
              prompt: "What are the clear boundaries between AEP team and other team responsibilities?",
              order_idx: 1
            },
            {
              prompt: "Who owns each aspect of the performance lifecycle? (Initial setup, monitoring, intervention, optimization)",
              order_idx: 2
            },
            {
              prompt: "What escalation paths exist when performance issues arise?",
              order_idx: 3
            },
            {
              prompt: "How do we ensure accountability without creating organizational silos?",
              order_idx: 4
            },
            {
              prompt: "What feedback loops ensure continuous improvement across teams?",
              order_idx: 5
            }
          ]
        },
        {
          title: "Technical Implementation",
          description: "Systems and tools required to deliver on performance commitments",
          order_idx: 5,
          questions: [
            {
              prompt: "What technical infrastructure is needed to support fleet-wide performance management?",
              order_idx: 1
            },
            {
              prompt: "How do we integrate performance data across existing systems? (Telemetry, CRM, Support)",
              order_idx: 2
            },
            {
              prompt: "What automated tools can accelerate configuration and calibration?",
              order_idx: 3
            },
            {
              prompt: "How do we ensure scalability as the fleet grows?",
              order_idx: 4
            },
            {
              prompt: "What data analytics capabilities enable predictive performance management?",
              order_idx: 5
            }
          ]
        },
        {
          title: "Success Metrics & Timeline",
          description: "Measuring AEP team impact and implementation roadmap",
          order_idx: 6,
          questions: [
            {
              prompt: "What key performance indicators (KPIs) measure AEP team success?",
              order_idx: 1
            },
            {
              prompt: "What is the phased implementation timeline? (Q1 2025 - Q4 2025)",
              order_idx: 2
            },
            {
              prompt: "What are the critical milestones and dependencies?",
              order_idx: 3
            },
            {
              prompt: "How do we measure customer satisfaction with fleet performance?",
              order_idx: 4
            },
            {
              prompt: "What continuous improvement processes ensure long-term success?",
              order_idx: 5
            }
          ]
        }
      ];

      // Clear existing data first
      log("🧹 Clearing existing data...");
      await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert sections and questions
      for (const sectionData of sections) {
        log(`📁 Creating section: ${sectionData.title}`);
        
        const { data: section, error: sectionError } = await supabase
          .from('sections')
          .insert({
            title: sectionData.title,
            description: sectionData.description,
            order_idx: sectionData.order_idx
          })
          .select()
          .single();

        if (sectionError) {
          log(`❌ Error creating section: ${sectionError.message}`);
          continue;
        }

        log(`✅ Section created with ID: ${section.id}`);

        // Insert questions for this section
        for (const questionData of sectionData.questions) {
          const { error: questionError } = await supabase
            .from('questions')
            .insert({
              section_id: section.id,
              prompt: questionData.prompt,
              order_idx: questionData.order_idx
            });

          if (questionError) {
            log(`❌ Error creating question: ${questionError.message}`);
          }
        }

        log(`✅ Added ${sectionData.questions.length} questions to section`);
      }

      log("🎉 Import complete! Navigate to the home page to see your content.");

    } catch (error) {
      log(`💥 Import failed: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Import Original AEP Blueprint Data</CardTitle>
          <CardDescription>
            This will import the 6 sections and 30 questions from the original AEP Blueprint document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold mb-2">What this will import:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>6 main sections (Performance Standards, Configuration, Monitoring, etc.)</li>
              <li>5 key questions per section (30 total)</li>
              <li>Original structure and organization from the HTML document</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h3 className="font-semibold mb-2">⚠️ Warning:</h3>
            <p className="text-sm">This will clear any existing sections and questions before importing.</p>
          </div>

          <Button 
            onClick={importOriginalData} 
            disabled={importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Start Import"}
          </Button>

          {logs.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2">Import Log:</h3>
              <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}