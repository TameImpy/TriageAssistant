"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscussionFeed } from "@/components/discussion/DiscussionFeed";
import { FinalReport } from "@/components/report/FinalReport";
import { RecommendationBadge } from "@/components/report/RecommendationBadge";
import { useTriageStream } from "@/hooks/useTriageStream";
import { useRequestStore } from "@/hooks/useRequestStore";
import type { RequestRecord } from "@/types/request";
import type { MessageRecord } from "@/types/message";
import type { AgentConfig } from "@/config/agents.schema";
import type { FinalReport as FinalReportType } from "@/types/report";
import Link from "next/link";

interface FullRequest extends RequestRecord {
  messages: MessageRecord[];
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<FullRequest | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);

  const finalReport = useRequestStore((s) => s.finalReport);
  const error = useRequestStore((s) => s.error);
  const reset = useRequestStore((s) => s.reset);
  const { startStream } = useTriageStream(requestId);

  useEffect(() => {
    reset();
    Promise.all([
      fetch(`/api/requests/${requestId}`).then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]).then(([req, agentsData]: [FullRequest, AgentConfig[]]) => {
      setRequest(req);
      setAgents(agentsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [requestId, reset]);

  function handleStartTriage() {
    setStreaming(true);
    startStream();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Request not found.</p>
        </div>
      </main>
    );
  }

  const existingReport = request.final_report
    ? (JSON.parse(request.final_report) as FinalReportType)
    : null;

  const displayReport = finalReport ?? existingReport;
  const canStartTriage =
    (request.status === "in_progress" && !streaming) ||
    request.status === "awaiting_clarification" ||
    request.status === "draft";

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/requests" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <span>{request.tool_name}</span>
            </div>
            <h1 className="text-2xl font-bold">{request.tool_name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Requested by {request.requester_name} · {request.requester_team} ·{" "}
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {displayReport && (
              <RecommendationBadge
                recommendation={displayReport.recommendation}
                riskLevel={displayReport.riskLevel}
              />
            )}
            {canStartTriage && !streaming && (
              <Button onClick={handleStartTriage}>
                {request.status === "complete" ? "Re-run Triage" : "Start Triage"}
              </Button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Error during triage:</strong> {error}
          </div>
        )}

        {/* Request summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Tool URL</dt>
                <dd>{request.tool_url ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Users</dt>
                <dd>{request.user_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data Leaves Company</dt>
                <dd>
                  {request.data_leaves_company === null
                    ? "Unknown"
                    : request.data_leaves_company
                    ? "Yes"
                    : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data Types</dt>
                <dd>{request.data_types.join(", ")}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Justification</dt>
                <dd className="mt-1 text-foreground/80">{request.business_justification}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Discussion feed */}
        {streaming && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <DiscussionFeed agentConfigs={agents} />
            </CardContent>
          </Card>
        )}

        {/* Final Report */}
        {displayReport && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Final Report</h2>
            <FinalReport
              report={displayReport}
              request={request}
              messages={request.messages}
              agentConfigs={agents}
            />
          </div>
        )}

        {/* Existing messages (if not streaming) */}
        {!streaming && request.messages.length > 0 && !displayReport && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Discussion History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {request.messages.length} messages recorded. Start triage to see the full discussion.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
