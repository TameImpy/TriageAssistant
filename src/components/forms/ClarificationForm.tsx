"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IntakeQuestion } from "@/types/agent";

interface ClarificationFormProps {
  requestId: string;
  questions: IntakeQuestion[];
}

export function ClarificationForm({ requestId, questions }: ClarificationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Record<string, string>>();

  async function onSubmit(values: Record<string, string>) {
    setSubmitting(true);
    setError(null);

    const answers = questions.map((q) => ({
      questionId: q.id,
      answer: values[q.id] ?? "",
    }));

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, answers }),
      });

      const data = await res.json() as { ready: boolean };

      router.push(`/requests/${requestId}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Label htmlFor={q.id} className="text-sm font-medium leading-snug">
                {i + 1}. {q.question}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {q.required && (
                <Badge variant="outline" className="text-xs shrink-0">Required</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground italic">{q.rationale}</p>
            <Textarea
              id={q.id}
              {...register(q.id, q.required ? { required: "This question requires an answer" } : {})}
              placeholder="Your answer…"
              rows={3}
              className="mt-1"
            />
            {errors[q.id] && (
              <p className="text-xs text-destructive">{errors[q.id]?.message}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full h-12">
        {submitting ? (
          <span className="flex items-center justify-center gap-3">
            <span className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-bounce" />
            </span>
            Processing request…
          </span>
        ) : (
          "Submit Answers"
        )}
      </Button>
    </form>
  );
}
