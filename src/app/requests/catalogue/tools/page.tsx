"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovedTool } from "@/types/catalogue";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ToolForm = {
  name: string;
  description: string;
  category: string;
  vendor_url: string;
  training_url: string;
  training_notes: string;
};

const emptyForm: ToolForm = {
  name: "",
  description: "",
  category: "",
  vendor_url: "",
  training_url: "",
  training_notes: "",
};

export default function CatalogueToolsPage() {
  const [tools, setTools] = useState<ApprovedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ToolForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retiring, setRetiring] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/catalogue/tools")
      .then((r) => r.json())
      .then((data: ApprovedTool[]) => {
        setTools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function startEdit(tool: ApprovedTool) {
    setEditingId(tool.id);
    setForm({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      vendor_url: tool.vendor_url ?? "",
      training_url: tool.training_url ?? "",
      training_notes: tool.training_notes ?? "",
    });
    setError(null);
  }

  function startAdd() {
    setEditingId("new");
    setForm(emptyForm);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const url =
        editingId === "new"
          ? "/api/catalogue/tools"
          : `/api/catalogue/tools/${editingId}`;
      const method = editingId === "new" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          vendor_url: form.vendor_url || undefined,
          training_url: form.training_url || undefined,
          training_notes: form.training_notes || undefined,
          ...(editingId === "new" ? { added_by: "reviewer" } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      const saved = await res.json() as ApprovedTool;

      if (editingId === "new") {
        setTools((prev) => [saved, ...prev]);
      } else {
        setTools((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      }
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function retire(id: string) {
    if (!confirm("Retire this tool? Employees will no longer be able to request access.")) return;
    setRetiring(id);
    try {
      const res = await fetch(`/api/catalogue/tools/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTools((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
      }
    } finally {
      setRetiring(null);
    }
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              href="/requests/catalogue"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Pre-approved Queue
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Manage Catalogue</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add, edit, or retire pre-approved AI tools
            </p>
          </div>
          {editingId !== "new" && (
            <Button onClick={startAdd} size="sm">
              + Add Tool
            </Button>
          )}
        </div>

        <Separator />

        {/* Add form */}
        {editingId === "new" && (
          <Card className="rounded-xl border-primary/30">
            <CardContent className="pt-5 pb-5 space-y-4">
              <p className="font-semibold text-sm">New Tool</p>
              <ToolFormFields form={form} setForm={setForm} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Add Tool"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tools.map((tool) => (
              <Card key={tool.id} className="rounded-xl">
                <CardContent className="pt-5 pb-5 space-y-3">
                  {editingId === tool.id ? (
                    <>
                      <ToolFormFields form={form} setForm={setForm} />
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={save} disabled={saving}>
                          {saving ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{tool.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {tool.category}
                            </Badge>
                            {!tool.active && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-100 text-slate-500 border-slate-200"
                              >
                                Retired
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Added {formatDate(tool.added_at)}
                          </p>
                        </div>
                        {tool.active && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(tool)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retire(tool.id)}
                              disabled={retiring === tool.id}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              {retiring === tool.id ? "…" : "Retire"}
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ToolFormFields({
  form,
  setForm,
}: {
  form: {
    name: string;
    description: string;
    category: string;
    vendor_url: string;
    training_url: string;
    training_notes: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      category: string;
      vendor_url: string;
      training_url: string;
      training_notes: string;
    }>
  >;
}) {
  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tool name *</Label>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Category *</Label>
          <Input
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="e.g. Writing & Editing"
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Description *</Label>
        <Textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Vendor URL</Label>
          <Input
            value={form.vendor_url}
            onChange={(e) => update("vendor_url", e.target.value)}
            placeholder="https://…"
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Training URL</Label>
          <Input
            value={form.training_url}
            onChange={(e) => update("training_url", e.target.value)}
            placeholder="https://…"
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Training notes (shown to employee on approval)</Label>
        <Textarea
          value={form.training_notes}
          onChange={(e) => update("training_notes", e.target.value)}
          rows={2}
          className="mt-1 text-sm"
        />
      </div>
    </div>
  );
}
