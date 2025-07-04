import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DocProgress {
  score: number;
  total: number;
}

export function useDocProgress() {
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("doc-progress")
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
    queryKey: ["doc-progress", refetchTrigger],
    queryFn: async () => {
      const { data } = await supabase
        .from("v_doc_progress")
        .select("*")
        .single();
      
      return data as DocProgress;
    },
  });
}