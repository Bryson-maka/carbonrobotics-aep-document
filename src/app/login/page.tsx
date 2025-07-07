"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [authInitiated, setAuthInitiated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("🏁 Login page loaded");
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔍 Existing session:", !!session);
        
        if (session?.user) {
          console.log("✅ User already authenticated:", session.user.email);
          router.push("/");
        }
      } catch (err) {
        console.error("❌ Auth check error:", err);
      }
    };

    checkAuth();
  }, [router]);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🖱️ Button clicked! Click count will be:", clickCount + 1);
    setClickCount(prev => prev + 1);
    
    if (authInitiated) {
      console.log("⏳ Auth already initiated, skipping...");
      return;
    }

    console.log("🚀 Starting Google OAuth flow...");
    setLoading(true);
    setAuthInitiated(true);
    
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("📍 Redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            hd: "carbonrobotics.com"
          }
        },
      });
      
      console.log("📝 OAuth response:", { data, error, url: data?.url });
      
      if (error) {
        console.error("❌ OAuth error:", error);
        alert(`OAuth Error: ${error.message}`);
        setLoading(false);
        setAuthInitiated(false);
      } else if (data?.url) {
        console.log("✅ OAuth URL generated, redirecting...");
        // Supabase will handle the redirect automatically
      } else {
        console.warn("⚠️ No error but no URL returned");
        setLoading(false);
        setAuthInitiated(false);
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      alert(`Error: ${err}`);
      setLoading(false);
      setAuthInitiated(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            AEP Blueprint
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Carbon Robotics account
          </p>
        </div>
        
        <div className="mt-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>
          
          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Debug: {loading ? "Loading..." : "Ready"}</p>
            <p>Clicks: {clickCount}</p>
            <p>Auth Initiated: {authInitiated ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}