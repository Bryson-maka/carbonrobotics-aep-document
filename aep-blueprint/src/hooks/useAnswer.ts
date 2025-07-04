import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Answer {
  question_id: string;
  content: Record<string, unknown>;
  status: "draft" | "final";
  updated_by: string;
  updated_at: string;
}

export function useAnswer(questionId: string) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnswer = async () => {
      const { data } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", questionId)
        .single();
      
      setAnswer(data);
      setLoading(false);
    };

    fetchAnswer();

    const channel = supabase
      .channel(`answer-${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          setAnswer(payload.new as Answer);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  return { answer, loading };
}