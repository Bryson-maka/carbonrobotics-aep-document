import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SectionProgress {
  section_id: string;
  score: number;
  total: number;
}

export function useSectionProgress(sectionId: string) {
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("section-progress")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
        },
        () => {
          setRefetchTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return useQuery({
    queryKey: ["section-progress", sectionId, refetchTrigger],
    queryFn: async () => {
      const { data } = await supabase
        .from("v_section_progress")
        .select("*")
        .eq("section_id", sectionId)
        .single();
      
      return data as SectionProgress;
    },
  });
}