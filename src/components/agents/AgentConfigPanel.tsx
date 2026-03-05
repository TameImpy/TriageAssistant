"use client";

import { useState } from "react";
import { AgentCard } from "./AgentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentConfig } from "@/config/agents.schema";

interface AgentConfigPanelProps {
  initialAgents: AgentConfig[];
}

export function AgentConfigPanel({ initialAgents }: AgentConfigPanelProps) {
  const [agents, setAgents] = useState<AgentConfig[]>(initialAgents);
  const [editing, setEditing] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function saveAgent(updated: AgentConfig) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/agents/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      setAgents((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setEditing(null);
        setSaveSuccess(false);
      }, 800);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onClick={() => {
            setEditing({ ...agent });
            setSaveError(null);
            setSaveSuccess(false);
          }}
        />
      ))}

      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit — {editing.name}</DialogTitle>
            </DialogHeader>
            <AgentEditForm
              agent={editing}
              onChange={setEditing}
              onSave={() => saveAgent(editing)}
              saving={saving}
              error={saveError}
              success={saveSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface AgentEditFormProps {
  agent: AgentConfig;
  onChange: (a: AgentConfig) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  success: boolean;
}

function AgentEditForm({ agent, onChange, onSave, saving, error, success }: AgentEditFormProps) {
  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    onChange({ ...agent, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agent.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Enabled</span>
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Risk Weighting (1-10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={agent.riskWeighting}
            onChange={(e) => update("riskWeighting", parseInt(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Vote Weight</Label>
          <Input
            type="number"
            step={0.1}
            min={0}
            max={3}
            value={agent.voteWeight}
            onChange={(e) => update("voteWeight", parseFloat(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">System Prompt Template</Label>
        <Textarea
          value={agent.systemPromptTemplate}
          onChange={(e) => update("systemPromptTemplate", e.target.value)}
          rows={10}
          className="mt-1 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Variables: {"{{requestContext}}"}, {"{{discussionHistory}}"}, {"{{dealbreakers}}"}, {"{{requiredQuestions}}"}
        </p>
      </div>

      <div>
        <Label className="text-xs">Focus Areas (one per line)</Label>
        <Textarea
          value={agent.focusAreas.join("\n")}
          onChange={(e) =>
            update("focusAreas", e.target.value.split("\n").filter((l) => l.trim()))
          }
          rows={4}
          className="mt-1 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs">Dealbreakers (one per line)</Label>
        <Textarea
          value={agent.dealbreakers.join("\n")}
          onChange={(e) =>
            update("dealbreakers", e.target.value.split("\n").filter((l) => l.trim()))
          }
          rows={4}
          className="mt-1 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs">Required Questions (one per line)</Label>
        <Textarea
          value={agent.requiredQuestions.join("\n")}
          onChange={(e) =>
            update("requiredQuestions", e.target.value.split("\n").filter((l) => l.trim()))
          }
          rows={3}
          className="mt-1 text-sm"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive border border-destructive/30 rounded p-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 border border-green-300 rounded p-2">
          Saved successfully
        </div>
      )}

      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
