"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const log = (message: string) => {
    setResults(prev => [...prev, message]);
    console.log(message);
  };

  const testDatabase = async () => {
    setTesting(true);
    setResults([]);

    try {
      log("🔍 Testing database structure...");

      // Test if tables exist
      log("📋 Testing sections table...");
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('count')
        .limit(1);

      if (sectionsError) {
        log(`❌ Sections table: ${sectionsError.message}`);
      } else {
        log(`✅ Sections table exists`);
      }

      log("📋 Testing questions table...");
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('count')
        .limit(1);

      if (questionsError) {
        log(`❌ Questions table: ${questionsError.message}`);
      } else {
        log(`✅ Questions table exists`);
      }

      log("📋 Testing answers table...");
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('count')
        .limit(1);

      if (answersError) {
        log(`❌ Answers table: ${answersError.message}`);
      } else {
        log(`✅ Answers table exists`);
      }

      // Test views
      log("📊 Testing v_section_progress view...");
      const { data: sectionProgress, error: sectionProgressError } = await supabase
        .from('v_section_progress')
        .select('*')
        .limit(1);

      if (sectionProgressError) {
        log(`❌ v_section_progress view: ${sectionProgressError.message}`);
      } else {
        log(`✅ v_section_progress view exists`);
      }

      log("📊 Testing v_doc_progress view...");
      const { data: docProgress, error: docProgressError } = await supabase
        .from('v_doc_progress')
        .select('*')
        .limit(1);

      if (docProgressError) {
        log(`❌ v_doc_progress view: ${docProgressError.message}`);
      } else {
        log(`✅ v_doc_progress view exists`);
      }

      // Test data counts
      log("📊 Checking data counts...");
      const { count: sectionCount } = await supabase
        .from('sections')
        .select('*', { count: 'exact', head: true });

      const { count: questionCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { count: answerCount } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true });

      log(`📈 Data summary:`);
      log(`   Sections: ${sectionCount || 0}`);
      log(`   Questions: ${questionCount || 0}`);
      log(`   Answers: ${answerCount || 0}`);

    } catch (error) {
      log(`💥 Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Debug & Status</CardTitle>
          <CardDescription>
            Check current database structure and identify missing components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testDatabase} 
            disabled={testing}
            className="w-full"
          >
            {testing ? "Testing..." : "Test Database Structure"}
          </Button>

          {results.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
                {results.map((result, i) => (
                  <div key={i}>{result}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}