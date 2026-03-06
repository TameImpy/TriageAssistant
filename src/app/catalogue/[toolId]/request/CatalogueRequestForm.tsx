"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { ApprovedTool } from "@/types/catalogue";

const FormSchema = z.object({
  requester_name: z.string().min(1, "Your name is required"),
  requester_team: z.string().min(1, "Team is required"),
  requester_role: z.string().optional(),
  business_reason: z.string().min(20, "Please provide at least 20 characters"),
  user_count: z
    .string()
    .min(1, "Must be at least 1")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1, "Must be at least 1"),
});

type FormValues = z.infer<typeof FormSchema>;

export function CatalogueRequestForm({ tool }: { tool: ApprovedTool }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/catalogue/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: tool.id, ...values, user_count: Number(values.user_count) }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }

      const { id } = await res.json() as { id: string };
      router.push(`/catalogue/requests/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requester_name">Your name *</Label>
              <Input id="requester_name" {...register("requester_name")} className="mt-1" />
              {errors.requester_name && (
                <p className="text-xs text-destructive mt-1">{errors.requester_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="requester_team">Team *</Label>
              <Input
                id="requester_team"
                {...register("requester_team")}
                placeholder="e.g. Engineering"
                className="mt-1"
              />
              {errors.requester_team && (
                <p className="text-xs text-destructive mt-1">{errors.requester_team.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="requester_role">Role / job title (optional)</Label>
            <Input id="requester_role" {...register("requester_role")} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="user_count">Number of users who will need access *</Label>
            <Input
              id="user_count"
              type="number"
              min={1}
              {...register("user_count")}
              className="mt-1 w-32"
            />
            {errors.user_count && (
              <p className="text-xs text-destructive mt-1">{errors.user_count.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="business_reason">How will you use this tool? *</Label>
            <Textarea
              id="business_reason"
              {...register("business_reason")}
              placeholder="Briefly describe your intended use case…"
              rows={4}
              className="mt-1"
            />
            {errors.business_reason && (
              <p className="text-xs text-destructive mt-1">{errors.business_reason.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
}
