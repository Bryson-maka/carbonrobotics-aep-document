"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const questionSchema = z.object({
  prompt: z.string().min(1, "Question prompt is required"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  sectionId: string;
  question?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  mode,
  sectionId,
  question,
}: QuestionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      prompt: question?.prompt || "",
    },
  });

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        // Get current max order_idx for this section
        const { data: maxOrderData } = await supabase
          .from("questions")
          .select("order_idx")
          .eq("section_id", sectionId)
          .order("order_idx", { ascending: false })
          .limit(1);

        const newOrderIdx = (maxOrderData?.[0]?.order_idx || 0) + 1;

        const { error } = await supabase
          .from("questions")
          .insert({
            section_id: sectionId,
            prompt: data.prompt,
            order_idx: newOrderIdx,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("questions")
          .update({
            prompt: data.prompt,
          })
          .eq("id", question.id);

        if (error) throw error;
      }

      // Invalidate section query to refresh data
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Question" : "Edit Question"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the question prompt..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}