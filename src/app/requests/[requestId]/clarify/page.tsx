import { getRequest } from "@/lib/db/requests";
import { ClarificationForm } from "@/components/forms/ClarificationForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound, redirect } from "next/navigation";

interface ClarifyPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ClarifyPage({ params }: ClarifyPageProps) {
  const { requestId } = await params;
  const request = getRequest(requestId);

  if (!request) {
    notFound();
  }

  if (request.intake_ready || request.status === "in_progress" || request.status === "complete") {
    redirect(`/requests/${requestId}/status`);
  }

  const questions = request.intake_questions ?? [];

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">A few follow-up questions</h1>
          <p className="text-muted-foreground mt-1">
            To review your request for <strong>{request.tool_name}</strong> thoroughly,
            we need a bit more information. Please answer the questions below.
          </p>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No questions at this time. Your request is being reviewed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ClarificationForm requestId={requestId} questions={questions} />
        )}
      </div>
    </main>
  );
}
