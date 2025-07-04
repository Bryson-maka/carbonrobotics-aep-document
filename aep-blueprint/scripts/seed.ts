import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---- hard-coded seed -----------------
const data = [
  {
    title: "Performance Standards & Measurement",
    questions: [
      "What constitutes 'successful weeding' from the customer's perspective?",
      "Who defines 'good performance' - Carbon or the customer?",
      "How should performance be measured and validated?"
    ]
  },
  {
    title: "Configuration & Customer Experience",
    questions: [
      "How complex should configuration be for customers?",
      "How do customers know when settings need adjustment?",
      "What planning capabilities should we provide?"
    ]
  },
  {
    title: "Monitoring & Proactive Intervention",
    questions: [
      "When and how should Carbon intervene proactively?",
      "How should fleet-wide performance monitoring work?",
      "How should Carbon's support response work?"
    ]
  },
  {
    title: "Responsibility & Ownership Framework",
    questions: [
      "What should customers be fully responsible for?",
      "What should Carbon be fully responsible for?",
      "What requires joint Carbon-Customer ownership?",
      "How do we handle performance disputes and continuous improvement?"
    ]
  },
  {
    title: "Technical Implementation & Team Structure",
    questions: [
      "What technical capabilities need development?"
    ]
  }
];

async function main() {
  for (let idx = 0; idx < data.length; idx++) {
    const { data: section } = await supabase
      .from("sections")
      .insert({ title: data[idx].title, order_idx: idx })
      .select()
      .single();

    for (let qIdx = 0; qIdx < data[idx].questions.length; qIdx++) {
      await supabase.from("questions").insert({
        section_id: section.id,
        prompt: data[idx].questions[qIdx],
        order_idx: qIdx
      });
    }
  }
  console.log("Seed complete");
}

main();