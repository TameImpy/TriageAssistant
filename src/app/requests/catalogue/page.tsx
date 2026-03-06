"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { CatalogueRequest } from "@/types/catalogue";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  denied: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CatalogueQueuePage() {
  const [requests, setRequests] = useState<CatalogueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/catalogue/requests")
      .then((r) => r.json())
      .then((data: CatalogueRequest[]) => {
        setRequests(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function resolve(id: string, status: "approved" | "denied") {
    setResolving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/catalogue/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewer_note: notes[id] ?? undefined }),
      });
      if (res.ok) {
        const updated = await res.json() as CatalogueRequest;
        setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } finally {
      setResolving((prev) => ({ ...prev, [id]: false }));
    }
  }

  const displayed = showAll
    ? requests
    : requests.filter((r) => r.status === "pending");

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link href="/requests" className="text-sm text-muted-foreground hover:text-foreground">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Pre-approved Queue</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quick-approve access requests for pre-approved tools
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/requests/catalogue/tools">
              <Button variant="outline" size="sm">Manage Catalogue</Button>
            </Link>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                !showAll
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                showAll
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              All ({requests.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                {pendingCount === 0
                  ? "No pending catalogue requests."
                  : "No requests match the current filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {displayed.map((req) => (
              <Card key={req.id} className="rounded-xl">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{req.tool_name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs border ${statusStyles[req.status]}`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.requester_name}
                        {req.requester_team && ` · ${req.requester_team}`}
                        {req.requester_role && ` · ${req.requester_role}`}
                        {" · "}{formatDate(req.created_at)}
                        {" · "}{req.user_count} {req.user_count === 1 ? "user" : "users"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">Reason: </span>
                    {req.business_reason}
                  </p>

                  {req.status === "pending" && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Optional note to include with decision…"
                        value={notes[req.id] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => resolve(req.id, "approved")}
                          disabled={resolving[req.id]}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {resolving[req.id] ? "…" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolve(req.id, "denied")}
                          disabled={resolving[req.id]}
                        >
                          {resolving[req.id] ? "…" : "Deny"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {req.status !== "pending" && req.reviewer_note && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {req.reviewer_note}
                    </p>
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
