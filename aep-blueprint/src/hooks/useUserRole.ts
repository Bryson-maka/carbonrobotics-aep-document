import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "editor" | "viewer";

export function useUserRole(): { role: UserRole; loading: boolean } {
  const [role, setRole] = useState<UserRole>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setRole("viewer");
          setLoading(false);
          return;
        }

        // Check user metadata for roles
        const userMetadata = session.user.user_metadata;
        const roles = userMetadata?.roles || [];

        if (Array.isArray(roles)) {
          if (roles.includes("admin")) {
            setRole("admin");
          } else if (roles.includes("editor")) {
            setRole("editor");
          } else {
            setRole("viewer");
          }
        } else {
          // Default to editor for logged-in Carbon Robotics users
          // This ensures compatibility while roles are being set up
          setRole("editor");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setRole("viewer");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading };
}