import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sections")
        .select(`
          id,title,order_idx,
          questions (
            id,prompt,order_idx,
            answers (status)
          )
        `)
        .order("order_idx");
      return data;
    }
  });
}