import { getRequest } from "@/lib/db/requests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { notFound } from "next/navigation";
import type { RequestStatus } from "@/types/request";

interface StatusPageProps {
  params: Promise<{ requestId: string }>;
}

const statusConfig: Record<RequestStatus, { label: string; description: string; progress: number }> = {
  draft: {
    label: "Submitted",
    description: "Your request has been received and is being prepared for review.",
    progress: 15,
  },
  awaiting_clarification: {
    label: "Awaiting Your Answers",
    description: "We have some follow-up questions. Please check the link you were given.",
    progress: 30,
  },
  in_progress: {
    label: "Under Review",
    description: "Our team of reviewers is analysing your request. This typically takes 2–5 minutes.",
    progress: 65,
  },
  complete: {
    label: "Review Complete",
    description: "The review has been completed and a decision has been made. IT/Infosec will be in touch.",
    progress: 100,
  },
  error: {
    label: "Review Error",
    description: "Something went wrong during the review. The IT team has been notified.",
    progress: 0,
  },
};

const recommendationLabels: Record<string, { label: string; color: string }> = {
  APPROVE: { label: "Approved", color: "text-green-700" },
  "APPROVE WITH CONDITIONS": { label: "Approved with Conditions", color: "text-amber-700" },
  DEFER: { label: "Deferred", color: "text-amber-700" },
  REJECT: { label: "Rejected", color: "text-red-700" },
};

export default async function StatusPage({ params }: StatusPageProps) {
  const { requestId } = await params;
  const request = getRequest(requestId);

  if (!request) {
    notFound();
  }

  const config = statusConfig[request.status];

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Request Status</h1>
          <p className="text-muted-foreground mt-1">{request.tool_name}</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{config.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.status !== "error" && (
              <Progress value={config.progress} className="h-2" />
            )}
            <p className="text-sm text-muted-foreground">{config.description}</p>

            {request.status === "complete" && request.recommendation && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Decision</p>
                <p className={`text-lg font-semibold ${recommendationLabels[request.recommendation]?.color ?? ""}`}>
                  {recommendationLabels[request.recommendation]?.label ?? request.recommendation}
                </p>
              </div>
            )}

            {request.status === "awaiting_clarification" && (
              <a
                href={`/requests/${requestId}/clarify`}
                className="inline-flex items-center justify-center w-full h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Answer Follow-up Questions
              </a>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted by</span>
            <span className="font-medium">{request.requester_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Team</span>
            <span className="font-medium">{request.requester_team}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submitted</span>
            <span className="font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Request ID: {requestId}
        </p>
      </div>
    </main>
  );
}
