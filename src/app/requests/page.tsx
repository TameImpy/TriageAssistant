"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { RequestStatus, RiskLevel, Recommendation } from "@/types/request";

interface RequestSummary {
  id: string;
  tool_name: string;
  requester_name: string;
  requester_team: string;
  status: RequestStatus;
  risk_level: RiskLevel | null;
  recommendation: Recommendation | null;
  created_at: number;
  intake_ready: boolean;
}

const statusStyles: Record<RequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  awaiting_clarification: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

const statusLabels: Record<RequestStatus, string> = {
  draft: "Draft",
  awaiting_clarification: "Awaiting Answers",
  in_progress: "In Review",
  complete: "Complete",
  error: "Error",
};

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((data: RequestSummary[]) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (riskFilter !== "all" && r.risk_level !== riskFilter) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Triage Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              AI tool access requests — IT/Infosec review
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/requests/agents">
              <Button variant="outline" size="sm">Agent Config</Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="awaiting_clarification">Awaiting Answers</SelectItem>
              <SelectItem value="in_progress">In Review</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {requests.length === 0
                  ? "No requests yet. Share the submission form with your team."
                  : "No requests match the current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((request) => (
              <Link key={request.id} href={`/requests/${request.id}`}>
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{request.tool_name}</span>
                      <Badge className={`text-xs ${statusStyles[request.status]}`} variant="outline">
                        {statusLabels[request.status]}
                      </Badge>
                      {request.risk_level && (
                        <Badge className={`text-xs ${riskStyles[request.risk_level]}`} variant="outline">
                          {request.risk_level.toUpperCase()} RISK
                        </Badge>
                      )}
                      {request.recommendation && (
                        <Badge variant="outline" className="text-xs">
                          {request.recommendation}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.requester_name} · {request.requester_team} ·{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
