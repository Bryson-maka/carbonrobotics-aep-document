"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_seen: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            return null;
          }

          return newProfile;
        }
        return null;
      }

      return profile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Simplified - all Carbon Robotics team members have full access
export function useCanEdit() {
  const { data: profile } = useUserProfile();
  return !!profile; // If they have a profile, they can edit
}

// For future use when roles are needed
export function useIsAdmin() {
  const { data: profile } = useUserProfile();
  // For now, you're the admin. Later this can be role-based
  return profile?.email === 'bryson@carbonrobotics.com';
}