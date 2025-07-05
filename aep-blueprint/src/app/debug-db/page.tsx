"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function DebugDB() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testQueries = async () => {
    setLoading(true);
    const tests: any = {};

    try {
      // Test 1: Basic connection
      console.log("🔍 Testing basic Supabase connection...");
      const { data: session } = await supabase.auth.getSession();
      tests.session = { exists: !!session.session, user: session.session?.user?.email };

      // Test 2: Try to list tables 
      console.log("🔍 Testing table access...");
      try {
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("sections")
          .select("*")
          .limit(1);
        tests.sections = { data: sectionsData, error: sectionsError?.message };
      } catch (err) {
        tests.sections = { error: `Exception: ${err}` };
      }

      // Test 3: Try simpler query
      console.log("🔍 Testing RLS...");
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('version');
        tests.rpc = { data: rpcData, error: rpcError?.message };
      } catch (err) {
        tests.rpc = { error: `Exception: ${err}` };
      }

    } catch (err) {
      tests.error = `Global error: ${err}`;
    }

    setResults(tests);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Database Debug</h1>
      
      <button 
        onClick={testQueries}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? "Testing..." : "Run Database Tests"}
      </button>

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Session Test:</h3>
            <pre>{JSON.stringify(results.session, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Sections Table Test:</h3>
            <pre>{JSON.stringify(results.sections, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">RPC Test:</h3>
            <pre>{JSON.stringify(results.rpc, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}