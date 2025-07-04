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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const sectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  section?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function SectionFormDialog({
  open,
  onOpenChange,
  mode,
  section,
}: SectionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: section?.title || "",
      description: section?.description || "",
    },
  });

  const onSubmit = async (data: SectionFormData) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        // Get current max order_idx
        const { data: maxOrderData } = await supabase
          .from("sections")
          .select("order_idx")
          .order("order_idx", { ascending: false })
          .limit(1);

        const newOrderIdx = (maxOrderData?.[0]?.order_idx || 0) + 1;

        const { error } = await supabase
          .from("sections")
          .insert({
            title: data.title,
            description: data.description,
            order_idx: newOrderIdx,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sections")
          .update({
            title: data.title,
            description: data.description,
          })
          .eq("id", section.id);

        if (error) throw error;
      }

      // Invalidate sections query to refresh data
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving section:", error);
      alert("Failed to save section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Section" : "Edit Section"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Section title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional description"
                      rows={3}
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