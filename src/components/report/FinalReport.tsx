"use client";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RecommendationBadge } from "./RecommendationBadge";
import { RiskMatrix } from "./RiskMatrix";
import { AgentPOV } from "./AgentPOV";
import type { FinalReport as FinalReportType } from "@/types/report";
import type { RequestRecord } from "@/types/request";
import type { MessageRecord } from "@/types/message";
import type { AgentConfig } from "@/config/agents.schema";

interface FinalReportProps {
  report: FinalReportType;
  request?: RequestRecord;
  messages?: MessageRecord[];
  agentConfigs?: AgentConfig[];
}

export function FinalReport({ report, request, messages = [], agentConfigs = [] }: FinalReportProps) {
  function copyToClipboard() {
    const text = buildPlainText(report);
    navigator.clipboard.writeText(text);
  }

  function getAgentConfig(agentId: string) {
    return agentConfigs.find((a) => a.id === agentId);
  }

  return (
    <div className="space-y-4 print:space-y-3">
      {/* Section 1: Decision Header */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg mb-2">Triage Decision</CardTitle>
              <RecommendationBadge
                recommendation={report.recommendation}
                riskLevel={report.riskLevel}
                size="lg"
              />
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Confidence: <span className="font-medium capitalize text-foreground">{report.confidence}</span></p>
              <p className="text-xs mt-1">{new Date(report.generatedAt).toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section 2: Executive Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 leading-relaxed">{report.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Section 3: Required Conditions */}
      {report.requiredConditions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Required Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.requiredConditions.map((cond, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-600 font-bold text-sm">•</span>
                  <div>
                    <p className="text-sm text-foreground/90">{cond.condition}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Raised by {cond.raisedBy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Risk Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Risk Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskMatrix risks={report.riskMatrix} />
        </CardContent>
      </Card>

      {/* Sections 5, 6, 7: Expandable */}
      <Accordion type="multiple" className="space-y-2">
        {/* Section 5: Agent Perspectives */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Section 5 — Agent Perspectives
          </h3>
          <Accordion type="multiple">
            {report.agentPerspectives.map((perspective) => {
              const config = getAgentConfig(perspective.agentId);
              return (
                <AgentPOV
                  key={perspective.agentId}
                  perspective={perspective}
                  avatarColor={config?.persona.avatarColor}
                  avatarInitials={config?.persona.avatarInitials}
                />
              );
            })}
          </Accordion>
        </div>

        {/* Section 6: Full Transcript */}
        {messages.filter((m) => m.phase === 3).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Section 6 — Full Discussion Transcript
            </h3>
            <Accordion type="multiple">
              <div className="border rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="font-medium text-sm">View Full Transcript ({messages.filter(m => m.phase === 3).length} messages)</span>
                    <span className="text-muted-foreground text-sm group-open:hidden">Expand</span>
                    <span className="text-muted-foreground text-sm hidden group-open:block">Collapse</span>
                  </summary>
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    {messages.filter((m) => m.phase === 3).map((msg) => {
                      const config = getAgentConfig(msg.agent_id);
                      return (
                        <div key={msg.id} className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {msg.agent_name} — Round {msg.round}
                          </p>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            </Accordion>
          </div>
        )}

        {/* Section 7: Original Request */}
        {request && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Section 7 — Original Request Details
            </h3>
            <div className="border rounded-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <span className="font-medium text-sm">View Request Details</span>
                  <span className="text-muted-foreground text-sm group-open:hidden">Expand</span>
                  <span className="text-muted-foreground text-sm hidden group-open:block">Collapse</span>
                </summary>
                <div className="px-4 pb-4 border-t pt-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Tool</dt>
                      <dd className="font-medium">{request.tool_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Requester</dt>
                      <dd className="font-medium">{request.requester_name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Team</dt>
                      <dd className="font-medium">{request.requester_team}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Users</dt>
                      <dd className="font-medium">{request.user_count}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Business Justification</dt>
                      <dd className="mt-1 text-foreground/80">{request.business_justification}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Data Types</dt>
                      <dd className="font-medium">{request.data_types.join(", ")}</dd>
                    </div>
                  </dl>
                </div>
              </details>
            </div>
          </div>
        )}
      </Accordion>

      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={copyToClipboard}>
          Copy Report
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}

function buildPlainText(report: FinalReportType): string {
  const lines = [
    `TRIAGE DECISION: ${report.recommendation}`,
    `Risk Level: ${report.riskLevel.toUpperCase()}`,
    `Confidence: ${report.confidence}`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    "",
    "EXECUTIVE SUMMARY",
    report.executiveSummary,
    "",
  ];

  if (report.requiredConditions.length > 0) {
    lines.push("REQUIRED CONDITIONS");
    report.requiredConditions.forEach((c) => {
      lines.push(`• ${c.condition} (${c.raisedBy})`);
    });
    lines.push("");
  }

  lines.push("RISK MATRIX");
  report.riskMatrix.forEach((r) => {
    lines.push(`• ${r.risk} — Severity: ${r.severity}, Likelihood: ${r.likelihood}`);
    lines.push(`  Mitigation: ${r.mitigation}`);
  });
  lines.push("");

  lines.push("AGENT PERSPECTIVES");
  report.agentPerspectives.forEach((p) => {
    lines.push(`${p.agentName}: ${p.finalStance} (Risk: ${p.riskScore}/10)`);
    p.keyConcerns.forEach((c) => lines.push(`  - ${c}`));
  });

  return lines.join("\n");
}
