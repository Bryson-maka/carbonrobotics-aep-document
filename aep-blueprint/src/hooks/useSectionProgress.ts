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

  // Disabled real-time updates to prevent WebSocket errors in production
  // useEffect(() => {
  //   const channel = supabase
  //     .channel("section-progress")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "*",
  //         schema: "public",
  //         table: "answers",
  //       },
  //       () => {
  //         setRefetchTrigger(prev => prev + 1);
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, []);

  return useQuery({
    queryKey: ["section-progress", sectionId, refetchTrigger],
    queryFn: async () => {
      try {
        // First check if the section has any questions
        const { data: questions, error: questionsError } = await supabase
          .from("questions")
          .select("id")
          .eq("section_id", sectionId);

        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          return { section_id: sectionId, score: 0, total: 0 };
        }

        // If no questions, return zero progress
        if (!questions || questions.length === 0) {
          return { section_id: sectionId, score: 0, total: 0 };
        }

        // Try to get progress from view
        const { data, error } = await supabase
          .from("v_section_progress")
          .select("*")
          .eq("section_id", sectionId)
          .maybeSingle(); // Use maybeSingle instead of single
        
        if (error) {
          console.error("Progress view error:", error);
          // Fallback: calculate manually
          const { data: progressData, error: calcError } = await supabase
            .from("questions")
            .select(`
              id,
              answers(status)
            `)
            .eq("section_id", sectionId);

          if (calcError || !progressData) {
            return { section_id: sectionId, score: 0, total: 0 };
          }

          let score = 0;
          const total = progressData.length;

          progressData.forEach(question => {
            if (question.answers && question.answers.length > 0) {
              const answer = question.answers[0]; // Assuming one answer per question
              if (answer.status === 'final') {
                score += 1;
              } else if (answer.status === 'draft') {
                score += 0.5;
              }
            }
          });

          return { section_id: sectionId, score, total };
        }
        
        return data ? data as SectionProgress : { section_id: sectionId, score: 0, total: 0 };
      } catch (error) {
        console.error("Progress query failed:", error);
        return { section_id: sectionId, score: 0, total: 0 };
      }
    },
  });
}