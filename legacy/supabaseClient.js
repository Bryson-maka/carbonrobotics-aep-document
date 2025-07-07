import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// TODO: Replace YOUR_PUBLIC_ANON_KEY with your actual Supabase anon key
// This key is safe to be public as it's designed for client-side use
// Get it from: Supabase Dashboard > Settings > API
export const supabase = createClient(
  "https://anyfhncbazmdixkzipyx.supabase.co",   // Project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueWZobmNiYXptZGl4a3ppcHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTAxMjEsImV4cCI6MjA2NzEyNjEyMX0.apedcbqGbhZ9inNapbHaco4cB_WNeEtJVQ48VAyBD8k"                         // Public anon key - safe to expose
);