import { notFound } from "next/navigation";
import { getTool } from "@/lib/db/catalogue";
import { CatalogueRequestForm } from "./CatalogueRequestForm";

export default async function CatalogueRequestPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const tool = getTool(toolId);

  if (!tool || !tool.active) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <a href="/catalogue" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to catalogue
          </a>
          <h1 className="text-2xl font-bold tracking-tight mt-3">Request access</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{tool.name}</span> is pre-approved. Complete the form below and IT will confirm your access.
          </p>
        </div>
        <CatalogueRequestForm tool={tool} />
      </div>
    </main>
  );
}
