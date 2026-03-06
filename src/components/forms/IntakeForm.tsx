"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATA_TYPES = [
  "Personal data (names, emails, etc.)",
  "Employee data",
  "Client/customer data",
  "Financial data",
  "Intellectual property / proprietary content",
  "Health or medical data",
  "Public data only",
  "No data (pure productivity tool)",
];

const USER_COUNTS = ["Just me", "2-5 people", "6-20 people", "21-50 people", "50+ people"];

const TEAMS = [
  "Advertising",
  "Audience Engagement",
  "Commercial Growth",
  "Contract & Customer",
  "Customer Marketing & Subscriptions",
  "Digital Content",
  "Digital Growth",
  "Enterprise Systems",
  "Finance",
  "Food Group",
  "Gardeners' World",
  "History",
  "Immediate Live",
  "Leadership Team",
  "Legal",
  "Licensing & International",
  "Nutracheck",
  "Parenting",
  "People Team",
  "Podcasts",
  "Product & Tech",
  "Production",
  "Radio Times",
  "SEO & Audience Development",
  "Youth & Children's",
];

const FormSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  tool_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  requester_name: z.string().min(1, "Your name is required"),
  requester_team: z.string().min(1, "Team is required"),
  requester_role: z.string().optional(),
  business_justification: z
    .string()
    .min(100, "Please provide at least 100 characters explaining your use case"),
  data_types: z.array(z.string()).min(1, "Select at least one data type"),
  user_count: z.string().min(1, "Select number of users"),
  data_leaves_company: z
    .enum(["yes", "no", "unsure"])
    .optional(),
  requires_system_access: z
    .enum(["yes", "no", "unsure"])
    .optional(),
  estimated_cost: z.string().optional(),
  replaces_tool: z.string().optional(),
  existing_docs_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof FormSchema>;

export function IntakeForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { data_types: [] },
  });

  const justification = watch("business_justification") ?? "";
  const selectedDataTypes = watch("data_types") ?? [];

  function toggleDataType(type: string) {
    if (selectedDataTypes.includes(type)) {
      setValue("data_types", selectedDataTypes.filter((t) => t !== type), {
        shouldValidate: true,
      });
    } else {
      setValue("data_types", [...selectedDataTypes, type], {
        shouldValidate: true,
      });
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          data_leaves_company:
            values.data_leaves_company === "yes"
              ? true
              : values.data_leaves_company === "no"
              ? false
              : null,
          requires_system_access: values.requires_system_access ?? "unsure",
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }

      const { id } = await res.json() as { id: string };

      // Trigger intake agent
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });

      const intakeData = await intakeRes.json() as { ready: boolean };

      if (intakeData.ready) {
        router.push(`/requests/${id}/status`);
      } else {
        router.push(`/requests/${id}/clarify`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tool Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tool Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tool_name">Tool name *</Label>
            <Input id="tool_name" {...register("tool_name")} placeholder="e.g. ChatGPT, Notion AI, GitHub Copilot" className="mt-1" />
            {errors.tool_name && <p className="text-xs text-destructive mt-1">{errors.tool_name.message}</p>}
          </div>

          <div>
            <Label htmlFor="tool_url">Tool URL (optional)</Label>
            <Input id="tool_url" {...register("tool_url")} placeholder="https://..." className="mt-1" />
            {errors.tool_url && <p className="text-xs text-destructive mt-1">{errors.tool_url.message}</p>}
          </div>

          <div>
            <Label htmlFor="existing_docs_url">Vendor documentation / security page URL (optional)</Label>
            <Input id="existing_docs_url" {...register("existing_docs_url")} placeholder="https://..." className="mt-1" />
            {errors.existing_docs_url && <p className="text-xs text-destructive mt-1">{errors.existing_docs_url.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Requester Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requester_name">Your name *</Label>
              <Input id="requester_name" {...register("requester_name")} className="mt-1" />
              {errors.requester_name && <p className="text-xs text-destructive mt-1">{errors.requester_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="requester_team">Team *</Label>
              <Select
                onValueChange={(v) => setValue("requester_team", v, { shouldValidate: true })}
              >
                <SelectTrigger id="requester_team" className="mt-1">
                  <SelectValue placeholder="Select your team…" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.requester_team && <p className="text-xs text-destructive mt-1">{errors.requester_team.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="requester_role">Role / job title (optional)</Label>
            <Input id="requester_role" {...register("requester_role")} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Use Case */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Use Case</CardTitle>
          <CardDescription>The more detail you provide, the faster we can process your request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_justification">
              Business justification * ({justification.length}/100 min)
            </Label>
            <Textarea
              id="business_justification"
              {...register("business_justification")}
              placeholder="Describe what you need this tool for, how it will improve your work, and any specific features you need..."
              rows={5}
              className="mt-1"
            />
            {errors.business_justification && (
              <p className="text-xs text-destructive mt-1">{errors.business_justification.message}</p>
            )}
          </div>

          <div>
            <Label>How many people will use this tool? *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {USER_COUNTS.map((count) => {
                const selected = watch("user_count") === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setValue("user_count", count, { shouldValidate: true })}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
            {errors.user_count && <p className="text-xs text-destructive mt-1">{errors.user_count.message}</p>}
          </div>

          <div>
            <Label htmlFor="replaces_tool">Does this replace an existing tool? (optional)</Label>
            <Input
              id="replaces_tool"
              {...register("replaces_tool")}
              placeholder="e.g. Replaces Grammarly"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="estimated_cost">Estimated monthly cost (optional)</Label>
            <Input
              id="estimated_cost"
              {...register("estimated_cost")}
              placeholder="e.g. £20/month, £500/year, Free tier"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>What types of data will this tool process? * (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DATA_TYPES.map((type) => {
                const selected = selectedDataTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleDataType(type)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {errors.data_types && <p className="text-xs text-destructive mt-1">{errors.data_types.message}</p>}
          </div>

          <div>
            <Label>Will data leave company systems? *</Label>
            <div className="flex gap-3 mt-2">
              {(["yes", "no", "unsure"] as const).map((option) => {
                const selected = watch("data_leaves_company") === option;
                const labels = { yes: "Yes", no: "No", unsure: "Not sure" };
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setValue("data_leaves_company", option, { shouldValidate: true })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {labels[option]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Does this tool require installation or system/network access on company devices?</Label>
            <div className="flex gap-3 mt-2">
              {(["yes", "no", "unsure"] as const).map((option) => {
                const selected = watch("requires_system_access") === option;
                const labels = { yes: "Yes", no: "No", unsure: "Not sure" };
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setValue("requires_system_access", option, { shouldValidate: true })
                    }
                    className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {labels[option]}
                  </button>
                );
              })}
            </div>
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
