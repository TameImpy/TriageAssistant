import { IntakeForm } from "@/components/forms/IntakeForm";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Request AI Tool Access</h1>
          <p className="text-muted-foreground mt-1">
            Fill in this form to submit your request for review. Required fields are marked with *.
          </p>
        </div>
        <IntakeForm />
      </div>
    </main>
  );
}
