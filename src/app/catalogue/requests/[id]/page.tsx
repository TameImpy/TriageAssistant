import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalogueRequest, getTool } from "@/lib/db/catalogue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CatalogueRequestStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = getCatalogueRequest(id);

  if (!request) {
    notFound();
  }

  const tool = getTool(request.tool_id);

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link href="/catalogue" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to catalogue
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-3">Access Request</h1>
          <p className="text-muted-foreground mt-1">
            {request.tool_name} — requested by {request.requester_name}
          </p>
        </div>

        {request.status === "pending" && (
          <Card className="rounded-xl border-blue-200 bg-blue-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-600 text-sm font-bold">⏳</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Under review</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your request is with the IT team for review. You&apos;ll be notified when a decision is made.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {request.status === "approved" && (
          <div className="space-y-4">
            <Card className="rounded-xl border-green-200 bg-green-50">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Approved</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your request for <span className="font-medium">{request.tool_name}</span> has been approved. Follow the training materials below before getting started.
                    </p>
                    {request.reviewer_note && (
                      <p className="text-sm text-green-800 mt-2 p-2 bg-green-100 rounded">
                        Note from IT: {request.reviewer_note}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {tool && (tool.training_notes || tool.training_url) && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Training Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tool.training_notes && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                      {tool.training_notes}
                    </div>
                  )}
                  {tool.training_url && (
                    <a
                      href={tool.training_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full">Start Training ↗</Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {request.status === "denied" && (
          <div className="space-y-4">
            <Card className="rounded-xl border-slate-200">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-slate-600 text-sm font-bold">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Request not approved</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Your request for <span className="font-medium">{request.tool_name}</span> was not approved at this time.
                    </p>
                    {request.reviewer_note && (
                      <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-100 rounded">
                        Note from IT: {request.reviewer_note}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Need a different tool for this use case?
              </p>
              <Link href="/submit">
                <Button variant="outline">Submit a Full Review Request</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
