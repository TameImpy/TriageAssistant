import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl overflow-hidden inline-block">
              <Image
                src="/logo.png"
                alt="Immediate, a Burda company"
                width={320}
                height={88}
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Request access to an AI tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Submit your request and a team of AI agents will review it from security, legal,
            engineering, and business perspectives — delivering a structured recommendation to IT/Infosec.
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Submit a New Request</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Takes 3–5 minutes. You may be asked a few follow-up questions.
                </p>
              </div>
              <Link href="/submit">
                <Button size="lg">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">5</div>
                <div className="text-xs text-muted-foreground">AI Reviewers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">4</div>
                <div className="text-xs text-muted-foreground">Review Phases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">&lt;2m</div>
                <div className="text-xs text-muted-foreground">Decision Read Time</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            IT/Infosec reviewer?{" "}
            <Link href="/requests" className="text-primary hover:underline">
              Open the dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
