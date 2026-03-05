import { loadAgents } from "@/lib/config/agent-loader";
import { AgentConfigPanel } from "@/components/agents/AgentConfigPanel";
import Link from "next/link";

export default function AgentsPage() {
  const agents = loadAgents();

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/requests" className="hover:text-foreground">Dashboard</Link>
            <span>/</span>
            <span>Agent Configuration</span>
          </div>
          <h1 className="text-2xl font-bold">Agent Configuration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Click an agent to edit its configuration. Changes take effect on the next triage run.
          </p>
        </div>

        <AgentConfigPanel initialAgents={agents} />
      </div>
    </main>
  );
}
