"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  requires_system_access: boolean | null;
}

const statusStyles: Record<RequestStatus, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  awaiting_clarification: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  complete: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-600 border-red-200",
};

const statusLabels: Record<RequestStatus, string> = {
  draft: "Draft",
  awaiting_clarification: "Awaiting Answers",
  in_progress: "In Review",
  complete: "Complete",
  error: "Error",
};

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

// Left border accent colour — risk takes priority over status
const accentColors: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-amber-400",
  low: "border-l-green-400",
  in_progress: "border-l-amber-400",
  awaiting_clarification: "border-l-blue-400",
  complete: "border-l-green-500",
  error: "border-l-red-400",
  draft: "border-l-slate-300",
};

function formatDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [cataloguePendingCount, setCataloguePendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json())
      .then((data: RequestSummary[]) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/catalogue/requests")
      .then((r) => r.json())
      .then((data: { status: string }[]) => {
        setCataloguePendingCount(data.filter((r) => r.status === "pending").length);
      })
      .catch(() => undefined);
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (riskFilter !== "all" && r.risk_level !== riskFilter) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Triage Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI tool access requests — IT/Infosec review
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/requests/catalogue">
              <Button variant="outline" size="sm" className="relative">
                Pre-approved Queue
                {cataloguePendingCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {cataloguePendingCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/requests/agents">
              <Button variant="outline" size="sm">Agent Config</Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* Filters + count */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
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
              <SelectTrigger className="w-38 h-9 text-sm">
                <SelectValue placeholder="All Risk Levels" />
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

          {!loading && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "request" : "requests"}
            </p>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                {requests.length === 0
                  ? "No requests yet. Share the submission form with your team."
                  : "No requests match the current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((request) => {
              const accentKey = request.risk_level ?? request.status;
              const accent = accentColors[accentKey] ?? "border-l-slate-300";
              return (
                <Link key={request.id} href={`/requests/${request.id}`} className="block">
                  <div
                    className={`flex items-center gap-5 px-6 py-5 rounded-xl border border-l-4 ${accent} bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group`}
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[15px] leading-snug">
                          {request.tool_name}
                        </span>
                        <Badge
                          className={`text-xs font-medium border ${statusStyles[request.status]}`}
                          variant="outline"
                        >
                          {statusLabels[request.status]}
                        </Badge>
                        {request.risk_level && (
                          <Badge
                            className={`text-xs font-medium border ${riskStyles[request.risk_level]}`}
                            variant="outline"
                          >
                            {request.risk_level.charAt(0).toUpperCase() + request.risk_level.slice(1)} Risk
                          </Badge>
                        )}
                        {request.recommendation && (
                          <Badge variant="secondary" className="text-xs font-medium">
                            {request.recommendation}
                          </Badge>
                        )}
                        {request.requires_system_access === true && (
                          <Badge
                            className="text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200"
                            variant="outline"
                          >
                            System Access
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {request.requester_name}
                        <span className="mx-1.5 text-muted-foreground/40">·</span>
                        {request.requester_team}
                        <span className="mx-1.5 text-muted-foreground/40">·</span>
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
