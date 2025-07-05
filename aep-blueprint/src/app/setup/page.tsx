"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function SetupPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      log("🔍 Testing database connection...");

      // Test basic tables
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('count')
        .limit(1);

      if (sectionsError) {
        log(`❌ Cannot access sections table: ${sectionsError.message}`);
      } else {
        log("✅ Sections table accessible");
      }

      // Test views
      const { data: progressData, error: progressError } = await supabase
        .from('v_section_progress')
        .select('*')
        .limit(1);

      if (progressError) {
        log(`❌ Progress views missing: ${progressError.message}`);
        log("📋 You need to run the SQL setup in Supabase dashboard");
      } else {
        log("✅ Progress views working!");
      }

      log("🎯 Database test complete!");

    } catch (error) {
      log(`💥 Test failed: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>
      
      <button 
        onClick={setupDatabase}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6 disabled:opacity-50"
      >
        {loading ? "Setting up..." : "🚀 Setup Database"}
      </button>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-gray-500">Click the button above to setup the database...</div>
        ) : (
          results.map((result, i) => (
            <div key={i} className="mb-1">{result}</div>
          ))
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>This will create the necessary tables for the AEP Blueprint application.</p>
        <p>After setup is complete, navigate back to <a href="/" className="text-blue-500 hover:underline">the home page</a>.</p>
      </div>
    </div>
  );
}